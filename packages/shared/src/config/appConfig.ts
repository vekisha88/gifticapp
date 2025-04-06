import { env, loadEnv, updateEnvFromProcess } from './loadEnv';

// Initialize environment variables
loadEnv();

// Check if this is React Native
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Global application configuration object
 */
export const appConfig = {
  // General app configuration
  app: {
    name: 'GifticApp',
    version: '1.0.0',
    environment: env.nodeEnv
  },

  // Server configuration
  server: {
    port: env.port,
    url: isReactNative 
      ? 'http://localhost:3000' // Default for React Native
      : `http://localhost:${env.port}`
  },

  // Database configuration
  db: {
    mongoUri: env.mongoUri,
  },

  // Authentication settings
  auth: {
    jwtSecret: env.jwtSecret,
    bcryptSalt: env.bcryptSalt,
    tokenExpiresIn: '24h'
  },
  
  // Blockchain settings
  blockchain: {
    rpcUrl: env.blockchainRpcUrl,
    privateKey: env.blockchainPrivateKey,
    network: env.ethereumNetwork
  },
  
  // Payment and fees
  payment: {
    platformFeePercentage: env.platformFeePercentage,
    minimumGiftAmount: 0.01
  },

  // External APIs configuration
  externalApis: {
    // Add external API configs as needed
  },

  // Testing configuration
  testing: {
    enabled: env.nodeEnv === 'test',
  },

  // Logging configuration
  logging: {
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
  },
};

// Export individual configuration sections
export const { app, server, db, auth, blockchain, payment, externalApis, testing, logging } = appConfig;

export default appConfig; 