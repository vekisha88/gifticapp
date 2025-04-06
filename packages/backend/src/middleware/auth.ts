import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/userService.js';
import { createAuthenticationError, createAuthorizationError } from '../utils/errorHandler.js';
import { logger } from '../logger.js';

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
      throw createAuthenticationError('No token provided');
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Set user data in request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    logger.warn(`Authentication failed: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
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
        throw createAuthenticationError('You must be logged in to access this resource');
      }
      
      // If roles is empty, allow all authenticated users
      if (roles.length === 0) {
        return next();
      }
      
      // Check if user has an allowed role
      if (!roles.includes(req.user.role)) {
        throw createAuthorizationError('You do not have permission to access this resource');
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

