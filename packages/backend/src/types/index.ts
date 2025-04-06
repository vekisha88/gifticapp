/**
 * Core application types
 */

// User-related types
export interface UserRegisterData {
  email: string;
  password: string;
  username: string;
  fullName?: string;
}

export interface UserUpdateData {
  username?: string;
  fullName?: string;
  email?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  language?: string;
  [key: string]: any;
}

// Gift-related types
export interface GiftCreateParams {
  recipient: string;
  amount: number;
  unlockTime: number;
  giftId: number | string;
}

export interface GiftResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  giftId?: number | string;
  message?: string;
}

// Blockchain-related types
export interface BlockchainStatus {
  status: 'UP' | 'DOWN';
  network?: string;
  blockNumber?: number;
  gasPrice?: string;
  contractStatus?: string;
  error?: string;
}

// Wallet-related types
export interface WalletData {
  address: string;
  encryptedPrivateKey: string;
  balance?: string;
  reserved?: boolean;
}

// API response types
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: any[];
}

// Auth-related types
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  token: string;
  expiresIn: number;
}

// Error types
export interface AppErrorData {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Blockchain types
export interface BlockchainTransaction {
  hash: string;
  blockNumber?: number;
  from: string;
  to: string;
  value: string;
  timestamp?: number;
}

// User types
export interface UserLoginParams {
  email: string;
  password: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
} 