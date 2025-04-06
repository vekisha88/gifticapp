import mongoose, { ConnectOptions } from "mongoose";
import { config } from "dotenv";
import { logger } from "../logger.js";

// Load environment variables
config();

// Default MongoDB connection options
const DEFAULT_OPTIONS: ConnectOptions = {
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000
};

/**
 * Establishes a connection to MongoDB
 * @param options Optional connection options
 * @returns The database connection
 */
export async function connectDatabase(options: ConnectOptions = {}): Promise<mongoose.Connection> {
  // Get MongoDB URI from environment or use default
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gifticapp";
  
  // Merge default options with provided options
  const connectionOptions: ConnectOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      logger.info("MongoDB connection already established");
      return mongoose.connection;
    }
    
    // Set connection listeners
    mongoose.connection.on("error", (err: Error) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
    
    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
    
    // Connect to MongoDB
    logger.info(`Connecting to MongoDB at ${mongoUri}`);
    await mongoose.connect(mongoUri, connectionOptions);
    
    logger.info("MongoDB connection established successfully");
    return mongoose.connection;
  } catch (error: any) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Closes the MongoDB connection
 * @returns Promise that resolves when connection is closed
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    }
  } catch (error: any) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
}

export default {
  connectDatabase,
  closeDatabase
}; 

