import { ethers } from "ethers"; // Using ethers v5.7.2
import { Gift } from "../models/gift.js";
import { Wallet } from "../models/wallet.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger.js";
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };
import { provider, contract, signer } from "./blockchainService.js";
import { isValidEthereumAddress } from "../utils/validation.js";

// Reference contract address for legacy purposes
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;

/**
 * Saves a gift to the database
 * @param {Object} giftData Gift data object
 * @returns {Promise<Object>} Created gift object
 */
export async function saveGiftToDatabase(giftData) {
    try {
        const gift = new Gift(giftData);
        await gift.save();
        logger.info(`✅ Gift saved to database for recipient wallet: ${giftData.recipientWallet}`);
        return gift;
    } catch (error) {
        logger.error(`❌ Error saving gift to database: ${error.message}`);
        throw error;
    }
}

/**
 * Create a new gift
 * @param {Object} giftData Gift data object
 * @returns {Promise<Object>} Gift creation result
 */
export async function createNewGift(giftData) {
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
        } = giftData;
        
        // Validate required fields
        if (!buyerEmail || !recipientFirstName || !amount || !currency || !unlockDate || !walletAddress) {
            return {
                success: false,
                error: "Missing required fields"
            };
        }
        
        // Calculate fee (5% of amount)
        const feeAmount = parseFloat(amount) * 0.05;
        const totalAmount = parseFloat(amount) + feeAmount;
        
        // Create the gift in database
        const gift = new Gift({
            buyerEmail,
            recipientFirstName,
            recipientLastName: recipientLastName || "",
            giftAmount: parseFloat(amount),
            feeAmount: feeAmount,
            totalRequired: totalAmount,
            currency,
            recipientWallet: walletAddress.toLowerCase(),
            unlockTimestamp: new Date(unlockDate),
            message: message || ""
        });
        
        await gift.save();
        
        logger.info(`✅ Gift created: Code=${gift.giftCode} for ${recipientFirstName} ${recipientLastName || ""} using wallet ${walletAddress}`);
        
        return {
            success: true,
            giftCode: gift.giftCode,
            paymentAddress: walletAddress,
            contractAddress: contract.target,
            giftAmount: amount,
            totalAmount: totalAmount,
            fee: feeAmount,
            message: `Gift created successfully for ${recipientFirstName} ${recipientLastName || ""}. Please send ${totalAmount} ${currency} to ${walletAddress} to lock the funds.`
        };
    } catch (error) {
        logger.error(`❌ Error creating gift: ${error.message}`);
        return {
            success: false,
            error: "Failed to create gift"
        };
    }
}

