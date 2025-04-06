import { ethers, Contract, Wallet, JsonRpcProvider, InfuraProvider } from 'ethers';
import { config } from 'dotenv';
import { logger } from '../logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { GiftCreateParams, GiftResult, BlockchainStatus } from '../types/index.js';

// Import the ABI from the shared package
import { GiftContractABI } from '@gifticapp/shared';

// Load environment variables
config();

// Get directory path for loading contract ABI - NO LONGER NEEDED
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Log the ABI to verify it's loaded correctly
logger.info(`Loaded GiftContractABI from @gifticapp/shared with ${GiftContractABI.length} entries`);

// Blockchain error codes
export const BlockchainErrorCode = {
  CONTRACT_NOT_INITIALIZED: "CONTRACT_NOT_INITIALIZED",
  INVALID_GIFT_ID: "INVALID_GIFT_ID",
  TRANSFER_FAILED: "TRANSFER_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  NETWORK_ERROR: "NETWORK_ERROR",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS"
};

// Provider and contract globals
export let provider: ethers.Provider;
export let contract: ethers.Contract;
export let signer: ethers.Wallet;

// Initialize blockchain connection
export function initializeBlockchainConnection() {
  try {
    // Get blockchain configuration from environment
    const network = process.env.BLOCKCHAIN_NETWORK || "localhost";
    const rpcUrl = process.env.ETH_PROVIDER_URL || process.env.RPC_URL || "http://127.0.0.1:8545";
    const contractAddress = process.env.GIFT_CONTRACT_ADDRESS;
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    
    logger.info(`Initializing blockchain connection to network: ${network} at ${rpcUrl}`);
    
    // Setup provider based on network
    if (network === "localhost" || network === "hardhat") {
      provider = new JsonRpcProvider(rpcUrl);
    } else if (network === "sepolia") {
      provider = new InfuraProvider("sepolia", process.env.INFURA_API_KEY);
    } else if (network === "mumbai") {
      provider = new JsonRpcProvider("https://rpc-mumbai.maticvigil.com");
    } else {
      provider = new JsonRpcProvider(rpcUrl);
    }
    
    // Verify provider connection
    provider.getBlockNumber().then(blockNumber => {
      logger.info(`Successfully connected to blockchain, current block: ${blockNumber}`);
    }).catch(error => {
      logger.error(`Failed to connect to blockchain: ${error.message}`);
    });
    
    // Setup signer if private key is available
    if (privateKey) {
      signer = new Wallet(privateKey, provider);
      logger.info("Admin wallet initialized");
      
      // Log wallet address and balance
      const walletAddress = signer.address;
      logger.info(`Admin wallet address: ${walletAddress}`);
      
      provider.getBalance(walletAddress).then(balance => {
        logger.info(`Admin wallet balance: ${ethers.formatEther(balance)} ETH`);
      }).catch(error => {
        logger.error(`Failed to get wallet balance: ${error.message}`);
      });
    } else {
      // If in development mode, try to use the first Hardhat account
      if (network === "localhost" || network === "hardhat") {
        try {
          // Hardhat's first account private key
          const devPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
          signer = new Wallet(devPrivateKey, provider);
          logger.info("Using Hardhat's first account as admin wallet for development");
          
          // Log wallet address and balance
          const walletAddress = signer.address;
          logger.info(`Dev admin wallet address: ${walletAddress}`);
          
          provider.getBalance(walletAddress).then(balance => {
            logger.info(`Dev admin wallet balance: ${ethers.formatEther(balance)} ETH`);
          });
        } catch (error: any) {
          logger.warn(`Could not use default Hardhat account: ${error.message}`);
          logger.warn("No admin private key provided. Contract write functions will not be available.");
        }
      } else {
        logger.warn("No admin private key provided. Contract write functions will not be available.");
      }
    }
    
    // Get contract address directly from the deployed contract file
    let resolvedContractAddress: string | undefined;
    try {
      // Try to read from the blockchain package
      const contractInfoPath = join(process.cwd(), '..', 'blockchain', 'contractAddress.json');
      if (fs.existsSync(contractInfoPath)) {
        const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
        resolvedContractAddress = contractInfo.contractAddress;
        if (resolvedContractAddress) {
           logger.info(`Read contract address from contractAddress.json: ${resolvedContractAddress}`);
        } else {
           logger.warn(`contractAddress field missing in contractAddress.json at ${contractInfoPath}`);
        }
      } else {
        logger.warn(`contractAddress.json not found at ${contractInfoPath}`);
      }
    } catch (error: any) {
      logger.warn(`Failed to read or parse contractAddress.json: ${error.message}`);
    }

    // Optional: Fallback to environment variable if file reading fails or address is missing
    if (!resolvedContractAddress) {
        const envContractAddress = process.env.GIFT_CONTRACT_ADDRESS;
        if (envContractAddress) {
            logger.warn(`Falling back to environment variable GIFT_CONTRACT_ADDRESS: ${envContractAddress}`);
            resolvedContractAddress = envContractAddress;
        }
    }

    // Check if contract address is available after all attempts
    if (!resolvedContractAddress) {
      logger.error("Contract address could not be resolved from file or environment variable. Cannot initialize contract."); // Changed to error
      // Optional: Throw an error or return early if address is critical
      // throw new Error("Contract address could not be resolved.");
      return false; // Return false as initialization failed
    }
    
    // Initialize contract instance using the imported ABI
    if (resolvedContractAddress && GiftContractABI.length > 0) {
      logger.info(`Initializing contract with address: ${resolvedContractAddress} and ABI with ${GiftContractABI.length} entries`);
      
      // Debug output of the first couple ABI entries to verify format
      logger.info(`ABI sample: ${JSON.stringify(GiftContractABI.slice(0, 2))}`);
      
      try {
        contract = new Contract(
          resolvedContractAddress,
          GiftContractABI,
          signer || provider
        );
        logger.info(`Contract initialized at address: ${resolvedContractAddress}`);
        
        // Verify contract exists on chain
        provider.getCode(resolvedContractAddress).then(code => {
          if (code === '0x') {
            logger.error(`No contract found at address ${resolvedContractAddress}`);
          } else {
            logger.info(`Contract code verified at address ${resolvedContractAddress}`);
          }
        }).catch(error => {
          logger.error(`Failed to verify contract: ${error.message}`);
        });
      } catch (error: any) {
        logger.error(`Failed to initialize contract with ABI: ${error.message}`);
        if (error.message.includes("invalid fragment")) {
          logger.error("ABI format appears to be invalid - check GiftContractABI in shared package");
        }
        // Create a minimal contract instance with just the address
        try {
          logger.info("Attempting to create minimal contract instance with just the address");
          contract = new Contract(resolvedContractAddress, [], provider);
          logger.info("Created minimal contract instance (limited functionality)");
        } catch (fallbackError: any) {
          logger.error(`Failed to create minimal contract instance: ${fallbackError.message}`);
        }
      }
    } else {
      if (!resolvedContractAddress) {
        logger.warn("Contract not initialized: missing contract address");
      }
      if (!GiftContractABI || GiftContractABI.length === 0) {
        logger.warn("Contract not initialized: ABI is empty or undefined");
      }
    }
    
    return true;
  } catch (error: any) {
    logger.error(`Failed to initialize blockchain: ${error.message}`);
    return false;
  }
}

