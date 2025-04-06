# GifticApp

A marketplace application for gift cards built with React Native, Expo, and blockchain integration.

## Project Structure

The project is organized as a monorepo with the following packages:

- `packages/frontend`: The mobile application built with React Native and Expo
- `packages/backend`: The backend API service
- `packages/shared`: Shared types, utilities, and configuration
- `packages/blockchain`: Smart contract and blockchain interaction

## Requirements

- Node.js (v18 or later recommended)
- npm
- PowerShell (for Windows script execution)
- Expo Go app (for testing on physical devices)

## Getting Started

1. Clone the repository
2. Install dependencies (run from the root directory):
   ```powershell
   npm install
   ```

3. Run the application (from the root directory):
   ```powershell
   ./start-app.ps1
   ```

   This script will:
   - Check for and stop existing processes on required ports.
   - Start the local Hardhat blockchain node.
   - Deploy the smart contracts to the local node.
   - Start the backend server.
   - Start the frontend Expo development server with optimizations.
   - Monitor the running services in the console (Press Ctrl+C to stop monitoring).

   **Wait for the script to finish initializing all services.** You should see a QR code printed in the console. Scan this code with the Expo Go app on your mobile device to run the application.

## Development

While `./start-app.ps1` is the primary way to run the full application, you can also run individual components for focused development.

### Frontend

The frontend is a React Native application built with Expo. To start *only* the frontend development server:

```powershell
cd packages/frontend
npm run start # Or: npx expo start
```

### Backend

The backend is a Node.js application. To start *only* the backend server:

```powershell
cd packages/backend
npm run dev
```

### Blockchain

The blockchain component uses a local development node.

To start *only* the local blockchain node:

```powershell
cd packages/blockchain
npm run node
```

To deploy contracts to the *already running* local node:

```powershell
cd packages/blockchain
npm run deploy
```

## Troubleshooting

### QR Code Not Displaying in `start-app.ps1`

If the QR code doesn't display properly after running `./start-app.ps1` and waiting for initialization:

1. The script attempts to show the output. Scroll up in your console to check if it appeared earlier.
2. If it's still missing, you can view the raw output of the frontend job by running:
   ```powershell
   Receive-Job -Name "FrontendExpo" -Keep
   ```

### Port Already in Use Errors

The `start-app.ps1` script attempts to stop processes on required ports (8545, 8000, 8081, 19000). If you still encounter errors:

1. Manually stop any relevant `node` processes or close terminal windows running parts of the application.
2. Re-run `./start-app.ps1`.

### Other Issues

- Ensure you have installed dependencies correctly by running `npm install` in the root directory.
- Check that Node.js and npm versions meet the requirements.
- For frontend-specific issues, try cleaning the Expo cache:
  ```powershell
  cd packages/frontend
npm run clean
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

## Recent Updates and Improvements

### March 2024 Update

The following improvements have been made to the codebase:

1. **Environment Management**:
   - Centralized environment variable management in the shared package
   - Improved environment loading to properly handle the monorepo structure

2. **PowerShell Compatibility**:
   - Added PowerShell-compatible scripts for starting all application components
   - New unified `start-app.ps1` script to launch the entire application with one command

3. **Code Structure**:
   - Fixed redundant nested package structure in frontend
   - Removed duplicate dependencies

4. **Smart Contract Updates**:
   - Updated contract version compatibility
   - Improved contract constructor to accept parameters instead of using hardcoded values

5. **Performance and Reliability**:
   - Implemented log file rotation to prevent disk space issues
   - Improved error handling and script execution
   - Direct imports for scripts instead of using child processes

### Usage of New Scripts

To start the entire application at once, use the new unified script:

```powershell
.\start-app.ps1
```

This will launch all components in the correct order:
1. The blockchain node (Hardhat)
2. The backend server (Express)
3. The frontend (Expo)

Each component will run in its own PowerShell window, making it easy to monitor logs.

To stop all components when finished, press Ctrl+C in the main script window and confirm with 'y' when prompted.

## Centralized Configuration

GifticApp now uses a centralized configuration system to manage all environment variables and settings in one place. All components (frontend, backend, and blockchain) pull their configuration from this central system.

### Key Features

- Single source of truth for all configuration values
- Structured with logical sections (app, server, database, blockchain, etc.)
- Default values for everything, overridable via environment variables
- Easily accessible from any package

### Using the Configuration

To use the configuration in your code:

```typescript
// Import the entire config object
import { appConfig } from '@gifticapp/shared';

// Or import specific sections
import { blockchain, server } from '@gifticapp/shared';

// Example usage
console.log(`Connecting to blockchain at ${blockchain.rpcUrl}`);
```

### Environment Setup

All configuration can be controlled through the root `.env` file. See the [centralized configuration documentation](packages/shared/docs/centralized-config.md) for full details on available options.

```
# Example .env file
PORT=4000
MONGODB_URI=mongodb://localhost:27017/gifticapp
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
```

## Environment Configuration

The project uses the following environment configuration strategy:

1. Root `.env` file - Contains variables used by the start scripts and general configuration
2. Package-specific `.env` files - Contain variables specific to each package
3. `.env.example` files - Provide templates for setting up environment variables

## Code Structure

The codebase follows a monorepo pattern with these packages:

- `packages/frontend` - React Native application using Expo
- `packages/backend` - Express.js server API
- `packages/blockchain` - Hardhat-based smart contracts and blockchain interactions
- `packages/shared` - Common types, utilities, and configurations shared across packages
- `packages/config` - Build configurations and tooling
