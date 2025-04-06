import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cron from "node-cron";
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

// Load routes
import giftRoutes from "./routes/gift.js";
import userRoutes from "./routes/user.js";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();

// Log environment information to the logger
logger.info(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
logger.info(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/gifticapp'}`);
logger.info(`Blockchain network: ${process.env.BLOCKCHAIN_NETWORK || 'localhost'}`);
logger.info(`Gift contract address: ${process.env.GIFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}`);

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

// Initialize components asynchronously
async function initializeApp() {
  try {
    // Connect to database
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
      try {
        await connectDatabase();
        await initializeWallets();
        logger.info("✅ Database connected successfully");
      } catch (error: any) {
        logger.error(`❌ Failed to connect to database or initialize wallets: ${error.message}`);
        logger.warn("Application will continue without database functionality");
        // Continue execution even without database
      }
    } else {
      logger.info("🗄️ Database already connected");
      // Still check for wallets
    }
    
    // Initialize blockchain components
    try {
      // Make sure blockchain connection is initialized with proper environment variables
      initializeBlockchainConnection();
      
      await initializeContract();
      
      // Force contract reinitialization if needed
      if (getContractStatus() !== CONTRACT_STATUS.READY) {
        logger.info("Attempting to reinitialize contract connection...");
        // Wait a moment to ensure blockchain node is fully ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try initializing blockchain connection again to ensure it has the right env vars
        initializeBlockchainConnection();
        await initializeContract();
      }
      
      // Setup blockchain interactions
      setupContractEvents();
      setupDirectTransferMonitoring();
      checkPendingGiftsOnStartup();
      
      logger.info("✅ Blockchain components initialized successfully");
    } catch (blockchainError: any) {
      logger.error(`❌ Blockchain initialization failed: ${blockchainError.message}`);
      logger.warn("Application will continue with limited blockchain functionality");
      // Continue execution even with limited blockchain functionality
    }
    
    // Generate wallets for testing
    try {
      const wallets = await generateWallets(0, 20);
      logger.info(`✅ Pre-generated ${wallets.length} wallets`);
    } catch (walletError: any) {
      logger.error(`❌ Failed to generate wallets: ${walletError.message}`);
    }
    
    logger.info("✅ Application initialization complete");
  } catch (error: any) {
    logger.error(`❌ Failed to initialize application: ${error.message}`);
  }
}

// API routes
app.use("/api/gift", giftRoutes);
app.use("/api/user", userRoutes);

interface SafeWallet {
  address: string;
  reserved?: boolean;
  balance?: string;
  createdAt?: Date;
}

// Wallet endpoint (DEV only)
app.get("/api/wallets", async (req: Request, res: Response) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is not available in production"
      });
    }
    
    // Check if Wallet model is defined
    if (!Wallet) {
      return res.status(500).json({
        success: false,
        message: "Wallet model not initialized"
      });
    }
    
    // Get all wallets from the database
    const wallets = await Wallet.find({}).lean();
    
    // Return wallet addresses (not private keys for security)
    const safeWallets: SafeWallet[] = wallets.map(wallet => ({
      address: wallet.address,
      reserved: wallet.reserved,
      balance: wallet.balance || '0',
      createdAt: wallet.createdAt
    }));
    
    res.json({
      success: true,
      count: safeWallets.length,
      wallets: safeWallets
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate wallets endpoint (DEV only)
app.post("/api/wallets/generate", async (req: Request, res: Response) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is not available in production"
      });
    }
    
    const count = parseInt(String(req.query.count || req.body.count || 5));
    
    // Generate wallets
    const wallets = await generateWallets(0, count);
    
    // Return wallet addresses (not private keys for security)
    const safeWallets: SafeWallet[] = wallets.map(wallet => ({
      address: wallet.address
    }));
    
    res.json({
      success: true,
      message: `Generated ${count} wallets successfully`,
      wallets: safeWallets
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      error?: string;
    };
    blockchain: {
      status: string;
      error?: string;
      [key: string]: any;
    };
  };
}

// Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const health: HealthStatus = {
      status: "UP",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? "UP" : "DOWN"
        },
        blockchain: {
          status: "CHECKING"
        }
      }
    };

    // Check blockchain connection
    try {
      const blockchainStatus = await getBlockchainStatus();
      health.services.blockchain = blockchainStatus;
    } catch (error: any) {
      health.services.blockchain = {
        status: "DOWN",
        error: error.message
      };
    }
    
    // If any critical service is down, set overall status to DOWN
    if (health.services.database.status === "DOWN" || health.services.blockchain.status === "DOWN") {
      health.status = "DOWN";
      res.status(503);
    }
    
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: "DOWN",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  
  // Initialize app components
  initializeApp();
  
  // Schedule cron jobs
  // Clean up expired gifts once a day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running scheduled job: cleanupExpiredGifts");
    await cleanupExpiredGifts();
  });
  
  // Process pending gifts every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    logger.info("Running scheduled job: batchProcessGifts");
    await batchProcessGifts();
  });
  
  // Update gas prices every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    logger.info("Running scheduled job: updateGasPrices");
    const gasPrices = await getGasPrices();
    logger.info(`Updated gas prices: ${JSON.stringify(gasPrices)}`);
  });
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.warn(`⚠️ Port ${PORT} is already in use. Try stopping other instances of the server or use a different port.`);
    
    // Try alternate port
    const alternatePort = parseInt(PORT.toString()) + 1;
    logger.info(`Attempting to use alternate port: ${alternatePort}`);
    
    app.listen(alternatePort, () => {
      logger.info(`🚀 Server running on alternate port ${alternatePort}`);
      initializeApp();
    }).on('error', (err) => {
      logger.error(`❌ Failed to start server on alternate port: ${err.message}`);
      process.exit(1);
    });
  } else {
    logger.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
});

// Schedule periodic blockchain status check
cron.schedule("*/5 * * * *", async () => {
  try {
    const status = await getBlockchainStatus();
    logger.info(`Blockchain status: ${status.status}`);
  } catch (error: any) {
    logger.error(`Failed to check blockchain status: ${error.message}`);
  }
});

/**
 * Generate initial wallets if needed
 */
async function initializeWallets() {
  try {
    logger.info("🔍 Checking for existing wallets...");
    const { generateWallets } = await import("./utils/walletGenerator.js");
    const wallets = await generateWallets(0, 20);
    logger.info(`✅ Pre-generated ${wallets.length} wallets`);
  } catch (error: any) {
    logger.error(`❌ Failed to generate wallets: ${error.message}`);
  }
}

export default app; 

