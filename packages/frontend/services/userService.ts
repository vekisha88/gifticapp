import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock user data
const MOCK_USER = {
  id: '123456',
  name: 'Demo User',
  email: 'demo@example.com',
  walletAddress: '0x123456789abcdef',
  preferences: {
    theme: 'auto',
    notifications: true,
  },
};

const TOKEN_KEY = 'giftic_auth_token';
const USER_KEY = 'giftic_user';

export const userService = {
  // Login with credentials
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      // For demo, we'll just simulate a successful login
      await AsyncStorage.setItem(TOKEN_KEY, 'mock_token_' + Date.now());
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
      
      console.log('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  },
  
  // Register a new user
  register: async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      // For demo, we'll just simulate a successful registration
      const user = { ...MOCK_USER, email, name };
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(TOKEN_KEY, 'mock_token_' + Date.now());
      
      console.log('Registration successful');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },
  
  // Logout the current user
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },
  
  // Get the current user data
  getCurrentUser: async (): Promise<any> => {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return null;
      
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },
  
  // Update user profile
  updateProfile: async (userData: any): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  },
}; 