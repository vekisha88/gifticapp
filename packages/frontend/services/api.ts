import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';

// Get API URL from Expo config or fallback to default
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:3000';

/**
 * Axios instance configured for the application
 * - Sets base URL from environment
 * - Configures timeouts and headers
 * - Includes response interceptors for error handling
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor for consistent error handling
 * Transforms errors into a standard format with helpful error messages
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Format error message for consistent error handling
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with a status code that falls out of the range of 2xx
      const data = error.response.data as any;
      errorMessage = data.error || data.message || `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }

    return Promise.reject({
      ...error,
      formattedMessage: errorMessage,
    });
  }
);

/**
 * Formats API error messages into user-friendly strings
 * 
 * @param error - The error object from a failed API request
 * @param fallbackMessage - Default message to use if no error details are available
 * @returns A user-friendly error message string
 */
export const formatErrorMessage = (error: any, fallbackMessage = 'An error occurred'): string => {
  if (error?.formattedMessage) {
    return error.formattedMessage;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return fallbackMessage;
};

/**
 * Sets the authentication token for all subsequent API requests
 * 
 * @param token - JWT token to include in Authorization header, or null to remove the header
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export { api, API_BASE_URL }; 