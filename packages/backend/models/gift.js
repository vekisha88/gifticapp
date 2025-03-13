const mongoose = require("mongoose");

// Define the Gift schema
const giftSchema = new mongoose.Schema(
  {
    recipientFirstName: { type: String, required: true, trim: true },
    recipientLastName: { type: String, required: true, trim: true },
    amount: { 
      type: Number, 
      required: true, 
      validate: { validator: (value) => value > 0, message: "Amount must be greater than zero." },
    },
    currency: { type: String, required: true, trim: true },
    unlockDate: { 
      type: Date, 
      required: true, 
      // Clarify that unlockDate should include both date and time (ISO 8601 format, e.g., "2025-02-26T14:30:00Z")
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v); // Ensure it's a valid Date
        },
        message: "Invalid date and time format for unlockDate"
      }
    },
    walletAddress: { type: String, required: true, trim: true },
    walletIndex: { type: Number, required: true, ref: "Wallet" },
    giftCode: { type: String, required: true, trim: true, unique: true },
    buyerEmail: { type: String, required: true, trim: true },
    claimed: { type: Boolean, default: false },
    claimedBy: { type: String, default: null },
    paymentStatus: { type: String, enum: ["pending", "received"], default: "pending" },
    expiryDate: { type: Date, required: true },
    fee: { type: Number, required: true }, // Fee after gas deduction
    totalAmount: { type: Number, required: true }, // Payment amount (Gift Amount + initial 5% Fee)
    gasFee: { type: Number, required: true, default: 0 } // Gas fee deducted from the fee
  },
  { timestamps: true }
);

// Virtual property to check if gift is ready to be claimed
giftSchema.virtual("giftReady").get(function () {
  return this.paymentStatus === "received";
});

// Create the Gift model
const Gift = mongoose.model("Gift", giftSchema);

module.exports = Gift;