import mongoose from "mongoose";
import { logger } from "../logger.js";

// Helper function to generate a code in format ABCD-1234-EFGH-5678
function generateGiftCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 4 blocks of 4 characters
  for (let block = 0; block < 4; block++) {
    if (block > 0) code += '-';
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
  }
  
  return code;
}

// Define the Gift schema - aligned with smart contract
const giftSchema = new mongoose.Schema(
  {
    recipientFirstName: { type: String, required: true, trim: true },
    recipientLastName: { type: String, required: true, trim: true },
    recipientWallet: { 
      type: String, 
      required: true, 
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Please provide a valid Ethereum address"]
    },
    giftAmount: { 
      type: Number, 
      required: true, 
      validate: { validator: (value) => value > 0, message: "Amount must be greater than zero." },
    },
    feeAmount: { type: Number, required: true },
    totalRequired: { type: Number, required: true }, // giftAmount + feeAmount
    unlockTimestamp: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v); // Ensure it's a valid Date
        },
        message: "Invalid date and time format for unlockTimestamp"
      }
    },
    isClaimed: { type: Boolean, default: false },
    tokenAddress: { 
      type: String, 
      default: "0x0000000000000000000000000000000000000000", 
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Please provide a valid token address"]
    },
    // Additional fields for tracking
    buyerEmail: { type: String, required: true, trim: true },
    claimedBy: { type: String, default: null },
    paymentStatus: { type: String, enum: ["pending", "received", "completed", "failed"], default: "pending" },
    currency: { type: String, required: true, trim: true },
    // Legacy field for backward compatibility
    giftCode: {
      type: String,
      required: true,
      unique: true,
      default: generateGiftCode
    },
    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate a gift code if not provided
giftSchema.pre("save", function (next) {
  if (this.isNew && !this.giftCode) {
    this.giftCode = generateGiftCode();
    logger.info(`Generated new gift code: ${this.giftCode}`);
  }
  next();
});

// Virtual property to check if gift is ready to be claimed
giftSchema.virtual("giftReady").get(function () {
  return this.paymentStatus === "received";
});

// Create the Gift model
export const Gift = mongoose.model("Gift", giftSchema);