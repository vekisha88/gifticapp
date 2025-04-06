import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../components/ui/ThemeContext';
import Dashboard from '../../components/screens/Dashboard';

export default function HomeTab() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Dashboard 
        onSendGift={() => {/* Handle in component */}}
        onClaimGift={() => {/* Handle in component */}}
        cryptoData={[
          {
            name: 'Bitcoin',
            symbol: 'BTC',
            icon: 'bitcoin',
            price: 60123.45,
            change: 2.4,
          },
          {
            name: 'Ethereum',
            symbol: 'ETH',
            icon: 'ethereum',
            price: 1845.67,
            change: 1.2,
          },
          {
            name: 'Solana',
            symbol: 'SOL',
            icon: 'solana',
            price: 102.34,
            change: 3.5,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 