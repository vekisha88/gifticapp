import express, { Request, Response } from "express";
import { logger } from "../logger.js";
import { config } from "dotenv";

// Load environment variables
config();

const router = express.Router();

interface UserDetails {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

interface Gift {
  giftId: string;
  amount: string;
  unlockDate: string;
  status: string;
  claimedAt?: string;
}

/**
 * GET /api/user/details
 * Get user details (mock)
 */
router.get("/details", async (req: Request, res: Response) => {
  try {
    // This is a mock endpoint
    const user: UserDetails = {
      id: "1234",
      name: "Test User",
      email: "test@example.com",
      walletAddress: "0x1234567890123456789012345678901234567890"
    };

    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    logger.error(`Error getting user details: ${error.message}`);
    res.status(500).json({ success: false, error: "Error fetching user details" });
  }
});

/**
 * GET /api/user/gifts
 * Get gifts for the current user (mock)
 */
router.get("/gifts", async (req: Request, res: Response) => {
  try {
    // This is a mock endpoint
    const gifts: Gift[] = [
      {
        giftId: "1234567890",
        amount: "0.1",
        unlockDate: new Date(Date.now() + 86400000).toISOString(),
        status: "active"
      },
      {
        giftId: "0987654321",
        amount: "0.2",
        unlockDate: new Date(Date.now() - 86400000).toISOString(),
        status: "claimed",
        claimedAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      gifts
    });
  } catch (error: any) {
    logger.error(`Error getting user gifts: ${error.message}`);
    res.status(500).json({ success: false, error: "Error fetching user gifts" });
  }
});

export default router; 

