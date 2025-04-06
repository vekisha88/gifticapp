import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to wrap Express route handlers
 * This eliminates the need for try/catch blocks in route handlers
 * @param {Function} fn - Express route handler
 * @returns {Function} - Enhanced route handler with error catching
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 

