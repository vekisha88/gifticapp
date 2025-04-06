import { logger } from '../logger.js';

/**
 * Validates if a string is a valid Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  try {
    if (!address) return false;
    
    // Ethereum addresses should be 42 characters long (including 0x prefix)
    // and contain only hexadecimal characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch (error: any) {
    logger.error(`Error validating Ethereum address: ${error.message}`);
    return false;
  }
}

/**
 * Standardizes an Ethereum address (converts to lowercase if valid)
 * @param address The address to standardize
 * @returns The standardized address or the original if not valid
 */
export function standardizeEthereumAddress(address: string): string {
  try {
    if (isValidEthereumAddress(address)) {
      return address.toLowerCase();
    }
    return address;
  } catch (error: any) {
    logger.error(`Error standardizing Ethereum address: ${error.message}`);
    return address;
  }
}

/**
 * Validates if a date is in the future by at least minHours
 * @param date The date to validate (Date object or ISO string)
 * @param minHours Minimum hours in the future (default: 2)
 * @returns True if the date is valid and in the future, false otherwise
 */
export function isValidFutureDate(date: Date | string, minHours: number = 2): boolean {
  try {
    const dateToCheck = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    // Add minHours to current time to get the minimum acceptable date
    const minDate = new Date(now.getTime() + (minHours * 60 * 60 * 1000));
    
    return dateToCheck.getTime() > minDate.getTime();
  } catch (error: any) {
    logger.error(`Error validating future date: ${error.message}`);
    return false;
  }
}

/**
 * Validates if a value is a positive number above minValue
 * @param value The number to validate
 * @param minValue Minimum acceptable value (default: 0.0001)
 * @returns True if the value is valid and positive, false otherwise
 */
export function isValidPositiveNumber(value: number | string, minValue: number = 0.0001): boolean {
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return !isNaN(numValue) && isFinite(numValue) && numValue >= minValue;
  } catch (error: any) {
    logger.error(`Error validating positive number: ${error.message}`);
    return false;
  }
}

/**
 * Validates if a string is a valid email address
 * @param email The email to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  try {
    if (!email) return false;
    
    // Basic email validation
    // For production, consider using a more comprehensive validation library
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error: any) {
    logger.error(`Error validating email: ${error.message}`);
    return false;
  }
} 

