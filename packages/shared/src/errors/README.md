# Error Handling System

This directory contains the standardized error handling system used throughout the GifticApp application.

## Quick Reference

### Available Error Classes

```typescript
import { 
  AppError,            // Base error class
  ValidationError,     // For input validation errors
  NotFoundError,       // For resources not found
  AuthenticationError, // For authentication issues
  AuthorizationError,  // For permission issues
  DatabaseError,       // For database errors
  BlockchainError,     // For blockchain errors
  ApiError,            // For external API errors
  ConflictError        // For data conflicts
} from '@gifticapp/shared';
```

### Error Handler Utilities

```typescript
import {
  handleError,         // Standardize error format
  createAsyncHandler,  // Create error-handling async wrapper
  formatErrorResponse  // Format errors for API responses
} from '@gifticapp/shared';
```

### Error Codes

```typescript
import { ErrorCode } from '@gifticapp/shared';

// Example error codes
ErrorCode.VALIDATION_ERROR
ErrorCode.NOT_FOUND_ERROR
ErrorCode.AUTHENTICATION_ERROR
// etc.
```

## Usage Examples

### Throwing an Error

```typescript
import { ValidationError } from '@gifticapp/shared';

function validateInput(input) {
  if (!input.name) {
    throw new ValidationError('Name is required');
  }
}
```

### Creating an Async Handler with Error Handling

```typescript
import { createAsyncHandler, NotFoundError } from '@gifticapp/shared';

const getResource = createAsyncHandler(async (req, res) => {
  const resource = await fetchResource(req.params.id);
  
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  
  return res.json({ success: true, data: resource });
});
```

### Handling Errors with try/catch

```typescript
import { handleError, formatErrorResponse } from '@gifticapp/shared';

async function handleRequest(req, res) {
  try {
    // Business logic here
  } catch (error) {
    const appError = handleError(error, 'handleRequest');
    return res.status(appError.statusCode).json(formatErrorResponse(appError));
  }
}
```

## See Full Documentation

For more detailed documentation, see [error-handling.md](../../docs/error-handling.md). 