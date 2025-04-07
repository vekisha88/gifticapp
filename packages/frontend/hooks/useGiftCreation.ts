import { useState, useCallback } from 'react';
import { giftService } from '../services';
import { logger } from '../utils/logger'; // Assuming logger exists
import { handleApiError } from '../utils/errorHandling';
import { CreateGiftData } from '@gifticapp/shared'; // Assuming type exists

interface UseGiftCreationResult {
  createGift: (giftDetails: CreateGiftData) => Promise<any>; // Return type might need adjustment
  isLoading: boolean;
  error: string | null;
  gift: any | null; // Type might need adjustment
  clearError: () => void;
}

/**
 * Custom hook for gift creation functionality
 */
export const useGiftCreation = (): UseGiftCreationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gift, setGift] = useState<any | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createGift = useCallback(async (giftDetails: CreateGiftData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Creating gift with details:', giftDetails);
      const response = await giftService.createGift(giftDetails);
      setGift(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to create gift');
      setError(errorMessage);
      logger.error('Gift creation error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createGift,
    isLoading,
    error,
    gift,
    clearError
  };
}; 