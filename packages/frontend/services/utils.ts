/**
 * Format error message from API response
 * @param error Error object from axios
 * @returns Formatted error message
 */
export function formatErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  // Handle axios error response
  if (error.response && error.response.data) {
    const data = error.response.data;
    
    // Check for validation errors
    if (data.validation && Array.isArray(data.validation)) {
      return data.validation.map((err: any) => err.message).join(', ');
    }
    
    // Check for error message
    if (data.message) {
      return data.message;
    }
    
    // Check for error field
    if (data.error) {
      return data.error;
    }
  }
  
  // Handle other error formats
  if (error.message) {
    return error.message;
  }
  
  // Fallback to string representation
  return error.toString();
} 