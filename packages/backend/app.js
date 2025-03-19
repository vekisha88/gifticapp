import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "dotenv";
import cron from "node-cron";
import morgan from "morgan";
import { cleanupExpiredGifts, batchProcessGifts } from "./services/giftService.js";
import giftRoutes from "./routes/gift.js";
import { logger } from "./logger.js";
import { ethers } from "ethers";
import { generateWallets } from "./utils/walletGenerator.js";
import { Gift } from "./models/gift.js";
import contractAddressJson from "../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Wallet } from "./models/wallet.js";
import { automateGiftReleases } from "./services/blockchainService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config(); // Load environment variables

const app = express();

// Load contract address dynamically
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GiftContractABI = contractABIJson.abi;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("combined"));

const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/giftic";
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};
connectDB();

// Generate 20 wallets
generateWallets(0, 20).then((wallets) => {
    logger.info(`✅ Pre-generated ${wallets.length} wallets`);
}).catch((err) => {
    if (err.message.includes("duplicate key error")) {
        logger.warn(`Wallets already exist in database, skipping generation`);
    } else {
        logger.error(`❌ Wallet generation failed: ${err.message}`);
    }
});

// Ethereum provider and contract setup
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
provider.pollingInterval = 500;

// Configure the provider to include full transaction objects
const providerConfig = {
  includeTransactions: true,
  fullTransactionObjects: true
};

provider.getBlockNumber()
    .then((block) => logger.info(`Provider connected at block: ${block}`))
    .catch((err) => logger.error(`Provider connection failed: ${err.message}`));
provider.on("error", (err) => logger.error(`JsonRpcProvider error: ${err.message}`));

// Signer for contract interactions
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, GiftContractABI, signer);

