import mongoose from 'mongoose';
import { logger, logDatabase, logError } from '../logger.js';
import { createDatabaseError, handleError } from '../utils/errorHandler.js';

const defaultMongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/giftic";

/**
 * Connect to MongoDB database
 * @param {string} mongoURI MongoDB connection URI
 * @returns {Promise<boolean>} True if connection successful
 */
export async function connectDatabase(mongoURI = defaultMongoURI) {
  try {
    await mongoose.connect(mongoURI);
    logDatabase("MongoDB connected successfully");
    return true;
  } catch (err) {
    const dbError = createDatabaseError(
      "Failed to connect to MongoDB",
      "DB_CONNECTION_ERROR",
      { mongoURI, originalError: err.message }
    );
    handleError(dbError, "connectDatabase");
    throw dbError;
  }
}

/**
 * Disconnect from MongoDB database
 * @returns {Promise<boolean>} True if disconnection successful
 */
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logDatabase("MongoDB disconnected successfully");
    return true;
  } catch (err) {
    const dbError = createDatabaseError(
      "Failed to disconnect from MongoDB",
      "DB_DISCONNECTION_ERROR",
      { originalError: err.message }
    );
    handleError(dbError, "disconnectDatabase");
    throw dbError;
  }
}

/**
 * Check MongoDB connection status
 * @returns {boolean} True if connected, false otherwise
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get MongoDB connection instance
 * @returns {mongoose.Connection} Mongoose connection instance
 */
export function getConnection() {
  return mongoose.connection;
} 