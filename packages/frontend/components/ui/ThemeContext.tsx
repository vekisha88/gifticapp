import React, { createContext, useState, useContext, useEffect } from 'react';
import { ColorSchemeName } from 'react-native';
import { userService } from '../../services/userService';

// Define theme colors with strict types
export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  errorLight: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
};

// Define theme presets
export const lightTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryDark: '#1D4ED8',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  background: '#FFFFFF',
  card: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export const darkTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#1E40AF',
  primaryDark: '#93C5FD',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
};

// Theme context type
type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  currentTheme: 'light' | 'dark' | 'auto';
};

// Create context with default light theme values
const ThemeContext = createContext<ThemeContextType>({
  colors: lightTheme,
  isDark: false,
  setTheme: () => {},
  currentTheme: 'auto',
});

// Hook for consuming theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Always return a valid context even if it's used outside a provider
  if (!context) {
    console.warn('useTheme was called outside of ThemeProvider, using default light theme');
    return {
      colors: lightTheme,
      isDark: false,
      setTheme: () => {},
      currentTheme: 'auto'
    };
  }
  return context;
};

// Props for ThemeProvider
interface ThemeProviderProps {
  children: React.ReactNode;
  systemColorScheme?: ColorSchemeName;
}

// ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  systemColorScheme = 'light'
}) => {
  // Theme state
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'auto'>('auto');
  const [colors, setColors] = useState<ThemeColors>(lightTheme);
  
  // Determine if dark mode is active
  const isDark = 
    themePreference === 'dark' || 
    (themePreference === 'auto' && systemColorScheme === 'dark');
  
  // Update colors when theme changes
  useEffect(() => {
    // Select the appropriate theme object
    const newColors = isDark ? darkTheme : lightTheme;
    
    // Apply the theme
    setColors(newColors);
    
    // Log for debugging
    console.log(`Theme updated: ${isDark ? 'dark' : 'light'} mode`);
  }, [isDark, systemColorScheme, themePreference]);

  // Theme setter function
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemePreference(newTheme);
    
    // Could add persistence here if needed
    console.log(`Theme preference changed to: ${newTheme}`);
  };
  
  // Create context value with guaranteed values
  const contextValue: ThemeContextType = {
    colors: colors || lightTheme, // Ensure colors is never undefined
    isDark,
    setTheme: handleThemeChange,
    currentTheme: themePreference,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 