import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { logger } from '../logger.js';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation middleware using express-validator
 * @param {ValidationChain[]} validations Array of validation checks
 */
export function validate(validations: ValidationChain[] = []): (req: Request, res: Response, next: NextFunction) => Promise<void | Response> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      // Execute all validations
      for (const validation of validations) {
        await validation.run(req);
      }
      
      // Check for validation errors
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        // Format validation errors for client
        const formattedErrors: ValidationError[] = errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }));
        
        logger.warn(`Validation error: ${JSON.stringify(formattedErrors)}`);
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          validation: formattedErrors
        });
      }
      
      next();
    } catch (error: any) {
      logger.error(`Validation middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Server error during validation',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
} 

