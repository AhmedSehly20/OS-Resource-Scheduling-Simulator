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

// ARB (Additional Reference Bit) Algorithm implementation
// This algorithm uses a history of reference bits to make replacement decisions
export function simulateARB(
  frameCount: number,
  refString: number[]
): MemoryResult {
  const frames: number[] = new Array(frameCount).fill(-1);
  // For each frame, store 8-bit reference history
  // Higher values mean more recently/frequently used pages
  const refBitHistory: number[] = new Array(frameCount).fill(0);
  // We'll use a single bit for visualization purposes
  const refBits: number[] = new Array(frameCount).fill(0);
  let framesFilled = 0;

  // We'll keep a pointer for visualization compatibility with the UI
  // In real ARB, there's no pointer as it's not a clock algorithm
  // but we need this for the visualization
  let pointer = 0;

  // In true aging algorithm, we shift bits on every reference
  const result: MemoryResult = {
    steps: [],
    faults: 0,
    hits: 0,
  };

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    // In true Aging algorithm, we shift on every reference
    const shouldShiftBits = i > 0; // Shift on every reference except the first one

    const step: MemoryStep = {
      reference: page,
      frames: [...frames],
      refBits: [...refBits],
      framesAfter: [],
      refBitsAfter: [],
      isFault: false,
      resetBits: shouldShiftBits,
      pointerPosition: pointer,
      pointerPositionAfter: pointer, // Will be updated if needed
    };

    // Perform the shift operation on every reference (except the first)
    if (shouldShiftBits) {
      for (let j = 0; j < frameCount; j++) {
        if (frames[j] !== -1) {
          // Right shift the history (divide by 2)
          refBitHistory[j] = refBitHistory[j] >> 1;

          // Update the single display bit for visualization
          // For true Aging algorithm, we display the MSB (Most Significant Bit)
          refBits[j] = (refBitHistory[j] & 0x80) > 0 ? 1 : 0; // Get highest bit (bit 7)
        }
      }
    }

    // Check if page already in frames
    const frameIndex = frames.indexOf(page);
    if (frameIndex !== -1) {
      // Page hit - set the highest bit
      result.hits++;

      // Set the highest bit (bit 7) for this page's history
      refBitHistory[frameIndex] = refBitHistory[frameIndex] | 0x80; // OR with 10000000

      // Set the display bit to show the MSB for visualization
      refBits[frameIndex] = 1; // MSB is now set to 1
    } else {
      // Page fault
      result.faults++;
      step.isFault = true;

      if (framesFilled < frameCount) {
        // Empty frame available - place in the next available slot
        const emptyIndex = frames.indexOf(-1);
        frames[emptyIndex] = page;

        // Set highest bit for new page (according to canonical Aging algorithm)
        refBitHistory[emptyIndex] = 0x80; // 10000000 in binary
        refBits[emptyIndex] = 1; // MSB = 1

        step.replacedFrame = emptyIndex;
        framesFilled++;

        // Update pointer for visualization
        pointer = (emptyIndex + 1) % frameCount;
        step.pointerPositionAfter = pointer;
      } else {
        // All frames are filled - find the one with the lowest reference history
        let minValue = Number.MAX_SAFE_INTEGER;
        let victimIndex = 0;

        for (let j = 0; j < frameCount; j++) {
          if (refBitHistory[j] < minValue) {
            minValue = refBitHistory[j];
            victimIndex = j;
          }
        } // Replace the page with lowest reference history
        step.replacedFrame = victimIndex;
        frames[victimIndex] = page;

        // Set highest bit for new page (according to canonical Aging algorithm)
        refBitHistory[victimIndex] = 0x80; // 10000000 in binary
        refBits[victimIndex] = 1; // MSB = 1

        // Update pointer for visualization (point to the frame after the one we replaced)
        pointer = (victimIndex + 1) % frameCount;
        step.pointerPositionAfter = pointer;
      }
    }

    step.framesAfter = [...frames];
    step.refBitsAfter = [...refBits];
    result.steps.push(step);
  }

  return result;
}
