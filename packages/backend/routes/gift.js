import express from "express";
import { check, validationResult } from "express-validator";
import { logger } from "../logger.js";
import {
  getAvailableWallet,
  createGift,
  verifyGiftCode,
  preclaimGift,
  claimGiftByCode,
  getClaimedGifts,
  checkGiftTransferable,
  transferGiftFunds
} from "../controllers/giftController.js";
import { batchProcessGifts } from "../services/giftService.js";
import { automateGiftReleases } from "../services/blockchainService.js";
import { isValidEthereumAddress, isValidEmail, isValidFutureDate } from "../utils/validation.js";
import { createValidationError } from "../utils/errorHandler.js";
import { asyncHandler, sendError } from "../utils/apiResponses.js";

/**
 * NOTE: These routes are also defined in a type-safe manner in the shared package.
 * See packages/shared/src/api/routes.ts for the definitive API route definitions.
 * This ensures consistency between backend routes and frontend API calls.
 */
const router = express.Router();

/**
 * Validation middleware that processes validation results
 * @param {Array} validations Array of validation chains
 * @returns {Function} Express middleware function
 */
const validate = (validations) => async (req, res, next) => {
  try {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      logger.warn(`Validation error in ${req.originalUrl}: ${JSON.stringify(errors.array())}`);
      
      // Convert validation errors to a standardized format
      const validationError = createValidationError(
        "Validation failed", 
        "VALIDATION_ERROR",
        { errors: errors.array() }
      );
      
      return sendError(res, "Validation failed", 400, { errors: errors.array() });
    }
    
    next();
  } catch (error) {
    logger.error(`Error in validation middleware: ${error.message}`);
    return sendError(res, "Validation failed due to server error", 500);
  }
};

/**
 * @route GET /api/gift/get-wallet
 * @description Get an available wallet address for gift creation
 * @access Public
 */
router.get(
  "/get-wallet",
  asyncHandler(getAvailableWallet)
);

/**
 * @route POST /api/gift/create
 * @description Create a new gift
 * @access Public
 */
router.post(
  "/create",
  [
    check("buyerEmail").trim().isEmail().withMessage("Valid email is required"),
    check("recipientFirstName").trim().notEmpty().withMessage("Recipient first name is required"),
    check("amount").isFloat({ min: 0.0001 }).withMessage("Amount must be a positive number"),
    check("currency").notEmpty().withMessage("Currency is required"),
    check("unlockDate").custom(value => isValidFutureDate(new Date(value))).withMessage("Unlock date must be in the future"),
    check("walletAddress").custom(value => isValidEthereumAddress(value)).withMessage("Valid wallet address is required")
  ],
  validate([
    check("buyerEmail"),
    check("recipientFirstName"),
    check("amount"),
    check("currency"),
    check("unlockDate"),
    check("walletAddress")
  ]),
  asyncHandler(createGift)
);

/**
 * @route GET /api/gift/verify/:giftCode
 * @description Verify a gift code
 * @access Public
 */
router.get(
  "/verify/:giftCode",
  asyncHandler(verifyGiftCode)
);

/**
 * @route POST /api/gift/verify-code
 * @description Verify a gift code (alternative POST endpoint)
 * @access Public
 */
router.post(
  "/verify-code",
  [
    check("giftCode").trim().notEmpty().withMessage("Gift code is required")
  ],
  validate([check("giftCode")]),
  asyncHandler(async (req, res) => {
    // Reuse the same controller function
    req.params.giftCode = req.body.giftCode;
    return verifyGiftCode(req, res);
  })
);

/**
 * @route POST /api/gift/preclaim
 * @description Pre-claim a gift (verify it's available and unlock date is valid)
 * @access Public
 */
router.post(
  "/preclaim",
  [
    check("giftCode").trim().notEmpty().withMessage("Gift code is required")
  ],
  validate([check("giftCode")]),
  asyncHandler(preclaimGift)
);

/**
 * @route POST /api/gift/claim
 * @description Claim a gift
 * @access Public
 */
router.post(
  "/claim",
  [
    check("giftCode").trim().notEmpty().withMessage("Gift code is required"),
    check("recipientAddress").custom(value => isValidEthereumAddress(value)).withMessage("Valid recipient address is required"),
    check("recipientEmail").trim().optional({ nullable: true }).custom(value => !value || isValidEmail(value)).withMessage("Valid email is required if provided")
  ],
  validate([
    check("giftCode"),
    check("recipientAddress"),
    check("recipientEmail")
  ]),
  asyncHandler(claimGiftByCode)
);

/**
 * @route GET /api/gift/claimed
 * @description Get claimed gifts by recipient address
 * @access Public
 */
router.get(
  "/claimed",
  [
    check("address").custom(value => {
      if (!value) {
        throw new Error("Address parameter is required");
      }
      return isValidEthereumAddress(value);
    }).withMessage("Valid address is required")
  ],
  validate([check("address")]),
  asyncHandler(getClaimedGifts)
);

/**
 * @route GET /api/gift/check-transferable/:giftCode
 * @description Check if a gift is transferable
 * @access Public
 */
router.get(
  "/check-transferable/:giftCode",
  asyncHandler(checkGiftTransferable)
);

/**
 * @route POST /api/gift/transfer-funds
 * @description Transfer funds from a gift to another wallet
 * @access Public
 */
router.post(
  "/transfer-funds",
  [
    check("giftCode").trim().notEmpty().withMessage("Gift code is required"),
    check("destinationAddress").custom(value => isValidEthereumAddress(value)).withMessage("Valid destination address is required")
  ],
  validate([
    check("giftCode"),
    check("destinationAddress")
  ]),
  asyncHandler(transferGiftFunds)
);

/**
 * @route POST /api/gift/force-process
 * @description Admin route to force process pending gifts (for testing only)
 * @access Private
 */
router.post(
  "/force-process",
  asyncHandler(async (req, res) => {
    const result = await batchProcessGifts();
    res.status(200).json({ 
      success: true, 
      message: `Processed ${result.processed} gifts` 
    });
  })
);

/**
 * @route POST /api/gift/force-release
 * @description Admin route to force release gifts that are ready (for testing only)
 * @access Private
 */
router.post(
  "/force-release",
  asyncHandler(async (req, res) => {
    const result = await automateGiftReleases();
    res.status(200).json(result);
  })
);

export default router;