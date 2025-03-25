# GifticApp Local Environment Setup Guide

## Project Overview

GifticApp is a monorepo project with multiple packages:
- **Frontend**: A mobile/web application built with Expo/React Native
- **Backend**: A Node.js/Express server
- **Blockchain**: Smart contracts using Hardhat
- **Shared**: Shared utilities and types
- **Config**: Shared configuration

## Prerequisites

Before setting up the project, ensure you have the following installed:
- Node.js (v22 or higher recommended)
- npm (v10 or higher recommended)
- Git
- MongoDB (v6.0 or higher recommended)

### Installing Node.js and npm using NVM (recommended)

We recommend using Node Version Manager (NVM) to install and manage Node.js versions:

1. Install NVM:
   - On macOS/Linux:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```
   - On Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows)

2. Install Node.js v22:
   ```bash
   nvm install 22
   nvm use 22
   ```

3. Verify installation:
   ```bash
   node --version  # Should show v22.x.x
   npm --version   # Should show v10.x.x
   ```

### Installing MongoDB

#### On macOS:

1. Using Homebrew (recommended):
   ```bash
   # Install Homebrew if you don't have it
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install MongoDB
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB service
   brew services start mongodb-community
   ```

2. Verify installation:
   ```bash
   mongosh --version
   ```

3. MongoDB will be available at `mongodb://localhost:27017`

#### On Windows:

1. Download the MongoDB Community Server installer from the [official MongoDB website](https://www.mongodb.com/try/download/community)

2. Run the installer and follow the installation wizard:
   - Choose "Complete" installation
   - Install MongoDB as a service (recommended)
   - Install MongoDB Compass (optional but useful GUI)

3. Verify installation:
   - Open Command Prompt and run:
   ```bash
   mongosh --version
   ```

4. MongoDB will be available at `mongodb://localhost:27017`

#### Using Docker (Alternative for any platform):

If you prefer using Docker:

```bash
# Pull the MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gifticapp
```

### 2. Install Dependencies

The project uses npm workspaces to manage dependencies across packages.

```bash
npm install
```

This will install all dependencies for the root project and all packages.

### 3. Environment Setup

#### Backend Environment

Create or modify the `.env` file in `packages/backend/`:

```
# Database connection
MONGODB_URI=mongodb://localhost:27017/gifticapp
# Other environment variables as needed
```

#### Frontend Environment

Check the `.env` file in `packages/frontend/`:

```
# API URL - update with your backend URL
API_URL=http://localhost:3000
```

#### Blockchain Environment

You may need to set up environment variables for blockchain interactions. Create a `.env` file in `packages/blockchain/` if needed.

```
# Add or update this in your packages/backend/.env file

# Database connection
MONGODB_URI=mongodb://localhost:27017/gifticapp
ETHEREUM_RPC_URL=http://localhost:8545  # Default Hardhat node URL
```

### 4. Running the Application

You can run all packages simultaneously using Turborepo:

```bash
npm run dev
```

Or run each package individually:

#### Frontend

```bash
cd packages/frontend
npm run dev
```

This will start the Expo development server. You can run the app on:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

#### Backend

```bash
cd packages/backend
npm run dev
```

This will start the backend server with Nodemon for automatic reloading.

#### Blockchain

```bash
cd packages/blockchain
npm run dev
```

This will start a local Hardhat node for blockchain development.

### 5. Building the Application

To build all packages:

```bash
npm run build
```

### 6. Testing

To run tests across all packages:

```bash
npm run test
```

## Package-Specific Information

### Frontend (Expo/React Native)

- Built with Expo Router
- Uses React Native for cross-platform mobile development
- Supports iOS, Android, and Web

Key commands:
- `npm run start` or `npm run dev`: Start the Expo development server
- `npm run ios`: Run on iOS simulator
- `npm run android`: Run on Android emulator
- `npm run web`: Run in web browser
- `npm run reset-project`: Reset the Expo project

### Backend (Node.js/Express)

- RESTful API server built with Express
- Uses MongoDB for data storage
- Includes authentication and various API endpoints

Key commands:
- `npm run dev`: Start the server with Nodemon
- `npm run start`: Start the server without auto-reloading

### Blockchain (Hardhat)

- Smart contract development using Hardhat
- Uses OpenZeppelin contracts
- Includes deployment scripts and tests

Key commands:
- `npm run dev`: Start a local Hardhat node
- `npm run build`: Compile smart contracts
- `npm run deploy`: Deploy smart contracts
- `npm run test`: Run smart contract tests

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you encounter port conflicts, check if other applications are using the same ports.

2. **Node version issues**: Ensure you're using a compatible Node.js version. You may want to use a version manager like nvm.

3. **Dependency issues**: If you encounter dependency issues, try:
   ```bash
   npm clean-install
   ```

4. **Expo issues**: For Expo-related issues, try:
   ```bash
   cd packages/frontend
   npm run reset-project
   ```

## Additional Resources

- Check individual package README files for more specific information
- Refer to the project documentation for API endpoints and usage

This setup guide should help you get the GifticApp running in your local environment. If you encounter any issues not covered here, please refer to the project's issue tracker or contact the development team.

## Recent Improvements

### Standardized Error Handling

We've implemented a standardized error handling system throughout the application:

- **Consistent Error Types**: All errors extend from a base `AppError` class with standardized properties
- **Error Codes**: Enumerated error codes that map consistently to HTTP status codes
- **Specialized Error Classes**: Purpose-built error classes for different scenarios (validation, not found, etc.)
- **Async Handler Utility**: A wrapper for async functions that provides standardized error handling
- **Frontend Error Handling**: Utilities for handling and displaying user-friendly error messages

This system ensures:
- Consistent error formats in API responses
- Proper HTTP status codes based on error type
- Detailed error information for debugging
- User-friendly error messages in the frontend

For more information, see [error-handling.md](packages/shared/docs/error-handling.md).

### Centralized Environment Configuration

We've implemented a centralized environment configuration system:

- **Single Source of Truth**: Environment variables defined in one place
- **Type Safety**: TypeScript interfaces for environment variables
- **Consistent Access**: Single `env` object used throughout the application
- **Intelligent Loading**: Environment files loaded in a predictable order
- **Sensible Defaults**: Default values for all environment variables

This system ensures:
- Consistent environment variable access across packages
- No duplicate or conflicting definitions
- Easy environment configuration updates

For more information, see [environment-config.md](packages/shared/docs/environment-config.md).

### Environment Setup

To set up your environment:

1. Copy the `.env.example` file to `.env` in the project root:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration values

3. For local overrides that you don't want in Git, create a `.env.local` file
