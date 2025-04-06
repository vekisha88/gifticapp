import { api } from './api';
import axios from 'axios';
import { ClaimedGift } from './gifts';

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  amount: number;
  value: number;
  priceChange: number;
  gifts: number;
}

export interface AssetDetailsResponse {
  success: boolean;
  asset?: CryptoAsset;
  error?: string;
}

export interface PortfolioResponse {
  success: boolean;
  assets?: CryptoAsset[];
  totalValue?: number;
  error?: string;
}

export interface CryptoPriceData {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export const assetService = {
  /**
   * Get user's portfolio of crypto assets
   * This will aggregate assets across all gifts
   */
  getPortfolio: async (email: string): Promise<PortfolioResponse> => {
    try {
      // Currently, backend doesn't have a specific portfolio endpoint
      // So we'll get claimed gifts and then format them as assets
      const response = await api.get(`/api/gift/claimed?email=${encodeURIComponent(email)}`);
      
      if (response.data.success && response.data.gifts) {
        // Group gifts by currency
        const assetsMap = new Map<string, CryptoAsset>();
        
        // Get current prices for all currencies
        const currencies = [...new Set(response.data.gifts.map((gift: any) => gift.currency.toLowerCase()))];
        const priceData = await assetService.getCryptoPrices(currencies);
        
        // Process each gift and add to appropriate asset
        response.data.gifts.forEach((gift: any) => {
          const currency = gift.currency.toLowerCase();
          const price = priceData[currency]?.usd || 0;
          const priceChange = priceData[currency]?.usd_24h_change || 0;
          
          if (assetsMap.has(currency)) {
            // Asset already exists, update it
            const asset = assetsMap.get(currency)!;
            asset.amount += gift.amount;
            asset.value = asset.amount * price;
            asset.gifts += 1;
          } else {
            // Create new asset
            assetsMap.set(currency, {
              id: currency,
              name: getCryptoName(currency),
              symbol: gift.currency,
              icon: getCryptoIcon(currency),
              amount: gift.amount,
              value: gift.amount * price,
              priceChange,
              gifts: 1
            });
          }
        });
        
        // Convert map to array
        const assets = Array.from(assetsMap.values());
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        
        return {
          success: true,
          assets,
          totalValue
        };
      }
      
      return {
        success: false,
        error: 'No assets found'
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return {
        success: false,
        error: 'Failed to fetch portfolio data'
      };
    }
  },
  
  /**
   * Get details for a specific asset
   */
  getAssetDetails: async (assetId: string, email: string): Promise<AssetDetailsResponse> => {
    try {
      // Get portfolio first
      const portfolio = await assetService.getPortfolio(email);
      
      if (portfolio.success && portfolio.assets) {
        const asset = portfolio.assets.find(a => a.id === assetId);
        
        if (asset) {
          return {
            success: true,
            asset
          };
        }
      }
      
      return {
        success: false,
        error: 'Asset not found'
      };
    } catch (error) {
      console.error('Error fetching asset details:', error);
      return {
        success: false,
        error: 'Failed to fetch asset details'
      };
    }
  },
  
  /**
   * Get current prices for multiple cryptocurrencies
   */
  getCryptoPrices: async (currencies: string[]): Promise<CryptoPriceData> => {
    try {
      const coinIds = currencies.join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return {};
    }
  },
  
  /**
   * Get trending cryptocurrencies
   */
  getTrendingCryptos: async (): Promise<any[]> => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending');
      return response.data.coins.slice(0, 5).map((item: any) => ({
        name: item.item.name,
        symbol: item.item.symbol,
        price: 0, // We'll need to fetch prices separately
        change: 0,
        icon: item.item.thumb
      }));
    } catch (error) {
      console.error('Error fetching trending cryptos:', error);
      return [];
    }
  },
  
  /**
   * Get gifts related to a specific asset
   */
  getAssetGifts: async (assetId: string, email: string): Promise<{
    success: boolean;
    gifts?: ClaimedGift[];
    error?: string;
  }> => {
    try {
      // First get all claimed gifts
      const response = await api.get(`/api/gift/claimed?email=${encodeURIComponent(email)}`);
      
      if (response.data.success && response.data.gifts) {
        // Filter gifts that match the asset's currency
        const relatedGifts = response.data.gifts.filter(
          (gift: any) => gift.currency.toLowerCase() === assetId.toLowerCase()
        );
        
        return {
          success: true,
          gifts: relatedGifts
        };
      }
      
      return {
        success: false,
        error: 'No gifts found for this asset'
      };
    } catch (error) {
      console.error('Error fetching asset gifts:', error);
      return {
        success: false,
        error: 'Failed to fetch gifts related to this asset'
      };
    }
  }
};

// Helper functions to standardize crypto data
function getCryptoName(currency: string): string {
  const nameMap: Record<string, string> = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'matic-network': 'Polygon',
    'ripple': 'Ripple',
    'binancecoin': 'BNB',
    'solana': 'Solana',
    'dogecoin': 'Dogecoin',
    'cardano': 'Cardano',
    'tron': 'TRON',
    'the-open-network': 'TON',
    'chainlink': 'Chainlink',
    // Add more as needed
  };
  
  return nameMap[currency] || currency.charAt(0).toUpperCase() + currency.slice(1);
}

function getCryptoIcon(currency: string): string {
  const iconMap: Record<string, string> = {
    'bitcoin': 'bitcoin',
    'ethereum': 'ethereum',
    // For other currencies, we can use external image URLs
    'solana': 'https://cryptologos.cc/logos/solana-sol-logo.svg',
    // Add more as needed
  };
  
  return iconMap[currency] || '';
} 