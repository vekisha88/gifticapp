import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../components/ui/ThemeContext';
import Gifts from '../../components/ui/Gifts';

// Define the default export explicitly
export default function GiftsTab() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Gifts 
        onGiftPress={(giftId) => {
          // Handle gift press in component
          console.log('Gift pressed:', giftId);
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