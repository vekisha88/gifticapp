// Export shared utilities, types, and constants
export * from './types';
export * from './types/gift';
export * from './api';
export * from './errors';
export * from './config';
export { env } from './config/env';

// Example shared utility
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
}; 