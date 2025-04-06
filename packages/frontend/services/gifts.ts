import { api } from './api';
import { GiftDetails } from '../components/screens/CreateGift';

// Define types for API responses
export interface GiftResponse {
  success: boolean;
  giftCode?: string;
  walletAddress?: string;
  paymentAddress?: string;
  error?: string;
}

export interface ClaimedGift {
  giftCode: string;
  recipientFirstName: string;
  recipientLastName: string;
  amount: number;
  currency: string;
  unlockDate: string;
  status: 'locked' | 'unlocked' | 'pending';
  walletAddress: string;
  paymentStatus?: string;
  value?: number;
  senderName?: string;
  isTransferable?: boolean;
}

export interface ClaimedGiftsResponse {
  success: boolean;
  gifts?: ClaimedGift[];
  error?: string;
}

export interface VerifyGiftResponse {
  success: boolean;
  giftDetails?: any;
  error?: string;
}

export const giftService = {
  /**
   * Create a new gift
   */
  createGift: async (giftDetails: {
    recipientFirstName: string;
    recipientLastName: string;
    giftAmount: number;
    currency: string;
    unlockDate: Date;
    buyerEmail: string;
  }): Promise<GiftResponse> => {
    const response = await api.post('/api/gift/create', giftDetails);
    return response.data;
  },

  /**
   * Get wallet address for payment
   */
  getWalletAddress: async (): Promise<{ success: boolean; walletAddress?: string; error?: string }> => {
    const response = await api.get('/api/gift/get-wallet');
    return response.data;
  },

  /**
   * Verify a gift code
   */
  verifyGiftCode: async (giftCode: string): Promise<VerifyGiftResponse> => {
    const response = await api.post('/api/gift/verify-code', { giftCode });
    return response.data;
  },

  /**
   * Claim a gift
   */
  claimGift: async (giftCode: string, recipientEmail: string, recipientAddress: string): Promise<{
    success: boolean;
    mnemonic?: string;
    giftAmount?: number;
    error?: string;
  }> => {
    const response = await api.post('/api/gift/claim', {
      giftCode,
      recipientEmail,
      recipientAddress,
    });
    return response.data;
  },

  /**
   * Get gift mnemonic without claiming it yet
   */
  preClaimGift: async (giftCode: string, recipientEmail: string, recipientAddress: string): Promise<{
    success: boolean;
    mnemonic?: string;
    giftAmount?: number;
    error?: string;
  }> => {
    const response = await api.post('/api/gift/preclaim', {
      giftCode,
      recipientEmail,
      recipientAddress,
    });
    return response.data;
  },

  /**
   * Get all claimed gifts for a user
   */
  getClaimedGifts: async (email: string): Promise<ClaimedGiftsResponse> => {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await api.get(`/api/gift/claimed?email=${encodeURIComponent(email)}&_t=${timestamp}`);
    return response.data;
  },

  /**
   * Format gift data from CreateGift component for API
   */
  formatGiftDetailsForAPI: (details: GiftDetails, buyerEmail: string): any => {
    return {
      recipientFirstName: details.recipientFirstName,
      recipientLastName: details.recipientLastName,
      giftAmount: parseFloat(details.amount),
      currency: details.cryptocurrency,
      unlockDate: details.unlockDate,
      buyerEmail,
    };
  },

  /**
   * Check if a gift is transferable
   */
  checkGiftTransferable: async (giftCode: string): Promise<{
    success: boolean;
    isTransferable?: boolean;
    error?: string;
  }> => {
    try {
      const response = await api.get(`/api/gift/check-transferable/${giftCode}`);
      return response.data;
    } catch (error) {
      console.error('Error checking gift transferability:', error);
      return { 
        success: false, 
        error: 'Failed to check gift transferability' 
      };
    }
  },

  /**
   * Transfer gift funds to another wallet
   */
  transferFunds: async (giftCode: string, destinationAddress: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> => {
    try {
      const response = await api.post('/api/gift/transfer-funds', {
        giftCode,
        destinationAddress
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      return { 
        success: false, 
        error: 'Failed to transfer funds' 
      };
    }
  }
}; 