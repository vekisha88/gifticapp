const Gift = require("../models/gift");
const logger = require("../logger");
const { ethers } = require("ethers");

exports.verifyGiftCode = async (req, res) => {
  try {
    const { giftCode } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    if (gift.claimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }

    logger.info(`✅ Gift verified: ${giftCode}`);
    res.status(200).json({ 
      success: true, 
      giftDetails: gift,
      giftReady: gift.paymentStatus === "received"
    });
  } catch (error) {
    logger.error(`❌ Error verifying gift code: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to verify gift code" });
  }
};

exports.preclaimGift = async (req, res) => {
  try {
    const { giftCode, userEmail } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    if (gift.claimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }
    if (gift.paymentStatus !== "received") {
      return res.status(400).json({ success: false, error: "Gift is not ready yet. Payment is still pending." });
    }

    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    logger.info(`✅ Generated preview mnemonic for gift ${giftCode}`);
    res.status(200).json({
      success: true,
      message: "Mnemonic fetched successfully for preview.",
      walletAddress: gift.walletAddress,
      mnemonic,
      giftAmount: gift.amount,
      totalAmount: gift.totalAmount,
      fee: gift.fee,
      gasFee: gift.gasFee,
    });
  } catch (error) {
    logger.error(`❌ Error preclaiming gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch mnemonic" });
  }
};

exports.claimGift = async (req, res) => {
  try {
    const { giftCode, userEmail } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    if (gift.claimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }
    if (gift.paymentStatus !== "received") {
      return res.status(400).json({ success: false, error: "Gift is not ready yet. Payment is still pending." });
    }

    gift.claimed = true;
    gift.claimedBy = userEmail;
    await gift.save();

    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    logger.info(`✅ Gift claimed: ${giftCode} by ${userEmail}`);
    res.status(200).json({
      success: true,
      message: "Gift claimed successfully. Funds will be available on the unlock date and time.",
      walletAddress: gift.walletAddress,
      mnemonic,
      giftAmount: gift.amount,
      totalAmount: gift.totalAmount,
      fee: gift.fee,
      gasFee: gift.gasFee,
    });
  } catch (error) {
    logger.error(`❌ Error claiming gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to claim the gift" });
  }
};

exports.getClaimedGifts = async (req, res) => {
  try {
    const { userEmail, page = 1, limit = 10 } = req.query;

    const claimedGifts = await Gift.find({ claimedBy: userEmail })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    logger.info(`✅ Claimed gifts retrieved for user: ${userEmail}`);
    res.status(200).json({ success: true, gifts: claimedGifts });
  } catch (error) {
    logger.error(`❌ Error fetching claimed gifts: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch claimed gifts" });
  }
};