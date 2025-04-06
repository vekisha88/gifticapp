/**
 * This is a React Native specific version of loadEnv
 * It loads environment variables from the app's config
 * since we can't use fs in React Native
 */

import Constants from 'expo-constants';

// Wrap potentially problematic imports in try/catch
let SharedEnv = { env: {} };
try {
  // Attempt to import from shared package, but catch any errors
  SharedEnv = require('@gifticapp/shared/dist/esm/config/env');
} catch (error) {
  console.warn('Failed to import from shared package:', error.message);
}

export function loadEnvRN() {
  // In React Native, we use the app config to store environment variables
  // This is set during the build process or from app.json
  const envFromExpo = Constants.expoConfig?.extra || {};
  
  // You can also use process.env for environment variables 
  // that were bundled during build time
  const envFromBuild = process.env || {};
  
  // Combine environment variables
  const env = {
    ...envFromBuild,
    ...envFromExpo,
    // Add any default values needed for RN
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Add API_URL and other important variables with defaults if needed
    API_URL: process.env.API_URL || envFromExpo.API_URL || 'http://localhost:3000',
    API_BASE_URL: process.env.API_BASE_URL || envFromExpo.API_BASE_URL || 'http://localhost:3000'
  };

  // Ensure process.env is updated with our values
  process.env.API_BASE_URL = env.API_BASE_URL;
  process.env.API_URL = env.API_URL;
  process.env.NODE_ENV = env.NODE_ENV;

  // Try to update the shared env object if it's available
  try {
    if (SharedEnv.env) {
      Object.assign(SharedEnv.env, env);
    }
  } catch (error) {
    console.warn('Failed to update shared env:', error.message);
  }

  return env;
}

// Export a named function that matches the shared package's interface
export function loadEnv(packageName) {
  console.log('React Native environment detected, using app.json configuration');
  return loadEnvRN();
}

// Export loadEnvNode as a no-op function for compatibility with shared package
export function loadEnvNode(packageName) {
  console.log('React Native environment - loadEnvNode is a no-op');
  return loadEnvRN();
}

// Create mock for updateEnvFromProcess to ensure compatibility
export function updateEnvFromProcess() {
  const env = loadEnvRN();
  
  // Update the process.env object
  Object.assign(process.env, env);
  
  // Try to update the shared env object if it's available
  try {
    if (SharedEnv.env) {
      Object.assign(SharedEnv.env, env);
    }
  } catch (error) {
    console.warn('Failed to update shared env:', error.message);
  }

  // Log for debugging
  console.log('Environment updated, API_BASE_URL =', process.env.API_BASE_URL);

  return env;
}

// Default export for compatibility
export default { loadEnv, loadEnvRN, loadEnvNode, updateEnvFromProcess }; 