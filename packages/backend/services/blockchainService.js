import { ethers } from 'ethers';
import { logger } from '../logger.js';
import { Gift } from '../models/gift.js';
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };

// Centralized blockchain configuration
const CONFIG = {
  contractAddress: contractAddressJson.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  privateKey: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  contractABI: contractABIJson.abi,
  charityWallet: contractAddressJson.charityWallet || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  companyWallet: contractAddressJson.companyWallet || "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
};

// Create providers and contracts only once
const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const signer = new ethers.Wallet(CONFIG.privateKey, provider);
const contract = new ethers.Contract(CONFIG.contractAddress, CONFIG.contractABI, signer);

// Export the centralized config and instances for reuse
export { CONFIG, provider, signer, contract };

/**
 * Custom blockchain error class for standardized error handling
 */
class BlockchainError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Initialize blockchain service with custom configuration
 * @param {Object} config Custom configuration to override defaults
 * @returns {Object} Initialized provider, signer and contract instances
 */
export const initializeBlockchain = (config = {}) => {
  try {
    const customConfig = { ...CONFIG, ...config };
    const customProvider = new ethers.JsonRpcProvider(customConfig.rpcUrl);
    const customSigner = new ethers.Wallet(customConfig.privateKey, customProvider);
    const customContract = new ethers.Contract(customConfig.contractAddress, CONFIG.contractABI, customSigner);

    logger.info('✅ Blockchain service initialized successfully');
    return { provider: customProvider, signer: customSigner, contract: customContract };
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to initialize blockchain service',
      'INITIALIZATION_ERROR',
      { originalError: error.message }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    throw blockchainError;
  }
};

export const lockFunds = async (giftCode, amount, targetWallet, unlockDate, feeAmount) => {
  try {
    // Convert gift amount to ethers BigInt
    const amountBigInt = typeof amount === 'string' || typeof amount === 'number'
      ? ethers.parseEther(amount.toString())
      : amount;
    
    // We only send the gift amount to the contract, not the fee
    logger.info(`Locking funds for gift ${giftCode}: ${ethers.formatEther(amountBigInt)} MATIC to contract for ${targetWallet}`);

    // When calling lockFunds, we need to:
    // 1. Send only the gift amount to the contract (not the fee)
    // 2. Use zero address for native currency (MATIC/ETH)
    // 3. Set value to the gift amount only
    const tx = await contract.lockFunds(
      ethers.ZeroAddress, // Zero address for native currency (MATIC/ETH)
      amountBigInt,       // Gift amount only (no fee)
      targetWallet,       // Recipient wallet address
      BigInt(Math.floor(unlockDate.getTime() / 1000)), // Unlock timestamp in seconds
      {
        value: amountBigInt,  // Send only the gift amount as value
        gasLimit: 500000      // Increase gas limit to be safe
      }
    );

    const receipt = await tx.wait();
    logger.info(`✅ Funds locked for gift ${giftCode}, transaction hash: ${receipt.hash}`);
    
    // Now send the fee to the company wallet (minus gas used)
    // This should happen in a separate function call
    
    return receipt.hash;
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to lock funds in contract',
      'LOCK_FUNDS_ERROR',
      {
        giftCode,
        targetWallet,
        amount: amount?.toString() || '0',
        originalError: error.message
      }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    throw blockchainError;
  }
};

export const releaseFunds = async (giftCode, recipientWallet) => {
  try {
    const tx = await contract.releaseFunds(
      ethers.encodeBytes32String(giftCode),
      recipientWallet
    );

    const receipt = await tx.wait();
    logger.info(`✅ Funds released for gift ${giftCode}`);
    return receipt.hash;
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to release funds from contract',
      'RELEASE_FUNDS_ERROR',
      { 
        giftCode,
        recipientWallet,
        originalError: error.message 
      }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    throw blockchainError;
  }
};

export const getGiftStatus = async (giftCode) => {
  try {
    const gift = await contract.gifts(ethers.encodeBytes32String(giftCode));

    return {
      token: gift.token,
      amount: gift.amount,
      targetWallet: gift.targetWallet,
      unlockDate: new Date(Number(gift.unlockDate) * 1000),
      released: gift.released
    };
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to get gift status from contract',
      'GET_GIFT_STATUS_ERROR',
      { 
        giftCode,
        originalError: error.message 
      }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    throw blockchainError;
  }
};

/**
 * Automates the release of funds from the smart contract
 * Calls checkUpkeep and performUpkeep functions to identify and process
 * gifts that are ready to have their funds released
 */
export async function automateGiftReleases() {
  try {
    logger.info("Running automated gift release check");
    
    // Call checkUpkeep to see if any gifts are ready for release
    const [upkeepNeeded, performData] = await contract.checkUpkeep("0x");
    
    if (!upkeepNeeded) {
      logger.info("No gifts ready for release at this time");
      return {
        success: true,
        message: "No gifts ready for release",
        releasedCount: 0
      };
    }
    
    logger.info("Gifts found that are ready for release, initiating performUpkeep");
    
    // Execute performUpkeep to release the funds
    const tx = await contract.performUpkeep(performData, {
      gasLimit: 500000 // Set an appropriate gas limit
    });
    
    logger.info(`Transaction sent: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Count FundsTransferred events to know how many gifts were processed
    let releasedCount = 0;
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "FundsTransferred") {
            releasedCount++;
            logger.info(`Funds released to ${parsedLog.args.recipientWallet}, amount: ${ethers.formatEther(parsedLog.args.amount)}`);
          }
        } catch (error) {
          // Not all logs will be from our contract or parseable
          continue;
        }
      }
    }
    
    logger.info(`Successfully released funds for ${releasedCount} gifts`);
    
    return {
      success: true,
      message: `Successfully released funds for ${releasedCount} gifts`,
      transactionHash: tx.hash,
      releasedCount
    };
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to automate gift releases',
      'AUTOMATE_RELEASES_ERROR',
      { originalError: error.message }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    return {
      success: false,
      error: blockchainError.message,
      details: blockchainError.details
    };
  }
}

/**
 * Send the remaining fee to the company wallet
 * @param {string} giftCode The gift code for logging purposes
 * @param {string|number|BigInt} feeAmount The fee amount to send
 * @returns {Promise<string>} Transaction hash
 */
export const sendFeeToCompanyWallet = async (giftCode, feeAmount) => {
  try {
    // Convert fee amount to ethers BigInt if it's a string or number
    const feeAmountBigInt = typeof feeAmount === 'string' || typeof feeAmount === 'number'
      ? ethers.parseEther(feeAmount.toString())
      : feeAmount;
    
    logger.info(`Sending fee for gift ${giftCode}: ${ethers.formatEther(feeAmountBigInt)} MATIC to company wallet ${CONFIG.companyWallet}`);
    
    // Send transaction directly to company wallet
    const tx = await signer.sendTransaction({
      to: CONFIG.companyWallet,
      value: feeAmountBigInt,
      gasLimit: 30000 // Lower gas limit for simple transfer
    });
    
    const receipt = await tx.wait();
    logger.info(`✅ Fee sent to company wallet for gift ${giftCode}, transaction hash: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    const blockchainError = new BlockchainError(
      'Failed to send fee to company wallet',
      'SEND_FEE_ERROR',
      {
        giftCode,
        companyWallet: CONFIG.companyWallet,
        feeAmount: feeAmount?.toString() || '0',
        originalError: error.message
      }
    );
    logger.error(`❌ ${blockchainError.message}: ${blockchainError.details.originalError}`);
    throw blockchainError;
  }
}; 