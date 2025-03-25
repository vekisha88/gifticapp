import { logger } from '../logger.js';

/**
 * Custom application error class for standardized error handling
 */
export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Create a blockchain-specific error
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {Object} details Additional error details
 * @returns {AppError} Blockchain error
 */
export function createBlockchainError(message, code, details = {}) {
  const error = new AppError(message, code, details);
  error.name = 'BlockchainError';
  return error;
}

/**
 * Create a database-specific error
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {Object} details Additional error details
 * @returns {AppError} Database error
 */
export function createDatabaseError(message, code, details = {}) {
  const error = new AppError(message, code, details);
  error.name = 'DatabaseError';
  return error;
}

/**
 * Create a validation-specific error
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {Object} details Additional error details
 * @returns {AppError} Validation error
 */
export function createValidationError(message, code, details = {}) {
  const error = new AppError(message, code, details);
  error.name = 'ValidationError';
  return error;
}

/**
 * Handle errors in a standardized way
 * @param {Error} error Error to handle
 * @param {string} context Context where the error occurred
 * @param {Object} additionalDetails Additional details to include
 */
export function handleError(error, context, additionalDetails = {}) {
  // If it's already an AppError, just add context
  if (error instanceof AppError) {
    error.details = { ...error.details, ...additionalDetails, context };
  } else {
    // Wrap regular errors in an AppError
    error = new AppError(
      error.message || 'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      { ...additionalDetails, context, originalError: error.message }
    );
  }
  
  // Log the error
  logger.error(`❌ ${error.name} in ${context}: ${error.message}`, {
    errorCode: error.code,
    ...error.details
  });
  
  return error;
}

/**
 * Format error for API responses
 * @param {Error} error Error to format
 * @returns {Object} Formatted error response
 */
export function formatErrorResponse(error) {
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