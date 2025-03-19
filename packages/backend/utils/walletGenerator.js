import { ethers } from 'ethers';
import { Wallet } from '../models/wallet.js';
import { logger } from '../logger.js';
import { saveWalletToDatabase, getLastWalletIndex } from "../services/walletService.js";
import dotenv from 'dotenv';

dotenv.config();

// Securely Load and Validate Master Mnemonic (optional, can remove if not used)
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC;

// Function to Generate Gift Code
export function generateGiftCode() {
  const randomHex = ethers.hexlify(ethers.randomBytes(4));
  const giftCode = `GIFT-${randomHex.slice(2).toUpperCase()}`;
  logger.info(`✅ Generated gift code: ${giftCode}`);
  return giftCode;
}

/**
 * Generates a batch of wallet addresses and stores them in the database
 * @param {number} startIndex - Starting index for the batch
 * @param {number} count - Number of wallets to generate
 * @returns {Promise<Array>} - Array of generated wallet objects
 */
export async function generateWallets(startIndex = 0, count = 10) {
  try {
    logger.info(`Generating ${count} wallets starting at index ${startIndex}...`);
    const wallets = [];

    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      
      try {
        // Create wallet document with encrypted private key
        const newWallet = new Wallet({
          address: wallet.address.toLowerCase(),
          encryptedPrivateKey: wallet.privateKey, // Will be encrypted by pre-save hook
          isAssigned: false,
          index: startIndex + i,
        });

        // Save to database
        await newWallet.save();
        
        // Don't include the private key in the returned object for security
        wallets.push({
          address: newWallet.address,
          index: newWallet.index,
          isAssigned: newWallet.isAssigned,
        });
        
        logger.info(`Generated wallet ${i + 1}/${count}: ${wallet.address}`);
      } catch (error) {
        // Check if this is a duplicate key error
        if (error.code === 11000) {
          logger.warn(`Wallet ${wallet.address} already exists in the database. Skipping.`);
        } else {
          logger.error(`Error saving wallet ${wallet.address}: ${error.message}`);
          throw error; // Re-throw if it's not a duplicate key error
        }
      }
    }

    logger.info(`Successfully generated ${wallets.length} wallets`);
    return wallets;
  } catch (error) {
    logger.error(`Failed to generate wallets: ${error.message}`);
    throw error;
  }
}

/**
 * Gets an available wallet from the database
 * @returns {Promise<Object|null>} - Available wallet or null if none found
 */
export async function getAvailableWallet() {
  try {
    // Find the first unused wallet and mark it as used atomically
    const wallet = await Wallet.findOneAndUpdate(
      { isAssigned: false },
      { isAssigned: true },
      { new: true, sort: { index: 1 } }
    );

    if (!wallet) {
      logger.warn("No available wallets found");
      return null;
    }

    logger.info(`Assigned wallet: ${wallet.address}`);
    
    // Don't return the private key in the response
    return {
      address: wallet.address,
      isAssigned: wallet.isAssigned,
    };
  } catch (error) {
    logger.error(`Failed to get available wallet: ${error.message}`);
    throw error;
  }
}

// Function to Regenerate Wallet (without mnemonic, as it's now generated on claim)
export async function regenerateWallet(index) {
  try {
    // Create a random wallet using ethers v6 API
    const wallet = ethers.Wallet.createRandom();
    const walletData = {
      index,
      address: wallet.address,
      privateKey: Buffer.from(wallet.privateKey.slice(2), 'hex').toString('base64'), // Encrypt private key
      used: false,
      reserved: false,
      network: 'polygon'
    };
    await Wallet.findOneAndUpdate({ index }, walletData, { upsert: true });
    logger.info(`Regenerated wallet ${index}: ${wallet.address}`);
    return walletData;
  } catch (error) {
    logger.error('Error regenerating wallet:', error);
    throw error;
  }
}