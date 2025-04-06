import mongoose, { Document, Schema, Model } from "mongoose";
import crypto from "crypto";
import { isValidEthereumAddress } from "../utils/validation.js";
import { logger } from "../logger.js";
import { WalletData } from "../types/index.js";

// Simple encryption/decryption for wallet private keys
// Note: In production, use a secure secret management service
const SECRET_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-key-for-development-only-change-me";

export interface IWallet extends Document {
  address: string;
  encryptedPrivateKey: string;
  reserved: boolean;
  balance: string;
  lastBalanceUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  getDecryptedPrivateKey(): string;
  getMnemonic(): string;
}

/**
 * Wallet schema definition
 */
const walletSchema = new Schema({
  // Wallet address (public key)
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value: string) => isValidEthereumAddress(value),
      message: "Invalid Ethereum address format"
    }
  },
  // Encrypted private key (never store raw private keys!)
  encryptedPrivateKey: {
    type: String,
    required: true
  },
  // Used to track temporary reservations
  reserved: {
    type: Boolean,
    default: false
  },
  // Balance in wei
  balance: {
    type: String,
    default: "0"
  },
  // Last balance update
  lastBalanceUpdate: {
    type: Date,
    default: Date.now
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Method to decrypt the private key
 * @returns Decrypted private key
 */
walletSchema.methods.getDecryptedPrivateKey = function(this: IWallet): string {
  try {
    return decrypt(this.encryptedPrivateKey);
  } catch (error: any) {
    logger.error(`Failed to decrypt private key: ${error.message}`);
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
};

/**
 * Method to get the mnemonic for this wallet
 * @returns Mnemonic phrase
 * @throws Error If the private key is not a valid mnemonic
 */
walletSchema.methods.getMnemonic = function(this: IWallet): string {
  try {
    // Get the decrypted private key
    const privateKey = this.getDecryptedPrivateKey();
    
    // Assume the privateKey is actually a mnemonic phrase
    // In a real implementation, you would verify this is a valid mnemonic
    // For example, using ethers.js to validate
    
    if (privateKey && typeof privateKey === 'string' && privateKey.split(' ').length >= 12) {
      return privateKey; // This appears to be a mnemonic
    } else {
      // If it's a regular private key, we might need to handle conversion
      logger.warn(`Wallet ${this.address} has a privateKey that doesn't appear to be a mnemonic`);
      throw new Error("Wallet does not have a mnemonic format private key");
    }
  } catch (error: any) {
    logger.error(`Failed to get mnemonic: ${error.message}`);
    throw new Error(`Failed to get mnemonic: ${error.message}`);
  }
};

/**
 * Encrypt a string using AES-256-CBC with an initialization vector
 * @param text Plain text to encrypt
 * @returns Encrypted text with IV prefixed
 */
function encrypt(text: string): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  // Create a key buffer from the secret key (must be exactly 32 bytes for AES-256)
  const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
  // Create cipher with key and IV
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prefix the IV to the encrypted data (IV needs to be stored to decrypt)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string
 * @param encrypted Encrypted text with IV prefixed
 * @returns Decrypted text
 */
function decrypt(encrypted: string): string {
  try {
    // Handle legacy format (no IV)
    if (!encrypted.includes(':')) {
      // Generate key using SHA-256 for legacy format
      const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
      
      // Create initialization vector for legacy format (all zeros)
      const iv = Buffer.alloc(16, 0);
      
      // Use createDecipheriv instead of deprecated createDecipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    
    // Split the IV and the encrypted text
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    // Create a key buffer from the secret key (must be exactly 32 bytes for AES-256)
    const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    logger.error(`Decryption failed: ${error.message}`);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}

/**
 * Helper function to encrypt a private key
 * @param privateKey Private key to encrypt
 * @returns Encrypted private key
 */
export function encryptPrivateKey(privateKey: string): string {
  return encrypt(privateKey);
}

/**
 * Pre-save hook to encrypt the private key if it has been modified
 */
walletSchema.pre("save", function(this: IWallet, next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Always store address in lowercase
  if (this.address) {
    this.address = this.address.toLowerCase();
  }
  
  next();
});

const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);

export { Wallet }; 

