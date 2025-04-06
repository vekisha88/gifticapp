# Environment Configuration

## Overview

GifticApp uses a centralized environment configuration system to manage environment variables across all packages in the monorepo.

## Key Features

- **Centralized Configuration**: All environment variables are defined in a single `.env` file at the root of the project.
- **Package-Specific Loading**: Each package can load the environment variables it needs.
- **Shared TypeScript Types**: Environment variables are typed for better developer experience.

## Setup

### Root .env File

The project uses a root `.env` file in the monorepo root directory. This file contains all environment variables used by any package.

Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

Then customize the values as needed.

### Usage in Packages

To load environment variables in a package, use the `loadEnv` function:

```typescript
import { loadEnv, env } from '@gifticapp/shared';

// Load environment variables
loadEnv('backend'); // or 'frontend', 'blockchain', etc.

// Now you can access env variables
console.log(env.mongoUri);
```

## Available Environment Variables

Here are the key environment variables used in the project:

### Server Settings
- `PORT`: The port number for the server (default: 8000)
- `HOST`: The host address (default: 0.0.0.0)
- `NODE_ENV`: The environment mode (development, production, test)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

### Database Settings
- `MONGODB_URI`: MongoDB connection string

### API Configuration
- `API_BASE_URL`: Base URL for API requests

### Blockchain Settings
- `BLOCKCHAIN_NETWORK`: The blockchain network to use (localhost, polygon, etc.)
- `RPC_URL`: The RPC URL for the blockchain provider
- `BLOCKCHAIN_RPC_URL`: Alternative name for RPC_URL
- `GIFT_CONTRACT_ADDRESS`: The address of the deployed gift contract
- `BLOCKCHAIN_CHAIN_ID`: The chain ID of the blockchain network
- `CHARITY_WALLET_ADDRESS`: The address of the charity wallet
- `COMPANY_WALLET`: The address of the company wallet

## Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | Database connection string | `mongodb://localhost:27017/gifticapp` |
| `JWT_SECRET` | Secret for JWT tokens | (sensitive) |
| `BLOCKCHAIN_RPC_URL` | Blockchain node URL | `http://localhost:8545` |
| `BLOCKCHAIN_CHAIN_ID` | Chain ID for blockchain | `31337` (Hardhat) |

## Best Practices

1. Call `loadEnv` at the beginning of your application entry point
2. Keep sensitive information only in `.env` files (never commit these)
3. Use `env` object to access environment variables rather than `process.env`
4. Keep `.env.example` files updated as templates

## Shared Environment Variables

Here's a list of the shared environment variables used across packages:

### General
- `NODE_ENV` - Application environment (development, production, test)
- `API_BASE_URL` - Base URL for API calls

### Backend/Database
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration

### Blockchain
- `BLOCKCHAIN_RPC_URL` - Blockchain node URL
- `BLOCKCHAIN_CHAIN_ID` - Chain ID for blockchain
- `BLOCKCHAIN_NETWORK` - Network name
- `GIFT_CONTRACT_ADDRESS` - Deployed contract address

### Fee Configuration
- `PLATFORM_FEE_PERCENTAGE` - Platform fee percentage
- `MINIMUM_GIFT_AMOUNT` - Minimum gift amount

### Security
- `MASTER_MNEMONIC` - Development mnemonic (DO NOT USE IN PRODUCTION)
- `PRIVATE_KEY` - Development private key (DO NOT USE IN PRODUCTION)

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