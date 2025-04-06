import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ethers, Contract } from "ethers";
import giftRoutes from "../routes/gift.js"; 
import { logger } from "../logger.js";
import { cleanupExpiredGifts } from "../services/giftService.js";
import { confirmPayment } from "../services/paymentService.js";

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/gift", giftRoutes);

interface ContractAddressFile {
  contractAddress: string;
}

// Blockchain setup
const CONTRACT_ADDRESS = (require("../../../blockchain/contractAddress.json") as ContractAddressFile).contractAddress;
const GIFT_CONTRACT_ABI = require("../../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json").abi;
const provider = new ethers.JsonRpcProvider(functions.config().provider?.url || "http://127.0.0.1:8545");
const signer = new ethers.Wallet(functions.config().signer?.private_key || "", provider);
const contract = new Contract(CONTRACT_ADDRESS, GIFT_CONTRACT_ABI, signer);

// Event listener (runs on deployment)
contract.on("FundsLocked", async (
  giftCode: string, 
  token: string, 
  amount: ethers.BigNumberish, 
  fee: ethers.BigNumberish, 
  targetWallet: string, 
  unlockDate: ethers.BigNumberish
) => {
    try {
        const decodedGiftCode = ethers.toUtf8String(giftCode);
        logger.info(`FundsLocked event: ${decodedGiftCode}`);
        const result = await confirmPayment(decodedGiftCode);
        if (!result.success) logger.warn(`Payment confirmation failed: ${result.error}`);
    } catch (error: any) {
        logger.error(`Error processing FundsLocked: ${error.message}`);
    }
});

// Export as Firebase Function
export const api = functions.https.onRequest(app);

// Cleanup expired gifts (runs every minute)
export const cleanupExpiredGiftsScheduler = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
    try {
        await cleanupExpiredGifts();
        logger.info("Expired gifts cleanup executed");
        return null;
    } catch (error: any) {
        logger.error(`Cleanup error: ${error.message}`);
        return null;
    }
}); 

