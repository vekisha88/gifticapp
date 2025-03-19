// Backend/functions/index.js
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const giftRoutes = require("../routes/gift"); // Adjust path
const logger = require("../logger");
const { cleanupExpiredGifts } = require("../services/giftService");

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/gift", giftRoutes);

// Blockchain setup (example; update with your provider)
const CONTRACT_ADDRESS = require("../../../contractAddress.json").contractAddress;
const GIFT_CONTRACT_ABI = require("../../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json").abi;
const provider = new ethers.providers.JsonRpcProvider(functions.config().provider.url || "http://127.0.0.1:8545");
const signer = new ethers.Wallet(functions.config().signer.private_key, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, GIFT_CONTRACT_ABI, signer);

// Event listener (runs on deployment)
contract.on("FundsLocked", async (giftCode, token, amount, fee, targetWallet, unlockDate) => {
    try {
        const decodedGiftCode = ethers.utils.parseBytes32String(giftCode);
        logger.info(`FundsLocked event: ${decodedGiftCode}`);
        const { confirmPayment } = require("../services/paymentService");
        const result = await confirmPayment(decodedGiftCode);
        if (!result.success) logger.warn(`Payment confirmation failed: ${result.error}`);
    } catch (error) {
        logger.error(`Error processing FundsLocked: ${error.message}`);
    }
});

// Export as Firebase Function
exports.api = functions.https.onRequest(app);

// Cleanup expired gifts (runs every minute)
exports.cleanupExpiredGifts = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
    try {
        await cleanupExpiredGifts();
        logger.info("Expired gifts cleanup executed");
    } catch (error) {
        logger.error(`Cleanup error: ${error.message}`);
    }
});