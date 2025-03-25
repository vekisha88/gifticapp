import { AppError, ErrorCode } from './AppError';

/**
 * Handle errors in a standardized way
 * 
 * @param error Original error
 * @param context Context where the error occurred
 * @param additionalDetails Additional details to include in the error
 * @returns Standardized AppError
 */
export function handleError(
  error: Error | AppError, 
  context: string, 
  additionalDetails: Record<string, any> = {}
): AppError {
  // If it's already an AppError, just add context to details
  if (error instanceof AppError) {
    error.details = { 
      ...error.details, 
      ...additionalDetails, 
      context 
    };
    return error;
  }
  
  // For regular errors, wrap in an AppError
  return new AppError(
    error.message || 'An unexpected error occurred',
    ErrorCode.UNEXPECTED_ERROR,
    {
      ...additionalDetails,
      context,
      originalError: error.message,
      stack: error.stack
    }
  );
}

/**
 * Create an async handler that catches errors and returns standardized responses
 * 
 * @param fn Async function to wrap
 * @param errorHandler Custom error handler function
 * @returns Wrapped function that handles errors
 */
export function createAsyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: AppError) => any
): (...args: Parameters<T>) => Promise<any> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(
        error instanceof Error ? error : new Error(String(error)),
        fn.name || 'unknown',
      );
      
      if (errorHandler) {
        return errorHandler(appError);
      }
      
      throw appError;
    }
  };
}

/**
 * Format an error for API responses
 * 
 * @param error Error to format
 * @param includeDetails Whether to include details in production
 * @returns Formatted error response
 */
export function formatErrorResponse(
  error: Error | AppError,
  includeDetails: boolean = process.env.NODE_ENV !== 'production'
): Record<string, any> {
  if (error instanceof AppError) {
    return error.toJSON(includeDetails);
  }
  
  // For regular errors, create a generic error response
  return {
    success: false,
    error: process.env.NODE_ENV === 'production' && !includeDetails
      ? 'An error occurred'
      : error.message,
  };
} 