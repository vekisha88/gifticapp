import { logger } from "../logger.js";
import Gift from "../models/gift.js";
import { config } from "dotenv";

// Load environment variables
config();

interface CleanupResult {
  removed: number;
  message: string;
  error?: string;
}

interface BatchProcessResult {
  processed: number;
  message: string;
  error?: string;
}

/**
 * Clean up expired gifts
 * @returns {Promise<CleanupResult>} Results of cleanup operation
 */
export async function cleanupExpiredGifts(): Promise<CleanupResult> {
  logger.info("Starting cleanup of expired gifts");
  
  try {
    // Find expired gifts
    const expiredGifts = await Gift.findExpired();
    
    if (expiredGifts.length === 0) {
      logger.info("No expired gifts found");
      return { removed: 0, message: "No expired gifts found" };
    }
    
    logger.info(`Found ${expiredGifts.length} expired gifts to clean up`);
    
    // Mark gifts as expired
    const giftIds = expiredGifts.map(gift => gift._id);
    
    await Gift.updateMany(
      { _id: { $in: giftIds } },
      { $set: { status: "expired" } }
    );
    
    logger.info(`Successfully marked ${expiredGifts.length} gifts as expired`);
    
    return {
      removed: expiredGifts.length,
      message: `Successfully marked ${expiredGifts.length} gifts as expired`
    };
  } catch (error: any) {
    logger.error(`Error cleaning up expired gifts: ${error.message}`);
    
    return {
      removed: 0,
      error: error.message,
      message: "Failed to clean up expired gifts"
    };
  }
}

/**
 * Process gifts in batches
 * @returns {Promise<BatchProcessResult>} Results of batch processing
 */
export async function batchProcessGifts(): Promise<BatchProcessResult> {
  logger.info("Starting batch processing of gifts");
  
  try {
    // Get all active gifts
    const activeGifts = await Gift.find({ status: "active" });
    
    if (activeGifts.length === 0) {
      logger.info("No active gifts to process");
      return { processed: 0, message: "No active gifts to process" };
    }
    
    logger.info(`Found ${activeGifts.length} active gifts to process`);
    
    // Process each gift
    let processed = 0;
    
    for (const gift of activeGifts) {
      try {
        // Check if gift is expired
        if (gift.isExpired()) {
          gift.status = "expired";
          await gift.save();
          
          logger.info(`Marked gift ID ${gift.giftId} as expired`);
          processed++;
          continue;
        }
        
        // Other processing logic could be added here
        
      } catch (giftError: any) {
        logger.error(`Error processing gift ID ${gift.giftId}: ${giftError.message}`);
      }
    }
    
    logger.info(`Successfully processed ${processed} gifts`);
    
    return {
      processed: processed,
      message: `Successfully processed ${processed} gifts`
    };
  } catch (error: any) {
    logger.error(`Error in batch processing gifts: ${error.message}`);
    
    return {
      processed: 0,
      error: error.message,
      message: "Failed to process gifts in batch"
    };
  }
}

export default {
  cleanupExpiredGifts,
  batchProcessGifts
}; 

