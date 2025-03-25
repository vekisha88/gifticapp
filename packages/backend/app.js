import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cron from "node-cron";
import morgan from "morgan";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Load the shared environment configuration
import { loadEnv, env } from "@gifticapp/shared";

// Load environment variables from .env files
loadEnv('backend');

// Load services
import { logger } from "./logger.js";
import { connectDatabase } from "./services/databaseService.js";
import { generateWallets } from "./utils/walletGenerator.js";
import { setupContractEvents } from "./services/eventService.js";
import { setupDirectTransferMonitoring, checkPendingGiftsOnStartup } from "./services/transactionMonitorService.js";
import { cleanupExpiredGifts, batchProcessGifts } from "./services/giftService.js";

// Load routes
import giftRoutes from "./routes/gift.js";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();

// Log environment information
logger.info(`Starting server in ${env.nodeEnv} mode`);
logger.info(`MongoDB URI: ${env.mongoUri}`);
logger.info(`Blockchain network: ${env.blockchainNetwork}`);
logger.info(`Gift contract address: ${env.giftContractAddress}`);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("combined"));

// Connect to database
connectDatabase().catch(err => {
  logger.error(`Failed to connect to database: ${err.message}`);
  process.exit(1);
});

// Generate wallets for testing
generateWallets(0, 20).then((wallets) => {
  logger.info(`✅ Pre-generated ${wallets.length} wallets`);
}).catch((err) => {
  logger.error(`❌ Failed to generate wallets: ${err.message}`);
});

// Setup blockchain interactions
setupContractEvents();
setupDirectTransferMonitoring();
checkPendingGiftsOnStartup();

// API routes
app.use("/api/gift", giftRoutes);

// Cron Jobs
// Auto-transfer job - runs every hour
cron.schedule("0 * * * *", () => {
  logger.info("Running auto-transfer job to process eligible gifts");
  
  // Use spawn to run the script as a separate process
  const autoTransferScript = spawn("node", [path.join(__dirname, "scripts", "autoTransfer.js")]);
  
  autoTransferScript.stdout.on("data", (data) => {
    logger.info(`Auto-transfer output: ${data}`);
  });
  
  autoTransferScript.stderr.on("data", (data) => {
    logger.error(`Auto-transfer error: ${data}`);
  });
  
  autoTransferScript.on("close", (code) => {
    logger.info(`Auto-transfer process exited with code ${code}`);
  });
});

// Cleanup job - runs at midnight every day
cron.schedule("0 0 * * *", () => {
  logger.info("Running cleanup job to remove expired gifts");
  cleanupExpiredGifts()
    .then((result) => {
      logger.info(`Cleanup job completed: ${result.removed} expired gifts removed`);
    })
    .catch((error) => {
      logger.error(`Cleanup job error: ${error.message}`);
    });
});

// Monitor fees job - runs every 12 hours
cron.schedule("0 */12 * * *", () => {
  logger.info("Running fee monitoring job");
  
  const monitorFeesScript = spawn("node", [path.join(__dirname, "scripts", "monitorFees.js")]);
  
  monitorFeesScript.stdout.on("data", (data) => {
    logger.info(`Fee monitor output: ${data}`);
  });
  
  monitorFeesScript.stderr.on("data", (data) => {
    logger.error(`Fee monitor error: ${data}`);
  });
  
  monitorFeesScript.on("close", (code) => {
    logger.info(`Fee monitor process exited with code ${code}`);
  });
});

// Batch processing job - runs every 4 hours
cron.schedule("0 */4 * * *", () => {
  logger.info("Running batch processing job for gifts");
  batchProcessGifts()
    .then((result) => {
      logger.info(`Batch processing completed: ${result.processed} gifts processed`);
    })
    .catch((error) => {
      logger.error(`Batch processing error: ${error.message}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
const server = app.listen(PORT, HOST, () => {
  logger.info(`✅ Server running on http://${HOST}:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  logger.info("Shutting down server...");
  server.close(() => {
    logger.info("Server shut down successfully");
    process.exit(0);
  });
}