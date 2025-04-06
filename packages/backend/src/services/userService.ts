import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { logger } from '../logger.js';
import { env } from '@gifticapp/shared';
import { isValidEmail } from '../utils/validation.js';
import { 
  createAuthenticationError, 
  createValidationError,
  createNotFoundError,
  createConflictError
} from '../utils/errorHandler.js';
import { UserRegisterData, UserUpdateData, TokenPayload, AuthResult } from '../types/index.js';

/**
 * Register a new user
 * @param {Object} userData User registration data
 * @returns {Promise<Object>} Created user object without password
 */
export async function registerUser(userData: UserRegisterData): Promise<Record<string, any>> {
  try {
    const { email, password, username, fullName } = userData;
    
    // Validate email
    if (!isValidEmail(email)) {
      throw createValidationError('Invalid email format');
    }
    
    // Validate password
    if (!password || password.length < 8) {
      throw createValidationError('Password must be at least 8 characters long');
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createConflictError('User with this email already exists');
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      username,
      fullName: fullName || '',
    });
    
    // Save user to database
    await user.save();
    
    logger.info(`User registered successfully: ${email}`);
    
    // Return user without password
    return user.toJSON();
  } catch (error: any) {
    logger.error(`Error registering user: ${error.message}`);
    throw error;
  }
}

/**
 * Login user with email and password
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Auth data with token and user info
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw createAuthenticationError('Invalid email or password');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createAuthenticationError('Invalid email or password');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    logger.info(`User logged in: ${email}`);
    
    // Return auth data
    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role
      },
      expiresIn: parseInt(env.jwtExpiresIn) || 3600
    };
  } catch (error: any) {
    logger.error(`Error logging in user: ${error.message}`);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} userId User ID
 * @returns {Promise<Object>} User object
 */
export async function getUserById(userId: string): Promise<Record<string, any>> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User not found');
    }
    return user.toJSON();
  } catch (error: any) {
    logger.error(`Error getting user by ID: ${error.message}`);
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email User email
 * @returns {Promise<Object>} User object
 */
export async function getUserByEmail(email: string): Promise<Record<string, any>> {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw createNotFoundError('User not found');
    }
    return user.toJSON();
  } catch (error: any) {
    logger.error(`Error getting user by email: ${error.message}`);
    throw error;
  }
}

/**
 * Update user preferences
 * @param {string} userId User ID
 * @param {Object} preferences User preferences
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<Record<string, any>> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User not found');
    }
    
    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    
    return user.toJSON();
  } catch (error: any) {
    logger.error(`Error updating user preferences: ${error.message}`);
    throw error;
  }
}

/**
 * Update user profile
 * @param {string} userId User ID
 * @param {Object} profileData Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserProfile(userId: string, profileData: UserUpdateData): Promise<Record<string, any>> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User not found');
    }
    
    // Update allowable fields
    if (profileData.username) user.username = profileData.username;
    if (profileData.fullName) user.fullName = profileData.fullName;
    if (profileData.email && isValidEmail(profileData.email)) user.email = profileData.email;
    
    await user.save();
    
    return user.toJSON();
  } catch (error: any) {
    logger.error(`Error updating user profile: ${error.message}`);
    throw error;
  }
}

/**
 * Change user password
 * @param {string} userId User ID
 * @param {string} currentPassword Current password
 * @param {string} newPassword New password
 * @returns {Promise<boolean>} Success indicator
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw createAuthenticationError('Current password is incorrect');
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      throw createValidationError('New password must be at least 8 characters long');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    logger.info(`Password changed for user: ${user.email}`);
    
    return true;
  } catch (error: any) {
    logger.error(`Error changing password: ${error.message}`);
    throw error;
  }
}

/**
 * Generate JWT token for user
 * @param {Object} user User object
 * @returns {string} JWT token
 */
function generateToken(user: any): string {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    } as TokenPayload,
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

/**
 * Verify JWT token
 * @param {string} token JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch (error: any) {
    logger.error(`Error verifying token: ${error.message}`);
    throw createAuthenticationError('Invalid or expired token');
  }
}

export default {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  updateUserPreferences,
  updateUserProfile,
  changePassword,
  verifyToken
}; 

