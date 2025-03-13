const { ethers } = require("ethers"); // Using ethers v5.7.2
const Gift = require("../models/gift");
const Wallet = require("../models/wallet");
const { generateGiftCode } = require("../utils/walletGenerator"); // Corrected path
const logger = require("../logger");

async function saveGiftToDatabase(giftData) {
    try {
        const gift = new Gift(giftData);
        await gift.save();
        logger.info(`✅ Gift saved to database: ${gift.giftCode}`);
        return gift;
    } catch (error) {
        logger.error(`❌ Error saving gift to database: ${error.message}`);
        throw error;
    }
}

async function saveWalletToDatabase(walletData) {
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

async function getLastWalletIndex() {
    try {
        const lastWallet = await Wallet.findOne().sort({ index: -1 });
        return lastWallet ? lastWallet.index : 0;
    } catch (error) {
        logger.error(`❌ Error fetching last wallet index: ${error.message}`);
        throw error;
    }
}

async function getUnusedWallet() {
    try {
        const wallet = await Wallet.findOne({ used: false, reserved: false });
        return wallet ? { address: wallet.address, index: wallet.index } : null;
    } catch (error) {
        logger.error(`❌ Error fetching unused wallet: ${error.message}`);
        throw error;
    }
}

async function markWalletAsUsed(walletIndex) {
    try {
        await Wallet.updateOne({ index: walletIndex }, { used: true });
        logger.info(`✅ Wallet index ${walletIndex} marked as used. Reserved status unchanged.`);
    } catch (error) {
        logger.error(`❌ Error marking wallet as used: ${error.message}`);
        throw error;
    }
}

async function assignWalletToGift(giftDetails) {
    try {
        // Log the giftDetails for debugging
        logger.info(`Assigning wallet to gift with details: ${JSON.stringify(giftDetails)}`);

        // Validate the walletAddress provided by the frontend
        if (!giftDetails.walletAddress) {
            throw new Error("No wallet address provided for gift assignment.");
        }

        // Find the wallet using the provided walletAddress to ensure it’s the exact one reserved
        const wallet = await Wallet.findOne({
            address: giftDetails.walletAddress,
            reserved: true,
            used: false
        });

        if (!wallet) {
            throw new Error(`Wallet ${giftDetails.walletAddress} is not reserved or already used. Please fetch a new wallet.`);
        }

        // Validate unlockDate as a full datetime and enforce minimum 2 hours from now
        if (!giftDetails.unlockDate || typeof giftDetails.unlockDate !== "string") {
            throw new Error("Invalid or missing unlock date and time.");
        }

        const unlockDate = new Date(giftDetails.unlockDate);
        if (isNaN(unlockDate.getTime())) {
            throw new Error("Invalid date and time format for unlockDate");
        }

        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

        if (unlockDate < twoHoursFromNow) {
            throw new Error("Unlock date and time must be at least 2 hours from now.");
        }

        // Generate a unique gift code
        const giftCode = await generateGiftCode();
        const giftAmount = Number(giftDetails.amount); // Keep the exact amount the buyer inputs
        const initialFee = giftAmount * 0.05; // Initial 5% fee
        const totalAmount = giftAmount + initialFee; // Payment amount = Gift Amount + 5% Fee

        // Simulate gas fees (for local testing, use a fixed value; in production, use real gas costs)
        const simulatedGasFee = ethers.utils.parseEther("0.001"); // Use ethers.utils for v5
        const finalFee = initialFee - Number(ethers.utils.formatEther(simulatedGasFee)); // Use ethers.utils for v5

        if (finalFee < 0) {
            throw new Error("Gas fees exceed the 5% fee. Adjust fee or gas estimation.");
        }

        const giftData = {
            giftCode,
            recipientFirstName: giftDetails.recipientFirstName,
            recipientLastName: giftDetails.recipientLastName,
            amount: giftAmount, // Receiver gets the exact amount buyer input
            currency: giftDetails.currency,
            unlockDate: unlockDate, // Store the validated full datetime
            walletAddress: wallet.address, // Use the validated wallet address
            walletIndex: wallet.index, // Use the validated wallet index
            buyerEmail: giftDetails.buyerEmail,
            paymentStatus: "pending",
            expiryDate: giftDetails.expiryDate || new Date(Date.now() + 60 * 60 * 1000),
            fee: finalFee, // Fee after gas deduction
            totalAmount, // Payment amount (Gift Amount + initial 5% Fee)
            gasFee: Number(ethers.utils.formatEther(simulatedGasFee)) // Store gas fee for tracking
        };

        // Save the gift to the database, ensuring the correct wallet is associated
        await saveGiftToDatabase(giftData);

        // Mark the wallet as used, leaving reserved unchanged (as per request)
        await markWalletAsUsed(wallet.index);

        logger.info(`✅ Wallet ${wallet.address} assigned to gift ${giftCode} with unlock date/time: ${unlockDate.toISOString()}`);

        return giftData;
    } catch (error) {
        logger.error(`❌ Error assigning wallet to gift: ${error.message}`);
        throw error;
    }
}

async function cleanupExpiredGifts() {
    try {
        const now = new Date();
        const expiredGifts = await Gift.find({ expiryDate: { $lt: now } });
        for (const gift of expiredGifts) {
            await Gift.deleteOne({ giftCode: gift.giftCode });
            await Wallet.updateOne({ index: gift.walletIndex }, { used: false, reserved: false }); // Reset both used and reserved to false
            logger.info(`✅ Expired gift ${gift.giftCode} cleaned up and wallet ${gift.walletAddress} marked as unused and unreserved`);
        }
    } catch (error) {
        logger.error(`❌ Error cleaning up expired gifts: ${error.message}`);
        throw error;
    }
}

module.exports = { saveGiftToDatabase, saveWalletToDatabase, getLastWalletIndex, getUnusedWallet, markWalletAsUsed, assignWalletToGift, cleanupExpiredGifts };