// Handle contract events more reliably by using the provider's getLogs directly
// instead of relying on the contract event listeners
async function setupContractEvents() {
    try {
        // Use a function to create event listeners with proper error handling
        const createEventListener = (eventName, handler) => {
            try {
                logger.info(`Setting up listener for ${eventName} event`);
                contract.on(eventName, (...args) => {
                    try {
                        handler(...args);
                    } catch (error) {
                        logger.error(`Error handling ${eventName} event: ${error.message}`);
                    }
                });
            } catch (error) {
                logger.error(`Error setting up ${eventName} event listener: ${error.message}`);
            }
        };

        // FundsLocked event
        createEventListener("FundsLocked", async (paymentWallet, tokenAddress, giftAmount, feeAmount, recipientWallet, unlockTimestamp) => {
            const recipientWalletString = recipientWallet.toLowerCase();
            const paymentWalletString = paymentWallet.toLowerCase();
            logger.info(`FundsLocked event: paymentWallet=${paymentWalletString}, tokenAddress=${tokenAddress}, giftAmount=${giftAmount.toString()}, feeAmount=${feeAmount.toString()}, recipientWallet=${recipientWalletString}, unlockTimestamp=${unlockTimestamp.toString()}`);
            
            // Update payment status for the gift associated with this wallet
            try {
                // Look up gift by recipient wallet address, case-insensitive
                const gift = await Gift.findOne({ 
                    recipientWallet: { $regex: new RegExp(`^${recipientWalletString}$`, 'i') }
                });
                
                if (gift) {
                    // Only update if still pending (otherwise it was already handled by direct monitoring)
                    if (gift.paymentStatus === "pending") {
                        gift.paymentStatus = "received";
                        gift.giftAmount = ethers.formatUnits(giftAmount, 'ether');
                        gift.feeAmount = ethers.formatUnits(feeAmount, 'ether');
                        gift.totalRequired = parseFloat(gift.giftAmount) + parseFloat(gift.feeAmount);
                        
                        // If this is a token (not MATIC/ETH)
                        if (tokenAddress !== "0x0000000000000000000000000000000000000000") {
                            gift.tokenAddress = tokenAddress;
                        }
                        
                        await gift.save();
                        logger.info(`✅ Payment confirmed for recipient wallet: ${recipientWalletString}`);
                    } else {
                        logger.info(`ℹ️ Gift for wallet ${recipientWalletString} already processed (status: ${gift.paymentStatus})`);
                    }
                } else {
                    // This is genuinely a problem - no gift found at all
                    logger.error(`❌ No gift found for recipient wallet: ${recipientWalletString}`);
                }
            } catch (error) {
                logger.error(`❌ Error updating gift payment status: ${error.message}`);
            }
        });

        // GiftClaimed event
        createEventListener("GiftClaimed", async (recipientWallet) => {
            const recipientWalletString = recipientWallet.toLowerCase();
            logger.info(`GiftClaimed event: recipientWallet=${recipientWalletString}`);
            
            try {
                // Look up gift by recipient wallet address
                const gift = await Gift.findOne({ 
                    recipientWallet: { $regex: new RegExp(`^${recipientWalletString}$`, 'i') }
                });
                
                if (gift) {
                    gift.isClaimed = true;
                    await gift.save();
                    logger.info(`✅ Gift marked as claimed for recipient wallet: ${recipientWalletString}`);
                } else {
                    logger.warn(`❌ No gift found for recipient wallet: ${recipientWalletString}`);
                }
            } catch (error) {
                logger.error(`❌ Error updating gift claim status: ${error.message}`);
            }
        });

        // FundsTransferred event
        createEventListener("FundsTransferred", async (paymentWallet, tokenAddress, amount, recipientWallet) => {
            const recipientWalletString = recipientWallet.toLowerCase();
            const paymentWalletString = paymentWallet.toLowerCase();
            logger.info(`FundsTransferred event: paymentWallet=${paymentWalletString}, tokenAddress=${tokenAddress}, amount=${amount.toString()}, recipientWallet=${recipientWalletString}`);
            
            // Update gift status when funds are transferred
            try {
                // Look up gift by recipient wallet address, case-insensitive
                const gift = await Gift.findOne({ 
                    recipientWallet: { $regex: new RegExp(`^${recipientWalletString}$`, 'i') }
                });
                
                if (gift) {
                    gift.paymentStatus = "completed";
                    await gift.save();
                    logger.info(`✅ Funds transferred for recipient wallet: ${recipientWalletString}`);
                } else {
                    logger.warn(`❌ No gift found for recipient wallet: ${recipientWalletString}`);
                }
            } catch (error) {
                logger.error(`❌ Error updating gift status after funds transfer: ${error.message}`);
            }
        });

        // FeesWithdrawn event
        createEventListener("FeesWithdrawn", (token, amount) => {
            logger.info(`FeesWithdrawn event: token=${token}, amount=${amount.toString()}`);
        });

        // TokenApproved event
        createEventListener("TokenApproved", (token, approved) => {
            logger.info(`TokenApproved event: token=${token}, approved=${approved}`);
        });

        // Add handler for FundsSentToCharity event
        createEventListener("FundsSentToCharity", async (sender, token, amount, reason) => {
            const senderString = sender.toLowerCase();
            logger.info(`FundsSentToCharity event: sender=${senderString}, token=${token}, amount=${amount.toString()}, reason=${reason}`);
        });

        logger.info("Contract event listeners set up successfully");
    } catch (error) {
        logger.error(`Failed to set up contract events: ${error.message}`);
    }
}

