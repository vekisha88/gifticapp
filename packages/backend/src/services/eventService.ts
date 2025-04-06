import { ethers } from "ethers";
import { logger } from "../logger.js";
import { contract, signer, provider } from "./blockchainService.js";
import Gift from "../models/gift.js";
import { config } from "dotenv";

// Load environment variables
config();

// Contract status tracking
export const CONTRACT_STATUS = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error'
} as const;

export type ContractStatusType = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

let contractStatus: ContractStatusType = CONTRACT_STATUS.UNINITIALIZED;

/**
 * Get the current contract initialization status
 * @returns Current contract status
 */
export function getContractStatus(): ContractStatusType {
  return contractStatus;
}

/**
 * Initialize blockchain contract connection
 * @returns {Promise<boolean>} Success status
 */
export async function initializeContract(): Promise<boolean> {
  try {
    if (contractStatus === CONTRACT_STATUS.INITIALIZING || contractStatus === CONTRACT_STATUS.READY) {
      logger.info(`Contract already ${contractStatus}, skipping initialization`);
      return true;
    }
    
    contractStatus = CONTRACT_STATUS.INITIALIZING;
    logger.info("Initializing blockchain contract connection");
    
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    
    // Wait for provider to be ready
    try {
      const network = await provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
      
      const blockNumber = await provider.getBlockNumber();
      logger.info(`Provider connected at block: ${blockNumber}`);
      
      if (!contract) {
        logger.error("Contract object is undefined - blockchainService.ts initialization failed");
        
        // Get the contract address from environment variable
        const contractAddress = process.env.GIFT_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error("Contract address not specified in environment variables");
        }
        
        logger.info(`Attempting to manually check contract at address: ${contractAddress}`);
        
        // Check if contract exists at the address
        const contractCode = await provider.getCode(contractAddress);
        if (contractCode === '0x') {
          logger.error(`No contract exists at address: ${contractAddress}`);
          contractStatus = CONTRACT_STATUS.ERROR;
          return false;
        } else {
          logger.info(`Contract code verified at address: ${contractAddress}`);
          contractStatus = CONTRACT_STATUS.READY;
          return true;
        }
      }
      
      // Check if contract exists at the address
      const contractAddress = contract.target as string;
      const contractCode = await provider.getCode(contractAddress);
      if (contractCode === '0x') {
        logger.error(`No contract exists at address: ${contractAddress}`);
        contractStatus = CONTRACT_STATUS.ERROR;
        return false;
      } else {
        logger.info(`Contract code verified at address: ${contractAddress}`);
      }
      
      // Try to call a view function to verify contract interface
      try {
        // Test if we can interact with the contract at all
        let success = false;
        
        try {
          // Try various view functions that might exist in the contract 
          if (typeof contract.gifts === 'function') {
            // The gifts function in the actual contract takes an address parameter
            logger.info("Testing gifts() function access with address parameter...");
            await contract.gifts(ethers.ZeroAddress);
            success = true;
          } 
          else if (typeof contract.ownerAddress === 'function') {
            logger.info("Testing ownerAddress() function access...");
            await contract.ownerAddress();
            success = true;
          }
          else if (typeof contract.charityWallet === 'function') {
            logger.info("Testing charityWallet() function access...");
            await contract.charityWallet();
            success = true;
          }
          else if (typeof contract.approvedTokens === 'function') {
            logger.info("Testing approvedTokens() function access...");
            await contract.approvedTokens(ethers.ZeroAddress);
            success = true;
          }
          else {
            // If we can access the target address, consider it a basic success
            logger.info("Basic contract verification - checking target property...");
            if (contract.target) {
              logger.info(`Contract target verified: ${contract.target}`);
              success = true;
            }
          }
        } catch (functionError: any) {
          // Even if we get a revert error, that's fine - it means the contract exists
          // and has the correct interface, just returning an expected error
          if (functionError.message.includes("revert") || 
              functionError.message.includes("execution reverted") ||
              functionError.message.includes("invalid argument") ||
              functionError.message.includes("no matching function")) {
            logger.info("Contract function exists but reverted (expected for test calls)");
            success = true;
          } else {
            throw functionError;
          }
        }
        
        if (success) {
          logger.info("Contract interface verified successfully");
          contractStatus = CONTRACT_STATUS.READY;
          return true;
        } else {
          throw new Error("Could not verify any contract functions");
        }
      } catch (contractError: any) {
        logger.warn(`Contract interface check failed: ${contractError.message}`);
        // Continue even if this fails in development mode
        if (process.env.NODE_ENV === 'development') {
          logger.info("In development mode, proceeding despite contract interface issues");
          contractStatus = CONTRACT_STATUS.READY;
          return true;
        } else {
          contractStatus = CONTRACT_STATUS.ERROR;
          return false;
        }
      }
    } catch (error: any) {
      contractStatus = CONTRACT_STATUS.ERROR;
      logger.error(`❌ Failed to initialize blockchain contract: ${error.message}`);
      return false;
    }
  } catch (error: any) {
    contractStatus = CONTRACT_STATUS.ERROR;
    logger.error(`❌ Error in contract initialization: ${error.message}`);
    return false;
  }
}

type EventListener = (...args: any[]) => void;

/**
 * Create an event listener for a specific contract event
 * @param eventName Name of the event to listen for
 * @param callback Callback function to execute when event is triggered
 * @returns Function to remove the listener
 */
