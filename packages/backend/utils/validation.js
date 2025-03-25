import { logger } from "../logger.js";

/**
 * Validate Ethereum address format
 * @param {string} address The wallet address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEthereumAddress(address) {
  try {
    if (!address) return false;
    // Check for 0x prefix and 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch (error) {
    logger.error(`Error validating Ethereum address: ${error.message}`);
    return false;
  }
}

/**
 * Standardize Ethereum address (lowercase)
 * @param {string} address The wallet address to standardize
 * @returns {string} Standardized address or empty string if invalid
 */
export function standardizeEthereumAddress(address) {
  try {
    if (!isValidEthereumAddress(address)) {
      return '';
    }
    return address.toLowerCase();
  } catch (error) {
    logger.error(`Error standardizing Ethereum address: ${error.message}`);
    return '';
  }
}

/**
 * Validate future date (must be at least minHours from now)
 * @param {Date|string} date Date to validate
 * @param {number} minHours Minimum hours in the future (default: 2)
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidFutureDate(date, minHours = 2) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return false;
    }
    
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + minHours * 60 * 60 * 1000);
    return dateObj >= minFutureTime;
  } catch (error) {
    logger.error(`Error validating future date: ${error.message}`);
    return false;
  }
}

/**
 * Validate positive number greater than minValue
 * @param {number} value Number to validate
 * @param {number} minValue Minimum value (default: 0.0001)
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidPositiveNumber(value, minValue = 0.0001) {
  try {
    const num = Number(value);
    return !isNaN(num) && num >= minValue;
  } catch (error) {
    logger.error(`Error validating positive number: ${error.message}`);
    return false;
  }
}

/**
 * Validate email format
 * @param {string} email Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email) {
  try {
    if (!email) return false;
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error) {
    logger.error(`Error validating email: ${error.message}`);
    return false;
  }
} 