/**
 * Verify a gift code
 * @param {string} giftCode Gift code to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyGiftByCode(giftCode) {
    try {
        if (!giftCode) {
            return { success: false, error: "Gift code is required" };
        }
        
        const gift = await Gift.findOne({ giftCode });
        
        if (!gift) {
            return { success: false, error: "Gift not found" };
        }
        
        // Check if gift is already claimed
        if (gift.isClaimed) {
            return { 
                success: false, 
                error: "Gift already claimed",
                gift: {
                    giftCode: gift.giftCode,
                    recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                    amount: gift.giftAmount,
                    currency: gift.currency,
                    unlockDate: gift.unlockTimestamp,
                    isClaimed: true,
                    claimedAt: gift.claimedAt
                }
            };
        }
        
        // Check if payment is received
        if (gift.paymentStatus !== "received") {
            return { 
                success: false, 
                error: "Gift payment not received yet",
                paymentStatus: gift.paymentStatus,
                gift: {
                    giftCode: gift.giftCode,
                    recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                    amount: gift.giftAmount,
                    currency: gift.currency,
                    unlockDate: gift.unlockTimestamp
                }
            };
        }
        
        // For wallet access, we don't need to check unlock date
        // Just provide info about when funds will be available
        const now = new Date();
        let unlockMessage = "";
        
        if (gift.unlockTimestamp > now) {
            const timeRemaining = Math.ceil((gift.unlockTimestamp - now) / (1000 * 60 * 60));
            unlockMessage = `Funds will be available for transfer in approximately ${timeRemaining} hours.`;
        } else {
            unlockMessage = "Funds are available for transfer now.";
        }
        
        // Gift is valid and ready to claim (regardless of unlock date)
        return {
            success: true,
            message: "Gift is valid and ready to claim",
            fundsUnlocked: gift.unlockTimestamp <= now,
            unlockMessage: unlockMessage,
            giftDetails: {
                giftCode: gift.giftCode,
                recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                recipientFirstName: gift.recipientFirstName,
                recipientLastName: gift.recipientLastName || "",
                amount: gift.giftAmount,
                currency: gift.currency,
                unlockDate: gift.unlockTimestamp,
                paymentStatus: gift.paymentStatus,
                contractLocked: gift.contractLocked,
                walletAddress: gift.recipientWallet,
                message: gift.message
            }
        };
    } catch (error) {
        logger.error(`❌ Error verifying gift code: ${error.message}`);
        return { success: false, error: "Failed to verify gift code" };
    }
}

/**
 * Pre-claim a gift (check availability)
 * @param {string} giftCode Gift code to pre-claim
 * @returns {Promise<Object>} Pre-claim result
 */
export async function preclaimGiftByCode(giftCode) {
    try {
        if (!giftCode) {
            return { success: false, error: "Gift code is required" };
        }
        
        const gift = await Gift.findOne({ giftCode });
        
        if (!gift) {
            return { success: false, error: "Gift not found" };
        }
        
        // STRICT CHECK: Payment must be confirmed as received
        if (gift.paymentStatus !== "received") {
            logger.warn(`Attempt to preclaim gift ${giftCode} with payment status ${gift.paymentStatus}`);
            return { 
                success: false, 
                error: "Payment not yet confirmed. Please wait for transaction confirmation.",
                paymentStatus: gift.paymentStatus
            };
        }
        
        // Check if gift is already claimed
        if (gift.isClaimed) {
            return { success: false, error: "Gift already claimed" };
        }
        
        // No need to check unlock time for wallet access
        // Just include info about when funds will be available
        const now = new Date();
        let unlockMessage = "";
        if (gift.unlockTimestamp > now) {
            const timeRemaining = Math.ceil((gift.unlockTimestamp - now) / (1000 * 60 * 60));
            unlockMessage = `Funds will be available for transfer in approximately ${timeRemaining} hours.`;
        } else {
            unlockMessage = "Funds are available for transfer now.";
        }

        // For demo purpose, generate a sample mnemonic
        // In production, this would be real wallet recovery phrase
        const sampleMnemonic = "sample test abandon ability success signal quote resist trial believe dinosaur main";
        
        // Gift is valid and ready to claim (for wallet access)
        return {
            success: true,
            message: "Gift is valid and ready to claim",
            mnemonic: sampleMnemonic, // For demonstration only
            giftAmount: gift.giftAmount,
            totalAmount: gift.totalRequired,
            fee: gift.feeAmount,
            gasFee: 0.001, // Example gas fee value 
            fundsUnlocked: gift.unlockTimestamp <= now,
            unlockMessage: unlockMessage,
            gift: {
                giftCode: gift.giftCode,
                recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                amount: gift.giftAmount,
                currency: gift.currency,
                unlockDate: gift.unlockTimestamp,
                walletAddress: gift.recipientWallet
            }
        };
    } catch (error) {
        logger.error(`❌ Error preclaiming gift: ${error.message}`);
        return { success: false, error: "Failed to preclaim gift" };
    }
}

/**
 * Claim a gift by code
 * @param {string} giftCode Gift code to claim
 * @param {string} recipientAddress Recipient wallet address
 * @param {string} recipientEmail Recipient email (optional)
 * @returns {Promise<Object>} Claim result
 */
