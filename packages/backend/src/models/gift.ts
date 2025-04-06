import mongoose, { Document, Model, Schema } from "mongoose";

// Define the interface for the Gift document
export interface IGift extends Document {
  giftId: string;
  sender: string;
  recipient: string;
  amount: string;
  unlockDate: Date;
  status: "created" | "pending" | "active" | "claimed" | "cancelled" | "expired" | "failed";
  isClaimed: boolean;
  claimedAt?: Date;
  txHash?: string;
  claimTxHash?: string;
  blockNumber?: number;
  autoTransferAttempts: number;
  lastAutoTransferAttempt?: Date;
  autoTransferTxHash?: string;
  lastAutoTransferError?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  markClaimed(txHash: string): Promise<IGift>;
  isExpired(): boolean;
}

// Define interface for the Gift model with static methods
export interface IGiftModel extends Model<IGift> {
  findEligibleForAutoTransfer(maxAttempts?: number): Promise<IGift[]>;
  findExpired(): Promise<IGift[]>;
}

const giftSchema = new Schema({
  // Unique identifiers
  giftId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Gift details
  sender: {
    type: String,
    required: true,
    description: "Ethereum address of the gift sender"
  },
  recipient: {
    type: String,
    required: true,
    description: "Ethereum address of the gift recipient"
  },
  amount: {
    type: String,
    required: true,
    description: "Amount of the gift in ETH or tokens"
  },
  unlockDate: {
    type: Date,
    required: true,
    description: "Date when the gift becomes available to claim"
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ["created", "pending", "active", "claimed", "cancelled", "expired", "failed"],
    default: "created",
    description: "Current status of the gift"
  },
  isClaimed: {
    type: Boolean,
    default: false,
    description: "Whether the gift has been claimed"
  },
  claimedAt: {
    type: Date,
    description: "Date when the gift was claimed"
  },
  
  // Transaction data
  txHash: {
    type: String,
    description: "Transaction hash of the gift creation"
  },
  claimTxHash: {
    type: String,
    description: "Transaction hash of the claim transaction"
  },
  blockNumber: {
    type: Number,
    description: "Block number when the gift was created"
  },
  
  // Auto-transfer tracking
  autoTransferAttempts: {
    type: Number,
    default: 0,
    description: "Number of times auto-transfer has been attempted"
  },
  lastAutoTransferAttempt: {
    type: Date,
    description: "Date of the last auto-transfer attempt"
  },
  autoTransferTxHash: {
    type: String,
    description: "Transaction hash of the last auto-transfer attempt"
  },
  lastAutoTransferError: {
    type: String,
    description: "Error message from the last failed auto-transfer attempt"
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    description: "Date when the gift was created in the database"
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    description: "Date when the gift was last updated"
  }
}, {
  timestamps: true,
  collection: "gifts"
});

// Define indexes for better query performance
giftSchema.index({ recipient: 1 });
giftSchema.index({ unlockDate: 1 });
giftSchema.index({ status: 1 });
giftSchema.index({ isClaimed: 1 });

// Helper methods
giftSchema.methods.markClaimed = async function(this: IGift, txHash: string): Promise<IGift> {
  this.isClaimed = true;
  this.status = "claimed";
  this.claimedAt = new Date();
  this.claimTxHash = txHash;
  return this.save();
};

giftSchema.methods.isExpired = function(this: IGift): boolean {
  const now = new Date();
  const expiryDate = new Date(this.unlockDate);
  expiryDate.setDate(expiryDate.getDate() + 30); // Expire 30 days after unlock
  return now > expiryDate && !this.isClaimed;
};

// Static methods
giftSchema.statics.findEligibleForAutoTransfer = function(this: IGiftModel, maxAttempts: number = 3): Promise<IGift[]> {
  const now = new Date();
  return this.find({
    unlockDate: { $lte: now },
    isClaimed: false,
    autoTransferAttempts: { $lt: maxAttempts },
    status: { $nin: ["cancelled", "expired", "claimed"] }
  });
};

giftSchema.statics.findExpired = function(this: IGiftModel): Promise<IGift[]> {
  const now = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(now.getDate() - 30); // 30 days ago
  
  return this.find({
    unlockDate: { $lte: expiryThreshold },
    isClaimed: false,
    status: { $ne: "expired" }
  });
};

const Gift = mongoose.model<IGift, IGiftModel>("Gift", giftSchema);

export default Gift; 

