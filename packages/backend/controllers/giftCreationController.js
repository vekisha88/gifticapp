const Gift = require("../models/gift");
const logger = require("../logger");
const { assignWalletToGift } = require("../services/giftService");

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Still included for reference

exports.createGift = async (req, res) => {
  try {
    const { recipientFirstName, recipientLastName, amount, currency, unlockDate, buyerEmail, walletAddress } = req.body;

    // Validate unlockDate as a full datetime
    if (!unlockDate || typeof unlockDate !== "string") {
      return res.status(400).json({ success: false, error: "Invalid or missing unlock date and time." });
    }
    const unlockDateTime = new Date(unlockDate);
    if (isNaN(unlockDateTime.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date and time format for unlockDate" });
    }
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (unlockDateTime < twoHoursFromNow) {
      return res.status(400).json({ success: false, error: "Unlock date and time must be at least 2 hours from now." });
    }

    // Assign wallet and prepare gift data
    const giftData = await assignWalletToGift({
      recipientFirstName,
      recipientLastName,
      amount: Number(amount),
      currency,
      unlockDate: unlockDateTime.toISOString(),
      buyerEmail,
      walletAddress,
      expiryDate: new Date(Date.now() + 60 * 60 * 1000),
    });

    const { giftCode, walletAddress: assignedWalletAddress, totalAmount, fee, gasFee } = giftData;

    // Log and respond without locking funds
    logger.info(`✅ Gift created: ${giftCode} for ${recipientFirstName} ${recipientLastName} using wallet ${assignedWalletAddress}`);
    res.status(201).json({
      success: true,
      giftCode,
      paymentAddress: assignedWalletAddress, // User sends funds here manually
      contractAddress, // For reference
      giftAmount: giftData.amount,
      totalAmount,
      fee,
      gasFee,
      message: `Gift created successfully for ${recipientFirstName} ${recipientLastName}. Please send ${totalAmount} MATIC to ${assignedWalletAddress} to lock the funds.`,
    });
  } catch (error) {
    logger.error(`❌ Error creating gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to create gift", details: error.message });
  }
};