export async function claimGift(giftCode, recipientAddress, recipientEmail) {
    try {
        if (!giftCode || !recipientAddress) {
            return { 
                success: false, 
                error: "Gift code and recipient address are required" 
            };
        }
        
        if (!isValidEthereumAddress(recipientAddress)) {
            return { 
                success: false, 
                error: "Invalid recipient wallet address" 
            };
        }
        
        const gift = await Gift.findOne({ giftCode });
        
        if (!gift) {
            return { success: false, error: "Gift not found" };
        }
        
        // STRICT CHECK: Payment must be confirmed as received
        if (gift.paymentStatus !== "received") {
            logger.warn(`Attempt to claim gift ${giftCode} with payment status ${gift.paymentStatus}`);
            return { 
                success: false, 
                error: "Payment not yet confirmed. Please wait for transaction confirmation.",
                paymentStatus: gift.paymentStatus
            };
        }
        
        // Check if gift is already claimed
        if (gift.isClaimed) {
            return { success: false, error: "Gift already claimed" };
        }
        
        // Don't check unlock date here - we allow claiming the wallet regardless of unlock date
        // But include information about when funds will be available
        const now = new Date();
        let unlockMessage = "";
        const fundsUnlocked = gift.unlockTimestamp <= now;
        
        if (!fundsUnlocked) {
            const timeRemaining = Math.ceil((gift.unlockTimestamp - now) / (1000 * 60 * 60));
            unlockMessage = `Note: Funds will be available for transfer in approximately ${timeRemaining} hours.`;
        } else {
            unlockMessage = "Funds are available for transfer now.";
        }
        
        // Now mark the gift as claimed in the database
        gift.isClaimed = true;
        gift.claimedAt = new Date();
        gift.recipientEmail = recipientEmail || "";
        await gift.save();
        logger.info(`Gift ${giftCode} marked as claimed by ${recipientAddress}`);
        
        // For demo purpose, use the same sample mnemonic
        const sampleMnemonic = "sample test abandon ability success signal quote resist trial believe dinosaur main";
        
        try {
            // Only release funds if unlock date has passed
            if (fundsUnlocked && gift.contractLocked) {
                logger.info(`Releasing funds for gift ${giftCode} to recipient ${recipientAddress}`);
                
                const contractWithSigner = contract.connect(signer);
                const tx = await contractWithSigner.releaseFunds(gift.recipientWallet, recipientAddress);
                logger.info(`Transaction sent: ${tx.hash}`);
                
                const receipt = await tx.wait();
                logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);
                
                return {
                    success: true,
                    message: "Gift claimed successfully with funds released from contract",
                    transactionHash: tx.hash,
                    mnemonic: sampleMnemonic,
                    giftAmount: gift.giftAmount,
                    totalAmount: gift.totalRequired,
                    fee: gift.feeAmount,
                    fundsUnlocked,
                    unlockMessage,
                    gift: {
                        giftCode: gift.giftCode,
                        recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                        amount: gift.giftAmount,
                        currency: gift.currency,
                        claimedAt: gift.claimedAt
                    }
                };
            }
            
            // Gift wasn't locked in contract yet or unlock date hasn't passed
            return {
                success: true,
                message: fundsUnlocked ? "Gift claimed successfully (funds not yet in contract)" : "Gift claimed successfully (funds not unlocked yet)",
                mnemonic: sampleMnemonic,
                giftAmount: gift.giftAmount,
                totalAmount: gift.totalRequired,
                fee: gift.feeAmount,
                fundsUnlocked,
                unlockMessage,
                gift: {
                    giftCode: gift.giftCode,
                    recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                    amount: gift.giftAmount,
                    currency: gift.currency,
                    claimedAt: gift.claimedAt
                }
            };
        } catch (contractError) {
            logger.error(`Contract error releasing funds: ${contractError.message}`);
            
            // Still return success with mnemonic even if contract interaction failed
            return { 
                success: true,
                message: "Gift claimed but contract interaction failed. Funds will be available later.",
                mnemonic: sampleMnemonic,
                giftAmount: gift.giftAmount,
                totalAmount: gift.totalRequired,
                fee: gift.feeAmount,
                fundsUnlocked,
                unlockMessage,
                contractError: "Failed to release funds from contract. Please try again later.",
                gift: {
                    giftCode: gift.giftCode,
                    recipientName: `${gift.recipientFirstName} ${gift.recipientLastName || ""}`,
                    amount: gift.giftAmount,
                    currency: gift.currency,
                    claimedAt: gift.claimedAt
                }
            };
        }
    } catch (error) {
        logger.error(`❌ Error claiming gift: ${error.message}`);
        return { success: false, error: "Failed to claim gift" };
    }
}

