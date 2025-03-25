/**
 * Frontend environment configuration
 * 
 * This file provides environment configuration for the frontend.
 * It uses Expo's Constants.expoConfig.extra for environment variables in React Native.
 * 
 * Note: When running on a mobile device or emulator, replace 'localhost' with your computer's local IP address
 * (e.g., 'http://192.168.1.100:4000')
 */

import Constants from 'expo-constants';

// Get environment variables from Expo config or use defaults
const getExpoEnv = () => {
  const expoExtra = Constants.expoConfig?.extra || {};
  return {
    API_BASE_URL: expoExtra.apiBaseUrl || process.env.API_BASE_URL || 'http://192.168.100.47:4000',
    RECEIVER_EMAIL: expoExtra.receiverEmail || process.env.RECEIVER_EMAIL || 'vksha88+receiver@gmail.com',
    BLOCKCHAIN_NETWORK: expoExtra.blockchainNetwork || process.env.BLOCKCHAIN_NETWORK || 'localhost',
    GIFT_CONTRACT_ADDRESS: expoExtra.giftContractAddress || process.env.GIFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  };
};

// Environment configuration
export const env = getExpoEnv();

// For backward compatibility
export const API_BASE_URL = env.API_BASE_URL;
export const RECEIVER_EMAIL = env.RECEIVER_EMAIL;

export default env;
