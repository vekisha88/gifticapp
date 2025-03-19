import { Gift } from "../models/gift.js";
import { ethers } from "ethers";
import mongoose from "mongoose";
import { config } from "dotenv";
import { logger } from "../logger.js";
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };

config(); // Load environment variables

// Contract setup
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GiftContractABI = contractABIJson.abi;
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, GiftContractABI, signer);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/giftic";
mongoose.connect(mongoURI)
  .then(() => logger.info("MongoDB connected for auto-transfer script"))
  .catch(err => {
    logger.error(`MongoDB connection error in auto-transfer script: ${err.message}`);
    process.exit(1);
  });

/**
 * Process a single gift for transfer
 * @param {Object} gift - The gift object from database
 * @returns {Promise<boolean>} - True if transfer was successful, false otherwise
 */
async function processGiftTransfer(gift) {
  try {
    logger.info(`Processing transfer for gift: ${gift.giftCode} with recipient wallet: ${gift.recipientWallet}`);
    
    // Check if already completed
    if (gift.paymentStatus === "completed") {
      logger.info(`Gift ${gift.giftCode} already completed, skipping`);
      return false;
    }
    
    // Check if claimed and unlock date reached
    const now = new Date();
    if (!gift.isClaimed) {
      logger.info(`Gift ${gift.giftCode} not claimed yet, skipping`);
      return false;
    }
    
    if (now < new Date(gift.unlockTimestamp)) {
      logger.info(`Gift ${gift.giftCode} unlock date not reached yet, skipping`);
      return false;
    }
    
    // Initiate transfer on blockchain
    logger.info(`Initiating transfer for gift ${gift.giftCode} to wallet ${gift.recipientWallet}`);
    
    try {
      const tx = await contract.transferFunds(gift.recipientWallet);
      const receipt = await tx.wait();
      
      // Update gift status in database
      gift.paymentStatus = "completed";
      await gift.save();
      
      logger.info(`✅ Transfer successful for gift ${gift.giftCode}, transaction hash: ${receipt.hash}`);
      return true;
    } catch (error) {
      if (error.message.includes("Not claimed")) {
        logger.error(`Gift ${gift.giftCode} not claimed on blockchain, marked as claimed in database`);
      } else if (error.message.includes("Unlock date not reached")) {
        logger.error(`Gift ${gift.giftCode} unlock date not reached on blockchain, but passed in database`);
      } else if (error.message.includes("Gift does not exist")) {
        logger.error(`Gift ${gift.giftCode} not found on blockchain, but exists in database`);
      } else {
        logger.error(`Error transferring gift ${gift.giftCode}: ${error.message}`);
      }
      return false;
    }
  } catch (error) {
    logger.error(`Error processing gift ${gift.giftCode}: ${error.message}`);
    return false;
  }
}

/**
 * Main function to find and process all gifts eligible for transfer
 */
async function autoTransferGifts() {
  try {
    logger.info("Starting automatic gift transfer process");
    
    // Find all claimed gifts with unlock date in the past that haven't been completed
    const now = new Date();
    const eligibleGifts = await Gift.find({
      isClaimed: true,
      unlockTimestamp: { $lte: now },
      paymentStatus: { $ne: "completed" }
    });
    
    logger.info(`Found ${eligibleGifts.length} gifts eligible for transfer`);
    
    if (eligibleGifts.length === 0) {
      logger.info("No gifts to transfer at this time");
      return;
    }
    
    let successCount = 0;
    
    // Process each gift sequentially to avoid nonce issues
    for (const gift of eligibleGifts) {
      const success = await processGiftTransfer(gift);
      if (success) successCount++;
      
      // Add small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Auto-transfer complete. Successfully transferred ${successCount} out of ${eligibleGifts.length} gifts.`);
  } catch (error) {
    logger.error(`Auto-transfer script error: ${error.message}`);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info("MongoDB connection closed for auto-transfer script");
  }
}

// Run the auto-transfer process
autoTransferGifts()
  .then(() => {
    logger.info("Auto-transfer script completed");
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Auto-transfer script failed: ${error.message}`);
    process.exit(1);
  }); 