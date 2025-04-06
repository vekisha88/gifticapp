import { ethers } from "ethers";
import { logger } from "../logger.js";
import Gift from "../models/gift.js";
import { config } from "dotenv";
import { provider, contract } from "./blockchainService.js";

// Load environment variables
config();

// Configuration for wallets
interface Config {
  charityWallet: string;
  companyWallet: string;
}

// Default config - replace with actual values
const CONFIG: Config = {
  charityWallet: process.env.CHARITY_WALLET || '0x0000000000000000000000000000000000000000',
  companyWallet: process.env.COMPANY_WALLET || '0x0000000000000000000000000000000000000000'
};

// Monitor interval in milliseconds
const MONITOR_INTERVAL = parseInt(process.env.TRANSACTION_MONITOR_INTERVAL || '') || 5 * 60 * 1000; // Default: 5 minutes

let monitoringActive = false;
let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Handle the processing of a transaction for a gift wallet
 * @param {Object} tx Transaction object
 * @param {Object} gift Gift object
 * @param {Object} wallet Wallet object
 * @returns {Promise<boolean>} Success status
 */
async function processGiftTransaction(
  tx: ethers.TransactionResponse, 
  gift: any, 
  wallet: any
): Promise<boolean> {
  try {
    logger.info(`Processing transaction ${tx.hash} for gift code ${gift.giftCode}`);
    
    // Decrypt the private key
    let walletPrivateKey: string;
    try {
      walletPrivateKey = wallet.getDecryptedPrivateKey();
      logger.info(`✅ Successfully retrieved and decrypted private key for wallet ${wallet.address}`);
    } catch (decryptError: any) {
      logger.error(`❌ Failed to decrypt private key for wallet ${wallet.address}: ${decryptError.message}`);
      return false;
    }
    
    // Create a signer using the wallet's private key
    const walletSigner = new ethers.Wallet(walletPrivateKey, provider);
    const walletBalance = await provider.getBalance(wallet.address);
    logger.info(`Wallet balance: ${ethers.formatEther(walletBalance)} ETH/MATIC`);
    
    // Verify payment amount matches expected amount
    const expectedAmount = ethers.parseEther(gift.totalRequired.toString());
    
    if (walletBalance < tx.value || walletBalance < expectedAmount) {
      logger.warn(`⚠️ Wallet balance (${ethers.formatEther(walletBalance)}) is less than transaction value or expected amount`);
      return false;
    }
    
    // Check if payment amount is correct (with small tolerance for gas differences)
    const tolerance = 0.01; // 1% tolerance
    const receivedAmount = Number(ethers.formatEther(walletBalance));
    const requiredAmount = Number(gift.totalRequired);
    const lowerBound = requiredAmount * (1 - tolerance);
    const upperBound = requiredAmount * (1 + tolerance);
    
    if (receivedAmount < lowerBound || receivedAmount > upperBound) {
      logger.warn(`⚠️ Incorrect payment amount: expected ${gift.totalRequired}, received ${ethers.formatEther(walletBalance)}`);
      
      // Send to charity wallet if configured (incorrect payments)
      const charityAddress = CONFIG.charityWallet;
      
      try {
        const charityTx = await walletSigner.sendTransaction({
          to: charityAddress,
          value: walletBalance - ethers.parseEther("0.001"), // Leave a small amount for gas
          gasLimit: 30000
        });
        logger.info(`✅ Sent incorrect payment to charity: ${charityTx.hash}`);
      } catch (charityError: any) {
        logger.error(`❌ Failed to send to charity: ${charityError.message}`);
      }
      return false;
    }
    
    // At this point, we've verified the payment is correct
    // Double-check transaction confirmations for security
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    
    if (!txReceipt || !txReceipt.blockNumber) {
      logger.warn(`⚠️ Transaction ${tx.hash} not yet confirmed, waiting for more confirmations`);
      return false; // Don't proceed until we have confirmation
    }
    
    const confirmations = await provider.getBlockNumber() - txReceipt.blockNumber + 1;
    
    if (confirmations < 1) {
      logger.warn(`⚠️ Transaction ${tx.hash} has only ${confirmations} confirmations, waiting for more`);
      return false; // Don't proceed until we have at least 1 confirmation
    }
    
    logger.info(`✅ Transaction ${tx.hash} confirmed with ${confirmations} confirmations`);
    
    // *** IMPORTANT: Update gift status to 'received' only after transaction confirmation ***
    gift.paymentStatus = "received";
    gift.paymentTxHash = tx.hash;
    await gift.save();
    logger.info(`✅ Gift payment status updated to received for gift code ${gift.giftCode}`);
    
    try {
      // Connect contract with wallet signer
      const contractWithSigner = contract.connect(walletSigner);
      
      // Calculate unlock timestamp - convert date to Unix timestamp (seconds)
      const unlockTimestamp = Math.floor(gift.unlockTimestamp.getTime() / 1000);
      
      // Split the funds - gift amount goes to contract, fee goes to company
      const gasReservePerTx = ethers.parseEther("0.01"); // Reserve for each transaction
      const totalGasReserve = gasReservePerTx * BigInt(2); // Two transactions
      
      // Calculate the gift amount (excluding fee)
      const giftAmount = ethers.parseEther(gift.giftAmount.toString());
      
      // Calculate the fee amount
      const feeAmount = ethers.parseEther(gift.feeAmount.toString());
      
      // Make sure we have enough funds
      if (walletBalance < giftAmount + feeAmount) {
        logger.error(`❌ Insufficient balance to cover gift and fee: ${ethers.formatEther(walletBalance)} < ${gift.giftAmount + gift.feeAmount}`);
        return false;
      }
      
      // 1. First lock the gift amount in the contract
      const lockTx = await contractWithSigner.lockFunds(
        ethers.ZeroAddress, // Zero address for native token (ETH/MATIC)
        giftAmount, // Send only the gift amount
        gift.recipientWallet, // Recipient wallet from gift
        unlockTimestamp, // Unlock timestamp from gift
        {
          value: giftAmount, // Value is just the gift amount
          gasLimit: 500000 // Increased gas limit for safety
        }
      );
      
      logger.info(`✅ Lock funds transaction sent: ${lockTx.hash}, amount: ${ethers.formatEther(giftAmount)} MATIC`);
      
      // Wait for transaction confirmation
      const lockReceipt = await lockTx.wait();
      logger.info(`✅ Lock funds transaction confirmed in block ${lockReceipt.blockNumber}`);
      
      // 2. Then send the fee to the company wallet
      const gasUsed = lockReceipt.gasUsed * lockReceipt.gasPrice;
      logger.info(`Gas used for contract transaction: ${ethers.formatEther(gasUsed)} MATIC`);
      
      // Calculate remaining fee after gas costs
      const remainingFee = feeAmount - gasUsed;
      
      if (remainingFee > gasReservePerTx) {
        const companyTx = await walletSigner.sendTransaction({
          to: CONFIG.companyWallet,
          value: remainingFee - gasReservePerTx, // Subtract gas reserve for this tx
          gasLimit: 30000
        });
        
        logger.info(`✅ Fee sent to company wallet: ${companyTx.hash}, amount: ${ethers.formatEther(remainingFee - gasReservePerTx)} MATIC`);
        const companyReceipt = await companyTx.wait();
        logger.info(`✅ Fee transfer confirmed in block ${companyReceipt.blockNumber}`);
      } else {
        logger.warn(`⚠️ Remaining fee (${ethers.formatEther(remainingFee)}) too small to send to company wallet after gas costs`);
      }
      
      gift.contractLocked = true;
      await gift.save();
      logger.info(`✅ Gift marked as locked in contract for gift code ${gift.giftCode}`);
    } catch (contractError: any) {
      logger.error(`❌ Error processing gift transaction: ${contractError.message}`);
      logger.info(`Gift is still marked as paid, but funds are not properly allocated yet`);
      // We don't return false here, as the payment was received correctly
    }
    
    return true;
  } catch (error: any) {
    logger.error(`❌ Error processing transaction for gift wallet ${wallet.address}: ${error.message}`);
    return false;
  }
}

