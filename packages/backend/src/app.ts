import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
// Import the loadEnv function from shared package
// In ESM environments, we can import directly
import { loadEnv } from "@gifticapp/shared";

// Load environment variables from centralized config
loadEnv('backend');

// Log environment information
console.log(`Environment loaded: ${process.env.NODE_ENV || 'development'}`);
console.log(`Using MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/gifticapp'}`);
console.log(`Using blockchain network: ${process.env.BLOCKCHAIN_NETWORK || 'localhost'}`);
console.log(`Using contract address: ${process.env.GIFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}`);

// Load services
import { logger } from "./logger.js";
import { connectDatabase } from "./services/databaseService.js";
import { generateWallets } from "./utils/walletGenerator.js";
import { setupContractEvents, initializeContract, getContractStatus, CONTRACT_STATUS } from "./services/eventService.js";
import { setupDirectTransferMonitoring, checkPendingGiftsOnStartup } from "./services/transactionMonitorService.js";
import { cleanupExpiredGifts, batchProcessGifts } from "./services/giftService.js";
import { getBlockchainStatus, getGasPrices, initializeBlockchainConnection } from "./services/blockchainService.js";
import { Wallet } from "./models/wallet.js";
import { initializeAppComponents } from './services/initializationService.js';
import { scheduleJobs } from './jobs/scheduler.js';

// Load routes
import giftRoutes from "./routes/gift.js";
import userRoutes from "./routes/user.js";
import healthRoutes from './routes/health.js';
import devRoutes from './routes/dev.js';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();

// Log environment information to the logger
logger.info(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
logger.info(`MongoDB URI: ${process.env.MONGODB_URI ? 'Loaded' : 'Not Set - Using Default'}`);
logger.info(`Blockchain network: ${process.env.BLOCKCHAIN_NETWORK || 'localhost'}`);
logger.info(`Gift contract address: ${process.env.GIFT_CONTRACT_ADDRESS ? 'Loaded' : 'Not Set - Using Default'}`);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002',
    /^https?:\/\/.*\.expo\.dev$/,
    /^https?:\/\/.*\.exp\.direct$/,
    /^exp:\/\/.*$/
  ],
  credentials: true
}));
app.use(bodyParser.json());
app.use(morgan("combined"));

// Initialize components asynchronously BEFORE starting server/routes
initializeAppComponents().then(() => {
  // API routes
  app.use("/api/gift", giftRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/dev", devRoutes);

  // Setup cron jobs AFTER initialization
  scheduleJobs();

  // Start the server
  const PORT = process.env.PORT || 8000;
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️ Port ${PORT} is already in use. Try stopping other instances.`);
      process.exit(1);
    } else {
      logger.error(`❌ Failed to start server: ${err.message}`);
      process.exit(1);
    }
  });
}).catch(error => {
  logger.error(`❌ Critical application initialization failed: ${error.message}`);
  process.exit(1);
});

export default app; 

