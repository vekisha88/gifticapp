// Shared gift-related types that can be used across packages

// Currency types
export type CurrencyKey = "MATIC" | "ETH" | "WBTC" | "USDC" | "USDT" | "DAI";

// Payment status types
export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

// Blockchain status types
export type BlockchainStatus = "pending" | "locked" | "unlocked" | "claimed" | "failed";

// Network types
export type Network = "polygon" | "ethereum";

// Base payment interface
export interface IPaymentBase {
  amount: number;
  transactionHash: string;
  timestamp: Date;
  currency: string;
  tokenAddress?: string;
}

// Core gift interface containing common properties across all packages
export interface IGiftBase {
  giftCode: string;
  recipientFirstName: string;
  recipientLastName: string;
  amount: number;
  currency: CurrencyKey;
  unlockDate: Date | string;
  walletAddress: string;
  walletIndex?: number;
  buyerEmail?: string;
  claimed?: boolean;
  claimedBy?: string;
  paymentStatus?: PaymentStatus;
  expiryDate?: Date;
  platformFee?: number;
  totalAmount?: number;
  gasFee?: number;
  gasPrice?: number;
  estimatedGas?: string;
  platformProfit?: number;
  totalReceived?: number;
  payments?: IPaymentBase[];
  blockchainStatus?: BlockchainStatus;
  contractAddress?: string;
  lastPaymentCheck?: Date;
  recipientWallet?: string;
  usdEquivalent?: number;
  network?: Network;
  mnemonic?: string;
  fundsUnlocked?: boolean;
  unlockMessage?: string;
}

// Frontend specific gift type
export interface FrontendGiftType extends IGiftBase {
  // Frontend specific properties can be added here
}

// Request types
export interface CreateGiftRequest {
  recipientFirstName: string;
  recipientLastName: string;
  amount: number;
  currency: string;
  unlockDate: Date;
  buyerEmail: string;
  network: Network;
}

export interface ClaimGiftRequest {
  giftCode: string;
  recipientWallet: string;
}

export interface GiftStatusResponse {
  giftCode: string;
  status: PaymentStatus;
  blockchainStatus: BlockchainStatus;
  amount: number;
  currency: string;
  unlockDate: Date;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 