// Call initialization immediately for backward compatibility
initializeBlockchainConnection();

/**
 * Creates a new gift on the blockchain
 * @param giftData Gift data object
 * @returns Transaction result
 */
export async function createGift(giftData: GiftCreateParams): Promise<GiftResult> {
  try {
    if (!contract || !signer) {
      throw new Error(BlockchainErrorCode.CONTRACT_NOT_INITIALIZED);
    }
    
    const { recipient, amount, unlockTime, giftId } = giftData;
    
    logger.info(`Creating gift with ID ${giftId} for recipient ${recipient}`);
    
    // Convert amount to wei
    const valueInWei = ethers.parseEther(amount.toString());
    
    // Create gift on blockchain using the lockFunds function from the actual contract
    const tx = await contract.lockFunds(
      ethers.ZeroAddress, // Use native token (ETH/MATIC)
      valueInWei,
      recipient,
      unlockTime,
      { value: valueInWei }
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    logger.info(`Gift created successfully. Transaction hash: ${receipt.hash}`);
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      giftId: giftId
    };
  } catch (error: any) {
    logger.error(`Error creating gift: ${error.message}`);
    
    if (error.message.includes("insufficient funds")) {
      return {
        success: false,
        message: "Insufficient funds to create gift"
      };
    }
    
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Check if a gift is claimable
 * @param giftId The gift ID to check
 * @returns Whether the gift is claimable
 */
export async function isGiftClaimable(giftId: number): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error(BlockchainErrorCode.CONTRACT_NOT_INITIALIZED);
    }
    
    // In the actual contract, gifts are mapped by recipient address, not ID
    // This would need to be adapted based on your backend data model
    const recipientAddress = await getRecipientAddressForGiftId(giftId);
    if (!recipientAddress) {
      return false;
    }
    
    const gift = await contract.gifts(recipientAddress);
    const now = Math.floor(Date.now() / 1000);
    
    return gift.unlockTimestamp <= now && !gift.isClaimed;
  } catch (error: any) {
    logger.error(`Error checking if gift is claimable: ${error.message}`);
    return false;
  }
}

