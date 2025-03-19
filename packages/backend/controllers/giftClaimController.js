import { Gift } from "../models/gift.js";
import { logger } from "../logger.js";
import { ethers } from "ethers";
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };
import { config } from "dotenv";

config(); // Load environment variables

// Contract setup
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GiftContractABI = contractABIJson.abi;
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, GiftContractABI, signer);

// Verify gift using recipient wallet address
export const verifyGift = async (req, res) => {
  try {
    const { recipientWallet } = req.body;
    
    if (!recipientWallet || !ethers.isAddress(recipientWallet)) {
      return res.status(400).json({ success: false, error: "Valid recipient wallet address is required" });
    }
    
    const gift = await Gift.findOne({ recipientWallet: recipientWallet.toLowerCase() });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }

    logger.info(`✅ Gift verified for wallet: ${recipientWallet}`);
    res.status(200).json({ 
      success: true, 
      giftDetails: {
        recipientWallet: gift.recipientWallet,
        recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
        giftAmount: gift.giftAmount,
        feeAmount: gift.feeAmount,
        unlockTimestamp: gift.unlockTimestamp,
        currency: gift.currency,
        tokenAddress: gift.tokenAddress,
        paymentStatus: gift.paymentStatus
      },
      giftReady: gift.paymentStatus === "received"
    });
  } catch (error) {
    logger.error(`❌ Error verifying gift for wallet: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to verify gift" });
  }
};

// Support old gift code verification for backward compatibility
export const verifyGiftCode = async (req, res) => {
  try {
    const { giftCode } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }

    logger.info(`✅ Gift verified using gift code: ${giftCode}`);
    res.status(200).json({ 
      success: true, 
      giftDetails: {
        giftCode: gift.giftCode,
        recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
        amount: gift.giftAmount,
        currency: gift.currency,
        unlockDate: gift.unlockTimestamp,
        walletAddress: gift.recipientWallet,
        paymentStatus: gift.paymentStatus
      },
      giftReady: gift.paymentStatus === "received"
    });
  } catch (error) {
    logger.error(`❌ Error verifying gift code: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to verify gift code" });
  }
};

// Preclaim step - generate and display mnemonic without claiming
export const preclaimGift = async (req, res) => {
  try {
    const { giftCode, userEmail } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }
    
    if (gift.paymentStatus !== "received") {
      return res.status(400).json({ success: false, error: "Gift is not ready yet. Payment is still pending." });
    }

    // Generate a new wallet for the user
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    logger.info(`✅ Generated preview mnemonic for gift ${giftCode}`);
    res.status(200).json({
      success: true,
      message: "Mnemonic fetched successfully for preview.",
      walletAddress: gift.recipientWallet,
      mnemonic,
      giftAmount: gift.giftAmount,
      totalRequired: gift.totalRequired,
      feeAmount: gift.feeAmount,
      currency: gift.currency
    });
  } catch (error) {
    logger.error(`❌ Error preclaiming gift: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch mnemonic" });
  }
};

// Claim gift by code
export const claimGiftByCode = async (req, res) => {
  try {
    const { giftCode, userEmail } = req.body;
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has already been claimed" });
    }
    
    if (gift.paymentStatus !== "received") {
      return res.status(400).json({ success: false, error: "Gift is not ready yet. Payment is still pending." });
    }

    // Generate a wallet for the user
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;

    // Update gift data in database before blockchain interaction
    gift.isClaimed = true;
    gift.claimedBy = userEmail;
    await gift.save();
    logger.info(`✅ Gift marked as claimed in database: ${gift.giftCode}`);
    
    // Send successful response immediately
    res.status(200).json({
      success: true,
      message: "Gift claimed successfully. Funds will be available on the unlock date and time.",
      walletAddress: gift.recipientWallet,
      mnemonic: mnemonic,
      giftAmount: gift.giftAmount,
      totalAmount: gift.totalRequired,
      feeAmount: gift.feeAmount,
      currency: gift.currency,
      unlockDate: gift.unlockTimestamp,
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`
    });
    
    // Process blockchain claim asynchronously after sending response
    (async () => {
      try {
        logger.info(`Attempting blockchain claim for wallet: ${gift.recipientWallet}`);
        // Call claimGift directly from the contract owner/backend wallet
        const tx = await contract.claimGift(gift.recipientWallet);
        await tx.wait();
        logger.info(`✅ Gift claimed on blockchain for wallet: ${gift.recipientWallet}`);
      } catch (error) {
        logger.error(`❌ Error claiming gift on blockchain: ${error.message}`);
        logger.info(`Gift still marked as claimed in database despite blockchain error`);
      }
    })().catch(error => {
      logger.error(`Async blockchain claim failed: ${error.message}`);
    });

    logger.info(`✅ Gift claimed by code: ${giftCode} by ${userEmail}`);
  } catch (error) {
    logger.error(`❌ Error claiming gift by code: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to claim the gift" });
  }
};

export const getClaimedGifts = async (req, res) => {
  try {
    const { userEmail, page = 1, limit = 10 } = req.query;

    const claimedGifts = await Gift.find({ claimedBy: userEmail })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const formattedGifts = claimedGifts.map(gift => ({
      giftCode: gift.giftCode,
      recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
      amount: gift.giftAmount,
      currency: gift.currency,
      unlockDate: gift.unlockTimestamp,
      walletAddress: gift.recipientWallet,
      paymentStatus: gift.paymentStatus,
      claimed: gift.isClaimed,
      createdAt: gift.createdAt,
      recipientFirstName: gift.recipientFirstName,
      recipientLastName: gift.recipientLastName
    }));

    logger.info(`✅ Claimed gifts retrieved for user: ${userEmail}`);
    res.status(200).json({ success: true, gifts: formattedGifts });
  } catch (error) {
    logger.error(`❌ Error fetching claimed gifts: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch claimed gifts" });
  }
};

