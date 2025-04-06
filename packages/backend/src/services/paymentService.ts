import Gift from "../models/gift.js";
import { logger } from "../logger.js";

interface PaymentResult {
  success: boolean;
  message?: string;
  error?: string;
  giftCode?: string;
}

/**
 * ✅ Checks if payment has been received for a gift.
 * This function should be called when a payment confirmation webhook or blockchain listener detects a transaction.
 * @param {string} giftCode - Unique gift code for which payment is being confirmed.
 */
export async function confirmPayment(giftCode: string): Promise<PaymentResult> {
    try {
        const gift = await Gift.findOne({ giftCode });

        if (!gift) {
            logger.warn(`❌ Gift not found: ${giftCode}`);
            return { success: false, error: "Gift not found" };
        }

        if (gift.paymentStatus === "received") {
            logger.info(`✅ Payment already confirmed for gift: ${giftCode}`);
            return { success: true, message: "Payment was already confirmed" };
        }

        // ✅ Update the payment status in the database
        gift.paymentStatus = "received";
        await gift.save();

        logger.info(`✅ Payment confirmed for gift: ${giftCode}`);
        return { success: true, message: "Payment successfully confirmed" };
    } catch (error: any) {
        logger.error(`❌ Error confirming payment: ${error.message}`);
        return { success: false, error: "Failed to confirm payment" };
    }
}

/**
 * ✅ Confirms payment for a gift using the wallet address instead of gift code.
 * This function is used when the gift code is not available but the target wallet is known.
 * @param {string} walletAddress - The wallet address associated with the gift.
 */
export async function confirmPaymentByWallet(walletAddress: string): Promise<PaymentResult> {
    try {
        const gift = await Gift.findOne({ paymentAddress: walletAddress });

        if (!gift) {
            logger.warn(`❌ Gift not found for wallet: ${walletAddress}`);
            return { success: false, error: "Gift not found for this wallet address" };
        }

        if (gift.paymentStatus === "received") {
            logger.info(`✅ Payment already confirmed for wallet: ${walletAddress}`);
            return { success: true, message: "Payment was already confirmed" };
        }

        // ✅ Update the payment status in the database
        gift.paymentStatus = "received";
        await gift.save();

        logger.info(`✅ Payment confirmed for wallet: ${walletAddress}, gift code: ${gift.giftCode}`);
        return { success: true, message: "Payment successfully confirmed", giftCode: gift.giftCode };
    } catch (error: any) {
        logger.error(`❌ Error confirming payment by wallet: ${error.message}`);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export default { confirmPayment, confirmPaymentByWallet }; 