// Function to check for direct transfers to gift wallets
async function setupDirectTransferMonitoring() {
  try {
    logger.info("Setting up direct transfer monitoring for gift wallets");
    
    // Setup provider event listener for all new blocks
    provider.on("block", async (blockNumber) => {
      try {
        logger.info(`New block detected: ${blockNumber}`);
        
        // Get the block with transaction hashes
        const block = await provider.getBlock(blockNumber);
        
        if (!block) {
          logger.warn(`Block ${blockNumber} not found`);
          return;
        }
        
        // Get transaction hashes from the block
        const txHashes = block.transactions || [];
        
        if (txHashes.length === 0) {
          logger.info(`No transactions in block ${blockNumber}`);
          return;
        }
        
        logger.info(`Processing ${txHashes.length} transactions in block ${blockNumber}`);
        
        // Get all pending gifts with wallet addresses
        const pendingGifts = await Gift.find({ paymentStatus: "pending" });
        logger.info(`Found ${pendingGifts.length} pending gifts to check`);
        
        // Print out the wallet addresses for debugging
        pendingGifts.forEach(gift => {
          logger.info(`Pending gift: ${gift.giftCode}, Wallet: ${gift.recipientWallet}`);
        });
        
        if (pendingGifts.length === 0) {
          return;
        }
        
        // Create a map of wallet addresses to gifts for faster lookup (convert to lowercase for comparison)
        const giftWalletMap = {};
        pendingGifts.forEach(gift => {
          const lowerWallet = gift.recipientWallet.toLowerCase();
          giftWalletMap[lowerWallet] = gift;
          logger.info(`Monitoring wallet ${lowerWallet} for gift ${gift.giftCode}`);
        });
        
        // Process each transaction in the block
        const processedTransactions = [];
        for (const txHash of txHashes) {
          try {
            // Get full transaction details
            const tx = await provider.getTransaction(txHash);
            if (!tx) {
              logger.warn(`Transaction ${txHash} not found`);
              continue;
            }
            
            // Add detailed transaction logging
            logger.info(`Processing transaction ${tx.hash} in block ${blockNumber}`);
            
            // Skip if transaction doesn't have a 'to' address
            if (!tx.to) {
              logger.info(`Skipping transaction ${tx.hash} - no 'to' address (contract creation)`);
              continue;
            }
            
            // Get the lowercase 'to' address for comparison
            const toAddress = tx.to.toLowerCase();
            
            // Debug log to see all transaction destinations
            logger.info(`Transaction ${tx.hash}: from=${tx.from}, to=${toAddress}, value=${ethers.formatEther(tx.value || '0')} ETH/MATIC`);
            
            // Check if this transaction is to one of our monitored gift wallets
            if (giftWalletMap[toAddress]) {
              const gift = giftWalletMap[toAddress];
              logger.info(`✅ MATCH FOUND! Transaction ${tx.hash} is to monitored wallet: ${toAddress} for gift ${gift.giftCode}`);
              
              try {
                // Retrieve the wallet with private key
                const wallet = await Wallet.findOne({ 
                  address: toAddress
                });
                
                if (!wallet) {
                  logger.error(`❌ Wallet not found in database: ${toAddress}`);
                  continue;
                }
                
                // Decrypt the private key
                let walletPrivateKey;
                try {
                  walletPrivateKey = wallet.getDecryptedPrivateKey();
                  logger.info(`✅ Successfully retrieved and decrypted private key for wallet ${toAddress}`);
                } catch (decryptError) {
                  logger.error(`❌ Failed to decrypt private key for wallet ${toAddress}: ${decryptError.message}`);
                  continue;
                }
                
                // Create a signer using the wallet's private key
                const walletSigner = new ethers.Wallet(walletPrivateKey, provider);
                const walletBalance = await provider.getBalance(toAddress);
                logger.info(`Wallet balance: ${ethers.formatEther(walletBalance)} ETH/MATIC`);
                
                // Verify payment amount matches expected amount
                const expectedAmount = ethers.parseEther(gift.totalRequired.toString());
                
                if (walletBalance < tx.value || walletBalance < expectedAmount) {
                  logger.warn(`⚠️ Wallet balance (${ethers.formatEther(walletBalance)}) is less than transaction value or expected amount`);
                  continue;
                }
                
                // Check if payment amount is correct (with small tolerance for gas differences)
                const tolerance = 0.01; // 1% tolerance
                const receivedAmount = Number(ethers.formatEther(walletBalance));
                const requiredAmount = Number(gift.totalRequired);
                const lowerBound = requiredAmount * (1 - tolerance);
                const upperBound = requiredAmount * (1 + tolerance);
                
                if (receivedAmount < lowerBound || receivedAmount > upperBound) {
                  logger.warn(`⚠️ Incorrect payment amount: expected ${gift.totalRequired}, received ${ethers.formatEther(walletBalance)}`);
                  
                  // Send to charity wallet if configured (incorrect payments)
                  const charityAddress = process.env.CHARITY_WALLET || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
                  
                  try {
                    const charityTx = await walletSigner.sendTransaction({
                      to: charityAddress,
                      value: walletBalance - ethers.parseEther("0.001"), // Leave a small amount for gas
                      gasLimit: 30000
                    });
                    logger.info(`✅ Sent incorrect payment to charity: ${charityTx.hash}`);
                  } catch (charityError) {
                    logger.error(`❌ Failed to send to charity: ${charityError.message}`);
                  }
                  continue;
                }
                
                // Connect contract with wallet signer
                const contractWithSigner = contract.connect(walletSigner);
                
                // Create the lockFunds transaction
                const lockFundsTx = await contractWithSigner.lockFunds(
                  ethers.ZeroAddress, // Native token (ETH/MATIC)
                  walletBalance - ethers.parseEther("0.001"), // Leave a small amount for gas
                  gift.recipientWallet,
                  Math.floor(new Date(gift.unlockTimestamp).getTime() / 1000), // Convert to Unix timestamp
                  { 
                    gasLimit: 200000, // Gas limit for the transaction
                    value: walletBalance - ethers.parseEther("0.001") // Send all funds minus gas
                  }
                );
                
                logger.info(`🔄 Lock funds transaction sent: ${lockFundsTx.hash}`);
                
                // Wait for transaction to be mined
                const receipt = await lockFundsTx.wait();
                logger.info(`✅ Lock funds transaction confirmed in block ${receipt.blockNumber}`);
                
                // Update gift status
                gift.paymentStatus = "received";
                await gift.save();
                logger.info(`✅ Gift ${gift.giftCode} marked as received`);
                
                processedTransactions.push({
                  giftCode: gift.giftCode,
                  walletAddress: toAddress,
                  transactionHash: tx.hash,
                  lockFundsHash: lockFundsTx.hash,
                  status: "success"
                });
              } catch (error) {
                logger.error(`❌ Error processing transaction for gift wallet ${toAddress}: ${error.message}`);
                processedTransactions.push({
                  giftCode: gift ? gift.giftCode : 'unknown',
                  walletAddress: toAddress,
                  transactionHash: tx.hash,
                  status: "error",
                  error: error.message
                });
              }
            }
          } catch (txError) {
            logger.error(`❌ Error processing transaction ${tx.hash}: ${txError.message}`);
          }
        }
        
        if (processedTransactions.length > 0) {
          logger.info(`Processed ${processedTransactions.length} transactions for gift wallets`);
        }
      } catch (blockError) {
        logger.error(`❌ Error processing block ${blockNumber}: ${blockError.message}`);
      }
    });
    
    logger.info("Direct transfer monitoring setup complete");
  } catch (error) {
    logger.error(`❌ Failed to set up direct transfer monitoring: ${error.message}`);
  }
}