/**
 * Start monitoring for direct blockchain transfers
 */
export function setupDirectTransferMonitoring(): void {
  if (monitoringActive) {
    logger.info("Transaction monitoring already active");
    return;
  }
  
  logger.info(`Setting up transaction monitoring with interval: ${MONITOR_INTERVAL}ms`);
  
  monitoringActive = true;
  
  // Start monitoring
  monitorInterval = setInterval(async () => {
    try {
      await monitorPendingGifts();
    } catch (error: any) {
      logger.error(`Error in transaction monitoring: ${error.message}`);
    }
  }, MONITOR_INTERVAL);
  
  logger.info("Transaction monitoring started");
}

/**
 * Stop transaction monitoring
 */
export function stopDirectTransferMonitoring(): void {
  if (!monitoringActive || !monitorInterval) {
    return;
  }
  
  clearInterval(monitorInterval);
  monitoringActive = false;
  logger.info("Transaction monitoring stopped");
}

/**
 * Monitor pending gifts for blockchain confirmation
 */
async function monitorPendingGifts(): Promise<void> {
  logger.info("Checking for pending gifts needing blockchain confirmation");
  
  try {
    // Find gifts in pending status
    const pendingGifts = await Gift.find({
      status: "pending",
      txHash: { $exists: true, $ne: null }
    });
    
    if (pendingGifts.length === 0) {
      logger.info("No pending gifts to monitor");
      return;
    }
    
    logger.info(`Found ${pendingGifts.length} pending gifts to monitor`);
    
    // Check each pending gift
    for (const gift of pendingGifts) {
      try {
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(gift.txHash);
        
        if (!receipt) {
          logger.info(`Transaction for gift ID ${gift.giftId} still pending`);
          continue;
        }
        
        // Check if transaction was successful
        if (receipt.status === 1) {
          logger.info(`Transaction for gift ID ${gift.giftId} confirmed successfully`);
          
          // Update gift status
          gift.status = "active";
          gift.blockNumber = receipt.blockNumber;
          await gift.save();
          
          logger.info(`Updated gift ID ${gift.giftId} status to active`);
        } else {
          logger.error(`Transaction for gift ID ${gift.giftId} failed`);
          
          // Mark as failed
          gift.status = "failed";
          await gift.save();
        }
      } catch (error: any) {
        logger.error(`Error monitoring gift ID ${gift.giftId}: ${error.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Error in monitorPendingGifts: ${error.message}`);
  }
}

/**
 * Check for pending gifts on application startup
 */
export async function checkPendingGiftsOnStartup(): Promise<void> {
  logger.info("Checking for pending gifts on startup");
  
  try {
    await monitorPendingGifts();
  } catch (error: any) {
    logger.error(`Error checking pending gifts on startup: ${error.message}`);
  }
}

export default {
  setupDirectTransferMonitoring,
  stopDirectTransferMonitoring,
  checkPendingGiftsOnStartup
}; 

