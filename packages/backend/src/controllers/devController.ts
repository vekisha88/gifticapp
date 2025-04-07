import { Request, Response } from 'express';
import { Wallet } from '../models/wallet.js';
import { generateWallets } from '../utils/walletGenerator.js';
import { logger } from '../logger.js';

interface SafeWallet {
  address: string;
  reserved?: boolean;
  balance?: string;
  createdAt?: Date;
}

// Controller to get all wallets (dev only)
export const getAllWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({}).lean();
    
    // Create a safe version without private keys
    const safeWallets: SafeWallet[] = wallets.map(wallet => ({
      address: wallet.address,
      reserved: wallet.reserved,
      balance: wallet.balance,
      createdAt: wallet.createdAt
    }));
    
    res.status(200).json({
      success: true,
      count: safeWallets.length,
      data: safeWallets
    });
  } catch (error: any) {
    logger.error('Error fetching wallets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch wallets'
    });
  }
};

// Controller to generate new wallets (dev only)
export const generateNewWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = parseInt(req.query.count as string) || 5;
    const wallets = await generateWallets(count);
    
    // Create a safe version without private keys
    const safeWallets: SafeWallet[] = wallets.map(wallet => ({
      address: wallet.address
    }));
    
    res.status(201).json({
      success: true,
      count: safeWallets.length,
      data: safeWallets
    });
  } catch (error: any) {
    logger.error('Error generating wallets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate wallets'
    });
  }
}; 