// Define the structure of environment variables expected
export interface ProcessEnv {
  BLOCKCHAIN_RPC_URL: string;
  BLOCKCHAIN_CHAIN_ID: string;
  BLOCKCHAIN_NETWORK: string;
  GIFT_CONTRACT_ADDRESS: string;
  CHARITY_WALLET_ADDRESS: string;
  COMPANY_WALLET: string;
  PORT: string; // Usually a number, but often loaded as string
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PLATFORM_FEE_PERCENTAGE: string; // Consider parsing to number where used
  MINIMUM_GIFT_AMOUNT: string; // Consider parsing to number where used
  COINMARKETCAP_API_KEY: string;
  MASTER_MNEMONIC?: string; // Optional for production
  PRIVATE_KEY?: string; // Optional for production
}

// Optional: Provide a typed object for process.env if needed elsewhere,
// but often individual variables are accessed directly.
// Example:
// export const env: ProcessEnv = process.env as unknown as ProcessEnv;
// Ensure proper validation/parsing when using environment variables. 