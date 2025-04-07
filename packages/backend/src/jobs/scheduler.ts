import cron from 'node-cron';
import { logger } from '../logger.js';
import { cleanupExpiredGifts, batchProcessGifts } from '../services/giftService.js';
import { getGasPrices, getBlockchainStatus } from '../services/blockchainService.js';

/**
 * Schedules all the cron jobs for the application.
 */
export function scheduleJobs(): void {
  logger.info('⏰ Scheduling cron jobs...');

  // Clean up expired gifts once a day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running scheduled job: cleanupExpiredGifts");
    try {
      await cleanupExpiredGifts();
      logger.info("✅ Completed scheduled job: cleanupExpiredGifts");
    } catch (error: any) {
      logger.error(`❌ Error in scheduled job cleanupExpiredGifts: ${error.message}`);
    }
  });

  // Process pending gifts every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    logger.info("Running scheduled job: batchProcessGifts");
    try {
      await batchProcessGifts();
      logger.info("✅ Completed scheduled job: batchProcessGifts");
    } catch (error: any) {
      logger.error(`❌ Error in scheduled job batchProcessGifts: ${error.message}`);
    }
  });

  // Update gas prices every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    logger.info("Running scheduled job: updateGasPrices");
    try {
      const gasPrices = await getGasPrices();
      logger.info(`✅ Completed scheduled job: updateGasPrices - ${JSON.stringify(gasPrices)}`);
    } catch (error: any) {
      logger.error(`❌ Error in scheduled job updateGasPrices: ${error.message}`);
    }
  });

  // Schedule periodic blockchain status check every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Running scheduled job: checkBlockchainStatus");
    try {
      const status = await getBlockchainStatus();
      logger.info(`✅ Completed scheduled job: checkBlockchainStatus - ${status.status}`);
    } catch (error: any) {
      logger.error(`❌ Error in scheduled job checkBlockchainStatus: ${error.message}`);
    }
  });

  logger.info('✅ Cron jobs scheduled.');
} 