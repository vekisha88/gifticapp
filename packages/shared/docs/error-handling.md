# Standardized Error Handling

This document describes the standardized error handling system used throughout the GifticApp application.

## Overview

The error handling system provides a consistent way to:

1. Create, throw, and catch errors
2. Format errors for API responses
3. Log errors with context
4. Map errors to HTTP status codes
5. Present user-friendly error messages

## Error Classes

All errors extend the base `AppError` class, which includes:

- A human-readable error message
- An error code from the `ErrorCode` enum
- Optional details object for additional context
- HTTP status code (derived from the error code)

### Available Error Classes

- `AppError`: Base error class
- `ValidationError`: For input validation failures
- `NotFoundError`: When a requested resource cannot be found
- `AuthenticationError`: For authentication failures
- `AuthorizationError`: For permission issues
- `DatabaseError`: For database operation failures
- `BlockchainError`: For blockchain-related errors
- `ApiError`: For external API call failures
- `ConflictError`: For data conflicts

## Using Errors in Backend Code

### Option 1: Using the createAsyncHandler utility

The `createAsyncHandler` utility wraps an async function and handles errors automatically:

```javascript
import { ValidationError, NotFoundError, createAsyncHandler } from '@gifticapp/shared';

export const getUser = createAsyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ValidationError('User ID is required');
  }
  
  const user = await findUserById(id);
  
  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }
  
  return res.status(200).json({
    success: true,
    data: user
  });
});
```

### Option 2: Using try/catch with handleError

```javascript
import { ValidationError, handleError, formatErrorResponse } from '@gifticapp/shared';

export const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      throw new ValidationError('Name and email are required');
    }
    
    const user = await saveUser({ name, email });
    
    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    // Standardize the error
    const appError = handleError(error, 'createUser');
    
    // Return error response with correct status code
    return res.status(appError.statusCode).json(formatErrorResponse(appError));
  }
};
```

## Using Errors in Frontend Code

The frontend utilities help handle errors from API responses:

```typescript
import { handleApiError, showErrorNotification } from '../utils/errorHandling';

async function fetchData() {
  try {
    const response = await api.getResource(id);
    return response.data;
  } catch (error) {
    // Get user-friendly error message
    const message = handleApiError(error, 'Failed to load resource');
    
    // Show error notification to user
    showErrorNotification(error);
    
    // Optionally log to monitoring service
    console.error('Error fetching resource:', error);
  }
}
```

## Error Codes and HTTP Status Mapping

Each error code maps to an HTTP status code:

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| UNEXPECTED_ERROR | 500 | Unknown server error |
| NOT_IMPLEMENTED | 501 | Feature not implemented |
| AUTHENTICATION_ERROR | 401 | Not authenticated |
| AUTHORIZATION_ERROR | 403 | Not authorized |
| VALIDATION_ERROR | 400 | Invalid input |
| INVALID_INPUT | 400 | Invalid input format |
| NOT_FOUND_ERROR | 404 | Resource not found |
| CONFLICT_ERROR | 409 | Resource conflict |
| BLOCKCHAIN_ERROR | 500 | Blockchain operation failed |
| DATABASE_ERROR | 500 | Database operation failed |
| NETWORK_ERROR | 503 | Network connection issue |
| API_ERROR | 500 | External API error |
| TIMEOUT_ERROR | 504 | Request timeout |

## Best Practices

1. Always throw specific error classes rather than generic errors
2. Include meaningful error messages
3. Add context to errors when handling them
4. Use the `createAsyncHandler` utility for route handlers
5. Handle all errors at the API boundary
6. Present user-friendly messages in the frontend
7. Log errors with appropriate context 