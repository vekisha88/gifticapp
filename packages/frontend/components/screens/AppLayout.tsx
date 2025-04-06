import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Text } from 'react-native';
import { useTheme, lightTheme } from '../ui/ThemeContext';
import Login from './Login';
import Register from './Register';
import AppContent from './AppContent';
import { userService } from '../../services';

const AppLayout: React.FC = () => {
  console.log("Rendering AppLayout");
  
  // Get theme colors with robust fallback
  const theme = useTheme();
  const colors = theme?.colors || lightTheme;
  
  console.log("Theme colors loaded:", colors ? "yes" : "no");
  
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
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setScreen('login');
  };

  const handleRegisterSuccess = () => {
    setScreen('login');
  };

  const handleNavigateToRegister = () => {
    setScreen('register');
  };

  const handleNavigateToLogin = () => {
    setScreen('login');
  };

  // Safely access background color
  const backgroundColor = colors.background;
  
  console.log("Background color:", backgroundColor);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.container, { backgroundColor }]}>
        {isAuthenticated ? (
          <AppContent onLogout={handleLogout} />
        ) : (
          <>
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
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  }
});

// We no longer need the ThemeProvider wrapper since it's in the root layout
export default AppLayout; 