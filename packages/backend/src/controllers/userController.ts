import { Request, Response } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserById,
  updateUserPreferences,
  updateUserProfile,
  changePassword
} from '../services/userService.js';
import { logger } from '../logger.js';
import { sendSuccess, sendErrorResponse } from '../utils/apiResponses.js';

/**
 * Register a new user
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const userData = req.body;
    const user = await registerUser(userData);
    
    sendSuccess(res, { user }, 'User registered successfully', 201);
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.register', 400);
  }
}

/**
 * Login user
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const authData = await loginUser(email, password);
    
    sendSuccess(res, authData, 'Login successful');
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.login', 401);
  }
}

/**
 * Get current user profile
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    
    sendSuccess(res, { user }, 'User profile retrieved');
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.getCurrentUser');
  }
}

/**
 * Update user preferences
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    const updatedUser = await updateUserPreferences(userId, preferences);
    
    sendSuccess(res, { user: updatedUser }, 'Preferences updated successfully');
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.updatePreferences');
  }
}

/**
 * Update user profile
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    
    const updatedUser = await updateUserProfile(userId, profileData);
    
    sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.updateProfile');
  }
}

/**
 * Change user password
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function updatePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    await changePassword(userId, currentPassword, newPassword);
    
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error: any) {
    sendErrorResponse(res, error, 'userController.updatePassword');
  }
} 