/**
 * Helper function to get recipient address for a gift ID
 * This needs to be implemented based on your data model
 */
async function getRecipientAddressForGiftId(giftId: number): Promise<string | null> {
  try {
    // This would typically query your database to get the recipient address for a gift ID
    // For now, we'll just return null as a placeholder
    logger.warn(`getRecipientAddressForGiftId not fully implemented - gift ID: ${giftId}`);
    return null;
  } catch (error: any) {
    logger.error(`Error getting recipient address: ${error.message}`);
    return null;
  }
}

/**
 * Claim a gift
 * @param giftId The gift ID to claim
 * @param recipient The recipient address
 * @returns The transaction result
 */
export async function claimGift(giftId: number, recipient: string): Promise<GiftResult> {
  try {
    if (!contract || !signer) {
      throw new Error(BlockchainErrorCode.CONTRACT_NOT_INITIALIZED);
    }
    
    // First check if the gift is claimable
    const isClaimable = await isGiftClaimable(giftId);
    if (!isClaimable) {
      return {
        success: false,
        message: "Gift is either already claimed or not yet unlocked"
      };
    }
    
    logger.info(`Claiming gift ID ${giftId} for recipient ${recipient}`);
    
    // In the actual contract, we use the releaseFunds function which takes a recipient address
    const tx = await contract.releaseFunds(
      ethers.hexlify(ethers.toUtf8Bytes(`GIFT-${giftId}`)), // Convert giftId to a bytes32 code
      recipient
    );
    const receipt = await tx.wait();
    
    logger.info(`Gift claimed successfully. Transaction hash: ${receipt.hash}`);
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    logger.error(`Error claiming gift: ${error.message}`);
    
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Automates the release of eligible gifts
 * @returns Result of the release operation
 */
export async function automateGiftReleases(): Promise<GiftResult> {
  try {
    if (!contract || !signer) {
      throw new Error(BlockchainErrorCode.CONTRACT_NOT_INITIALIZED);
    }
    
    logger.info("Starting automated gift release process");
    
    // Call the batch release function on the contract
    const tx = await contract.batchRelease();
    const receipt = await tx.wait();
    
    // Log the result
    logger.info(`Batch release completed. Transaction hash: ${receipt.hash}`);
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    logger.error(`Error automating gift releases: ${error.message}`);
    
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get the current blockchain status
 * @returns Current blockchain status
 */
export async function getBlockchainStatus(): Promise<BlockchainStatus> {
  try {
    if (!provider) {
      return {
        status: "DOWN",
        error: "Blockchain provider not initialized"
      };
    }
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    
    // Get network information
    const network = await provider.getNetwork();
    
    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = ethers.formatUnits(feeData.gasPrice || 0, "gwei");
    
    // Check if contract is initialized
    let contractStatus = "NOT_FOUND";
    if (contract) {
      try {
        const code = await provider.getCode(contract.target as string);
        contractStatus = code === '0x' ? "NOT_FOUND" : "DEPLOYED";
      } catch (error) {
        contractStatus = "ERROR";
      }
    }
    
    return {
      status: "UP",
      network: network.name === "homestead" ? "mainnet" : network.name,
      blockNumber: blockNumber,
      gasPrice: gasPrice,
      contractStatus: contractStatus
    };
  } catch (error: any) {
    logger.error(`Error getting blockchain status: ${error.message}`);
    
    return {
      status: "DOWN",
      error: error.message
    };
  }
}

interface GasPrice {
  slow: string;
  average: string;
  fast: string;
  timestamp: number;
}

/**
 * Get current gas prices
 * @returns Current gas prices
 */
export async function getGasPrices(): Promise<GasPrice> {
  try {
    if (!provider) {
      throw new Error("Blockchain provider not initialized");
    }
    
    // Get fee data from provider
    const feeData = await provider.getFeeData();
    
    // Calculate different gas price tiers
    // Based on percentage of maxFeePerGas
    const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || ethers.parseUnits("20", "gwei");
    
    const slow = ethers.formatUnits(maxFeePerGas * 8n / 10n, "gwei");
    const average = ethers.formatUnits(maxFeePerGas, "gwei");
    const fast = ethers.formatUnits(maxFeePerGas * 12n / 10n, "gwei");
    
    return {
      slow,
      average,
      fast,
      timestamp: Date.now()
    };
  } catch (error: any) {
    logger.error(`Error getting gas prices: ${error.message}`);
    
    // Return default values if error occurs
    return {
      slow: "20",
      average: "30",
      fast: "40",
      timestamp: Date.now()
    };
  }
} 