// New function to check if a gift is ready for transfer
export const checkGiftTransferable = async (req, res) => {
  try {
    const { giftCode } = req.body;
    
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (!gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has not been claimed yet" });
    }
    
    const now = new Date();
    const isUnlocked = now >= new Date(gift.unlockTimestamp);
    
    // Get on-chain gift data to verify
    let onChainGift;
    try {
      onChainGift = await contract.getGift(gift.recipientWallet);
    } catch (error) {
      logger.error(`❌ Error fetching gift from blockchain: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to check gift status on blockchain",
        details: error.message
      });
    }
    
    // Convert BigInt values to strings for the response
    const onChainData = {
      giftAmount: ethers.formatUnits(onChainGift[0], 'ether'),
      feeAmount: ethers.formatUnits(onChainGift[1], 'ether'),
      unlockTimestamp: new Date(Number(onChainGift[2]) * 1000), // Convert seconds to milliseconds
      totalRequired: ethers.formatUnits(onChainGift[3], 'ether'),
      isClaimed: onChainGift[4],
      tokenAddress: onChainGift[5]
    };
    
    res.status(200).json({
      success: true,
      gift: {
        giftCode: gift.giftCode,
        recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
        amount: gift.giftAmount,
        currency: gift.currency,
        unlockDate: gift.unlockTimestamp,
        walletAddress: gift.recipientWallet,
        isClaimed: gift.isClaimed,
        isUnlocked,
        canTransfer: isUnlocked && gift.isClaimed
      },
      onChainData
    });
  } catch (error) {
    logger.error(`❌ Error checking gift transferability: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to check gift status" });
  }
};

// Function to initiate a transfer of claimed funds
export const transferGiftFunds = async (req, res) => {
  try {
    const { giftCode } = req.body;
    
    const gift = await Gift.findOne({ giftCode });

    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    
    if (!gift.isClaimed) {
      return res.status(400).json({ success: false, error: "Gift has not been claimed yet" });
    }
    
    const now = new Date();
    if (now < new Date(gift.unlockTimestamp)) {
      return res.status(400).json({ 
        success: false, 
        error: "Gift is not yet unlocked", 
        unlockTime: gift.unlockTimestamp 
      });
    }
    
    // Call the smart contract to transfer funds
    try {
      // Create a transaction to call transferFunds on the contract
      const tx = await contract.transferFunds(gift.recipientWallet);
      const receipt = await tx.wait();
      
      logger.info(`✅ Gift funds transferred on blockchain for wallet: ${gift.recipientWallet}, tx hash: ${receipt.hash}`);
      
      // Update local database
      gift.paymentStatus = "completed";
      await gift.save();
      
      res.status(200).json({
        success: true,
        message: "Funds transferred successfully!",
        giftDetails: {
          giftCode: gift.giftCode,
          amount: gift.giftAmount,
          currency: gift.currency,
          recipientName: `${gift.recipientFirstName} ${gift.recipientLastName}`,
          walletAddress: gift.recipientWallet,
          paymentStatus: gift.paymentStatus
        },
        transactionHash: receipt.hash
      });
    } catch (error) {
      logger.error(`❌ Error transferring funds: ${error.message}`);
      
      // Check if this is a "not claimed" or "unlock date not reached" error
      if (error.message.includes("Not claimed")) {
        return res.status(400).json({ success: false, error: "Gift must be claimed on the blockchain first" });
      }
      
      if (error.message.includes("Unlock date not reached")) {
        return res.status(400).json({ success: false, error: "Unlock date has not been reached on the blockchain" });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: "Failed to transfer funds",
        details: error.message
      });
    }
  } catch (error) {
    logger.error(`❌ Error transferring gift funds: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to transfer gift funds" });
  }
};