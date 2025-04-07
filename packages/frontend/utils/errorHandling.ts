import { AppError, ErrorCode } from '@gifticapp/shared';

/**
 * Handle API errors in the frontend
 * 
 * @param error Error from API or other source
 * @param defaultMessage Default message to show if none is provided
 * @returns User-friendly error message
 */
export function handleApiError(error: any, defaultMessage: string = 'An unexpected error occurred'): string {
  // Handle AppError format returned from the backend
  if (error && error.code && error.error) {
    return getUserFriendlyMessage(error.code, error.error);
  }
  
  // Handle Axios error format
  if (error && error.response && error.response.data) {
    const { data } = error.response;
    // ADD Check for validation errors first
    if (data.validation && Array.isArray(data.validation)) {
      return data.validation.map((err: any) => err.message).join(', ');
    }
    // Check for AppError structure within Axios data
    if (data.code && data.error) {
      return getUserFriendlyMessage(data.code, data.error);
    }
    // Check for simple message
    if (data.message) {
      return data.message;
    }
    // Check for simple error field (as fallback within Axios data)
    if (data.error) {
      return data.error;
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback for other error types
  return error?.message || defaultMessage;
}

/**
 * Get a user-friendly error message based on error code
 * 
 * @param code Error code
 * @param defaultMessage Default message if no mapping exists
 * @returns User-friendly error message
 */
function getUserFriendlyMessage(code: string, defaultMessage: string): string {
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    [ErrorCode.AUTHENTICATION_ERROR]: 'You need to sign in to access this feature',
    [ErrorCode.AUTHORIZATION_ERROR]: 'You do not have permission to access this feature',
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
    [ErrorCode.NOT_FOUND_ERROR]: 'The requested resource could not be found',
    [ErrorCode.CONFLICT_ERROR]: 'This action conflicts with existing data',
    [ErrorCode.BLOCKCHAIN_ERROR]: 'There was an issue with the blockchain transaction',
    [ErrorCode.TRANSACTION_FAILED]: 'The transaction failed to complete',
    [ErrorCode.DATABASE_ERROR]: 'There was an issue with the database',
    [ErrorCode.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection',
    [ErrorCode.API_ERROR]: 'There was an issue connecting to the service',
    [ErrorCode.TIMEOUT_ERROR]: 'The request timed out. Please try again',
  };
  
  return errorMessages[code] || defaultMessage;
}

/**
 * Show an error notification or alert
 * 
 * @param error Error object or message
 * @param fallbackMessage Fallback message if error is undefined
 */
export function showErrorNotification(error: any, fallbackMessage: string = 'An error occurred'): void {
  const message = handleApiError(error, fallbackMessage);
  
  // Use your app's notification system here
  // Examples:
  // - Toast notification
  // - Alert dialog
  // - Snackbar
  
  console.error('Error:', message);
  
  // Example using alert() for simplicity - replace with your notification system
  alert(message);
} 