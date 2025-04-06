import { logger } from '../logger.js';

interface ErrorDetails {
  [key: string]: any;
}

/**
 * Custom application error class for standardized error handling
 */
export class AppError extends Error {
  code: string;
  details: ErrorDetails;
  statusCode: number;

  constructor(message: string, code: string, details: ErrorDetails = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.statusCode = 500; // Default status code
  }
}

/**
 * Create an authentication error
 * @param {string} message Error message
 * @param {Object} details Additional error details
 * @returns {AppError} Authentication error
 */
export function createAuthenticationError(message: string, details: ErrorDetails = {}): AppError {
  const error = new AppError(message, 'AUTHENTICATION_ERROR', details);
  error.name = 'AuthenticationError';
  error.statusCode = 401;
  return error;
}

/**
 * Create an authorization error
 * @param {string} message Error message
 * @param {Object} details Additional error details
 * @returns {AppError} Authorization error
 */
export function createAuthorizationError(message: string, details: ErrorDetails = {}): AppError {
  const error = new AppError(message, 'AUTHORIZATION_ERROR', details);
  error.name = 'AuthorizationError';
  error.statusCode = 403;
  return error;
}

/**
 * Create a validation error
 * @param {string} message Error message
 * @param {Object} details Additional error details
 * @returns {AppError} Validation error
 */
export function createValidationError(message: string, details: ErrorDetails = {}): AppError {
  const error = new AppError(message, 'VALIDATION_ERROR', details);
  error.name = 'ValidationError';
  error.statusCode = 400;
  return error;
}

/**
 * Create a not found error
 * @param {string} message Error message
 * @param {Object} details Additional error details
 * @returns {AppError} Not found error
 */
export function createNotFoundError(message: string, details: ErrorDetails = {}): AppError {
  const error = new AppError(message, 'NOT_FOUND_ERROR', details);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  return error;
}

/**
 * Create a conflict error
 * @param {string} message Error message
 * @param {Object} details Additional error details
 * @returns {AppError} Conflict error
 */
export function createConflictError(message: string, details: ErrorDetails = {}): AppError {
  const error = new AppError(message, 'CONFLICT_ERROR', details);
  error.name = 'ConflictError';
  error.statusCode = 409;
  return error;
}

/**
 * Create a blockchain-specific error
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {Object} details Additional error details
 * @returns {AppError} Blockchain error
 */
export function createBlockchainError(
  message: string, 
  code: string = 'BLOCKCHAIN_ERROR', 
  details: ErrorDetails = {}
): AppError {
  const error = new AppError(message, code, details);
  error.name = 'BlockchainError';
  error.statusCode = 500;
  return error;
}

/**
 * Create a database-specific error
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {Object} details Additional error details
 * @returns {AppError} Database error
 */
export function createDatabaseError(
  message: string, 
  code: string = 'DATABASE_ERROR', 
  details: ErrorDetails = {}
): AppError {
  const error = new AppError(message, code, details);
  error.name = 'DatabaseError';
  error.statusCode = 500;
  return error;
}

/**
 * Handle errors in a standardized way
 * @param {Error} error Error to handle
 * @param {string} context Context where the error occurred
 * @param {Object} additionalDetails Additional details to include
 */
export function handleError(error: Error | AppError, context: string, additionalDetails: ErrorDetails = {}): AppError {
  let appError: AppError;
  
  // If it's already an AppError, just add context
  if (error instanceof AppError) {
    appError = error;
    appError.details = { ...appError.details, ...additionalDetails, context };
  } else {
    // Wrap regular errors in an AppError
    appError = new AppError(
      error.message || 'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      { ...additionalDetails, context, originalError: error.message }
    );
  }
  
  // Log the error
  logger.error(`❌ ${appError.name} in ${context}: ${appError.message}`, {
    errorCode: appError.code,
    ...appError.details
  });
  
  return appError;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code?: string;
  details?: ErrorDetails;
}

/**
 * Format error for API responses
 * @param {Error} error Error to format
 * @returns {Object} Formatted error response
 */
export function formatErrorResponse(error: Error | AppError): ErrorResponse {
  // For AppErrors, return structured response
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'production' 
        ? undefined 
        : error.details
    };
  }
  
  // For regular errors, return generic response
  return {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request' 
      : error.message
  };
} 

