const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const logger = require("../logger");
const { createGift } = require("../controllers/giftCreationController");
const { verifyGiftCode, preclaimGift, claimGift, getClaimedGifts } = require("../controllers/giftClaimController");
const { getUnusedWallet } = require("../services/walletService");

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

// Routes
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

router.post("/verify-code", validate([check("giftCode").notEmpty().withMessage("Gift code is required")]), verifyGiftCode);

router.post(
  "/preclaim",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
    check("userEmail").isEmail().withMessage("Valid user email is required"),
  ]),
  preclaimGift
);

router.post(
  "/claim",
  validate([
    check("giftCode").notEmpty().withMessage("Gift code is required"),
    check("userEmail").isEmail().withMessage("Valid user email is required"),
  ]),
  claimGift
);

router.get(
  "/claimed",
  validate([
    check("userEmail").isEmail().withMessage("Valid user email is required"),
    check("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    check("limit").optional().isInt({ min: 1 }).withMessage("Limit must be a positive integer"),
  ]),
  getClaimedGifts
);

module.exports = router;