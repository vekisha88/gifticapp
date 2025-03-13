const Wallet = require("../models/wallet"); // ✅ Import Wallet Model
const logger = require("../logger");

// ✅ Get an unused wallet from the database and mark it as reserved
async function getUnusedWallet() {
    try {
        // Find and update a wallet where both used and reserved are false, atomically setting reserved to true
        const wallet = await Wallet.findOneAndUpdate(
            { used: false, reserved: false }, // Ensure wallet is unused and unreserved
            { reserved: true }, // Mark as reserved
            { new: true } // Return the updated document
        );

        if (wallet) {
            logger.info(`✅ Wallet reserved: ${wallet.address} (Index: ${wallet.index})`);
            return wallet; // Return the wallet, now marked as reserved, with address and index
        }

        logger.warn("❌ No unused and unreserved wallets available.");
        return null;
    } catch (error) {
        logger.error(`❌ Error fetching unused wallet: ${error.message}`);
        throw error;
    }
}

// ✅ Mark a wallet as used (and leave reserved unchanged, as per request)
async function markWalletAsUsed(walletIndex) {
    try {
        const wallet = await Wallet.findOneAndUpdate(
            { index: walletIndex, used: false }, // Ensure wallet exists, is unused, and can be any reserved state
            { used: true }, // Mark as used, leaving reserved unchanged
            { new: true }
        );
        if (!wallet) {
            logger.warn(`❌ Wallet with index ${walletIndex} not found or already used.`);
        } else {
            logger.info(`✅ Wallet index ${walletIndex} marked as used. Reserved status unchanged.`);
        }
    } catch (error) {
        logger.error(`❌ Error marking wallet as used: ${error.message}`);
        throw error;
    }
}

// ✅ Get the last used wallet index from the database
async function getLastWalletIndex() {
    try {
        const lastWallet = await Wallet.findOne().sort({ index: -1 });
        return lastWallet ? lastWallet.index + 1 : 0; // Start from 0 if no wallets exist
    } catch (error) {
        logger.error(`❌ Error getting last wallet index: ${error.message}`);
        throw error;
    }
}

// ✅ Save a newly generated wallet to the database
async function saveWalletToDatabase(walletData) {
    try {
        const newWallet = new Wallet({
            index: walletData.index,
            address: walletData.address,
            used: false, // Newly generated wallets are unused by default
            reserved: false // Newly generated wallets are not reserved by default
        });

        await newWallet.save();
        logger.info(`✅ Wallet saved: ${walletData.address} (Index: ${walletData.index})`);
    } catch (error) {
        logger.error(`❌ Error saving wallet to database: ${error.message}`);
        throw error;
    }
}

module.exports = { getUnusedWallet, markWalletAsUsed, getLastWalletIndex, saveWalletToDatabase };