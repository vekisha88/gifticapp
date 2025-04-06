import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { borderRadius, shadows, spacing, typography } from './styles';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';

// Types for cryptocurrency asset
interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  amount: number;
  value: number;
  priceChange: number;
  gifts: number;
}

interface AssetsProps {
  assets?: CryptoAsset[];
  onAssetPress: (assetId: string) => void;
  onAddAsset: () => void;
}

const Assets: React.FC<AssetsProps> = ({
  assets = [
    {
      id: 'btc-1',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: 'bitcoin',
      amount: 0.023,
      value: 825.12,
      priceChange: 2.4,
      gifts: 2,
    },
    {
      id: 'eth-1',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'ethereum',
      amount: 0.35,
      value: 319.88,
      priceChange: -1.2,
      gifts: 1,
    },
    {
      id: 'sol-1',
      name: 'Solana',
      symbol: 'SOL',
      icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
      amount: 1.5,
      value: 100.00,
      priceChange: 5.6,
      gifts: 0,
    },
  ],
  onAssetPress,
  onAddAsset,
}) => {
  const { colors, isDark } = useTheme();
  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1m' | '1y'>('1m');

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  const getCryptoIcon = (icon: string) => {
    if (icon === 'bitcoin') {
      return <FontAwesome5 name="bitcoin" size={24} color={colors.text} />;
    } else if (icon === 'ethereum') {
      return <FontAwesome5 name="ethereum" size={24} color={colors.text} />;
    } else {
      return (
        <Image
          source={{ uri: icon }}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      );
    }
  };

  const renderAssetItem = ({ item }: { item: CryptoAsset }) => (
    <TouchableOpacity
      style={[styles.assetItem, { borderBottomColor: colors.border }]}
      onPress={() => onAssetPress(item.id)}
    >
      <View style={styles.assetIconContainer}>
        {getCryptoIcon(item.icon)}
      </View>
      
      <View style={styles.assetDetails}>
        <View style={styles.assetNameContainer}>
          <Text style={[styles.assetName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
            {item.symbol}
          </Text>
        </View>
        
        <View style={styles.assetValues}>
          <Text style={[styles.assetValue, { color: colors.text }]}>
            ${item.value.toLocaleString()}
          </Text>
          <Text
            style={[
              styles.assetChange,
              { color: item.priceChange >= 0 ? '#10B981' : '#EF4444' },
            ]}
          >
            {item.priceChange >= 0 ? '+' : ''}{item.priceChange}%
          </Text>
        </View>
        
        <View style={styles.assetAmountContainer}>
          <Text style={[styles.assetAmount, { color: colors.textSecondary }]}>
            {item.amount} {item.symbol}
          </Text>
          {item.gifts > 0 && (
            <View style={[styles.giftBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.giftBadgeText}>{item.gifts}</Text>
              <FontAwesome5 name="gift" size={10} color="white" style={{ marginLeft: 2 }} />
            </View>
          )}
        </View>
      </View>
      
      <MaterialIcons
        name="keyboard-arrow-right"
        size={24}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Assets</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: isDark ? colors.card : 'rgba(0, 0, 0, 0.05)' },
          ]}
          onPress={onAddAsset}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.portfolioContainer}>
          <Card style={styles.portfolioSummary}>
            <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>
              Total Value
            </Text>
            <Text style={[styles.portfolioValue, { color: colors.text }]}>
              ${totalValue.toLocaleString()}
            </Text>
            
            <View style={styles.timeframeButtons}>
              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  timeframe === '1d' && [
                    styles.timeframeButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => setTimeframe('1d')}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    { color: timeframe === '1d' ? 'white' : colors.text },
                  ]}
                >
                  1D
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  timeframe === '1w' && [
                    styles.timeframeButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => setTimeframe('1w')}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    { color: timeframe === '1w' ? 'white' : colors.text },
                  ]}
                >
                  1W
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  timeframe === '1m' && [
                    styles.timeframeButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => setTimeframe('1m')}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    { color: timeframe === '1m' ? 'white' : colors.text },
                  ]}
                >
                  1M
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  timeframe === '1y' && [
                    styles.timeframeButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => setTimeframe('1y')}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    { color: timeframe === '1y' ? 'white' : colors.text },
                  ]}
                >
                  1Y
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Chart Placeholder - In a real app, we would insert a chart component here */}
            <View
              style={[
                styles.chartPlaceholder,
                { backgroundColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.05)' },
              ]}
            >
              <Text style={{ color: colors.textSecondary }}>Portfolio Chart</Text>
            </View>
          </Card>
        </View>

        <View style={styles.assetsListContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Assets
          </Text>
          
          <FlatList
            data={assets}
            renderItem={renderAssetItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No assets yet. Tap + to add assets.
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioContainer: {
    padding: spacing.medium,
  },
  portfolioSummary: {
    padding: spacing.medium,
  },
  portfolioLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  timeframeButtons: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  timeframeButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    marginRight: spacing.small,
  },
  timeframeButtonActive: {
    backgroundColor: 'blue',
  },
  timeframeButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 150,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetsListContainer: {
    padding: spacing.medium,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: '600',
    marginBottom: spacing.medium,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
  },
  assetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  assetDetails: {
    flex: 1,
  },
  assetNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  assetName: {
    fontWeight: '600',
    fontSize: typography.fontSize.medium,
    marginRight: spacing.xs,
  },
  assetSymbol: {
    fontSize: typography.fontSize.small,
  },
  assetValues: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  assetValue: {
    fontWeight: '600',
    fontSize: typography.fontSize.medium,
    marginRight: spacing.small,
  },
  assetChange: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
  },
  assetAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetAmount: {
    fontSize: typography.fontSize.small,
  },
  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 100,
    marginLeft: spacing.small,
  },
  giftBadgeText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.large,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.medium,
  },
});

export default Assets; 