// Export shared utilities, types, and constants
export * from './types';

// Example shared utility
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
}; 