// Check for existing pending gifts on startup
async function checkPendingGiftsOnStartup() {
  try {
    const pendingGifts = await Gift.find({ paymentStatus: "pending" });
    
    if (pendingGifts.length > 0) {
      logger.info(`Found ${pendingGifts.length} pending gifts on startup that need payments`);
      
      pendingGifts.forEach(gift => {
        logger.info(`👀 Monitoring wallet ${gift.recipientWallet} for gift ${gift.giftCode} - Amount: ${gift.giftAmount}, Fee: ${gift.feeAmount}, Total: ${gift.totalRequired}`);
      });
      
      logger.info("All pending gifts have been restored for monitoring");
    } else {
      logger.info("No pending gifts found on startup");
    }
  } catch (error) {
    logger.error(`Error checking pending gifts on startup: ${error.message}`);
  }
}

// Set up contract events
setupContractEvents();

// Set up direct transfer monitoring
setupDirectTransferMonitoring();

// Check for pending gifts on startup
checkPendingGiftsOnStartup();

app.use("/api/gift", giftRoutes);

// Set up cron job for auto transfer funds - runs every hour
cron.schedule("0 * * * *", () => {
  logger.info("Running auto-transfer job to process eligible gifts");
  
  // Use spawn to run the script as a separate process
  const autoTransferScript = spawn("node", [path.join(__dirname, "scripts", "autoTransfer.js")]);
  
  autoTransferScript.stdout.on("data", (data) => {
    logger.info(`Auto-transfer stdout: ${data}`);
  });
  
  autoTransferScript.stderr.on("data", (data) => {
    logger.error(`Auto-transfer stderr: ${data}`);
  });
  
  autoTransferScript.on("close", (code) => {
    if (code === 0) {
      logger.info("Auto-transfer completed successfully");
    } else {
      logger.error(`Auto-transfer process exited with code ${code}`);
    }
  });
});

