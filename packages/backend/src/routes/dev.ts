import express from 'express';
import { getAllWallets, generateNewWallets } from '../controllers/devController.js';

const router = express.Router();

// Simple middleware to restrict routes to development environment
const devOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'This endpoint is only available in development environment'
  });
};

// Apply dev-only middleware to all routes in this router
router.use(devOnly);

// Wallet management routes
router.get('/wallets', getAllWallets);
router.post('/wallets/generate', generateNewWallets);

export default router; 