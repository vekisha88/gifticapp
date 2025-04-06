// Environment container that will be populated
export const env: {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  bcryptSalt: number;
  blockchainRpcUrl: string;
  blockchainPrivateKey: string;
  ethereumNetwork: string;
  platformFeePercentage: number;
  [key: string]: any; // Allow dynamic properties
} = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gifticapp',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  bcryptSalt: parseInt(process.env.BCRYPT_SALT || '10', 10),
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  ethereumNetwork: process.env.ETHEREUM_NETWORK || 'localhost',
  platformFeePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.025'),
};

// Is this React Native?
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Loads environment variables from .env files in multiple locations
 * Only works in Node.js environment, not in React Native
 */
export async function loadEnv(packageName?: string): Promise<void> {
  // For React Native, just log and return
  if (isReactNative) {
    console.log('React Native environment detected, using default environment settings');
    return;
  }

  // In Node.js environments, try to load .env files
  try {
    // Use dynamic import instead of require, which works in both ESM and CommonJS
    try {
      const loadEnvNodeModule = await import('./loadEnvNode.js');
      if (loadEnvNodeModule && typeof loadEnvNodeModule.loadEnvNode === 'function') {
        loadEnvNodeModule.loadEnvNode(packageName);
      }
    } catch (moduleError) {
      // Fallback for older Node.js versions or builds where .js extension doesn't work
      try {
        const loadEnvNodeModule = await import('./loadEnvNode');
        if (loadEnvNodeModule && typeof loadEnvNodeModule.loadEnvNode === 'function') {
          loadEnvNodeModule.loadEnvNode(packageName);
        }
      } catch (plainError) {
        throw new Error(`Failed to import loadEnvNode: ${plainError}`);
      }
    }
  } catch (error) {
    console.warn('Failed to load Node.js environment module:', error);
    console.log('Using default environment settings');
  }
}

/**
 * Updates the env object with values from process.env
 * Works in both Node.js and React Native
 */
export function updateEnvFromProcess(): void {
  // Update standard fields
  env.nodeEnv = process.env.NODE_ENV || env.nodeEnv;
  env.port = parseInt(process.env.PORT || String(env.port), 10);
  env.mongoUri = process.env.MONGO_URI || env.mongoUri;
  env.jwtSecret = process.env.JWT_SECRET || env.jwtSecret;
  env.bcryptSalt = parseInt(process.env.BCRYPT_SALT || String(env.bcryptSalt), 10);
  env.blockchainRpcUrl = process.env.BLOCKCHAIN_RPC_URL || env.blockchainRpcUrl;
  env.blockchainPrivateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || env.blockchainPrivateKey;
  env.ethereumNetwork = process.env.ETHEREUM_NETWORK || env.ethereumNetwork;
  env.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || String(env.platformFeePercentage));
  
  // Copy all process.env values to our env object
  for (const key in process.env) {
    if (!(key in env)) {
      env[key] = process.env[key];
    }
  }
}

export default { loadEnv, env }; 