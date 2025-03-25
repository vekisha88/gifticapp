import mongoose from "mongoose";
import crypto from "crypto";
import { isValidEthereumAddress } from "../utils/validation.js";
import { logger } from "../logger.js";

// Simple encryption/decryption for wallet private keys
// Note: In production, use a secure secret management service
const SECRET_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-key-for-development-only-change-me";

/**
 * Wallet schema definition
 */
const walletSchema = new mongoose.Schema({
  // Wallet address (public key)
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => isValidEthereumAddress(value),
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
 * @returns {string} Decrypted private key
 */
walletSchema.methods.getDecryptedPrivateKey = function() {
  try {
    return decrypt(this.encryptedPrivateKey);
  } catch (error) {
    logger.error(`Failed to decrypt private key: ${error.message}`);
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
};

/**
 * Encrypt a string using AES-256-CBC with an initialization vector
 * @param {string} text Plain text to encrypt
 * @returns {string} Encrypted text with IV prefixed
 */
function encrypt(text) {
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
 * @param {string} encrypted Encrypted text with IV prefixed
 * @returns {string} Decrypted text
 */
function decrypt(encrypted) {
  try {
    // Handle legacy format (no IV)
    if (!encrypted.includes(':')) {
      // Use legacy decryption
      const decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY);
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
  } catch (error) {
    logger.error(`Decryption failed: ${error.message}`);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}

/**
 * Helper function to encrypt a private key
 * @param {string} privateKey Private key to encrypt
 * @returns {string} Encrypted private key
 */
function encryptPrivateKey(privateKey) {
  return encrypt(privateKey);
}

/**
 * Pre-save hook to encrypt the private key if it has been modified
 */
walletSchema.pre("save", function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Always store address in lowercase
  if (this.address) {
    this.address = this.address.toLowerCase();
  }
  
  next();
});

const Wallet = mongoose.model("Wallet", walletSchema);

export { Wallet, encryptPrivateKey };