/**
 * Get claimed gifts by recipient address
 * @param {string} recipientAddress Ethereum address of the recipient
 * @returns {Promise<Object>} List of claimed gifts
 */
export async function getClaimedGiftsByRecipient(recipientAddress) {
    try {
        if (!recipientAddress || !isValidEthereumAddress(recipientAddress)) {
            return { 
                success: false, 
                error: "Invalid recipient address",
                gifts: []
            };
        }
        
        logger.info(`Finding claimed gifts in database for ${recipientAddress}`);
        
        // Find all gifts claimed by this address
        const gifts = await Gift.find({ 
            recipientWallet: { $regex: new RegExp(`^${recipientAddress}$`, 'i') },
            isClaimed: true
        });
        
        logger.info(`Found ${gifts.length} claimed gifts in database for ${recipientAddress}`);
        
        // Format gifts for frontend
        const formattedGifts = gifts.map(gift => ({
            giftCode: gift.giftCode,
            currency: gift.currency,
            amount: gift.giftAmount,
            recipientFirstName: gift.recipientFirstName,
            recipientLastName: gift.recipientLastName || "",
            unlockDate: gift.unlockTimestamp,
            walletAddress: gift.recipientWallet,
            paymentStatus: gift.paymentStatus,
            claimed: gift.isClaimed,
            claimedAt: gift.claimedAt
        }));
        
        // Try to get gifts from contract as well
        try {
            logger.info(`Attempting to get gift details from contract for ${recipientAddress}`);
            
            // Call the contract's getGiftsByRecipient function
            const contractGift = await contract.getGiftsByRecipient(recipientAddress);
            
            // Format response from contract (fields are returned as a tuple)
            const contractGiftInfo = {
                giftAmount: ethers.formatEther(contractGift[0]),
                feeAmount: ethers.formatEther(contractGift[1]),
                unlockTimestamp: new Date(Number(contractGift[2]) * 1000), // Convert seconds to milliseconds
                isClaimed: contractGift[3],
                tokenAddress: contractGift[4]
            };
            
            logger.info(`Successfully retrieved gift details from contract for ${recipientAddress}`);
            logger.info(`Contract gift details: ${JSON.stringify(contractGiftInfo)}`);
            
            // Return combined database and contract data
            return {
                success: true,
                gifts: formattedGifts,
                contractData: contractGiftInfo
            };
        } catch (contractError) {
            logger.warn(`Could not get claimed gifts from contract: ${contractError.message}`);
            
            // Return database gifts only
            return {
                success: true,
                gifts: formattedGifts
            };
        }
    } catch (error) {
        logger.error(`❌ Error getting claimed gifts: ${error.message}`);
        return { 
            success: false, 
            error: "Failed to retrieve claimed gifts",
            gifts: [] 
        };
    }
}

/**
 * Check if a gift is transferable
 * @param {string} giftCode Gift code to check
 * @returns {Promise<Object>} Transferability status
 */
