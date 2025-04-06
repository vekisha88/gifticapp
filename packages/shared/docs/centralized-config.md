# Centralized Configuration System

This document explains how GifticApp's centralized configuration system works. The centralized configuration approach ensures all parts of the application (frontend, backend, and blockchain) use consistent settings.

## Overview

The centralized configuration system is designed to:

1. Load environment variables from a central `.env` file
2. Provide default values for all configuration options
3. Structure the configuration in logical sections
4. Make the configuration available to all packages

## Configuration Structure

Configuration is organized into these sections:

- **app**: General application settings
- **server**: API server configuration 
- **database**: MongoDB database settings
- **auth**: Authentication and security
- **blockchain**: Blockchain connection and contract details
- **payment**: Payment processing and fees
- **externalApis**: API keys for external services
- **testing**: Test data and settings
- **logging**: Log levels and settings

## Usage

### Importing in JavaScript/TypeScript

To use the centralized configuration in your code:

```typescript
// Import the entire config object
import { appConfig } from '@gifticapp/shared';

// Or import specific sections
import { blockchain, server } from '@gifticapp/shared';

// Example usage
console.log(`Connecting to blockchain at ${blockchain.rpcUrl}`);
console.log(`Contract address: ${blockchain.giftContractAddress}`);
```

### Environment Variables

All configuration values can be overridden by setting environment variables in your `.env` file. The `.env` file should be located at the project root:

```
# Server configuration
PORT=4000
HOST=0.0.0.0
API_BASE_URL=http://localhost:4000

# Blockchain configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=31337
BLOCKCHAIN_NETWORK=localhost
GIFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CHARITY_WALLET_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
COMPANY_WALLET=0x90F79bf6EB2c4f870365E785982E1f101E93b906

# Database configuration
MONGODB_URI=mongodb://localhost:27017/gifticapp
```

### Available Configuration Options

Here's a complete list of configuration options with their default values:

#### App Configuration

| Option | Environment Variable | Default Value | Description |
|--------|---------------------|---------------|-------------|
| name | - | 'GifticApp' | Application name |
| version | APP_VERSION | '1.0.0' | Application version |
| env | NODE_ENV | 'development' | Environment (development, production, test) |
| isDev | - | (derived) | True when in development mode |
| isProd | - | (derived) | True when in production mode |

#### Server Configuration

| Option | Environment Variable | Default Value | Description |
|--------|---------------------|---------------|-------------|
| port | PORT | 4000 | Server port |
| host | HOST | '0.0.0.0' | Server host |
| apiBaseUrl | API_BASE_URL | 'http://localhost:4000' | API base URL |
| frontendUrl | FRONTEND_URL | 'http://localhost:19000' | Frontend URL |
| corsOrigins | CORS_ORIGINS | ['http://localhost:19000'] | Allowed CORS origins (comma-separated) |

#### Database Configuration

| Option | Environment Variable | Default Value | Description |
|--------|---------------------|---------------|-------------|
| mongoUri | MONGODB_URI | 'mongodb://localhost:27017/gifticapp' | MongoDB connection URI |
| mongoOptions | - | {useNewUrlParser: true, useUnifiedTopology: true} | MongoDB connection options |

#### Blockchain Configuration

| Option | Environment Variable | Default Value | Description |
|--------|---------------------|---------------|-------------|
| rpcUrl | BLOCKCHAIN_RPC_URL | 'http://127.0.0.1:8545' | Blockchain RPC URL |
| chainId | BLOCKCHAIN_CHAIN_ID | '31337' | Chain ID |
| network | BLOCKCHAIN_NETWORK | 'localhost' | Network name |
| giftContractAddress | GIFT_CONTRACT_ADDRESS | '0x5Fb...' | Gift contract address |
| charityWalletAddress | CHARITY_WALLET_ADDRESS | '0x3C4...' | Charity wallet address |
| companyWalletAddress | COMPANY_WALLET | '0x90F...' | Company wallet address |
| masterMnemonic | MASTER_MNEMONIC | 'army romance...' | Master mnemonic for wallet generation |
| privateKey | PRIVATE_KEY | '0xac0...' | Private key for transactions |

## Adding New Configuration

To add new configuration options:

1. Update `packages/shared/src/config/appConfig.ts`
2. Add the new option with a default value
3. Use the value in your code by importing from `@gifticapp/shared`

## Best Practices

1. Always use the centralized configuration instead of direct `process.env` access
2. Group related configuration options together
3. Provide sensible default values for all options
4. Use environment variables for any sensitive data (API keys, secrets)
5. In production, ensure all sensitive values are securely set as environment variables 