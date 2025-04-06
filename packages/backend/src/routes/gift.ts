import express, { Request, Response } from "express";
import { logger } from "../logger.js";
import Gift from "../models/gift.js";
import { createGift as createBlockchainGift } from "../services/blockchainService.js";
import { config } from "dotenv";

// Load environment variables
config();

const router = express.Router();

interface CreateGiftParams {
  giftId: number;
  recipient: string;
  amount: string;
  unlockTime: number;
}

interface BlockchainResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  message?: string;
}

/**
 * GET /api/gift
 * Get all gifts
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const gifts = await Gift.find();
    res.json({ success: true, gifts });
  } catch (error: any) {
    logger.error(`Error getting gifts: ${error.message}`);
    res.status(500).json({ success: false, error: "Error fetching gifts" });
  }
});

/**
 * GET /api/gift/:id
 * Get a specific gift by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const gift = await Gift.findOne({ giftId: req.params.id });
    
    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    res.json({ success: true, gift });
  } catch (error: any) {
    logger.error(`Error getting gift ${req.params.id}: ${error.message}`);
    res.status(500).json({ success: false, error: "Error fetching gift" });
  }
});

/**
 * POST /api/gift
 * Create a new gift
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { sender, recipient, amount, unlockDate } = req.body;
    
    // Validate required fields
    if (!sender || !recipient || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }
    
    // Generate a unique giftId
    const giftId = Date.now().toString();
    
    // Create gift in database first
    const gift = new Gift({
      giftId,
      sender,
      recipient,
      amount,
      unlockDate: new Date(unlockDate),
      status: "pending"
    });
    
    await gift.save();
    
    // Create gift on blockchain
    const result: BlockchainResult = await createBlockchainGift({
      giftId: Number(giftId),
      recipient,
      amount,
      unlockTime: Math.floor(new Date(unlockDate).getTime() / 1000)
    });
    
    if (result.success) {
      // Update the gift with transaction information
      gift.txHash = result.transactionHash;
      gift.blockNumber = result.blockNumber;
      await gift.save();
      
      res.status(201).json({ success: true, gift, transaction: result });
    } else {
      // Update the gift with error information
      gift.status = "failed";
      await gift.save();
      
      res.status(400).json({ success: false, error: result.message, gift });
    }
  } catch (error: any) {
    logger.error(`Error creating gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Error creating gift" });
  }
});

/**
 * PUT /api/gift/:id
 * Update a gift
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    const gift = await Gift.findOne({ giftId: req.params.id });
    
    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    // Update allowed fields
    if (status) gift.status = status;
    
    await gift.save();
    
    res.json({ success: true, gift });
  } catch (error: any) {
    logger.error(`Error updating gift ${req.params.id}: ${error.message}`);
    res.status(500).json({ success: false, error: "Error updating gift" });
  }
});

/**
 * DELETE /api/gift/:id
 * Cancel a gift
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const gift = await Gift.findOne({ giftId: req.params.id });
    
    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    // Can only cancel pending gifts
    if (gift.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot cancel a gift that is not in pending status" 
      });
    }
    
    gift.status = "cancelled";
    await gift.save();
    
    res.json({ success: true, message: "Gift cancelled successfully" });
  } catch (error: any) {
    logger.error(`Error cancelling gift ${req.params.id}: ${error.message}`);
    res.status(500).json({ success: false, error: "Error cancelling gift" });
  }
});

// DEV ONLY: Create a test gift with predefined values
router.post("/test-gift", async (req: Request, res: Response) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "This endpoint is not available in production"
    });
  }
  
  try {
    const {
      sender = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Default sender (admin wallet)
      recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Default to second test account
      amount = "0.01",
      unlockDate = new Date(Date.now() + (req.query.unlockInMinutes ? parseInt(String(req.query.unlockInMinutes)) * 60000 : 60000)) // Default 1 minute in the future
    } = req.body;
    
    // Generate a unique giftId
    const giftId = Date.now().toString();
    
    // Create gift in database first
    const gift = new Gift({
      giftId,
      sender,
      recipient,
      amount,
      unlockDate: new Date(unlockDate),
      status: "pending"
    });
    
    await gift.save();
    
    // Create gift on blockchain
    const result: BlockchainResult = await createBlockchainGift({
      giftId: Number(giftId),
      recipient,
      amount,
      unlockTime: Math.floor(new Date(unlockDate).getTime() / 1000)
    });
    
    if (result.success) {
      // Update the gift with transaction information
      gift.txHash = result.transactionHash;
      gift.blockNumber = result.blockNumber;
      await gift.save();
      
      res.status(201).json({ success: true, gift, transaction: result });
    } else {
      // Update the gift with error information
      gift.status = "failed";
      await gift.save();
      
      res.status(400).json({ success: false, error: result.message, gift });
    }
  } catch (error: any) {
    logger.error(`Error creating test gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Error creating test gift" });
  }
});

export default router; 

