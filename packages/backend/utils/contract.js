import { ethers } from 'ethers';
import { logger } from '../logger.js';
import contractAddressJson from '../../blockchain/contractAddress.json' with { type: "json" };
import contractABIJson from '../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json' with { type: "json" };
import dotenv from "dotenv";

dotenv.config();

// Blockchain configuration
const CONTRACT_ADDRESS = contractAddressJson.contractAddress;
const GIFT_CONTRACT_ABI = contractABIJson.abi;

// Cache the contract instance
let contractInstance = null;

export async function getContract() {
    if (contractInstance) {
        return contractInstance;
    }

    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
        contractInstance = new ethers.Contract(CONTRACT_ADDRESS, GIFT_CONTRACT_ABI, signer);
        logger.info(`Contract initialized at address: ${CONTRACT_ADDRESS}`);
        return contractInstance;
    } catch (error) {
        logger.error(`Failed to initialize contract: ${error.message}`);
        throw error;
    }
}

export async function getContractProvider() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");
        return provider;
    } catch (error) {
        logger.error(`Failed to initialize provider: ${error.message}`);
        throw error;
    }
}

let provider = null;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function initializeProvider() {
    try {
        provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
        await provider.getNetwork();
        logger.info('Successfully connected to blockchain network');
        return provider;
    } catch (error) {
        logger.error('Failed to connect to blockchain network:', error);
        throw error;
    }
}

export async function getProvider() {
    if (!provider) {
        await initializeProvider();
    }
    return provider;
}

export async function retryWithBackoff(operation, maxRetries = MAX_RETRIES) {
    try {
        return await operation();
    } catch (error) {
        if (retryCount < maxRetries) {
            retryCount++;
            logger.warn(`Operation failed, retrying (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
            return retryWithBackoff(operation, maxRetries);
        }
        throw error;
    }
} 