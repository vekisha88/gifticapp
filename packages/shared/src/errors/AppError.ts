/**
 * Standard error codes for consistent error handling across the application
 */
export enum ErrorCode {
  // General errors
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Authentication & Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // Input validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Data errors
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  
  // Blockchain specific errors
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  // General errors
  [ErrorCode.UNEXPECTED_ERROR]: 500,
  [ErrorCode.NOT_IMPLEMENTED]: 501,
  
  // Authentication & Authorization
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  
  // Input validation
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  
  // Data errors
  [ErrorCode.NOT_FOUND_ERROR]: 404,
  [ErrorCode.CONFLICT_ERROR]: 409,
  
  // Blockchain specific errors
  [ErrorCode.BLOCKCHAIN_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.GAS_ESTIMATION_FAILED]: 500,
  
  // Database errors
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DB_CONNECTION_ERROR]: 500,
  
  // Network errors
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.API_ERROR]: 500,
  [ErrorCode.TIMEOUT_ERROR]: 504,
};

/**
 * Base application error class for standardized error handling
 */
export class AppError extends Error {
  /**
   * Name of the error class
   */
  public name: string = 'AppError';
  
  /**
   * Error code from the ErrorCode enum
   */
  public code: ErrorCode;
  
  /**
   * Additional details about the error
   */
  public details: Record<string, any>;
  
  /**
   * HTTP status code for this error
   */
  public statusCode: number;
  
  /**
   * Constructor for AppError
   * 
   * @param message Human-readable error message
   * @param code Error code from ErrorCode enum
   * @param details Additional details about the error
   */
  constructor(message: string, code: ErrorCode = ErrorCode.UNEXPECTED_ERROR, details: Record<string, any> = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = ERROR_HTTP_STATUS_MAP[code] || 500;
    
    // Ensure stack trace works correctly
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Convert the error to a JSON response object
   * 
   * @param includeDetails Whether to include error details in the response
   * @returns Formatted error response object
   */
  public toJSON(includeDetails: boolean = process.env.NODE_ENV !== 'production'): Record<string, any> {
    const response: Record<string, any> = {
      success: false,
      error: this.message,
      code: this.code,
    };
    
    if (includeDetails && Object.keys(this.details).length > 0) {
      response.details = this.details;
    }
    
    return response;
  }
}