export async function checkGiftTransferability(giftCode) {
    try {
        if (!giftCode) {
            return { success: false, error: "Gift code is required" };
        }
        
        const gift = await Gift.findOne({ giftCode });
        
        if (!gift) {
            return { success: false, error: "Gift not found" };
        }
        
        // Check if payment is received
        if (gift.paymentStatus !== "received") {
            return { 
                success: false, 
                error: "Gift payment not received yet",
                paymentStatus: gift.paymentStatus
            };
        }
        
        // Check if gift is claimed
        if (gift.isClaimed) {
            return { success: false, error: "Gift already claimed and cannot be transferred" };
        }
        
        // Check contract status - this is a belt-and-suspenders approach
        const contractGift = await contract.getGiftByWallet(gift.recipientWallet);
        if (!contractGift || contractGift.amount.toString() === "0") {
            return { success: false, error: "Gift not found on blockchain" };
        }
        
        if (contractGift.claimed) {
            return { success: false, error: "Gift already claimed on blockchain" };
        }
        
        // Gift is transferable
        return {
            success: true,
            message: "Gift is transferable",
            gift: {
                giftCode: gift.giftCode,
                amount: gift.giftAmount,
                currency: gift.currency,
                unlockDate: gift.unlockTimestamp
            }
        };
    } catch (error) {
        logger.error(`❌ Error checking gift transferability: ${error.message}`);
        return { success: false, error: "Failed to check gift transferability" };
    }
}

/**
 * Transfer gift funds to another address
 * @param {string} giftCode Gift code to transfer
 * @param {string} destinationAddress Destination wallet address
 * @returns {Promise<Object>} Transfer result
 */
