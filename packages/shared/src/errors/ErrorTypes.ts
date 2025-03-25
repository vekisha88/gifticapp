import { AppError, ErrorCode } from './AppError';

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error for when resources cannot be found
 */
export class NotFoundError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.NOT_FOUND_ERROR, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Authentication error for when users are not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error for when users lack permission
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.DATABASE_ERROR, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Blockchain error for blockchain operation failures
 */
export class BlockchainError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.BLOCKCHAIN_ERROR, details);
    this.name = 'BlockchainError';
  }
}

/**
 * API error for external API call failures
 */
export class ApiError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.API_ERROR, details);
    this.name = 'ApiError';
  }
}

/**
 * Conflict error for when there are data conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, ErrorCode.CONFLICT_ERROR, details);
    this.name = 'ConflictError';
  }
} 