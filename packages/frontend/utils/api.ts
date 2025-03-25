import axios, { AxiosRequestConfig } from 'axios';
import { API_ROUTES, Route } from '@gifticapp/shared';
import { API_BASE_URL } from '../config/env';

/**
 * Makes a type-safe API request using the route definition
 * 
 * @param route The route definition from API_ROUTES
 * @param data Request data (for POST, PUT, PATCH)
 * @param params URL parameters (replaces :param in URL)
 * @param query Query parameters
 * @param config Additional axios config
 * @returns Promise with the typed response
 */
export async function apiRequest<Req, Res, Params = any, Query = any>(
  route: Route<Req, Res, Params, Query>,
  data?: Req,
  params?: Params,
  query?: Query,
  config?: AxiosRequestConfig
) {
  // Replace URL parameters like :id with actual values
  let url = route.path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  // Create the full URL with query parameters
  const fullUrl = `${API_BASE_URL}${url}`;
  
  try {
    const response = await axios({
      url: fullUrl,
      method: route.method,
      data: data,
      params: query,
      ...config
    });
    
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error) && error.response) {
      // Return the error response from the API if available
      return error.response.data;
    }
    
    // For network errors or other issues, create a standard error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Utility methods for common API calls
 */
export const api = {
  // Gift API methods
  gift: {
    /**
     * Get an available wallet for gift creation
     */
    getWallet: () => 
      apiRequest(API_ROUTES.GET_WALLET),
    
    /**
     * Create a new gift
     */
    createGift: (data: typeof API_ROUTES.CREATE_GIFT.request) => 
      apiRequest(API_ROUTES.CREATE_GIFT, data),
    
    /**
     * Verify a gift code via GET
     */
    verifyGift: (giftCode: string) => 
      apiRequest(API_ROUTES.VERIFY_GIFT_GET, undefined, { giftCode }),
    
    /**
     * Verify a gift code via POST
     */
    verifyGiftPost: (giftCode: string) => 
      apiRequest(API_ROUTES.VERIFY_GIFT_POST, { giftCode }),
    
    /**
     * Pre-claim a gift
     */
    preclaimGift: (giftCode: string) => 
      apiRequest(API_ROUTES.PRECLAIM_GIFT, { giftCode }),
    
    /**
     * Claim a gift
     */
    claimGift: (data: typeof API_ROUTES.CLAIM_GIFT.request) => 
      apiRequest(API_ROUTES.CLAIM_GIFT, data),
    
    /**
     * Get claimed gifts for a wallet address
     */
    getClaimedGifts: (address: string) => 
      apiRequest(API_ROUTES.GET_CLAIMED_GIFTS, undefined, undefined, { address }),
    
    /**
     * Check if a gift is transferable
     */
    checkTransferable: (giftCode: string) => 
      apiRequest(API_ROUTES.CHECK_TRANSFERABLE, undefined, { giftCode }),
    
    /**
     * Transfer gift funds to another wallet
     */
    transferFunds: (giftCode: string, destinationAddress: string) => 
      apiRequest(API_ROUTES.TRANSFER_FUNDS, { giftCode, destinationAddress }),
  }
};

export default api; 