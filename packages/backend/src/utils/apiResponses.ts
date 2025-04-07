import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { AppError, ErrorCode, formatErrorResponse } from '@gifticapp/shared';

interface ApiResponse {
  success: boolean;
  items?: any[];
  data?: any;
  message?: string;
  [key: string]: any;
}

/**
 * Standard API response structure
 * @param {boolean} success Whether the request was successful
 * @param {any} data Response data
 * @param {string} message Response message
 * @returns {Object} Standardized API response
 */
export function createApiResponse(success: boolean, data: any = null, message: string | null = null): ApiResponse {
  const response: ApiResponse = { success };
  
  if (data) {
    if (Array.isArray(data)) {
      response.items = data;
    } else if (typeof data === 'object') {
      // Spread the data into the response
      Object.assign(response, data);
    } else {
      response.data = data;
    }
  }
  
  if (message) {
    response.message = message;
  }
  
  return response;
}

/**
 * Send a success response
 * @param {object} res Express response object
 * @param {any} data Response data
 * @param {string} message Success message
 * @param {number} statusCode HTTP status code (default: 200)
 */
export function sendSuccess(res: Response, data: any = null, message: string | null = null, statusCode: number = 200): Response {
  return res.status(statusCode).json(createApiResponse(true, data, message));
}

/**
 * Send an error response
 * @param {object} res Express response object
 * @param {string} message Error message
 * @param {number} statusCode HTTP status code (default: 400)
 * @param {any} data Additional data to include in the response
 */
export function sendError(res: Response, message: string, statusCode: number = 400, data: any = null): Response {
  return res.status(statusCode).json(createApiResponse(false, data, message));
}

/**
 * Send a standardized error response for caught exceptions
 * @param {object} res Express response object
 * @param {Error} error Error object (should be AppError)
 * @param {string} context Context where the error occurred
 * @param {number} defaultStatusCode Default HTTP status code if not an AppError
 */
export function sendErrorResponse(res: Response, error: Error | AppError, context: string, defaultStatusCode: number = 500): Response {
  // Ensure error is an AppError. If not, wrap it.
  // This step might be redundant if controllers always use shared handleError first,
  // but provides safety.
  let appError: AppError;
  if (!(error instanceof AppError)) {
    // If it's not an AppError, log the original and wrap it
    logger.error(`Unexpected error type caught in ${context}: ${error.message}`, {
      stack: error.stack,
      context,
      originalError: error
    });
    // Use the shared handleError to wrap it
    appError = handleError(error, context);
  } else {
    appError = error;
  }

  // Logging should happen in the controller/service where the error originates or is handled.
  // Keep logging here minimal, focused on the response being sent.
  logger.warn(`Sending error response for ${context}: Status ${appError.statusCode}, Code ${appError.code}`);
  
  // Determine status code - Use the statusCode from the AppError directly
  const statusCode = appError.statusCode || defaultStatusCode;
  
  // Send the formatted error response using the shared formatter
  return res.status(statusCode).json(formatErrorResponse(appError));
}

/**
 * Create middleware that wraps route handlers for standardized error handling
 * @param {Function} fn Route handler function
 * @returns {Function} Wrapped route handler with error handling
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendErrorResponse(res, error, fn.name || 'asyncHandler');
    });
  };
} 