export async function transferGiftFunds(giftCode, destinationAddress) {
    try {
        if (!giftCode || !destinationAddress) {
            return { 
                success: false, 
                error: "Gift code and destination address are required" 
            };
        }
        
        if (!isValidEthereumAddress(destinationAddress)) {
            return { 
                success: false, 
                error: "Invalid destination wallet address" 
            };
        }
        
        // Check if transferable
        const transferabilityCheck = await checkGiftTransferability(giftCode);
        if (!transferabilityCheck.success) {
            return transferabilityCheck;
        }
        
        const gift = await Gift.findOne({ giftCode });
        
        try {
            // Transfer funds using contract
            logger.info(`Transferring funds for gift ${giftCode} to ${destinationAddress}`);
            
            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.transferGift(gift.recipientWallet, destinationAddress);
            logger.info(`Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);
            
            // Update gift record with transfer info
            gift.transferredTo = destinationAddress;
            gift.transferredAt = new Date();
            await gift.save();
            
            return {
                success: true,
                message: "Gift transferred successfully",
                transactionHash: tx.hash
            };
        } catch (contractError) {
            logger.error(`Contract error transferring funds: ${contractError.message}`);
            return { 
                success: false, 
                error: "Failed to transfer funds. Please try again later." 
            };
        }
    } catch (error) {
        logger.error(`❌ Error transferring gift: ${error.message}`);
        return { success: false, error: "Failed to transfer gift" };
    }
}

/**
 * Clean up expired gifts
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupExpiredGifts() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Find unclaimed gifts older than 30 days
        const expiredGifts = await Gift.find({
            isClaimed: false,
            unlockTimestamp: { $lt: thirtyDaysAgo },
            paymentStatus: { $ne: "pending" } // Only clean up gifts that received payment
        });
        
        logger.info(`Found ${expiredGifts.length} expired gifts to clean up`);
        
        if (expiredGifts.length === 0) {
            return { success: true, removed: 0 };
        }
        
        let removed = 0;
        for (const gift of expiredGifts) {
            try {
                // Transfer funds to charity wallet
                const contractWithSigner = contract.connect(signer);
                await contractWithSigner.sendToCharity(gift.recipientWallet, "Expired gift");
                
                // Mark as expired
                gift.status = "expired";
                await gift.save();
                removed++;
                
                logger.info(`✅ Expired gift ${gift.giftCode} cleaned up successfully`);
            } catch (error) {
                logger.error(`❌ Error cleaning up expired gift ${gift.giftCode}: ${error.message}`);
            }
        }
        
        return { success: true, removed };
    } catch (error) {
        logger.error(`❌ Error cleaning up expired gifts: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Batch process multiple gifts
 * @param {Array} giftIds Optional array of gift IDs to process
 * @returns {Promise<Object>} Processing result
 */
export async function batchProcessGifts(giftIds = []) {
    try {
        let giftsToProcess;
        
        if (giftIds && giftIds.length > 0) {
            giftsToProcess = await Gift.find({
                _id: { $in: giftIds },
                paymentStatus: "received",
                isClaimed: false
            });
        } else {
            // Process all gifts that are ready
            giftsToProcess = await Gift.find({
                paymentStatus: "received",
                isClaimed: false
            });
        }
        
        logger.info(`Found ${giftsToProcess.length} gifts to process in batch`);
        
        if (giftsToProcess.length === 0) {
            return { success: true, processed: 0 };
        }
        
        // Process each gift
        let processed = 0;
        for (const gift of giftsToProcess) {
            try {
                // Check if already on blockchain
                const onChain = await contract.isGiftLocked(gift.recipientWallet);
                
                if (!onChain) {
                    // Lock the funds if not already on chain
                    logger.info(`Processing gift ${gift.giftCode} for recipient ${gift.recipientWallet}`);
                    processed++;
                } else {
                    logger.info(`Gift ${gift.giftCode} already processed on blockchain`);
                }
            } catch (error) {
                logger.error(`❌ Error processing gift ${gift.giftCode}: ${error.message}`);
            }
        }
        
        return { success: true, processed };
    } catch (error) {
        logger.error(`❌ Error batch processing gifts: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Legacy function - will be deprecated in future versions
export async function saveWalletToDatabase(walletData) {
    try {
        const wallet = new Wallet(walletData);
        await wallet.save();
        logger.info(`✅ Wallet saved: ${walletData.address} (Index: ${walletData.index})`);
        return wallet;
    } catch (error) {
        logger.error(`❌ Error saving wallet to database: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function getLastWalletIndex() {
    try {
        const lastWallet = await Wallet.findOne().sort({ index: -1 });
        return lastWallet ? lastWallet.index : 0;
    } catch (error) {
        logger.error(`❌ Error fetching last wallet index: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function getUnusedWallet() {
    try {
        const wallet = await Wallet.findOne({ used: false, reserved: false });
        return wallet ? { address: wallet.address, index: wallet.index } : null;
    } catch (error) {
        logger.error(`❌ Error fetching unused wallet: ${error.message}`);
        throw error;
    }
}

// Legacy function - will be deprecated in future versions
export async function markWalletAsUsed(walletIndex) {
    try {
        await Wallet.updateOne({ index: walletIndex }, { used: true });
        logger.info(`✅ Wallet index ${walletIndex} marked as used. Reserved status unchanged.`);
    } catch (error) {
        logger.error(`❌ Error marking wallet as used: ${error.message}`);
        throw error;
    }
}

// Generate a unique gift code for backward compatibility
export async function generateGiftCode() {
    const giftCode = uuidv4();
    const existingGift = await Gift.findOne({ giftCode });
    if (existingGift) {
        return generateGiftCode(); // Try again if code already exists
    }
    return giftCode;
}

export async function findGiftByRecipientWallet(recipientWallet) {
    try {
        // Case-insensitive search for recipient wallet
        const gift = await Gift.findOne({ 
            recipientWallet: { $regex: new RegExp(`^${recipientWallet.toLowerCase()}$`, 'i') } 
        });
        return gift;
    } catch (error) {
        logger.error(`❌ Error finding gift by recipient wallet: ${error.message}`);
        throw error;
    }
}

export async function findGiftByCode(giftCode) {
    try {
        return await Gift.findOne({ giftCode });
    } catch (error) {
        logger.error(`❌ Error finding gift by code: ${error.message}`);
        throw error;
    }
}