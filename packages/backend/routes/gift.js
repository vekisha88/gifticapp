import express from "express";
import { check, validationResult } from "express-validator";
import { logger } from "../logger.js";
import { createGift } from "../controllers/giftCreationController.js";
import { 
  verifyGiftCode,
  preclaimGift,
  claimGiftByCode,
  getClaimedGifts,
  checkGiftTransferable,
  transferGiftFunds
} from "../controllers/giftClaimController.js";
import { getUnusedWallet } from "../services/walletService.js";
import { batchProcessGifts } from "../services/giftService.js";
import { automateGiftReleases } from "../services/blockchainService.js";

const router = express.Router();

// Validation Helper (unchanged)
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Custom datetime validator (unchanged)
const isValidFutureDateTime = (value) => {
  if (!value || typeof value !== "string") throw new Error("Invalid date and time format");
  const dateTime = new Date(value);
  if (isNaN(dateTime.getTime())) throw new Error("Invalid date and time format");
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (dateTime < twoHoursFromNow) throw new Error("Unlock date and time must be at least 2 hours from now.");
  return true;
};

// Legacy route - will be deprecated in future
router.get("/get-wallet", async (req, res) => {
  try {
    const wallet = await getUnusedWallet();
    if (!wallet) return res.status(500).json({ success: false, error: "No available wallets" });
    res.json({ success: true, walletAddress: wallet.address });
  } catch (error) {
    logger.error(`❌ Error fetching wallet: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch wallet" });
  }
});

// Create gift route
router.post(
  "/create",
  validate([
    check("recipientFirstName").notEmpty().withMessage("Recipient first name is required"),
    check("recipientLastName").notEmpty().withMessage("Recipient last name is required"),
    check("amount").isNumeric().custom((value) => value > 0).withMessage("Amount must be greater than zero"),
    check("currency").notEmpty().withMessage("Currency is required"),
    check("buyerEmail").isEmail().withMessage("Buyer email is required"),
    check("walletAddress").notEmpty().matches(/^0x[a-fA-F0-9]{40}$/).withMessage("Valid Ethereum address required"),
    check("unlockDate").notEmpty().custom(isValidFutureDateTime),
  ]),
  (req, res) => {
    logger.info(`Gift creation request body: ${JSON.stringify(req.body)}`);
    createGift(req, res);
  }
);

// Verify gift by code
router.post(
  "/verify-code", 
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required")
  ]), 
  verifyGiftCode
);

// Preclaim gift (show mnemonic without claiming)
router.post(
  "/preclaim",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
    check("userEmail").isEmail().withMessage("Valid user email is required"),
  ]),
  preclaimGift
);

// Claim gift by code
router.post(
  "/claim",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
    check("userEmail").isEmail().withMessage("Valid user email is required"),
  ]),
  claimGiftByCode
);

// Get claimed gifts
router.get(
  "/claimed",
  validate([
    check("userEmail").isEmail().withMessage("Valid user email is required"),
    check("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    check("limit").optional().isInt({ min: 1 }).withMessage("Limit must be a positive integer"),
  ]),
  getClaimedGifts
);

// Check if gift is ready for transfer (internal use)
router.post(
  "/check-transferable",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
  ]),
  checkGiftTransferable
);

// Transfer funds for a claimed gift (internal use for automated transfers)
router.post(
  "/transfer",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
  ]),
  transferGiftFunds
);

// Route to batch process multiple gifts in a single transaction to optimize gas costs
router.post("/batch-process", async (req, res) => {
  try {
    const { giftIds } = req.body;
    
    if (!giftIds || !Array.isArray(giftIds) || giftIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No gift IDs provided for batch processing"
      });
    }
    
    logger.info(`Received request to batch process ${giftIds.length} gifts`);
    
    const result = await batchProcessGifts(giftIds);
    
    return res.json({
      success: true,
      message: `Successfully processed ${result.processedGifts.length} gifts in batch`,
      transactionHash: result.transactionHash,
      processedGifts: result.processedGifts
    });
  } catch (error) {
    logger.error(`Batch processing API error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

// Endpoint to manually trigger fund releases for gifts that are ready
router.post("/release-funds", async (req, res) => {
  try {
    logger.info("Manual fund release requested");
    
    const result = await automateGiftReleases();
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        releasedCount: result.releasedCount,
        transactionHash: result.transactionHash
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error(`Manual fund release error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;