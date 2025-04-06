import { ethers } from "ethers";
import { Wallet } from "../models/wallet.js";
import { logger } from "../logger.js";
import { 
  getAvailableWallet as getWallet, 
  releaseWallet, 
  checkWalletBalance, 
  generateWallets 
} from "../utils/walletGenerator.js";
import { provider } from "./blockchainService.js";
import { WalletData } from "../types/index.js";

interface WalletResult {
  success: boolean;
  wallet?: any;
  error?: string;
}

/**
 * Get an unused wallet for a new gift
 * @returns {Promise<Object|null>} Available wallet or null if none found
 */
export async function getUnusedWallet(): Promise<WalletData | null> {
  try {
    // Get an available wallet
    const wallet = await getWallet();
    
    if (!wallet) {
      logger.warn("No available wallets found");
      
      // Check total wallet count and generate more if needed
      const totalWallets = await Wallet.countDocuments();
      if (totalWallets < 10) {
        logger.info("Generating more wallets...");
        await generateWallets(0, 20);
        return getUnusedWallet(); // Try again after generating wallets
      }
      
      return null;
    }
    
    // Check wallet balance
    try {
      await checkWalletBalance(wallet.address, provider);
    } catch (error: any) {
      logger.error(`Error checking wallet balance: ${error.message}`);
      // Continue even if balance check fails
    }
    
    return wallet;
  } catch (error: any) {
    logger.error(`Error getting unused wallet: ${error.message}`);
    return null;
  }
}

/**
 * Release a wallet reservation
 * @param {string} address Wallet address to release
 * @returns {Promise<boolean>} Success status
 */
export async function releaseWalletReservation(address: string): Promise<boolean> {
  try {
    if (!address) {
      logger.warn("No address provided for wallet release");
      return false;
    }
    
    const result = await releaseWallet(address);
    return !!result;
  } catch (error: any) {
    logger.error(`Error releasing wallet reservation: ${error.message}`);
    return false;
  }
}

/**
 * Get wallet balance
 * @param {string} address Wallet address to check
 * @returns {Promise<string>} Balance in ETH
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    return await checkWalletBalance(address, provider);
  } catch (error: any) {
    logger.error(`Error getting wallet balance: ${error.message}`);
    return "0";
  }
}

/**
 * Count available wallets
 * @returns {Promise<number>} Number of available wallets
 */
export async function countAvailableWallets(): Promise<number> {
  try {
    const count = await Wallet.countDocuments({ reserved: false });
    logger.info(`Available wallets: ${count}`);
    return count;
  } catch (error: any) {
    logger.error(`Error counting available wallets: ${error.message}`);
    return 0;
  }
}

/**
 * Generate additional wallets if needed
 * @param {number} minAvailable Minimum number of available wallets
 * @returns {Promise<number>} Number of wallets generated
 */
export async function ensureMinimumWallets(minAvailable: number = 10): Promise<number> {
  try {
    const availableCount = await countAvailableWallets();
    
    if (availableCount < minAvailable) {
      const countToGenerate = minAvailable - availableCount;
      logger.info(`Generating ${countToGenerate} additional wallets...`);
      const newWallets = await generateWallets(0, countToGenerate);
      return newWallets.length;
    }
    
    return 0;
  } catch (error: any) {
    logger.error(`Error ensuring minimum wallets: ${error.message}`);
    return 0;
  }
}

/**
 * Mark a wallet as used (and leave reserved unchanged, as per request)
 * @param {number} walletIndex The index of the wallet to mark as used
 * @returns {Promise<WalletResult>} Result object with success status and wallet or error
 */
export async function markWalletAsUsed(walletIndex: number): Promise<WalletResult> {
  try {
    // This is deliberately not an atomic update so it doesn't affect reservation status
    const wallet = await Wallet.findOne({ index: walletIndex });
    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }
    
    wallet.used = true; // Mark as used
    await wallet.save();
    logger.info(`✅ Wallet ${wallet.address} (Index: ${wallet.index}) marked as used. Reserved status: ${wallet.reserved}`);
    return { success: true, wallet: wallet };
  } catch (error: any) {
    logger.error(`❌ Error marking wallet as used: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Save a wallet with encrypted private key to the database
 * @param {WalletData} walletData The wallet data to save
 * @returns {Promise<any>} The saved wallet document
 */
export async function saveWalletToDatabase(walletData: WalletData): Promise<any> {
  try {
    const wallet = new Wallet(walletData);
    await wallet.save();
    logger.info(`✅ Wallet saved: ${walletData.address}`);
    return wallet;
  } catch (error: any) {
    logger.error(`❌ Error saving wallet to database: ${error.message}`);
    throw error;
  }
}

/**
 * Get the highest wallet index in use (for generating sequential wallets)
 * @returns {Promise<number>} The highest wallet index or 0 if no wallets exist
 */
export async function getLastWalletIndex(): Promise<number> {
  try {
    // Find the wallet with the highest index
    const lastWallet = await Wallet.findOne().sort({ index: -1 });
    
    // Return the index, or 0 if no wallets exist
    const lastIndex = lastWallet ? lastWallet.index : 0;
    logger.info(`✅ Last wallet index: ${lastIndex}`);
    return lastIndex;
  } catch (error: any) {
    logger.error(`❌ Error fetching last wallet index: ${error.message}`);
    throw error; 
  }
}

/**
 * Get a wallet by its address
 * @param {string} address Wallet address to find
 * @returns {Promise<Object|null>} Wallet document or null if not found
 */
export async function getWalletByAddress(address: string): Promise<any | null> {
  try {
    if (!address) {
      logger.warn("No address provided to getWalletByAddress");
      return null;
    }
    
    // Convert address to lowercase for consistent querying
    const normalizedAddress = address.toLowerCase();
    
    const wallet = await Wallet.findOne({ address: normalizedAddress });
    
    if (!wallet) {
      logger.warn(`Wallet not found with address: ${normalizedAddress}`);
      return null;
    }
    
    return wallet;
  } catch (error: any) {
    logger.error(`Error finding wallet by address: ${error.message}`);
    return null;
  }
}

export default {
  getUnusedWallet,
  releaseWalletReservation,
  getWalletBalance,
  countAvailableWallets,
  ensureMinimumWallets,
  markWalletAsUsed,
  saveWalletToDatabase,
  getLastWalletIndex,
  getWalletByAddress
}; 

