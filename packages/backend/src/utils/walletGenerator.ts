import { ethers } from 'ethers';
import { Wallet, encryptPrivateKey } from '../models/wallet.js';
import { logger } from '../logger.js';
import dotenv from 'dotenv';
import { WalletData } from '../types/index.js';

dotenv.config();

interface GeneratedWallet {
  index: number;
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic: string;
}

/**
 * Generates a batch of wallet addresses and stores them in the database
 * @param startIndex - Starting index for the batch (unused, kept for backward compatibility)
 * @param count - Number of wallets to generate
 * @returns Array of generated wallet objects
 */
export async function generateWallets(startIndex: number = 0, count: number = 10): Promise<GeneratedWallet[]> {
  logger.info(`Generating ${count} test wallets`);
  
  const wallets: GeneratedWallet[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      // Generate a random wallet using ethers.js
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const privateKey = wallet.privateKey;
      
      // Encrypt the private key
      const encryptedPrivateKey = encryptPrivateKey(privateKey);
      
      // Create and save wallet to database
      const walletDoc = new Wallet({
        address,
        encryptedPrivateKey,
        reserved: false
      });
      
      await walletDoc.save();
      
      // Add wallet to the array
      wallets.push({
        index: startIndex + i,
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        // Store the mnemonic for test wallets (in a real app, handle with extreme care)
        mnemonic: wallet.mnemonic?.phrase || 'No mnemonic available'
      });
      
      logger.info(`Generated wallet ${i+1}/${count}: ${wallet.address}`);
    }
    
    logger.info(`Successfully generated ${wallets.length} test wallets`);
    return wallets;
  } catch (error: any) {
    logger.error(`Error generating test wallets: ${error.message}`);
    throw error;
  }
}

/**
 * Find an unused and unreserved wallet from the database
 * @returns Wallet object or null if none available
 */
export async function getAvailableWallet(): Promise<WalletData | null> {
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
  } catch (error: any) {
    logger.error(`❌ Error finding available wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Release a wallet reservation
 * @param address Wallet address to release
 * @returns Updated wallet object or null
 */
export async function releaseWallet(address: string): Promise<WalletData | null> {
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
  } catch (error: any) {
    logger.error(`❌ Error releasing wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Check wallet balance
 * @param address Wallet address to check
 * @param provider Ethers provider instance
 * @returns Balance in ETH
 */
export async function checkWalletBalance(address: string, provider: ethers.Provider): Promise<string> {
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
  } catch (error: any) {
    logger.error(`❌ Error checking wallet balance: ${error.message}`);
    throw error;
  }
}

// Function to Regenerate Wallet (without mnemonic, as it's now generated on claim)
export async function regenerateWallet(index: number): Promise<WalletData> {
  try {
    // Create a random wallet using ethers v6 API
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Encrypt the private key using the proper method
    const encryptedPrivateKey = encryptPrivateKey(privateKey);
    
    const walletData: WalletData = {
      address,
      privateKey: encryptedPrivateKey
    };
    
    await Wallet.findOneAndUpdate({ address: address.toLowerCase() }, {
      address,
      encryptedPrivateKey,
      reserved: false
    }, { upsert: true });
    
    logger.info(`Regenerated wallet ${address}`);
    return walletData;
  } catch (error: any) {
    logger.error('Error regenerating wallet:', error);
    throw error;
  }
}

export default {
  generateWallets
}; 

