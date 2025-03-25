/**
 * @deprecated This file is deprecated. Please use the TypeScript version in '../api/routes.ts'
 * which provides a more typesafe API route definition with full TypeScript support.
 */

/**
 * @typedef {Object} ApiRoutes
 */

/**
 * @typedef {Object} CreateGiftRoute
 * @property {Object} POST
 * @property {import('./index.js').CreateGiftRequest} POST.request
 * @property {import('./index.js').ApiResponse<import('./index.js').IGiftBase>} POST.response
 */

/**
 * @typedef {Object} ClaimGiftRoute
 * @property {Object} POST
 * @property {import('./index.js').ClaimGiftRequest} POST.request
 * @property {import('./index.js').ApiResponse<void>} POST.response
 */

/**
 * @typedef {Object} GiftStatusRoute
 * @property {Object} GET
 * @property {import('./index.js').ApiResponse<import('./index.js').GiftStatusResponse>} GET.response
 */

/**
 * @typedef {Object} GetWalletRoute
 * @property {Object} GET
 * @property {import('./index.js').ApiResponse<{address: string, index: number}>} GET.response
 */

/**
 * @type {Object.<string, CreateGiftRoute | ClaimGiftRoute | GiftStatusRoute | GetWalletRoute>}
 * @deprecated Use the API_ROUTES object from '../api/routes.ts' instead.
 */
export const ApiRoutes = {
  // Gift Routes
  '/api/gift/create': {
    POST: {
      request: {},
      response: {}
    }
  },
  '/api/gift/claim': {
    POST: {
      request: {},
      response: {}
    }
  },
  '/api/gift/status/:giftCode': {
    GET: {
      response: {}
    }
  },
  '/api/gift/get-wallet': {
    GET: {
      response: {}
    }
  }
}; 