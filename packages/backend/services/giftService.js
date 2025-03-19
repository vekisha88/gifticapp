import { ethers } from "ethers"; // Using ethers v5.7.2
import { Gift } from "../models/gift.js";
import { Wallet } from "../models/wallet.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger.js";
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };

// Set up provider and contract
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GiftContractABI = contractABIJson.abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS, GiftContractABI, provider);

// Signer for contract interactions
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);

export async function saveGiftToDatabase(giftData) {
    try {
        const gift = new Gift(giftData);
        await gift.save();
        logger.info(`✅ Gift saved to database for recipient wallet: ${giftData.recipientWallet}`);
        return gift;
    } catch (error) {
        logger.error(`❌ Error saving gift to database: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function saveWalletToDatabase(walletData) {
    try {
        const wallet = new Wallet(walletData);
        await wallet.save();
        logger.info(`✅ Wallet saved: ${walletData.address} (Index: ${walletData.index})`);
        return wallet;
    } catch (error) {
        logger.error(`❌ Error saving wallet to database: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function getLastWalletIndex() {
    try {
        const lastWallet = await Wallet.findOne().sort({ index: -1 });
        return lastWallet ? lastWallet.index : 0;
    } catch (error) {
        logger.error(`❌ Error fetching last wallet index: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function getUnusedWallet() {
    try {
        const wallet = await Wallet.findOne({ used: false, reserved: false });
        return wallet ? { address: wallet.address, index: wallet.index } : null;
    } catch (error) {
        logger.error(`❌ Error fetching unused wallet: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function markWalletAsUsed(walletIndex) {
    try {
        await Wallet.updateOne({ index: walletIndex }, { used: true });
        logger.info(`✅ Wallet index ${walletIndex} marked as used. Reserved status unchanged.`);
    } catch (error) {
        logger.error(`❌ Error marking wallet as used: ${error.message}`);
        throw error;
    }
}

// Generate a unique gift code for backward compatibility
export async function generateGiftCode() {
    const giftCode = uuidv4();
    const existingGift = await Gift.findOne({ giftCode });
    if (existingGift) {
        return generateGiftCode(); // Try again if code already exists
    }
    return giftCode;
}

export async function findGiftByRecipientWallet(recipientWallet) {
    try {
        // Case-insensitive search for recipient wallet
        const gift = await Gift.findOne({ 
            recipientWallet: { $regex: new RegExp(`^${recipientWallet.toLowerCase()}$`, 'i') } 
        });
        return gift;
    } catch (error) {
        logger.error(`❌ Error finding gift by recipient wallet: ${error.message}`);
        throw error;
    }
}

export async function findGiftByCode(giftCode) {
    try {
        return await Gift.findOne({ giftCode });
    } catch (error) {
        logger.error(`❌ Error finding gift by code: ${error.message}`);
        throw error;
    }
}

export async function cleanupExpiredGifts() {
    try {
        // This function is updated to account for the new model structure
        // Since we're no longer using expiryDate, we'll just log this function
        // In a future version, this could check for gifts that are older than a certain time
        // and have not been claimed or paid for
        logger.info("Gift cleanup function called - no action required with current model");
    } catch (error) {
        logger.error(`❌ Error cleaning up expired gifts: ${error.message}`);
        throw error;
    }
}

/**
 * Batch process multiple gifts in a single transaction to optimize gas costs
 * @param {Array} giftIds - Array of gift IDs to process
 * @returns {Promise<Object>} - Result of batch processing
 */
export async function batchProcessGifts(giftIds) {
  try {
    if (!giftIds || !Array.isArray(giftIds) || giftIds.length === 0) {
      throw new Error("No gift IDs provided for batch processing");
    }
    
    logger.info(`Starting batch processing for ${giftIds.length} gifts`);
    
    // Load the gifts from database
    const gifts = await Gift.find({ _id: { $in: giftIds }, paymentStatus: "pending" });
    
    if (gifts.length === 0) {
      logger.warn("No pending gifts found for batch processing");
      return { success: false, message: "No pending gifts found" };
    }
    
    logger.info(`Found ${gifts.length} pending gifts for batch processing`);
    
    // Prepare arrays for batch processing
    const tokens = [];
    const amounts = [];
    const recipientWallets = [];
    const unlockTimestamps = [];
    
    // Collect wallets to retrieve private keys
    const walletAddresses = gifts.map(gift => gift.recipientWallet.toLowerCase());
    
    // Retrieve all relevant wallets in one query
    const wallets = await Wallet.find({ address: { $in: walletAddresses } });
    
    if (wallets.length !== gifts.length) {
      logger.warn(`Not all wallets found: ${wallets.length} wallets for ${gifts.length} gifts`);
    }
    
    // Create a map for easy wallet lookup
    const walletMap = {};
    wallets.forEach(wallet => {
      walletMap[wallet.address.toLowerCase()] = wallet;
    });
    
    // Calculate total native currency value needed
    let totalValue = ethers.parseEther("0");
    
    // Process each gift and prepare batch data
    const validGifts = [];
    for (const gift of gifts) {
      const walletAddress = gift.recipientWallet.toLowerCase();
      const wallet = walletMap[walletAddress];
      
      if (!wallet) {
        logger.warn(`Wallet not found for gift ${gift.giftCode}, skipping`);
        continue;
      }
      
      try {
        // Get wallet private key and balance
        const walletPrivateKey = wallet.getDecryptedPrivateKey();
        const walletSigner = new ethers.Wallet(walletPrivateKey, provider);
        const walletBalance = await provider.getBalance(walletAddress);
        
        if (walletBalance.isZero() || walletBalance.lt(ethers.parseEther("0.001"))) {
          logger.warn(`Insufficient balance for gift ${gift.giftCode}: ${ethers.formatEther(walletBalance)} ETH/MATIC`);
          continue;
        }
        
        // For now, we only handle native currency (ETH/MATIC)
        const tokenAddress = ethers.ZeroAddress;
        const giftAmount = walletBalance - ethers.parseEther("0.001"); // Leave a small amount for gas
        const unlockTimestamp = Math.floor(new Date(gift.unlockTimestamp).getTime() / 1000);
        
        tokens.push(tokenAddress);
        amounts.push(giftAmount);
        recipientWallets.push(walletAddress);
        unlockTimestamps.push(unlockTimestamp);
        
        totalValue = totalValue + giftAmount;
        validGifts.push(gift);
        
        logger.info(`Added gift ${gift.giftCode} to batch: ${ethers.formatEther(giftAmount)} ETH/MATIC`);
      } catch (error) {
        logger.error(`Error processing gift ${gift.giftCode} for batch: ${error.message}`);
      }
    }
    
    if (validGifts.length === 0) {
      logger.warn("No valid gifts found for batch processing");
      return { success: false, message: "No valid gifts found" };
    }
    
    logger.info(`Batch processing ${validGifts.length} gifts with total value: ${ethers.formatEther(totalValue)} ETH/MATIC`);
    
    // Connect to the contract with the backend wallet
    const contractWithSigner = contract.connect(signer);
    
    // Send the batch transaction
    const batchTx = await contractWithSigner.batchLockFunds(
      tokens,
      amounts,
      recipientWallets,
      unlockTimestamps,
      { value: totalValue, gasLimit: 1000000 }
    );
    
    logger.info(`Batch transaction sent: ${batchTx.hash}`);
    
    // Wait for the transaction to be mined
    const receipt = await batchTx.wait();
    logger.info(`Batch transaction confirmed in block ${receipt.blockNumber}`);
    
    // Update each gift's status
    for (const gift of validGifts) {
      gift.paymentStatus = "received";
      await gift.save();
      logger.info(`Gift ${gift.giftCode} marked as received`);
    }
    
    return {
      success: true,
      message: `Successfully processed ${validGifts.length} gifts in batch`,
      transactionHash: batchTx.hash,
      processedGifts: validGifts.map(gift => gift.giftCode)
    };
  } catch (error) {
    logger.error(`Batch processing error: ${error.message}`);
    throw error;
  }
}