export interface DiskResult {
  sequence: number[];
  seekDistance: number;
  path?: number[][]; // For visualization of the seek path
}

// LOOK Disk Scheduling Algorithm
// LOOK is like SCAN but doesn't go to the end, it just reverses direction at the last request
export function simulateLOOK(
  cylinders: number,
  start: number,
  requests: number[],
  initialDirection: boolean = true // true = towards higher cylinders, false = towards lower cylinders
): DiskResult {
  const result: DiskResult = {
    sequence: [start],
    seekDistance: 0,
    path: [[start, 0]],
  };

  // Sort all requests in ascending order
  const sortedRequests = [...requests].sort((a, b) => a - b);

  // Split requests into three groups
  const higher = sortedRequests.filter((r) => r > start); // Strictly higher
  const lower = sortedRequests.filter((r) => r < start); // Strictly lower
  const atStart = sortedRequests.filter((r) => r === start); // Equal to start

  let step = 1;
  let currentPosition = start;

  // First serve any request at the current position if it exists
  if (atStart.length > 0 && !result.sequence.includes(start)) {
    // Already handled by including start in sequence
  }

  if (initialDirection) {
    // Moving towards higher cylinders first
    if (higher.length > 0) {
      // Process higher requests in ascending order
      for (const req of higher) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }

    // If we have requests in the lower direction, change direction and service them
    if (lower.length > 0) {
      const reversedLower = [...lower].reverse();
      for (const req of reversedLower) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }
  } else {
    // Moving towards lower cylinders first
    if (lower.length > 0) {
      // Process lower requests in descending order
      const reversedLower = [...lower].reverse();
      for (const req of reversedLower) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }

    // If we have requests in the higher direction, change direction and service them
    if (higher.length > 0) {
      for (const req of higher) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }
  }

  return result;
}

// C-SCAN Disk Scheduling Algorithm
// C-SCAN moves from one end to the other, and then jumps back to the beginning
export function simulateCSCAN(
  cylinders: number,
  start: number,
  requests: number[],
  initialDirection: boolean = true // true = towards higher cylinders, false = towards lower cylinders
): DiskResult {
  const result: DiskResult = {
    sequence: [start],
    seekDistance: 0,
    path: [[start, 0]],
  };

  // Sort all requests in ascending order
  const sortedRequests = [...requests].sort((a, b) => a - b);

  // Split requests into groups
  const higher = sortedRequests.filter((r) => r > start);
  const lower = sortedRequests.filter((r) => r < start);
  const atStart = sortedRequests.filter((r) => r === start);

  let step = 1;
  let currentPosition = start;

  if (initialDirection) {
    // Moving towards higher cylinders first
    // First serve all requests higher than the starting position
    for (const req of higher) {
      result.seekDistance += Math.abs(req - currentPosition);
      result.sequence.push(req);
      result.path?.push([req, step++]);
      currentPosition = req;
    }

    if (lower.length > 0) {
      // If we have lower requests, move to the end and wrap around
      if (currentPosition < cylinders - 1) {
        result.seekDistance += Math.abs(cylinders - 1 - currentPosition);
        result.sequence.push(cylinders - 1);
        result.path?.push([cylinders - 1, step++]);
        currentPosition = cylinders - 1;
      }

      // Jump to cylinder 0 (this move is NOT counted in seek distance)
      result.sequence.push(0);
      result.path?.push([0, step++]);
      currentPosition = 0;

      // Now serve all the lower requests in ascending order
      for (const req of lower) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }
  } else {
    // Moving towards lower cylinders first
    // First serve all requests lower than the starting position in descending order
    const reversedLower = [...lower].reverse();
    for (const req of reversedLower) {
      result.seekDistance += Math.abs(req - currentPosition);
      result.sequence.push(req);
      result.path?.push([req, step++]);
      currentPosition = req;
    }

    if (higher.length > 0) {
      // If we have higher requests, move to cylinder 0 and wrap around
      if (currentPosition > 0) {
        result.seekDistance += currentPosition; // Move to cylinder 0
        result.sequence.push(0);
        result.path?.push([0, step++]);
        currentPosition = 0;
      }

      // Jump to the max cylinder (not counted in seek distance)
      result.sequence.push(cylinders - 1);
      result.path?.push([cylinders - 1, step++]);
      currentPosition = cylinders - 1;

      // Now serve all higher requests in descending order
      const reversedHigher = [...higher].reverse();
      for (const req of reversedHigher) {
        result.seekDistance += Math.abs(req - currentPosition);
        result.sequence.push(req);
        result.path?.push([req, step++]);
        currentPosition = req;
      }
    }
  }

  return result;
}
