import { ethers } from 'ethers';
import { logger } from '../logger.js';
import { Gift } from '../models/gift.js';
import pkg from '@gifticapp/shared';
const { GiftContractABI } = pkg;
import contractAddressJson from "../../blockchain/contractAddress.json" with { type: "json" };
import contractABIJson from "../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json" with { type: "json" };

const contractAddress = process.env.GIFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const ContractABI = contractABIJson.abi;

// Signer for contract interactions
const signerPrivateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = new ethers.Wallet(signerPrivateKey, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);

export const initializeBlockchain = (config) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    const contract = new ethers.Contract(config.contractAddress, ContractABI, wallet);

    logger.info('✅ Blockchain service initialized successfully');
  } catch (error) {
    logger.error(`❌ Error initializing blockchain service: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const lockFunds = async (giftCode, amount, targetWallet, unlockDate) => {
  try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
    const contract = new ethers.Contract(contractAddress, ContractABI, wallet);

    const tx = await contract.lockFunds(
      ethers.ZeroAddress, // Zero address for native currency (MATIC/ETH)
      amount,             // Gift amount
      targetWallet,       // Recipient wallet address
      BigInt(Math.floor(unlockDate.getTime() / 1000)), // Unlock timestamp in seconds
      { value: amount }   // Send the same amount as value
    );

    const receipt = await tx.wait();
    logger.info(`✅ Funds locked for gift ${giftCode}`);
    return receipt.hash;
  } catch (error) {
    logger.error(`❌ Error locking funds: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const releaseFunds = async (giftCode, recipientWallet) => {
  try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
    const contract = new ethers.Contract(contractAddress, ContractABI, wallet);

    const tx = await contract.releaseFunds(
      ethers.encodeBytes32String(giftCode),
      recipientWallet
    );

    const receipt = await tx.wait();
    logger.info(`✅ Funds released for gift ${giftCode}`);
    return receipt.hash;
  } catch (error) {
    logger.error(`❌ Error releasing funds: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const getGiftStatus = async (giftCode) => {
  try {
    const contract = new ethers.Contract(contractAddress, ContractABI, provider);
    const gift = await contract.gifts(ethers.encodeBytes32String(giftCode));

    return {
      token: gift.token,
      amount: gift.amount,
      targetWallet: gift.targetWallet,
      unlockDate: new Date(Number(gift.unlockDate) * 1000),
      released: gift.released
    };
  } catch (error) {
    logger.error(`❌ Error getting gift status: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
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
    logger.error(`Error automating gift releases: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
} 