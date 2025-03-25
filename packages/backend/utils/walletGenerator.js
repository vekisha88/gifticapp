import { ethers } from 'ethers';
import { Wallet, encryptPrivateKey } from '../models/wallet.js';
import { logger } from '../logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generates a batch of wallet addresses and stores them in the database
 * @param {number} startIndex - Starting index for the batch (unused, kept for backward compatibility)
 * @param {number} count - Number of wallets to generate
 * @returns {Promise<Array>} - Array of generated wallet objects
 */
export async function generateWallets(startIndex = 0, count = 10) {
  try {
    logger.info(`Generating ${count} wallets...`);
    const wallets = [];

    for (let i = 0; i < count; i++) {
      // Generate a new random wallet
      const ethersWallet = ethers.Wallet.createRandom();
      const address = ethersWallet.address;
      const privateKey = ethersWallet.privateKey;
      
      // Encrypt the private key
      const encryptedPrivateKey = encryptPrivateKey(privateKey);
      
      // Check if wallet already exists (unlikely but possible with random generation)
      const existingWallet = await Wallet.findOne({ address: address.toLowerCase() });
      
      if (existingWallet) {
        logger.warn(`Wallet with address ${address} already exists, skipping`);
        continue;
      }
      
      // Create and save wallet to database
      const wallet = new Wallet({
        address,
        encryptedPrivateKey,
        reserved: false
      });
      
      await wallet.save();
      logger.info(`Generated wallet ${i+1}/${count}: ${address}`);
      wallets.push(wallet);
    }
    
    return wallets;
  } catch (error) {
    logger.error(`❌ Error generating wallets: ${error.message}`);
    throw error;
  }
}

/**
 * Find an unused and unreserved wallet from the database
 * @returns {Promise<Object|null>} Wallet object or null if none available
 */
export async function getAvailableWallet() {
  try {
    // Find a wallet that's not reserved
    const wallet = await Wallet.findOneAndUpdate(
      { reserved: false },
      { reserved: true },
      { new: true }
    );
    
    if (!wallet) {
      logger.warn("No available wallets found");
      return null;
    }
    
    logger.info(`Found available wallet: ${wallet.address}`);
    return wallet;
  } catch (error) {
    logger.error(`❌ Error finding available wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Release a wallet reservation
 * @param {string} address Wallet address to release
 * @returns {Promise<Object|null>} Updated wallet object or null
 */
export async function releaseWallet(address) {
  try {
    if (!address) {
      logger.warn("No address provided for wallet release");
      return null;
    }
    
    const wallet = await Wallet.findOneAndUpdate(
      { address: address.toLowerCase() },
      { reserved: false },
      { new: true }
    );
    
    if (!wallet) {
      logger.warn(`Wallet with address ${address} not found`);
      return null;
    }
    
    logger.info(`Released wallet: ${address}`);
    return wallet;
  } catch (error) {
    logger.error(`❌ Error releasing wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Check wallet balance
 * @param {string} address Wallet address to check
 * @param {Object} provider Ethers provider instance
 * @returns {Promise<string>} Balance in ETH
 */
export async function checkWalletBalance(address, provider) {
  try {
    if (!address) {
      logger.warn("No address provided for balance check");
      return "0";
    }
    
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    logger.info(`Balance for ${address}: ${balanceInEth} ETH`);
    
    // Update wallet with balance information
    await Wallet.findOneAndUpdate(
      { address: address.toLowerCase() },
      { 
        balance: balance.toString(),
        lastBalanceUpdate: new Date()
      }
    );
    
    return balanceInEth;
  } catch (error) {
    logger.error(`❌ Error checking wallet balance: ${error.message}`);
    throw error;
  }
}

// Function to Regenerate Wallet (without mnemonic, as it's now generated on claim)
export async function regenerateWallet(index) {
  try {
    // Create a random wallet using ethers v6 API
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Encrypt the private key using the proper method
    const encryptedPrivateKey = encryptPrivateKey(privateKey);
    
    const walletData = {
      address,
      encryptedPrivateKey,
      reserved: false
    };
    
    await Wallet.findOneAndUpdate({ address: address.toLowerCase() }, walletData, { upsert: true });
    logger.info(`Regenerated wallet ${address}`);
    return walletData;
  } catch (error) {
    logger.error('Error regenerating wallet:', error);
    throw error;
  }
}