// Set up cron job for fee withdrawal - runs once daily at midnight
cron.schedule("0 0 * * *", () => {
  logger.info("Running fee withdrawal job");
  
  // Use spawn to run the script as a separate process
  const feeWithdrawalScript = spawn("node", [path.join(__dirname, "scripts", "feeWithdrawal.js")]);
  
  feeWithdrawalScript.stdout.on("data", (data) => {
    logger.info(`Fee withdrawal stdout: ${data}`);
  });
  
  feeWithdrawalScript.stderr.on("data", (data) => {
    logger.error(`Fee withdrawal stderr: ${data}`);
  });
  
  feeWithdrawalScript.on("close", (code) => {
    if (code === 0) {
      logger.info("Fee withdrawal completed successfully");
    } else {
      logger.error(`Fee withdrawal process exited with code ${code}`);
    }
  });
});

// Setup batch processing cron job - run every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    logger.info("Running scheduled batch processing for pending gifts");
    
    // Find all pending gifts that have been in that state for at least 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingGifts = await Gift.find({
      paymentStatus: "pending",
      updatedAt: { $lte: fiveMinutesAgo }
    }).limit(20); // Process at most 20 gifts in a batch
    
    if (pendingGifts.length === 0) {
      logger.info("No pending gifts to batch process");
      return;
    }
    
    logger.info(`Found ${pendingGifts.length} pending gifts for batch processing`);
    
    // Extract gift IDs for batch processing
    const giftIds = pendingGifts.map(gift => gift._id);
    
    // Process the gifts in a batch
    const result = await batchProcessGifts(giftIds);
    logger.info(`Batch processing completed: ${result.message}`);
  } catch (error) {
    logger.error(`Scheduled batch processing error: ${error.message}`);
  }
});

// Setup automation for gift fund releases - run every hour
cron.schedule("0 * * * *", async () => {
  try {
    logger.info("Running scheduled gift fund release automation");
    const result = await automateGiftReleases();
    
    if (result.success) {
      if (result.releasedCount > 0) {
        logger.info(`Successfully released funds for ${result.releasedCount} gifts, transaction: ${result.transactionHash}`);
      } else {
        logger.info("No gifts ready for fund release at this time");
      }
    } else {
      logger.error(`Gift fund release automation failed: ${result.error}`);
    }
  } catch (error) {
    logger.error(`Error in gift fund release cron job: ${error.message}`);
  }
});

app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});