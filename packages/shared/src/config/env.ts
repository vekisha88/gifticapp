/**
 * Centralized Environment Configuration
 * 
 * This file provides a consistent interface for accessing environment variables
 * across the entire application. It ensures type safety and provides default values
 * for all environment variables.
 */

// Define the shape of the environment configuration
export interface EnvironmentConfig {
  // API and Server Configuration
  apiBaseUrl: string;
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // MongoDB Configuration
  mongoUri: string;
  
  // Blockchain Configuration
  blockchainRpcUrl: string;
  blockchainChainId: number;
  blockchainNetwork: string;
  giftContractAddress: string;
  charityWalletAddress: string;
  companyWalletAddress: string;
  
  // Security
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // Fee Configuration
  platformFeePercentage: number;
  minimumGiftAmount: number;
  
  // Price Feed Configuration
  coinMarketCapApiKey: string;
  
  // Development Keys (only used in development)
  masterMnemonic?: string;
  privateKey?: string;
  
  // Email Configuration (for testing)
  buyerEmail?: string;
  receiverEmail?: string;
}

/**
 * Get environment variables with fallbacks to default values
 * 
 * @param processEnv The process.env object
 * @returns Configuration object with all environment variables
 */
export function getEnvironment(processEnv = process.env): EnvironmentConfig {
  return {
    // API and Server Configuration
    apiBaseUrl: processEnv.API_BASE_URL || 'http://localhost:4000',
    port: parseInt(processEnv.PORT || '4000', 10),
    nodeEnv: (processEnv.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    
    // MongoDB Configuration
    mongoUri: processEnv.MONGO_URI || processEnv.MONGODB_URI || 'mongodb://localhost:27017/gifticapp',
    
    // Blockchain Configuration
    blockchainRpcUrl: processEnv.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    blockchainChainId: parseInt(processEnv.BLOCKCHAIN_CHAIN_ID || '31337', 10),
    blockchainNetwork: processEnv.BLOCKCHAIN_NETWORK || 'localhost',
    giftContractAddress: processEnv.GIFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    charityWalletAddress: processEnv.CHARITY_WALLET_ADDRESS || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    companyWalletAddress: processEnv.COMPANY_WALLET || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    
    // Security
    jwtSecret: processEnv.JWT_SECRET || 'development-jwt-secret-do-not-use-in-production',
    jwtExpiresIn: processEnv.JWT_EXPIRES_IN || '24h',
    
    // Fee Configuration
    platformFeePercentage: parseFloat(processEnv.PLATFORM_FEE_PERCENTAGE || '5'),
    minimumGiftAmount: parseFloat(processEnv.MINIMUM_GIFT_AMOUNT || '0.01'),
    
    // Price Feed Configuration
    coinMarketCapApiKey: processEnv.COINMARKETCAP_API_KEY || '',
    
    // Development Keys
    masterMnemonic: processEnv.MASTER_MNEMONIC,
    privateKey: processEnv.PRIVATE_KEY,
    
    // Email Configuration
    buyerEmail: processEnv.BUYER_EMAIL,
    receiverEmail: processEnv.RECEIVER_EMAIL,
  };
}

// Create and export a singleton environment configuration
export const env: EnvironmentConfig = getEnvironment(); 