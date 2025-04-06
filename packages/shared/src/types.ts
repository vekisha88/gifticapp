// Shared types that can be used across packages
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CurrencyOption {
  key: string;
  label: string;
  icon: any; // Adjust based on your image import type
  priceInUSD?: number;
  binanceSymbol?: string;
}

// Add more shared types as needed 