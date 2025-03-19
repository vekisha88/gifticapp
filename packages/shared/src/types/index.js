/**
 * @typedef {"polygon" | "ethereum"} Network
 * @typedef {"pending" | "paid" | "expired" | "failed"} PaymentStatus
 * @typedef {"pending" | "locked" | "unlocked" | "claimed" | "failed"} BlockchainStatus
 */

/**
 * @typedef {Object} IPaymentBase
 * @property {number} amount
 * @property {string} transactionHash
 * @property {Date} timestamp
 * @property {string} currency
 * @property {string} [tokenAddress]
 */

/**
 * @typedef {Object} IGiftBase
 * @property {string} recipientFirstName
 * @property {string} recipientLastName
 * @property {number} amount
 * @property {string} currency
 * @property {Date} unlockDate
 * @property {string} walletAddress
 * @property {number} walletIndex
 * @property {string} giftCode
 * @property {string} buyerEmail
 * @property {boolean} claimed
 * @property {string} [claimedBy]
 * @property {PaymentStatus} paymentStatus
 * @property {Date} expiryDate
 * @property {number} platformFee
 * @property {number} totalAmount
 * @property {number} gasFee
 * @property {number} gasPrice
 * @property {string} estimatedGas
 * @property {number} platformProfit
 * @property {number} totalReceived
 * @property {IPaymentBase[]} payments
 * @property {BlockchainStatus} blockchainStatus
 * @property {string} [contractAddress]
 * @property {Date} [lastPaymentCheck]
 * @property {string} [recipientWallet]
 * @property {number} [usdEquivalent]
 * @property {Network} network
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 */

/**
 * @typedef {Object} CreateGiftRequest
 * @property {string} recipientFirstName
 * @property {string} recipientLastName
 * @property {number} amount
 * @property {string} currency
 * @property {Date} unlockDate
 * @property {string} buyerEmail
 * @property {Network} network
 */

/**
 * @typedef {Object} ClaimGiftRequest
 * @property {string} giftCode
 * @property {string} recipientWallet
 */

/**
 * @typedef {Object} GiftStatusResponse
 * @property {string} giftCode
 * @property {PaymentStatus} status
 * @property {BlockchainStatus} blockchainStatus
 * @property {number} amount
 * @property {string} currency
 * @property {Date} unlockDate
 */

export {}; 