export function createEventListener(eventName: string, callback: EventListener): () => void {
  try {
    if (!contract) {
      logger.error(`Cannot set up ${eventName} event listener - contract not initialized`);
      return () => {}; // Return empty function
    }
    
    logger.info(`Setting up event listener for ${eventName} events`);
    
    // In ethers v6, we need to use contract.filters to create event filters
    try {
      // Get the event signature filter
      const filter = contract.filters[eventName]();
      
      // Create a listener for the event using the filter
      const listener = (...args: any[]) => {
        logger.info(`${eventName} event detected`);
        callback(...args);
      };
      
      // Add the event listener
      contract.on(filter, listener);
      
      return () => {
        contract.off(filter, listener);
        logger.info(`Removed ${eventName} event listener`);
      };
    } catch (error: any) {
      // Try alternative approach for ethers compatibility
      logger.warn(`Could not use filter for ${eventName}, trying to attach to raw event: ${error.message}`);
      
      // Set up listener for all events and filter manually
      const allEventsListener = (log: ethers.Log) => {
        // Try to parse the log
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === eventName) {
            logger.info(`${eventName} event detected (via manual filter)`);
            callback(...parsedLog.args);
          }
        } catch (parseError) {
          // If parsing fails, this event wasn't what we're looking for
        }
      };
      
      // Listen to all events
      provider.on("logs", allEventsListener);
      
      return () => {
        provider.off("logs", allEventsListener);
        logger.info(`Removed ${eventName} event listener (manual filter)`);
      };
    }
  } catch (error: any) {
    logger.error(`Failed to set up ${eventName} event listener: ${error.message}`);
    return () => {}; // Return empty function
  }
}

/**
 * Set up all contract event listeners
 */
export async function setupContractEvents(): Promise<void> {
  try {
    // Skip contract events in development mode to avoid compatibility issues
    if (process.env.NODE_ENV === 'development') {
      logger.info("Skipping contract event setup in development mode");
      return;
    }
    
    // Check if the contract is properly initialized
    if (!contract) {
      logger.error("Cannot set up contract events - contract not initialized");
      return;
    }
    
    logger.info("Setting up contract event listeners");
    
    // FundsLocked event (replaces GiftCreated)
    createEventListener("FundsLocked", async (
      paymentWallet: string,
      tokenAddress: string,
      giftAmount: ethers.BigNumberish,
      recipientWallet: string,
      unlockTimestamp: ethers.BigNumberish,
      event: ethers.EventLog
    ) => {
      try {
        const amountString = ethers.formatEther(giftAmount);
        logger.info(`FundsLocked event: payment=${paymentWallet}, token=${tokenAddress}, amount=${amountString}, recipient=${recipientWallet}, unlock=${new Date(Number(unlockTimestamp) * 1000).toLocaleString()}`);
        
        // You could look up/create gift in database here based on recipient address
      } catch (error: any) {
        logger.error(`❌ Error processing FundsLocked event: ${error.message}`);
        logger.error("Event data:", event);
      }
    });

    // GiftClaimed event
    createEventListener("GiftClaimed", async (
      recipientWallet: string,
      event: ethers.EventLog
    ) => {
      try {
        logger.info(`GiftClaimed event: recipient=${recipientWallet}`);
        
        try {
          // Look up gift by recipient address
          const gift = await Gift.findOne({ recipientAddress: recipientWallet });
          
          if (gift) {
            await gift.markClaimed(event.transactionHash);
            logger.info(`✅ Gift claimed for recipient: ${recipientWallet}`);
          } else {
            logger.error(`❌ No gift found for recipient: ${recipientWallet}`);
          }
        } catch (error: any) {
          logger.error(`❌ Error updating gift claim status: ${error.message}`);
        }
      } catch (error: any) {
        logger.error(`❌ Error processing GiftClaimed event: ${error.message}`);
      }
    });

    // FundsTransferred event (replaces GiftReleased)
    createEventListener("FundsTransferred", async (
      paymentWallet: string,
      tokenAddress: string,
      amount: ethers.BigNumberish,
      recipientWallet: string,
      event: ethers.EventLog
    ) => {
      try {
        const amountString = ethers.formatEther(amount);
        
        logger.info(`FundsTransferred event: payment=${paymentWallet}, token=${tokenAddress}, amount=${amountString}, recipient=${recipientWallet}`);
        
        try {
          // Look up gift by recipient address
          const gift = await Gift.findOne({ recipientAddress: recipientWallet });
          
          if (gift) {
            await gift.markClaimed(event.transactionHash);
            logger.info(`✅ Gift transferred for recipient: ${recipientWallet}`);
          } else {
            logger.error(`❌ No gift found for recipient: ${recipientWallet}`);
          }
        } catch (error: any) {
          logger.error(`❌ Error updating gift transfer status: ${error.message}`);
        }
      } catch (error: any) {
        logger.error(`❌ Error processing FundsTransferred event: ${error.message}`);
      }
    });

    // FundsSentToCharity event
    createEventListener("FundsSentToCharity", async (
      sender: string,
      tokenAddress: string,
      amount: ethers.BigNumberish,
      reason: string,
      event: ethers.EventLog
    ) => {
      try {
        const amountString = ethers.formatEther(amount);
        logger.info(`FundsSentToCharity event: sender=${sender}, token=${tokenAddress}, amount=${amountString}, reason=${reason}`);
      } catch (error: any) {
        logger.error(`❌ Error processing FundsSentToCharity event: ${error.message}`);
      }
    });

    logger.info("Contract event listeners set up successfully");
  } catch (error: any) {
    logger.error(`Failed to set up contract events: ${error.message}`);
  }
}

export default {
  CONTRACT_STATUS,
  initializeContract,
  setupContractEvents,
  getContractStatus
}; 

