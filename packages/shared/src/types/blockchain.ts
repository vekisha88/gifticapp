// This file defines shared types for blockchain interactions

/**
 * Represents a gift in the smart contract
 */
export interface Gift {
  giftAmount: string;        // The gift amount (what receiver gets), as a string in ETH
  unlockTimestamp: Date;     // When the gift can be claimed
  totalRequired: string;     // Total amount required (giftAmount + feeAmount), as a string in ETH
  isClaimed: boolean;        // If the gift has been claimed
  tokenAddress: string;      // Token address (address(0) for native token)
}

/**
 * Represents a blockchain transfer transaction
 */
export interface TransactionInfo {
  hash: string;              // Transaction hash
  blockNumber: number;       // Block number where transaction was mined
  timestamp: Date;           // Timestamp of the transaction
  from: string;              // Sender address
  to: string;                // Recipient address
  value: string;             // Amount transferred, as a string in ETH
  tokenAddress?: string;     // Optional token address for ERC20 transfers
}

/**
 * Event data from the smart contract
 */
export interface ContractEvent {
  name: string;              // Event name
  transactionHash: string;   // Transaction hash
  blockNumber: number;       // Block number
  args: any;                 // Event arguments
  timestamp: Date;           // Timestamp of the event
}

/**
 * Configuration for blockchain connection
 */
export interface BlockchainConfig {
  contractAddress: string;   // Contract address
  rpcUrl: string;            // RPC URL for blockchain connection
  privateKey: string;        // Private key for transaction signing
  charityWallet: string;     // Charity wallet address
  companyWallet: string;     // Company wallet address
}

/**
 * Gas fee information
 */
export interface GasFeeInfo {
  gasPrice: string;          // Gas price in Gwei
  maxFeePerGas?: string;     // Max fee per gas in Gwei (EIP-1559)
  maxPriorityFeePerGas?: string; // Max priority fee in Gwei (EIP-1559)
  estimatedCost: string;     // Estimated cost for a standard transaction in ETH
}

/**
 * Error codes for blockchain operations
 */
export enum BlockchainErrorCode {
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  LOCK_FUNDS_ERROR = 'LOCK_FUNDS_ERROR',
  TRANSFER_FUNDS_ERROR = 'TRANSFER_FUNDS_ERROR',
  CLAIM_GIFT_ERROR = 'CLAIM_GIFT_ERROR',
  GET_GIFT_DETAILS_ERROR = 'GET_GIFT_DETAILS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
} 