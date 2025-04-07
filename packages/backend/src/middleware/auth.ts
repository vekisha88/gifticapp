import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/userService.js';
import { createAuthenticationError, createAuthorizationError } from '../utils/errorHandler.js';
import { logger } from '../logger.js';
import { AppError, ErrorCode } from '@gifticapp/shared';
import { TokenPayload, AuthenticatedRequest } from '../types/index.js';

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from the Authorization header
 * Sets the user information in the request object
 */
export function auth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAuthenticationError('No token provided');
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.warn('Authentication attempt failed: No token provided');
      throw new AppError('No token provided', ErrorCode.AUTHENTICATION_ERROR);
    }
    
    // Handle Bearer token format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    if (!token) {
      logger.warn('Authentication attempt failed: No token after Bearer check');
      throw new AppError('No token provided', ErrorCode.AUTHENTICATION_ERROR);
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Set user data in request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    logger.error(`Authentication error: ${error.message}`);
    throw new AppError('Invalid or expired token', ErrorCode.AUTHENTICATION_ERROR);
  }
}

/**
 * Role-based authorization middleware
 * Requires the auth middleware to be used first
 * @param {string[]} roles Array of allowed roles
 */
export function authorize(roles: string[] = []): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('Authorization check failed: User not authenticated');
        throw new AppError('You must be logged in to access this resource', ErrorCode.AUTHENTICATION_ERROR);
      }
      
      // If roles is empty, allow all authenticated users
      if (roles.length === 0) {
        return next();
      }
      
      // Check if user has one of the required roles
      if (!roles.some((role) => req.user?.roles?.includes(role))) {
        logger.warn(`Authorization failed: User ${req.user.id} does not have required roles: ${roles}`);
        throw new AppError('You do not have permission to access this resource', ErrorCode.AUTHORIZATION_ERROR);
      }
      
      next();
    } catch (error: any) {
      logger.warn(`Authorization failed: ${error.message}`);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
        message: error.message
      });
    }
  };
} 

