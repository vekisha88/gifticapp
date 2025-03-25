import { ethers } from 'ethers';
import { logger } from '../logger.js';
import { Gift } from '../models/gift.js';
import { Wallet } from '../models/wallet.js';
import { provider, contract, CONFIG } from './blockchainService.js';

/**
 * Handle the processing of a transaction for a gift wallet
 * @param {Object} tx Transaction object
 * @param {Object} gift Gift object
 * @param {Object} wallet Wallet object
 * @returns {Promise<boolean>} Success status
 */
async function processGiftTransaction(tx, gift, wallet) {
  try {
    logger.info(`Processing transaction ${tx.hash} for gift code ${gift.giftCode}`);
    
    // Decrypt the private key
    let walletPrivateKey;
    try {
      walletPrivateKey = wallet.getDecryptedPrivateKey();
      logger.info(`✅ Successfully retrieved and decrypted private key for wallet ${wallet.address}`);
    } catch (decryptError) {
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
      } catch (charityError) {
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
    } catch (contractError) {
      logger.error(`❌ Error processing gift transaction: ${contractError.message}`);
      logger.info(`Gift is still marked as paid, but funds are not properly allocated yet`);
      // We don't return false here, as the payment was received correctly
    }
    
    return true;
  } catch (error) {
    logger.error(`❌ Error processing transaction for gift wallet ${wallet.address}: ${error.message}`);
    return false;
  }
}

/**
 * Set up monitoring for direct transfers to gift wallets
 */
export async function setupDirectTransferMonitoring() {
  try {
    logger.info("Setting up direct transfer monitoring for gift wallets");
    
    // Setup provider event listener for all new blocks
    provider.on("block", async (blockNumber) => {
      try {
        logger.info(`New block detected: ${blockNumber}`);
        
        // Get the block with transactions
        const block = await provider.getBlock(blockNumber);
        
        if (!block) {
          logger.warn(`Block ${blockNumber} not found`);
          return;
        }
        
        // Get transaction hashes from the block
        const txHashes = block.transactions || [];
        
        if (txHashes.length === 0) {
          logger.info(`No transactions in block ${blockNumber}`);
          return;
        }
        
        logger.info(`Processing ${txHashes.length} transactions in block ${blockNumber}`);
        
        // Get all pending gifts with wallet addresses
        const pendingGifts = await Gift.find({ paymentStatus: "pending" });
        
        if (pendingGifts.length === 0) {
          logger.info("No pending gifts to check");
          return;
        }
        
        logger.info(`Found ${pendingGifts.length} pending gifts to check`);
        
        // Create a map of wallet addresses to gifts for faster lookup (convert to lowercase for comparison)
        const walletToGiftMap = {};
        for (const gift of pendingGifts) {
          if (gift.recipientWallet) {
            walletToGiftMap[gift.recipientWallet.toLowerCase()] = gift;
          }
        }
        
        logger.info(`Monitoring wallets: ${Object.keys(walletToGiftMap).join(', ')}`);
        
        const processedTxs = [];
        
        // Process each transaction hash by fetching the full transaction details
        for (const txHash of txHashes) {
          try {
            // Get full transaction details
            const tx = await provider.getTransaction(txHash);
            
            if (!tx) {
              logger.warn(`Transaction ${txHash} not found`);
              continue;
            }
            
            if (!tx.to) {
              logger.info(`Skipping transaction ${txHash} - no 'to' address (likely a contract creation)`);
              continue;
            }
            
            const toAddress = tx.to.toLowerCase();
            const fromAddress = tx.from ? tx.from.toLowerCase() : 'unknown';
            const value = tx.value ? ethers.formatEther(tx.value) : '0';
            
            logger.info(`Transaction ${txHash}: From ${fromAddress} to ${toAddress}, value: ${value} ETH`);
            
            // Check if this transaction is to a monitored wallet
            if (walletToGiftMap[toAddress]) {
              logger.info(`💰 Transaction ${tx.hash} matches monitored wallet ${toAddress} for gift code ${walletToGiftMap[toAddress].giftCode}`);
              
              // Get the gift and wallet
              const gift = walletToGiftMap[toAddress];
              const wallet = await Wallet.findOne({ address: toAddress });
              
              if (!wallet) {
                logger.error(`❌ Wallet not found in database for address ${toAddress}`);
                continue;
              }
              
              // Process the transaction
              const success = await processGiftTransaction(tx, gift, wallet);
              if (success) {
                processedTxs.push(tx.hash);
              }
            }
          } catch (txError) {
            logger.error(`❌ Error processing transaction ${txHash}: ${txError.message}`);
          }
        }
        
        if (processedTxs.length > 0) {
          logger.info(`✅ Processed ${processedTxs.length} transactions for gift wallets: ${processedTxs.join(', ')}`);
        }
      } catch (blockError) {
        logger.error(`❌ Error processing block ${blockNumber}: ${blockError.message}`);
      }
    });
    
    logger.info("Direct transfer monitoring setup complete");
  } catch (error) {
    logger.error(`❌ Failed to set up direct transfer monitoring: ${error.message}`);
  }
}

/**
 * Check for existing pending gifts on startup
 */
export async function checkPendingGiftsOnStartup() {
  try {
    const pendingGifts = await Gift.find({ paymentStatus: "pending" });
    
    if (pendingGifts.length > 0) {
      logger.info(`Found ${pendingGifts.length} pending gifts on startup that need payments`);
      
      pendingGifts.forEach(gift => {
        logger.info(`👀 Monitoring wallet ${gift.recipientWallet} for gift ${gift.giftCode} - Amount: ${gift.giftAmount}, Fee: ${gift.feeAmount}, Total: ${gift.totalRequired}`);
      });
      
      logger.info("All pending gifts have been restored for monitoring");
    } else {
      logger.info("No pending gifts found on startup");
    }
  } catch (error) {
    logger.error(`Error checking pending gifts on startup: ${error.message}`);
  }
} 