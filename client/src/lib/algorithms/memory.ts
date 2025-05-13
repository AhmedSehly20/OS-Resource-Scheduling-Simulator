export interface MemoryStep {
  reference: number;
  frames: number[];
  framesAfter: number[];
  isFault: boolean;
  refBits?: number[];
  refBitsAfter?: number[];
  replacedFrame?: number;
  resetBits?: boolean;
  pointerPosition?: number;
  pointerPositionAfter?: number;
  orderOfUse?: number[]; // Added for LRU algorithm to track frame usage order
}

export interface MemoryResult {
  steps: MemoryStep[];
  faults: number;
  hits: number;
}

// LRU (Least Recently Used) Algorithm
export function simulateLRU(
  frameCount: number,
  refString: number[]
): MemoryResult {
  const frames: number[] = new Array(frameCount).fill(-1);
  // Order array tracks indexes from least recently used to most recently used
  // Initially empty since no frames have been used yet
  const orderOfUse: number[] = [];

  const result: MemoryResult = {
    steps: [],
    faults: 0,
    hits: 0,
  };

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const step: MemoryStep = {
      reference: page,
      frames: [...frames],
      framesAfter: [],
      isFault: false,
      orderOfUse: [...orderOfUse], // Store current usage order before any changes
    };

    // Check if page already in frames
    const frameIndex = frames.indexOf(page);
    if (frameIndex !== -1) {
      // Page hit - update access order
      result.hits++;

      // Update the order to show this page is most recently used
      // Remove from current position (if exists) and add to end (most recently used)
      const posIndex = orderOfUse.indexOf(frameIndex);
      if (posIndex !== -1) {
        orderOfUse.splice(posIndex, 1);
      }
      orderOfUse.push(frameIndex);
    } else {
      // Page fault
      result.faults++;
      step.isFault = true;

      if (frames.includes(-1)) {
        // Empty frame available - use the first empty frame
        const emptyIndex = frames.indexOf(-1);
        frames[emptyIndex] = page;

        // For visualization tracking (not a true replacement but frame allocation)
        step.replacedFrame = emptyIndex;

        // Add to orderOfUse as most recently used
        // (No need to remove since it wasn't in the order list yet)
        orderOfUse.push(emptyIndex);
      } else {
        // No empty frames - replace least recently used page (first in orderOfUse)
        const replaceFrameIndex = orderOfUse[0];
        step.replacedFrame = replaceFrameIndex;
        frames[replaceFrameIndex] = page;

        // Update order: remove from front (least recently used), add to back (most recently used)
        orderOfUse.shift();
        orderOfUse.push(replaceFrameIndex);
      }
    }

    step.framesAfter = [...frames];
    // Store updated usage order after all changes
    step.orderOfUse = [...orderOfUse];
    result.steps.push(step);
  }

  return result;
}

// ARB (Additional Reference Bit) Algorithm with Circular Queue implementation
// This is also known as the "Clock" or "Second Chance" algorithm
export function simulateARB(
  frameCount: number,
  refString: number[]
): MemoryResult {
  const frames: number[] = new Array(frameCount).fill(-1);
  const refBits: number[] = new Array(frameCount).fill(0);
  let pointer = 0; // Circular pointer (clock hand) to track replacement position
  let framesFilled = 0; // Track how many frames have been filled

  const result: MemoryResult = {
    steps: [],
    faults: 0,
    hits: 0,
  };

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const step: MemoryStep = {
      reference: page,
      frames: [...frames],
      refBits: [...refBits],
      framesAfter: [],
      refBitsAfter: [],
      isFault: false,
      pointerPosition: pointer,
      pointerPositionAfter: pointer, // Will be updated later if pointer moves
      resetBits: false,
    };

    // Check if page already in frames
    const frameIndex = frames.indexOf(page);
    if (frameIndex !== -1) {
      // Page hit - set reference bit to 1
      result.hits++;
      refBits[frameIndex] = 1;
    } else {
      // Page fault
      result.faults++;
      step.isFault = true;

      if (framesFilled < frameCount) {
        // Empty frame available - place in the next available slot
        const emptyIndex = frames.indexOf(-1);
        frames[emptyIndex] = page;
        refBits[emptyIndex] = 1; // Set reference bit for newly loaded page
        step.replacedFrame = emptyIndex;
        framesFilled++;

        // In some ARB implementations, the clock hand doesn't move when filling empty frames
        // But for clarity in visualization, we'll advance it to the next position
        pointer = (emptyIndex + 1) % frameCount;
        step.pointerPositionAfter = pointer;
      } else {
        // All frames are filled - use the clock algorithm to find a victim page
        let foundVictim = false;
        let loopCount = 0; // Track if we've gone all the way around
        const startPointer = pointer; // Remember where we started

        // Keep going around the "clock" until we find a victim page
        while (!foundVictim) {
          // If reference bit is 0, replace this page
          if (refBits[pointer] === 0) {
            step.replacedFrame = pointer;
            frames[pointer] = page;
            refBits[pointer] = 1; // Set bit for the new page
            foundVictim = true;

            // Advance pointer for next iteration
            pointer = (pointer + 1) % frameCount;
          } else {
            // Give a second chance: clear ref bit but don't replace yet
            refBits[pointer] = 0;

            // Move clock hand (pointer) forward
            pointer = (pointer + 1) % frameCount;

            // Check if we've completed a full revolution
            if (pointer === startPointer) {
              loopCount++;

              // If we've gone around once and haven't found a victim,
              // all bits are now 0 (we've reset them all)
              if (loopCount === 1) {
                step.resetBits = true;

                // In a true implementation, we'd continue looking for a victim
                // (which would now be the next frame since all bits are 0)
                // But we won't immediately replace to show the reset bits visualization
              }

              // If we've gone around twice, something's wrong (shouldn't happen)
              // Force a replacement to prevent infinite loop
              if (loopCount > 1) {
                step.replacedFrame = pointer;
                frames[pointer] = page;
                refBits[pointer] = 1;
                foundVictim = true;
                pointer = (pointer + 1) % frameCount;
              }
            }
          }
        }

        step.pointerPositionAfter = pointer;
      }
    }

    step.framesAfter = [...frames];
    step.refBitsAfter = [...refBits];
    result.steps.push(step);
  }

  return result;
}
