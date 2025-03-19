import { ethers } from 'ethers';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
dotenv.config();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI and address
const contractAddressJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../blockchain/contractAddress.json'))
);
const contractAbiPath = path.join(
  __dirname,
  '../../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json'
);
const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath)).abi;
const contractAddress = contractAddressJson.contractAddress;

// Threshold in USD
const WITHDRAWAL_THRESHOLD_USD = 1000;

// List of tokens to monitor
const TOKENS_TO_MONITOR = [
  {
    address: '0x0000000000000000000000000000000000000000', // ETH/MATIC
    symbol: 'MATIC',
    coingeckoId: 'matic-network'
  },
  // Add more tokens as needed
];

async function fetchTokenPrices() {
  const ids = TOKENS_TO_MONITOR.map(token => token.coingeckoId).join(',');
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Create a map of token symbol to price
  const prices = {};
  TOKENS_TO_MONITOR.forEach(token => {
    if (data[token.coingeckoId]) {
      prices[token.symbol] = data[token.coingeckoId].usd;
    }
  });
  
  return prices;
}

async function monitorFees() {
  try {
    console.log('Starting fee monitoring...');
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545'
    );
    
    // Load contract
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      provider
    );
    const contract = new ethers.Contract(
      contractAddress,
      contractAbi,
      wallet
    );
    
    // Check current block
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block: ${blockNumber}`);
    
    // Fetch token prices
    const tokenPrices = await fetchTokenPrices();
    console.log('Current token prices (USD):', tokenPrices);
    
    // Check fees for each token
    for (const token of TOKENS_TO_MONITOR) {
      // Get accumulated fees
      const feeWei = await contract.getTotalFees(token.address);
      const feeEther = ethers.formatEther(feeWei);
      console.log(`${token.symbol} fees: ${feeEther} ${token.symbol}`);
      
      // Calculate USD value
      const feeUsd = Number(feeEther) * tokenPrices[token.symbol];
      console.log(`${token.symbol} fees in USD: $${feeUsd.toFixed(2)}`);
      
      // Check if above threshold
      if (feeUsd >= WITHDRAWAL_THRESHOLD_USD) {
        console.log(`${token.symbol} fees exceed threshold. Triggering withdrawal...`);
        
        // Withdraw fees
        const tx = await contract.withdrawFees(token.address);
        console.log(`Withdrawal transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`Withdrawal confirmed in block ${receipt.blockNumber}`);
        
        // Log the event details
        const withdrawalEvent = receipt.logs
          .map(log => {
            try {
              return contract.interface.parseLog(log);
            } catch (e) {
              return null;
            }
          })
          .filter(event => event && event.name === 'FeesWithdrawn')[0];
        
        if (withdrawalEvent) {
          const { token: withdrawnToken, amount } = withdrawalEvent.args;
          console.log(`Successfully withdrew ${ethers.formatEther(amount)} ${token.symbol}`);
        }
      } else {
        console.log(`${token.symbol} fees below threshold ($${WITHDRAWAL_THRESHOLD_USD}). No action needed.`);
      }
    }
    
    console.log('Fee monitoring completed.');
  } catch (error) {
    console.error('Error monitoring fees:', error);
  }
}

// Execute the function
monitorFees()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 