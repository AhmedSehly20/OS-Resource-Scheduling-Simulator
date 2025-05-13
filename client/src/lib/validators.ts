export function validateMemoryInput(
  frames: string,
  referenceString: string
): { valid: boolean; message: string; frameCount?: number; refArray?: number[] } {
  // Validate frame count
  const frameCount = parseInt(frames);
  if (!frameCount || frameCount <= 0) {
    return { valid: false, message: 'Number of frames must be a positive integer' };
  }

  // Validate reference string
  const refStringValue = referenceString.trim();
  if (!refStringValue) {
    return { valid: false, message: 'Reference string is required' };
  }

  // Convert reference string to array of numbers
  const refArray = refStringValue.split(/\s+/).map(Number);
  
  // Check if all values are valid numbers
  if (refArray.some(isNaN)) {
    return { valid: false, message: 'Reference string must contain only numbers separated by spaces' };
  }
  
  // Check if all values are non-negative
  if (refArray.some(num => num < 0)) {
    return { valid: false, message: 'Reference string must contain non-negative integers' };
  }

  return { valid: true, message: '', frameCount, refArray };
}

export function validateDiskInput(
  cylinders: string,
  headPosition: string,
  requestQueue: string
): { valid: boolean; message: string; cylinders?: number; start?: number; requestArray?: number[] } {
  // Validate total cylinders
  const cylindersCount = parseInt(cylinders);
  if (!cylindersCount || cylindersCount <= 0) {
    return { valid: false, message: 'Total cylinders must be a positive integer' };
  }

  // Validate head position
  const start = parseInt(headPosition);
  if (isNaN(start) || start < 0) {
    return { valid: false, message: 'Head position must be a non-negative integer' };
  }

  if (start >= cylindersCount) {
    return { valid: false, message: `Head position must be less than total cylinders (0-${cylindersCount-1})` };
  }

  // Validate request queue
  const requestsValue = requestQueue.trim();
  if (!requestsValue) {
    return { valid: false, message: 'Request queue is required' };
  }

  // Convert request queue to array of numbers
  const requestArray = requestsValue.split(',').map(r => parseInt(r.trim()));
  
  // Check if all values are valid numbers
  if (requestArray.some(isNaN)) {
    return { valid: false, message: 'Request queue must contain only numbers separated by commas' };
  }
  
  // Check if all values are within range
  if (requestArray.some(num => num < 0 || num >= cylindersCount)) {
    return { valid: false, message: `Request queue must contain integers between 0 and ${cylindersCount-1}` };
  }

  return { valid: true, message: '', cylinders: cylindersCount, start, requestArray };
}
