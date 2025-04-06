import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../components/ui/ThemeContext';
import { router } from 'expo-router';
import { userService } from '../services';
import Login from '../components/screens/Login';
import Register from '../components/screens/Register';

// Define the default export explicitly
export default function IndexScreen() {
  const { colors } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [screen, setScreen] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    console.log("Checking auth status...");
    
    const checkAuth = async () => {
      try {
        const isLoggedIn = await userService.isAuthenticated();
        console.log("Auth status:", isLoggedIn ? "authenticated" : "not authenticated");
        
        if (isLoggedIn) {
          // If user is authenticated, navigate to the tab layout
          router.replace('/(tabs)');
        }
        
        setIsAuthenticated(isLoggedIn);
        setError(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    router.replace('/(tabs)');
  };

  const handleNavigateToRegister = () => {
    setScreen('register');
  };

  const handleNavigateToLogin = () => {
    setScreen('login');
  };

  const handleRegisterSuccess = () => {
    setScreen('login');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  // If not authenticated, show login/register screens
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {screen === 'login' ? (
        <Login
          onLoginSuccess={handleLogin}
          onNavigateToRegister={handleNavigateToRegister}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={handleNavigateToLogin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
