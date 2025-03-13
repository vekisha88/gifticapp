const Gift = require("../models/gift");
const logger = require("../logger");

/**
 * ✅ Checks if payment has been received for a gift.
 * This function should be called when a payment confirmation webhook or blockchain listener detects a transaction.
 * @param {string} giftCode - Unique gift code for which payment is being confirmed.
 */
async function confirmPayment(giftCode) {
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
    } catch (error) {
        logger.error(`❌ Error confirming payment: ${error.message}`);
        return { success: false, error: "Failed to confirm payment" };
    }
}

module.exports = { confirmPayment };
