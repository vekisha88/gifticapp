/**
 * API Routes definitions - Single source of truth for API endpoints
 * This file should be imported by both frontend and backend to ensure consistency
 */

import { 
  ApiResponse, 
  CreateGiftRequest, 
  ClaimGiftRequest, 
  GiftStatusResponse, 
  IGiftBase 
} from '../types/gift';

/**
 * Route definition types with typed request and response objects
 */
export type Route<RequestType = any, ResponseType = any, ParamsType = any, QueryType = any> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  request?: RequestType;
  response: ApiResponse<ResponseType>;
  params?: ParamsType;
  query?: QueryType;
};

/**
 * Gift API Routes
 */
export const GIFT_ROUTES = {
  GET_WALLET: {
    path: '/api/gift/get-wallet',
    method: 'GET',
    description: 'Get an available wallet address for gift creation',
    response: {} as ApiResponse<{address: string, index: number}>
  } as Route<void, {address: string, index: number}>,

  CREATE_GIFT: {
    path: '/api/gift/create',
    method: 'POST',
    description: 'Create a new gift',
    request: {} as CreateGiftRequest,
    response: {} as ApiResponse<IGiftBase>
  } as Route<CreateGiftRequest, IGiftBase>,

  VERIFY_GIFT_GET: {
    path: '/api/gift/verify/:giftCode',
    method: 'GET',
    description: 'Verify a gift code',
    params: { giftCode: '' },
    response: {} as ApiResponse<GiftStatusResponse>
  } as Route<void, GiftStatusResponse, { giftCode: string }>,

  VERIFY_GIFT_POST: {
    path: '/api/gift/verify-code',
    method: 'POST',
    description: 'Verify a gift code (alternative POST endpoint)',
    request: { giftCode: '' },
    response: {} as ApiResponse<GiftStatusResponse>
  } as Route<{ giftCode: string }, GiftStatusResponse>,

  PRECLAIM_GIFT: {
    path: '/api/gift/preclaim',
    method: 'POST',
    description: 'Pre-claim a gift (verify it\'s available and unlock date is valid)',
    request: { giftCode: '' },
    response: {} as ApiResponse<{ 
      canClaim: boolean, 
      giftCode: string, 
      paymentStatus?: string,
      blockchainStatus?: string, 
      error?: string
    }>
  } as Route<{ giftCode: string }>,

  CLAIM_GIFT: {
    path: '/api/gift/claim',
    method: 'POST',
    description: 'Claim a gift',
    request: {} as ClaimGiftRequest,
    response: {} as ApiResponse<void>
  } as Route<ClaimGiftRequest, void>,

  GET_CLAIMED_GIFTS: {
    path: '/api/gift/claimed',
    method: 'GET',
    description: 'Get claimed gifts by recipient address',
    query: { address: '' },
    response: {} as ApiResponse<IGiftBase[]>
  } as Route<void, IGiftBase[], void, { address: string }>,

  CHECK_TRANSFERABLE: {
    path: '/api/gift/check-transferable/:giftCode',
    method: 'GET',
    description: 'Check if a gift is transferable',
    params: { giftCode: '' },
    response: {} as ApiResponse<{ transferable: boolean, reason?: string }>
  } as Route<void, { transferable: boolean, reason?: string }, { giftCode: string }>,

  TRANSFER_FUNDS: {
    path: '/api/gift/transfer-funds',
    method: 'POST',
    description: 'Transfer funds from a gift to another wallet',
    request: { 
      giftCode: '',
      destinationAddress: '',
    },
    response: {} as ApiResponse<{ success: boolean, transactionHash?: string }>
  } as Route<{ giftCode: string, destinationAddress: string }>,

  // Admin routes
  FORCE_PROCESS: {
    path: '/api/gift/force-process',
    method: 'POST',
    description: 'Admin route to force process pending gifts (for testing only)',
    response: {} as ApiResponse<{ processed: number }>
  } as Route<void, { processed: number }>,

  FORCE_RELEASE: {
    path: '/api/gift/force-release',
    method: 'POST',
    description: 'Admin route to force release gifts that are ready (for testing only)',
    response: {} as ApiResponse<{ success: boolean, message: string, transactionHash?: string, releasedCount?: number }>
  } as Route<void, { success: boolean, message: string, transactionHash?: string, releasedCount?: number }>
};

/**
 * All API routes combined
 */
export const API_ROUTES = {
  ...GIFT_ROUTES,
  // Add other route categories here
}; 