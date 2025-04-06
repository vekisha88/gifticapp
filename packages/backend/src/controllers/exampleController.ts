import { Request, Response } from 'express';
import { logger, logSuccess, logError } from '../logger.js';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  handleError, 
  createAsyncHandler, 
  formatErrorResponse 
} from '@gifticapp/shared';

/**
 * Example controller using the new standardized error handling
 * 
 * This file demonstrates how to use the shared error handling system
 * in backend controllers to ensure consistent error responses.
 */

interface Resource {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
}

/**
 * Get a resource by ID
 * @route GET /api/example/:id
 */
export const getResourceById = createAsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Input validation
  if (!id) {
    throw new ValidationError('Resource ID is required');
  }
  
  // Example business logic
  const resource = await findResourceById(id);
  
  if (!resource) {
    throw new NotFoundError(`Resource with ID ${id} not found`);
  }
  
  // Log successful operation
  logSuccess(`Retrieved resource with ID ${id}`);
  
  // Return successful response
  return res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * Create a new resource
 * @route POST /api/example
 */
export const createResource = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, description } = req.body;
    
    // Input validation
    if (!name) {
      throw new ValidationError('Name is required');
    }
    
    // Example business logic
    const newResource = await saveResource({ name, description });
    
    // Log successful operation
    logSuccess(`Created new resource: ${name}`);
    
    // Return successful response
    return res.status(201).json({
      success: true,
      data: newResource
    });
  } catch (error: any) {
    // Standardized error handling
    const appError = handleError(error, 'createResource');
    
    // Log the error
    logError(`Failed to create resource: ${appError.message}`, {
      code: appError.code,
      details: appError.details
    });
    
    // Return error response
    return res.status(appError.statusCode || 500).json(formatErrorResponse(appError));
  }
};

/**
 * Mock database functions for demonstration purposes
 */
async function findResourceById(id: string): Promise<Resource | null> {
  // This would normally be a database query
  if (id === 'test') {
    return { id, name: 'Test Resource', description: 'A test resource' };
  }
  return null;
}

interface ResourceInput {
  name: string;
  description?: string;
}

async function saveResource(data: ResourceInput): Promise<Resource> {
  // This would normally save to a database
  return { id: 'new-id', ...data, createdAt: new Date() };
} 

