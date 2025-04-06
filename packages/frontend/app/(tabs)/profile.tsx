import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../components/ui/ThemeContext';
import Profile from '../../components/screens/Profile';

export default function ProfileTab() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Profile 
        onLogout={() => {
          // Handle logout in component  
          console.log('Logout requested');
        }}
        onThemeChange={(isDarkMode) => {
          // Theme change is handled by ThemeContext
          console.log('Theme change requested:', isDarkMode ? 'dark' : 'light');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 