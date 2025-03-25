# Environment Configuration

This document describes the centralized environment configuration system used throughout the GifticApp application.

## Overview

The environment configuration system provides a consistent way to:

1. Define and access environment variables across all packages
2. Ensure type safety for environment values
3. Provide sensible default values
4. Load environment variables from various .env files in a predictable order

## Using Environment Variables

### Accessing Environment Variables

Import the `env` object from the shared package:

```javascript
// In JavaScript/TypeScript files
import { env } from '@gifticapp/shared';

// Use environment variables
console.log(`API Base URL: ${env.apiBaseUrl}`);
console.log(`MongoDB URI: ${env.mongoUri}`);
```

### Available Environment Variables

The following environment variables are available through the `env` object:

| Property | Environment Variable | Default Value | Description |
|----------|----------------------|---------------|-------------|
| `apiBaseUrl` | `API_BASE_URL` | `"http://localhost:4000"` | Base URL for API requests |
| `port` | `PORT` | `4000` | Port for the server |
| `nodeEnv` | `NODE_ENV` | `"development"` | Node environment |
| `mongoUri` | `MONGODB_URI` or `MONGO_URI` | `"mongodb://localhost:27017/gifticapp"` | MongoDB connection URI |
| `blockchainRpcUrl` | `BLOCKCHAIN_RPC_URL` | `"http://127.0.0.1:8545"` | Blockchain RPC URL |
| `blockchainChainId` | `BLOCKCHAIN_CHAIN_ID` | `31337` | Blockchain chain ID |
| `blockchainNetwork` | `BLOCKCHAIN_NETWORK` | `"localhost"` | Blockchain network name |
| `giftContractAddress` | `GIFT_CONTRACT_ADDRESS` | (default contract address) | Gift contract address |
| `charityWalletAddress` | `CHARITY_WALLET_ADDRESS` | (default wallet address) | Charity wallet address |
| `companyWalletAddress` | `COMPANY_WALLET` | (default wallet address) | Company wallet address |
| `jwtSecret` | `JWT_SECRET` | (default secret) | JWT secret |
| `jwtExpiresIn` | `JWT_EXPIRES_IN` | `"24h"` | JWT expiration time |
| `platformFeePercentage` | `PLATFORM_FEE_PERCENTAGE` | `5` | Platform fee percentage |
| `minimumGiftAmount` | `MINIMUM_GIFT_AMOUNT` | `0.01` | Minimum gift amount |
| `coinMarketCapApiKey` | `COINMARKETCAP_API_KEY` | `""` | CoinMarketCap API key |
| `masterMnemonic` | `MASTER_MNEMONIC` | `undefined` | Master mnemonic (dev only) |
| `privateKey` | `PRIVATE_KEY` | `undefined` | Private key (dev only) |
| `buyerEmail` | `BUYER_EMAIL` | `undefined` | Buyer email (testing) |
| `receiverEmail` | `RECEIVER_EMAIL` | `undefined` | Receiver email (testing) |

## Environment File Loading

The system loads environment variables from multiple .env files in the following order:

1. Default values (in env.ts)
2. .env file in project root
3. .env.local file in project root (if exists, not in Git)
4. .env.{NODE_ENV} file in project root (if exists)
5. Package-specific .env file (.e.g, packages/backend/.env)
6. Environment variables already defined in process.env

Later files override variables from earlier files.

### Loading Environment Variables

To load environment variables in a package, use the `loadEnv` function:

```javascript
// In your app's entry point (e.g., app.js)
import { loadEnv, env } from '@gifticapp/shared';

// Load environment variables for this package
loadEnv('backend'); // or 'frontend', 'blockchain', etc.

// Now you can use the env object
console.log(`Starting server in ${env.nodeEnv} mode`);
```

## Setting Up Environment Variables

1. Copy the `.env.example` file from the project root to `.env`
2. Customize the variables in the `.env` file as needed
3. For package-specific overrides, create a `.env` file in the package directory

## Best Practices

1. Always use the `env` object from the shared package instead of `process.env`
2. Call `loadEnv` at the beginning of your application entry point
3. Keep sensitive values (like API keys, secrets) out of source control
4. Use environment-specific files (`.env.production`, `.env.test`) for varying configurations
5. Use `.env.local` for local overrides that should not be in Git 