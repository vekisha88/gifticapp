import { Gift } from "../models/gift.js";
import mongoose from "mongoose";
import { config } from "dotenv";
import { logger } from "../logger.js";

config(); // Load environment variables

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/giftic";

interface GiftSummary {
  giftCode: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientWallet: string;
  giftAmount: number;
  feeAmount: number;
  totalRequired: number;
  currency: string;
  unlockTimestamp: Date;
  createdAt: Date;
}

async function checkPendingGifts(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully");

    // Find all pending gifts
    const pendingGifts = await Gift.find({ paymentStatus: "pending" });
    console.log(`Found ${pendingGifts.length} pending gifts:`);

    // Display each pending gift
    pendingGifts.forEach((gift, index) => {
      console.log(`----- Gift #${index + 1} -----`);
      console.log(`Gift Code: ${gift.giftCode}`);
      console.log(`Recipient: ${gift.recipientFirstName} ${gift.recipientLastName}`);
      console.log(`Wallet: ${gift.recipientWallet}`);
      console.log(`Amount: ${gift.giftAmount} + Fee ${gift.feeAmount} = Total ${gift.totalRequired}`);
      console.log(`Currency: ${gift.currency}`);
      console.log(`Unlock Date: ${gift.unlockTimestamp}`);
      console.log(`Created At: ${gift.createdAt}`);
      console.log("--------------------");
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error checking pending gifts: ${errorMessage}`);
    logger.error(`Error checking pending gifts: ${errorMessage}`);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
checkPendingGifts()
  .then(() => {
    console.log("Check complete");
    process.exit(0);
  })
  .catch(error => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Script failed: ${errorMessage}`);
    logger.error(`Script failed: ${errorMessage}`);
    process.exit(1);
  }); 

