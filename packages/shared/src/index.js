// Export all types
export * from './types/index.js';

// Export contract ABI
export { GiftContractABI } from './contracts/GiftContract.js';

// Utility functions
export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
}; 