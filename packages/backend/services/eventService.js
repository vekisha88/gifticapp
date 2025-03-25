import { ethers } from 'ethers';
import { logger } from '../logger.js';
import { Gift } from '../models/gift.js';
import { provider, contract } from './blockchainService.js';

/**
 * Create an event listener for the contract
 * @param {string} eventName Name of the event to listen for
 * @param {Function} callback Callback function to be called when event is triggered
 * @returns {Function} Function to remove the listener
 */
export function createEventListener(eventName, callback) {
  try {
    // Create a filter for the event
    const filter = contract.filters[eventName]();
    logger.info(`Setting up event listener for ${eventName} events`);
    
    // Listen for the specific event
    contract.on(filter, (...args) => {
      logger.info(`${eventName} event detected`);
      callback(...args);
    });
    
    return () => {
      contract.off(filter, callback);
      logger.info(`Removed ${eventName} event listener`);
    };
  } catch (error) {
    logger.error(`Failed to set up ${eventName} event listener: ${error.message}`);
    throw error;
  }
}

/**
 * Set up all contract event listeners
 */
export async function setupContractEvents() {
  try {
    logger.info("Setting up contract event listeners");
    
    // FundsLocked event
    createEventListener("FundsLocked", async (event) => {
      try {
        const args = event.args;
        if (!args) {
          logger.error("❌ FundsLocked event: No args found in event");
          return;
        }

        const paymentWallet = args[0];
        const tokenAddress = args[1];
        const giftAmount = args[2];
        const recipientWallet = args[3];
        const unlockTimestamp = args[4];

        if (!giftAmount || !unlockTimestamp) {
          logger.error("❌ FundsLocked event: Missing required parameters", { args: args.map(arg => arg?.toString()) });
          return;
        }

        const amountString = ethers.formatEther(giftAmount);
        logger.info(`FundsLocked event: wallet=${paymentWallet}, token=${tokenAddress || 'unknown'}, amount=${amountString}, recipient=${recipientWallet}, unlock=${new Date(Number(unlockTimestamp) * 1000).toLocaleString()}`);
      } catch (error) {
        logger.error(`❌ Error processing FundsLocked event: ${error.message}`);
        logger.error("Event data:", event);
      }
    });

    // GiftClaimed event
    createEventListener("GiftClaimed", async (...args) => {
      try {
        // Log the raw event args for debugging
        logger.info(`GiftClaimed event raw args: ${JSON.stringify(args.map(arg => 
          arg && typeof arg === 'object' && arg.toString ? arg.toString() : String(arg)
        ))}`);
        
        // Extract parameters safely
        const [recipientWallet] = args;
        
        // Ensure recipientWallet is a string
        const recipientWalletString = typeof recipientWallet === 'string' 
          ? recipientWallet.toLowerCase() 
          : (recipientWallet?.toString() || '').toLowerCase();
          
        logger.info(`GiftClaimed event: recipientWallet=${recipientWalletString}`);
        
        try {
          // Look up gift by recipient wallet address
          const gift = await Gift.findOne({ 
            recipientWallet: { $regex: new RegExp(`^${recipientWalletString}$`, 'i') }
          });
          
          if (gift) {
            gift.isClaimed = true;
            gift.claimedAt = new Date();
            await gift.save();
            logger.info(`✅ Gift claimed for recipient wallet: ${recipientWalletString}`);
          } else {
            logger.error(`❌ No gift found for recipient wallet: ${recipientWalletString}`);
          }
        } catch (error) {
          logger.error(`❌ Error updating gift claim status: ${error.message}`);
        }
      } catch (error) {
        logger.error(`❌ Error processing GiftClaimed event: ${error.message}`);
      }
    });

    // FundsTransferred event
    createEventListener("FundsTransferred", async (...args) => {
      try {
        // Log the raw event args for debugging
        logger.info(`FundsTransferred event raw args: ${JSON.stringify(args.map(arg => 
          arg && typeof arg === 'object' && arg.toString ? arg.toString() : String(arg)
        ))}`);
        
        // Extract parameters safely
        const [paymentWallet, tokenAddress, amount, recipientWallet] = args;
        
        const paymentWalletString = typeof paymentWallet === 'string' 
          ? paymentWallet.toLowerCase() 
          : (paymentWallet?.toString() || '').toLowerCase();
          
        const recipientWalletString = typeof recipientWallet === 'string' 
          ? recipientWallet.toLowerCase() 
          : (recipientWallet?.toString() || '').toLowerCase();
          
        const amountString = amount ? amount.toString() : '0';
        
        logger.info(`FundsTransferred event: paymentWallet=${paymentWalletString}, tokenAddress=${tokenAddress || 'unknown'}, amount=${amountString}, recipientWallet=${recipientWalletString}`);
      } catch (error) {
        logger.error(`❌ Error processing FundsTransferred event: ${error.message}`);
      }
    });

    // FundsSentToCharity event
    createEventListener("FundsSentToCharity", async (...args) => {
      try {
        // Extract parameters safely
        const [sender, token, amount, reason] = args;
        
        const senderString = typeof sender === 'string' 
          ? sender.toLowerCase() 
          : (sender?.toString() || '').toLowerCase();
        
        const amountString = amount ? amount.toString() : '0';
        
        logger.info(`FundsSentToCharity event: sender=${senderString}, token=${token || 'unknown'}, amount=${amountString}, reason=${reason || 'unknown'}`);
      } catch (error) {
        logger.error(`❌ Error processing FundsSentToCharity event: ${error.message}`);
      }
    });

    logger.info("Contract event listeners set up successfully");
  } catch (error) {
    logger.error(`Failed to set up contract events: ${error.message}`);
  }
} 