import { ethers } from "ethers";
import mongoose from "mongoose";
import { config } from "dotenv";
import { logger } from "../logger.js";
import contractAddressJson from "../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };
import axios from "axios";

config(); // Load environment variables

// Contract setup
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GiftContractABI = contractABIJson.abi;
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, GiftContractABI, signer);

// Connect to MongoDB (may be needed for future enhancements)
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/giftic";
mongoose.connect(mongoURI)
  .then(() => logger.info("MongoDB connected for fee withdrawal script"))
  .catch(err => {
    logger.error(`MongoDB connection error in fee withdrawal script: ${err.message}`);
    process.exit(1);
  });

// Fee threshold in USD
const FEE_THRESHOLD_USD = 1000;

/**
 * Get current token price in USD
 * @param {string} tokenSymbol - The token symbol (e.g., 'matic-network' for MATIC)
 * @returns {Promise<number>} - The token price in USD
 */
async function getTokenPrice(tokenSymbol) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol}&vs_currencies=usd`
    );
    
    if (response.data && response.data[tokenSymbol] && response.data[tokenSymbol].usd) {
      return response.data[tokenSymbol].usd;
    } else {
      throw new Error(`Could not get price for ${tokenSymbol}`);
    }
  } catch (error) {
    logger.error(`Error getting price for ${tokenSymbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Check accumulated fees and withdraw if they exceed the threshold
 * @param {string} tokenAddress - The token address to check fees for
 * @param {string} tokenSymbol - The token symbol for price lookup
 * @returns {Promise<boolean>} - True if withdrawal was successful, false otherwise
 */
async function checkAndWithdrawFees(tokenAddress, tokenSymbol) {
  try {
    // Get the token balance from the contract
    const totalFees = await contract.getTotalFees(tokenAddress);
    
    if (totalFees.toString() === "0") {
      logger.info(`No fees to withdraw for token: ${tokenSymbol}`);
      return false;
    }
    
    // Format the balance for display and calculations
    const formattedBalance = ethers.formatEther(totalFees);
    logger.info(`Current accumulated fees for ${tokenSymbol}: ${formattedBalance}`);
    
    // Get the token price in USD
    const tokenPrice = await getTokenPrice(tokenSymbol);
    logger.info(`Current price of ${tokenSymbol}: $${tokenPrice}`);
    
    // Calculate the value in USD
    const valueInUSD = parseFloat(formattedBalance) * tokenPrice;
    logger.info(`Value in USD: $${valueInUSD.toFixed(2)}`);
    
    // Check if the value exceeds the threshold
    if (valueInUSD >= FEE_THRESHOLD_USD) {
      logger.info(`Fee threshold of $${FEE_THRESHOLD_USD} reached for ${tokenSymbol}. Initiating withdrawal...`);
      
      // Withdraw the fees
      const tx = await contract.withdrawFees(tokenAddress);
      const receipt = await tx.wait();
      
      logger.info(`✅ Fee withdrawal successful for ${tokenSymbol}, transaction hash: ${receipt.hash}`);
      logger.info(`Withdrawn amount: ${formattedBalance} ${tokenSymbol} (approximately $${valueInUSD.toFixed(2)})`);
      
      return true;
    } else {
      logger.info(`Fee threshold of $${FEE_THRESHOLD_USD} not reached yet for ${tokenSymbol}. Current value: $${valueInUSD.toFixed(2)}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error processing fee withdrawal for ${tokenSymbol}: ${error.message}`);
    return false;
  }
}

/**
 * Main function to check and withdraw fees for different tokens
 */
async function checkAllTokenFees() {
  try {
    logger.info("Starting fee withdrawal check process");
    
    // Define tokens to check - add more tokens as needed
    const tokens = [
      { address: "0x0000000000000000000000000000000000000000", symbol: "matic-network" }, // MATIC/ETH (native token)
      // Add other tokens as needed
    ];
    
    let withdrawalCount = 0;
    
    // Process each token
    for (const token of tokens) {
      logger.info(`Checking fees for ${token.symbol}...`);
      
      const success = await checkAndWithdrawFees(token.address, token.symbol);
      if (success) withdrawalCount++;
      
      // Add small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Fee withdrawal check complete. Processed ${withdrawalCount} withdrawals out of ${tokens.length} tokens.`);
    
  } catch (error) {
    logger.error(`Fee withdrawal script error: ${error.message}`);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info("MongoDB connection closed for fee withdrawal script");
  }
}

// Run the fee withdrawal process
checkAllTokenFees()
  .then(() => {
    logger.info("Fee withdrawal script completed");
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Fee withdrawal script failed: ${error.message}`);
    process.exit(1);
  }); 