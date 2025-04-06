import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../components/ui/ThemeContext';
import Assets from '../../components/ui/Assets';

export default function AssetsTab() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Assets 
        onAssetPress={(assetId) => {
          // Handle asset press in component
          console.log('Asset pressed:', assetId);
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