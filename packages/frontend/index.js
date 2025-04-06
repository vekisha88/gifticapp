// Mock Node.js modules before importing anything else
// This ensures that any attempt to import these modules will use our shims
global.process = global.process || {};
global.process.env = global.process.env || {
  NODE_ENV: 'development',
  API_URL: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:3000'
};

// Prepare shims
const fsShim = require('./shims/fs').default;
const pathShim = require('./shims/path').default;
const dotenvShim = require('./shims/dotenv').default;

// Patch require to handle Node.js modules
const originalRequire = global.require;
global.require = function(name) {
  if (name === 'fs') return fsShim;
  if (name === 'path') return pathShim;
  if (name === 'dotenv') return dotenvShim;
  
  // Handle potential dynamic imports in shared package
  if (name.includes('loadEnvNode') || name.endsWith('loadEnvNode.js')) {
    console.log('Intercepted loadEnvNode import:', name);
    return { loadEnvNode: () => ({}) };
  }

  // Use original require for everything else
  return originalRequire(name);
};

// Patch Error.stackTraceLimit to prevent excessive stack traces
Error.stackTraceLimit = 25;

// Now import the app
import 'expo-router/entry';
import { loadEnvRN, updateEnvFromProcess } from './src/utils/loadEnvRN';

// Initialize environment variables before app starts
const env = loadEnvRN();

// Log the initial environment for debugging
console.log('Initial environment API_BASE_URL =', process.env.API_BASE_URL);

// Set them to process.env so they're available throughout the app
Object.assign(process.env, env);

// Log the updated environment for debugging
console.log('Updated environment API_BASE_URL =', process.env.API_BASE_URL);

// Also update any shared env objects
updateEnvFromProcess(); 