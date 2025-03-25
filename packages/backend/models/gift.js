import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { isValidEthereumAddress, isValidFutureDate, isValidPositiveNumber } from "../utils/validation.js";

const giftSchema = new mongoose.Schema({
  giftCode: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4().substring(0, 8).toUpperCase()
  },
  buyerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientFirstName: {
    type: String,
    required: true,
    trim: true
  },
  recipientLastName: {
    type: String,
    trim: true
  },
  giftAmount: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => isValidPositiveNumber(value),
      message: "Gift amount must be a positive number"
    }
  },
  feeAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalRequired: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: "ETH",
    uppercase: true
  },
  recipientWallet: {
    type: String,
    required: true,
    validate: {
      validator: (value) => isValidEthereumAddress(value),
      message: "Invalid Ethereum wallet address format"
    }
  },
  tokenAddress: {
    type: String,
    validate: {
      validator: (value) => !value || isValidEthereumAddress(value),
      message: "Invalid token address format"
    },
    default: "0x0000000000000000000000000000000000000000"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "received", "failed"],
    default: "pending"
  },
  paymentTxHash: {
    type: String
  },
  unlockTimestamp: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => isValidFutureDate(value),
      message: "Unlock timestamp must be in the future"
    }
  },
  contractLocked: {
    type: Boolean,
    default: false
  },
  isClaimed: {
    type: Boolean,
    default: false
  },
  claimedAt: {
    type: Date
  },
  recipientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  transferredTo: {
    type: String,
    validate: {
      validator: (value) => !value || isValidEthereumAddress(value),
      message: "Invalid Ethereum wallet address format"
    }
  },
  transferredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ["active", "expired", "revoked"],
    default: "active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add timestamp updating
giftSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  
  // Ensure wallet addresses are stored in lowercase
  if (this.recipientWallet) {
    this.recipientWallet = this.recipientWallet.toLowerCase();
  }
  
  if (this.tokenAddress) {
    this.tokenAddress = this.tokenAddress.toLowerCase();
  }
  
  if (this.transferredTo) {
    this.transferredTo = this.transferredTo.toLowerCase();
  }
  
  next();
});

// Virtual property to check if gift is ready to claim
giftSchema.virtual("giftReady").get(function() {
  const now = new Date();
  return this.paymentStatus === "received" && this.unlockTimestamp <= now && !this.isClaimed;
});

const Gift = mongoose.model("Gift", giftSchema);

export { Gift };