/**
 * @typedef {Object} ProcessEnv
 * @property {string} BLOCKCHAIN_RPC_URL - Blockchain RPC URL
 * @property {string} BLOCKCHAIN_CHAIN_ID - Blockchain Chain ID
 * @property {string} BLOCKCHAIN_NETWORK - Blockchain Network
 * @property {string} GIFT_CONTRACT_ADDRESS - Gift Contract Address
 * @property {string} CHARITY_WALLET_ADDRESS - Charity Wallet Address
 * @property {string} COMPANY_WALLET - Company Wallet Address
 * @property {string} PORT - API Port
 * @property {'development' | 'production' | 'test'} NODE_ENV - Node Environment
 * @property {string} MONGODB_URI - MongoDB Connection URI
 * @property {string} JWT_SECRET - JWT Secret Key
 * @property {string} JWT_EXPIRES_IN - JWT Expiration Time
 * @property {string} PLATFORM_FEE_PERCENTAGE - Platform Fee Percentage
 * @property {string} MINIMUM_GIFT_AMOUNT - Minimum Gift Amount
 * @property {string} COINMARKETCAP_API_KEY - CoinMarketCap API Key
 * @property {string} [MASTER_MNEMONIC] - Master Mnemonic (Development)
 * @property {string} [PRIVATE_KEY] - Private Key (Development)
 */

/**
 * @type {Object}
 * @property {ProcessEnv} env
 */
export const process = {
  env: {}
}; 