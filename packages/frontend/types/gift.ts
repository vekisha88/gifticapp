export type CurrencyKey = "MATIC" | "ETH" | "WBTC" | "USDC" | "USDT" | "DAI";

export interface ClaimedGiftType {
  giftCode: string;
  currency: CurrencyKey;
  amount: number;
  recipientFirstName: string;
  recipientLastName: string;
  unlockDate: string;
  walletAddress: string;
  paymentStatus?: string;
  mnemonic?: string;
  claimed?: boolean;
  fee?: number;
  totalAmount?: number;
  gasFee?: number;
  fundsUnlocked?: boolean;
  unlockMessage?: string;
}

export interface GiftDetailsType {
  giftCode: string;
  currency: CurrencyKey;
  amount: number;
  recipientFirstName: string;
  recipientLastName: string;
  unlockDate: string;
  walletAddress: string;
  paymentStatus?: string;
  fee?: number;
  totalAmount?: number;
  gasFee?: number;
  fundsUnlocked?: boolean;
  unlockMessage?: string;
} 