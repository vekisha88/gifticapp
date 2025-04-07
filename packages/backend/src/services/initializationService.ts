import mongoose from 'mongoose';
import { logger } from '../logger.js';
import { connectDatabase } from './databaseService.js';
import { generateWallets } from '../utils/walletGenerator.js';
import { setupContractEvents, initializeContract, getContractStatus, CONTRACT_STATUS } from './eventService.js';
import { setupDirectTransferMonitoring, checkPendingGiftsOnStartup } from './transactionMonitorService.js';
import { initializeBlockchainConnection } from './blockchainService.js';

/**
 * Initializes core application components asynchronously.
 */
export async function initializeAppComponents(): Promise<void> {
  logger.info("Starting application initialization");
  
  try {
    // Connect to database
    await connectDatabase();
    logger.info("✅ Database connection established");
    
    // Initialize blockchain connection
    await initializeBlockchainConnection();
    logger.info("✅ Blockchain connection initialized");
    
    // Initialize smart contract and wait for connection
    logger.info("Initializing and verifying smart contract connection...");
    await initializeContract(); 
    
    let contractStatus = await getContractStatus();
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 1000; // 1 second

    while (contractStatus !== CONTRACT_STATUS.READY && attempts < maxAttempts) {
      logger.warn(`Contract status is ${contractStatus}. Retrying in ${retryDelay / 1000}s... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      contractStatus = await getContractStatus();
      attempts++;
    }

    if (contractStatus === CONTRACT_STATUS.READY) {
      logger.info("✅ Smart contract connection verified successfully");
    } else {
      logger.error(`❌ Smart contract failed to connect after ${maxAttempts} attempts. Final status: ${contractStatus}`);
      // Decide if this is critical - maybe throw an error?
      // throw new Error(`Smart contract failed to connect. Status: ${contractStatus}`);
    }
    
    // Generate wallets if needed
    const walletCount = await generateWallets(5); // Ensure we have at least 5 wallets
    logger.info(`✅ Wallet pool checked (${walletCount} available)`);
    
    // Setup blockchain event listeners
    await setupContractEvents();
    logger.info("✅ Contract event listeners configured");
    
    // Setup direct transfer monitoring
    await setupDirectTransferMonitoring();
    logger.info("✅ Direct transfer monitoring configured");
    
    // Check for any pending gifts that need processing
    const pendingCount = await checkPendingGiftsOnStartup();
    logger.info(`✅ Pending gift check completed (${pendingCount} pending gifts)`);
    
    logger.info("✅ Application successfully initialized");
  } catch (error: any) {
    logger.error("❌ Application initialization failed", { error: error.message });
    throw error; // Re-throw to let the main app handle it
  }
}

/**
 * Performs graceful shutdown of application components.
 */
export async function shutdownAppComponents(): Promise<void> {
  logger.info("Starting application shutdown");
  
  try {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info("✅ Database connection closed");
    }
    
    // Additional cleanup can be added here
    
    logger.info("✅ Application shutdown completed");
  } catch (error: any) {
    logger.error("❌ Error during application shutdown", { error: error.message });
  }
} 