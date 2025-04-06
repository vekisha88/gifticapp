import { logger } from '../logger.js';
import { fileURLToPath } from 'url';
import { getGasPrices } from '../services/blockchainService.js';

interface GasPrice {
  wei: string;
  gwei: string;
  eth: string;
}

interface GasPrices {
  gasPrice?: GasPrice;
  maxFeePerGas?: GasPrice;
  maxPriorityFeePerGas?: GasPrice;
  network?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Monitors the current gas prices on the blockchain
 * @returns {Promise<GasPrices>} The current gas prices and fee data
 */
export async function monitorFees(): Promise<GasPrices> {
  logger.info("Starting blockchain fee monitoring");
  
  try {
    // Use the centralized blockchain service to get gas prices
    const result = await getGasPrices();
    
    if (result.success) {
      // Log gas price in Gwei for better readability
      const gasPriceGwei = result.gasPrices.gasPrice?.gwei || "Not available";
      logger.info(`Current gas price: ${gasPriceGwei} Gwei`);
      
      return result.gasPrices;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error monitoring fees: ${errorMessage}`);
    return {
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  monitorFees()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error("Error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
} 

