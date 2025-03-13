const mongoose = require("mongoose");

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
      trim: true 
    },
    used: { 
      type: Boolean, 
      default: false 
    },
    reserved: { // New field to track temporary reservations
      type: Boolean,
      required: true, // Ensure this field is always set
      default: false // Default to false (not reserved)
    }
  },
  { timestamps: true }
);

// Index for fast lookup (remove duplicate address index)
walletSchema.index({ index: 1 }); // Index for sorting, not unique

// Create the Wallet model
const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;