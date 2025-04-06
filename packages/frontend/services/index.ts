export { api, formatErrorMessage } from './api';
export { giftService } from './gifts';
export { assetService } from './assets';
export { userService } from './userService';

// Export types
export type { ClaimedGift, ClaimedGiftsResponse, GiftResponse, VerifyGiftResponse } from './gifts';
export type { CryptoAsset, PortfolioResponse, AssetDetailsResponse, CryptoPriceData } from './assets';
export type { User } from './userService';

// Default error formatter
export const formatErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (typeof error === 'string') return error;
  if (error && error.message) return error.message;
  return defaultMessage;
};

// Mock gift service
export const giftService = {
  createGift: async (details: any) => {
    return {
      success: true,
      giftCode: 'GIFT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      walletAddress: '0x' + Math.random().toString(36).substring(2, 40),
    };
  },
  
  formatGiftDetailsForAPI: (details: any, userEmail: string) => {
    return {
      ...details,
      senderEmail: userEmail,
    };
  },
}; 