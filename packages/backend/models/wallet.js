import mongoose from "mongoose";
import crypto from "crypto";
import { logger } from "../logger.js";

// Environment variable for encryption key (should be set in production)
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "a-default-encryption-key-that-should-be-changed";
const IV_LENGTH = 16; // For AES, this is always 16

// Function to encrypt private key
function encryptPrivateKey(privateKey) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(privateKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt private key
function decryptPrivateKey(encryptedPrivateKey) {
  try {
    const textParts = encryptedPrivateKey.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv
    );
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    logger.error(`Failed to decrypt private key: ${error.message}`);
    throw new Error('Failed to decrypt private key');
  }
}

// Define the Wallet schema
const walletSchema = new mongoose.Schema(
  {
    index: { 
      type: Number, 
      required: true, 
      min: [0, "Wallet index must be a positive number."] 
    }, // Removed unique—reuse allowed after expiration
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // Ensure addresses are stored in lowercase
      match: [/^0x[a-fA-F0-9]{40}$/, "Please provide a valid Ethereum address"]
    },
    encryptedPrivateKey: { // Store encrypted private key instead of plaintext
      type: String,
      required: true,
    },
    used: { 
      type: Boolean, 
      default: false 
    },
    reserved: { // New field to track temporary reservations
      type: Boolean,
      required: true, // Ensure this field is always set
      default: false // Default to false (not reserved)
    },
    network: {
      type: String,
      default: 'polygon'
    }
  },
  { timestamps: true }
);

// Index for fast lookup (remove duplicate address index)
walletSchema.index({ index: 1 }); // Index for sorting, not unique

// Add method to securely retrieve the private key
walletSchema.methods.getDecryptedPrivateKey = function() {
  return decryptPrivateKey(this.encryptedPrivateKey);
};

// Pre-save hook to encrypt private key if it's changed
walletSchema.pre("save", function(next) {
  // Only encrypt if it's a new wallet or the private key has been modified
  if (this.isNew || this.isModified("encryptedPrivateKey")) {
    try {
      // Check if the private key is already encrypted
      if (!this.encryptedPrivateKey.includes(':')) {
        this.encryptedPrivateKey = encryptPrivateKey(this.encryptedPrivateKey);
      }
    } catch (error) {
      logger.error(`Error encrypting private key: ${error.message}`);
      return next(error);
    }
  }
  next();
});

// Create the Wallet model
export const Wallet = mongoose.model("Wallet", walletSchema);