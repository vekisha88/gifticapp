import { logger } from '../logger.js';
import { 
  createNewGift,
  verifyGiftByCode, 
  preclaimGiftByCode,
  claimGift,
  getClaimedGiftsByRecipient,
  checkGiftTransferability,
  transferGiftFunds as transferGiftService
} from '../services/giftService.js';
import { getAvailableWallet as getAvailableWalletService } from '../utils/walletGenerator.js';
import { formatErrorResponse, handleError } from '../utils/errorHandler.js';
import { createApiResponse } from '../utils/apiResponses.js';

/**
 * Get an available wallet for gift creation
 * @route GET /api/gift/get-wallet
 */
export const getAvailableWallet = async (req, res) => {
  try {
    const wallet = await getAvailableWalletService();
    
    if (!wallet) {
      logger.warn("No available wallets for gift creation");
      return res.status(503).json({ 
        success: false, 
        error: "No wallets available at the moment" 
      });
    }
    
    logger.info(`Wallet ${wallet.address} reserved for new gift`);
    res.status(200).json({ 
      success: true, 
      walletAddress: wallet.address 
    });
  } catch (error) {
    const handledError = handleError(error, 'getAvailableWallet');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Create a new gift
 * @route POST /api/gift/create
 */
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
    
    logger.info(`Creating gift for ${recipientFirstName} from ${buyerEmail}`);
    
    const result = await createNewGift({
      buyerEmail,
      recipientFirstName,
      recipientLastName,
      amount,
      currency,
      unlockDate: new Date(unlockDate),
      walletAddress,
      message
    });
    
    res.status(result.success ? 201 : 400).json(createApiResponse(
      result.success,
      result,
      result.success ? "Gift created successfully" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'createGift');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Verify a gift code
 * @route GET /api/gift/verify/:giftCode
 */
export const verifyGiftCode = async (req, res) => {
  try {
    const giftCode = req.params.giftCode || req.body.giftCode;
    
    if (!giftCode) {
      return res.status(400).json(createApiResponse(
        false,
        null,
        "Gift code is required"
      ));
    }
    
    logger.info(`Verifying gift code: ${giftCode}`);
    const result = await verifyGiftByCode(giftCode);
    
    // Important: For gift verification, return a 200 even if not claimable yet
    // This is because the frontend should still be able to see gift details
    // even if the payment is not yet received
    res.status(200).json(createApiResponse(
      result.success,
      result,
      result.success ? "Gift verified successfully" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'verifyGiftCode');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Pre-claim a gift (verify it's available and ready)
 * @route POST /api/gift/preclaim
 */
export const preclaimGift = async (req, res) => {
  try {
    const { giftCode } = req.body;
    
    if (!giftCode) {
      return res.status(400).json(createApiResponse(
        false,
        null,
        "Gift code is required"
      ));
    }
    
    logger.info(`Pre-claiming gift code: ${giftCode}`);
    const result = await preclaimGiftByCode(giftCode);
    
    // For pre-claim, we use different status codes based on the result
    // because this determines if the frontend can proceed with claiming
    if (result.success) {
      res.status(200).json(createApiResponse(
        true,
        result,
        "Gift is ready to claim"
      ));
    } else if (result.paymentStatus === "pending") {
      // If payment is still pending, return a specific status code
      res.status(202).json(createApiResponse(
        false,
        result,
        "Payment is pending confirmation. Please try again later."
      ));
    } else {
      // For other failures (already claimed, not yet unlocked, etc.)
      res.status(400).json(createApiResponse(
        false,
        result,
        result.error
      ));
    }
  } catch (error) {
    const handledError = handleError(error, 'preclaimGift');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Claim a gift by code
 * @route POST /api/gift/claim
 */
export const claimGiftByCode = async (req, res) => {
  try {
    const { giftCode, recipientAddress, recipientEmail } = req.body;
    
    logger.info(`Claiming gift code: ${giftCode} for recipient: ${recipientAddress}`);
    const result = await claimGift(giftCode, recipientAddress, recipientEmail);
    
    res.status(result.success ? 200 : 400).json(createApiResponse(
      result.success,
      result,
      result.success ? "Gift claimed successfully" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'claimGiftByCode');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Get claimed gifts by recipient address
 * @route GET /api/gift/claimed
 */
export const getClaimedGifts = async (req, res) => {
  try {
    const { address } = req.query;
    
    logger.info(`Fetching claimed gifts for address: ${address}`);
    const result = await getClaimedGiftsByRecipient(address);
    
    res.status(result.success ? 200 : 400).json(createApiResponse(
      result.success,
      result,
      result.success ? "Claimed gifts retrieved successfully" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'getClaimedGifts');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Check if a gift is transferable
 * @route GET /api/gift/check-transferable/:giftCode
 */
export const checkGiftTransferable = async (req, res) => {
  try {
    const { giftCode } = req.params;
    
    logger.info(`Checking if gift code ${giftCode} is transferable`);
    const result = await checkGiftTransferability(giftCode);
    
    res.status(result.success ? 200 : 400).json(createApiResponse(
      result.success,
      result,
      result.success ? "Gift transferability checked" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'checkGiftTransferable');
    res.status(500).json(formatErrorResponse(handledError));
  }
};

/**
 * Transfer gift funds to another address
 * @route POST /api/gift/transfer-funds
 */
export const transferGiftFunds = async (req, res) => {
  try {
    const { giftCode, destinationAddress } = req.body;
    
    logger.info(`Transferring funds from gift ${giftCode} to ${destinationAddress}`);
    const result = await transferGiftService(giftCode, destinationAddress);
    
    res.status(result.success ? 200 : 400).json(createApiResponse(
      result.success,
      result,
      result.success ? "Gift funds transferred successfully" : result.error
    ));
  } catch (error) {
    const handledError = handleError(error, 'transferGiftFunds');
    res.status(500).json(formatErrorResponse(handledError));
  }
}; 