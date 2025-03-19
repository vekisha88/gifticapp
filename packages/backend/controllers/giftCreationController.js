import { Gift } from "../models/gift.js";
import { logger } from "../logger.js";
import { ethers } from "ethers";
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import { getUnusedWallet } from "../services/walletService.js";

// Import contract data
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;

// Create a new gift
export const createGift = async (req, res) => {
  try {
    const {
      buyerEmail,
      recipientFirstName,
      recipientLastName,
      amount,
      currency,
      unlockDate,
      walletAddress,
      message
    } = req.body;

    // Validate required fields
    if (!buyerEmail || !recipientFirstName || !amount || !currency || !unlockDate || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Calculate fee (5% of amount)
    const feeAmount = amount * 0.05;
    const totalAmount = amount + feeAmount;

    logger.info(`Gift creation request body: ${JSON.stringify(req.body)}`);

    // Create the gift in database
    const gift = new Gift({
      buyerEmail,
      recipientFirstName,
      recipientLastName,
      giftAmount: amount,
      feeAmount: feeAmount,
      totalRequired: totalAmount,
      currency,
      recipientWallet: walletAddress.toLowerCase(),
      unlockTimestamp: new Date(unlockDate),
      message: message || ""
    });

    await gift.save();

    logger.info(`✅ Gift created: Code=${gift.giftCode} for ${recipientFirstName} ${recipientLastName} using wallet ${walletAddress}`);

    res.status(201).json({
      success: true,
      giftCode: gift.giftCode,
      paymentAddress: walletAddress,
      contractAddress: CONTRACT_ADDRESS,
      giftAmount: amount,
      totalAmount: totalAmount,
      fee: feeAmount,
      message: `Gift created successfully for ${recipientFirstName} ${recipientLastName}. Please send ${totalAmount} ${currency} to ${walletAddress} to lock the funds.`
    });
  } catch (error) {
    logger.error(`❌ Error creating gift: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to create gift"
    });
  }
};

// Reserve a wallet for a new gift
export const getAvailableWallet = async (req, res) => {
  try {
    const wallet = await getUnusedWallet();
    
    if (!wallet) {
      return res.status(503).json({ 
        success: false, 
        error: "No wallets available at the moment"
      });
    }
    
    res.status(200).json({ 
      success: true, 
      walletAddress: wallet.address
    });
  } catch (error) {
    logger.error(`❌ Error getting available wallet: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get wallet"
    });
  }
};

// Get gift by code
export const getGiftByCode = async (req, res) => {
  try {
    const { giftCode } = req.params;
    
    const gift = await Gift.findOne({ giftCode });
    
    if (!gift) {
      return res.status(404).json({ 
        success: false, 
        error: "Gift not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      gift: {
        giftCode: gift.giftCode,
        recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
        amount: gift.giftAmount,
        feeAmount: gift.feeAmount,
        currency: gift.currency,
        unlockDate: gift.unlockTimestamp,
        paymentStatus: gift.paymentStatus,
        isClaimed: gift.isClaimed
      }
    });
  } catch (error) {
    logger.error(`❌ Error getting gift: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve gift information"
    });
  }
};

// Get gifts created by buyer email
export const getGiftsByBuyer = async (req, res) => {
  try {
    const { buyerEmail, page = 1, limit = 10 } = req.query;
    
    const gifts = await Gift.find({ buyerEmail })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const formattedGifts = gifts.map(gift => ({
      giftCode: gift.giftCode,
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
      amount: gift.giftAmount,
      currency: gift.currency,
      unlockDate: gift.unlockTimestamp,
      paymentStatus: gift.paymentStatus,
      isClaimed: gift.isClaimed,
      createdAt: gift.createdAt
    }));
    
    res.status(200).json({
      success: true,
      gifts: formattedGifts
    });
  } catch (error) {
    logger.error(`❌ Error getting gifts by buyer: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve gifts"
    });
  }
};