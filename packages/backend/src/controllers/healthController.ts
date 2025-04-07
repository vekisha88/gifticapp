import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getBlockchainStatus } from '../services/blockchainService.js';
import { logger } from '../logger.js';

interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      error?: string;
    };
    blockchain: {
      status: string;
      error?: string;
    };
  };
}

/**
 * Handler for the health check endpoint
 */
export const getHealthStatus = async (req: Request, res: Response): Promise<void> => {
  logger.debug('Health check requested');
  
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'ok'
      },
      blockchain: {
        status: 'ok'
      }
    }
  };

  // Check database connection
  if (mongoose.connection.readyState !== 1) {
    healthStatus.status = 'degraded';
    healthStatus.services.database = {
      status: 'error',
      error: 'Database not connected'
    };
    logger.warn('Health check: Database not connected');
  }

  // Check blockchain connection
  try {
    const blockchainStatus = await getBlockchainStatus();
    if (blockchainStatus.status !== 'connected') {
      healthStatus.status = 'degraded';
      healthStatus.services.blockchain = {
        status: 'error',
        error: blockchainStatus.error || 'Blockchain not connected'
      };
      logger.warn('Health check: Blockchain connection issues', blockchainStatus);
    }
  } catch (error: any) {
    healthStatus.status = 'degraded';
    healthStatus.services.blockchain = {
      status: 'error',
      error: error.message || 'Failed to check blockchain status'
    };
    logger.error('Health check: Failed to check blockchain status', error);
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
  logger.debug('Health check completed', { statusCode, healthStatus });
}; 