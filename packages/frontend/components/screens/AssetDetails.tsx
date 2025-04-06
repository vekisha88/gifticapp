import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import { Card, TouchableCard } from '../ui/Card';
import Button from '../ui/Button';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { assetService, userService, CryptoAsset, ClaimedGift } from '../../services';

interface AssetDetailsProps {
  assetId: string;
  onBack: () => void;
  onSendGift: () => void;
  onViewGift: (giftId: string) => void;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({
  assetId,
  onBack,
  onSendGift,
  onViewGift,
}) => {
  const { colors, isDark } = useTheme();
  const [asset, setAsset] = useState<CryptoAsset | null>(null);
  const [relatedGifts, setRelatedGifts] = useState<ClaimedGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1m' | '1y'>('1w');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch asset data on mount
  useEffect(() => {
    const fetchData = async () => {
      const email = await userService.getUserEmail();
      setUserEmail(email);
      
      if (email) {
        fetchAssetDetails(email);
      }
    };
    
    fetchData();
  }, [assetId]);

  // Fetch asset details and related gifts
  const fetchAssetDetails = async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // Fetch asset details
      const assetResponse = await assetService.getAssetDetails(assetId, email);
      if (assetResponse.success && assetResponse.asset) {
        setAsset(assetResponse.asset);
      }
      
      // Fetch gifts related to this asset
      const giftsResponse = await assetService.getAssetGifts(assetId, email);
      if (giftsResponse.success && giftsResponse.gifts) {
        setRelatedGifts(giftsResponse.gifts);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (userEmail) {
      fetchAssetDetails(userEmail);
    }
  };

  // Render cryptocurrency icon
  const renderCryptoIcon = () => {
    if (!asset) return null;
    
    if (asset.icon === 'bitcoin') {
      return <FontAwesome5 name="bitcoin" size={24} color={colors.text} />;
    } else if (asset.icon === 'ethereum') {
      return <FontAwesome5 name="ethereum" size={24} color={colors.text} />;
    } else if (asset.icon) {
      return (
        <View style={styles.cryptoImage}>
          <Image 
            source={{ uri: asset.icon }} 
            style={{ width: 24, height: 24 }} 
            resizeMode="contain" 
          />
        </View>
      );
    } else {
      // Fallback to text if no icon available
      return (
        <View
          style={[
            styles.cryptoIconFallback,
            { backgroundColor: isDark ? colors.card : 'rgba(0, 0, 0, 0.05)' },
          ]}
        >
          <Text style={[styles.cryptoIconText, { color: colors.text }]}>
            {asset.symbol.charAt(0)}
          </Text>
        </View>
      );
    }
  };

  // Render gift item
  const renderGiftItem = (gift: ClaimedGift) => {
    const status = determineGiftStatus(gift);
    
    return (
      <TouchableCard 
        style={styles.giftItem}
        onPress={() => onViewGift(gift.giftCode)}
      >
        <View style={styles.giftHeader}>
          <Text style={[styles.giftRecipient, { color: colors.text }]}>
            {gift.recipientFirstName} {gift.recipientLastName}
          </Text>
          <View style={[
            styles.giftStatusBadge,
            { backgroundColor: getStatusColor(status) + '20' },
          ]}>
            <Text style={[styles.giftStatusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.giftDetails}>
          <Text style={[styles.giftAmount, { color: colors.text }]}>
            {gift.amount} {gift.currency}
          </Text>
          
          <Text style={[styles.giftDate, { color: colors.textSecondary }]}>
            Unlocks: {formatDate(gift.unlockDate)}
          </Text>
        </View>
      </TouchableCard>
    );
  };
  
  // Helper function to determine gift status
  const determineGiftStatus = (gift: ClaimedGift): 'locked' | 'unlocked' | 'pending' => {
    const now = new Date();
    const unlockDate = new Date(gift.unlockDate);
    
    if (gift.paymentStatus !== 'received') {
      return 'pending';
    } else if (unlockDate > now) {
      return 'locked';
    } else {
      return 'unlocked';
    }
  };
  
  // Get status color based on status
  const getStatusColor = (status: 'locked' | 'unlocked' | 'pending') => {
    switch (status) {
      case 'locked':
        return colors.primary;
      case 'unlocked':
        return colors.success;
      case 'pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate time until unlock
  const getTimeUntilUnlock = (unlockDate: string) => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    
    if (unlock <= now) {
      return 'Unlocked';
    }
    
    const diffTime = Math.abs(unlock.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} remaining`;
    } else if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} remaining`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`;
    }
  };

  if (isLoading && !asset) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Asset Details
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading asset details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {asset?.name || 'Asset Details'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {asset && (
          <>
            <Card style={styles.assetOverviewCard}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIconContainer}>
                  {renderCryptoIcon()}
                </View>
                <View style={styles.assetInfo}>
                  <Text style={[styles.assetName, { color: colors.text }]}>
                    {asset.name}
                  </Text>
                  <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
                    {asset.symbol}
                  </Text>
                </View>
              </View>

              <View style={styles.assetValueContainer}>
                <Text style={[styles.assetValueLabel, { color: colors.textSecondary }]}>
                  Total Value
                </Text>
                <Text style={[styles.assetValue, { color: colors.text }]}>
                  ${asset.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={[
                    styles.assetChange,
                    { color: asset.priceChange >= 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {asset.priceChange >= 0 ? '+' : ''}
                  {asset.priceChange.toFixed(2)}% (24h)
                </Text>
              </View>

              <View style={styles.assetAmountContainer}>
                <Text style={[styles.assetAmountLabel, { color: colors.textSecondary }]}>
                  Your Balance
                </Text>
                <Text style={[styles.assetAmount, { color: colors.text }]}>
                  {asset.amount} {asset.symbol}
                </Text>
              </View>

              <Button
                title="Send as Gift"
                variant="primary"
                onPress={onSendGift}
                style={styles.sendButton}
              />
            </Card>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Price Chart
            </Text>

            <Card style={styles.chartCard}>
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
              
              <View style={styles.chartPlaceholder}>
                {/* In a real app, this would be a ChartView component */}
                <View style={[styles.placeholderChart, { backgroundColor: colors.border + '40' }]}>
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Chart for {asset.name} ({timeframe})
                  </Text>
                </View>
              </View>
              
              <View style={styles.priceInfo}>
                <View>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Current Price
                  </Text>
                  <Text style={[styles.price, { color: colors.text }]}>
                    ${(asset.value / asset.amount).toFixed(2)}
                  </Text>
                </View>
                
                <View>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    24h Change
                  </Text>
                  <Text
                    style={[
                      styles.priceChange,
                      { color: asset.priceChange >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {asset.priceChange >= 0 ? '+' : ''}{asset.priceChange.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </Card>

            {/* Related Gifts Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Related Gifts
            </Text>

            {relatedGifts.length > 0 ? (
              <View style={styles.giftsContainer}>
                {relatedGifts.map(gift => renderGiftItem(gift))}
              </View>
            ) : (
              <Card style={styles.emptyGiftsCard}>
                <Text style={[styles.emptyGiftsText, { color: colors.textSecondary }]}>
                  No gifts found for this asset
                </Text>
                <Button
                  title="Send a Gift"
                  variant="primary"
                  onPress={onSendGift}
                  style={styles.sendGiftButton}
                />
              </Card>
            )}
          </>
        )}
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
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: typography.fontSize.medium,
  },
  assetOverviewCard: {
    marginBottom: spacing.medium,
    padding: spacing.medium,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
  },
  assetSymbol: {
    fontSize: typography.fontSize.medium,
  },
  assetValueContainer: {
    marginBottom: spacing.medium,
  },
  assetValueLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  assetValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
  },
  assetChange: {
    fontSize: typography.fontSize.medium,
    fontWeight: '500',
  },
  assetAmountContainer: {
    marginBottom: spacing.medium,
  },
  assetAmountLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  assetAmount: {
    fontSize: typography.fontSize.large,
    fontWeight: '600',
  },
  sendButton: {
    marginTop: spacing.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: '600',
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  chartCard: {
    padding: spacing.medium,
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
    marginTop: spacing.medium,
    height: 200,
    width: '100%',
  },
  placeholderChart: {
    flex: 1,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: typography.fontSize.medium,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.medium,
  },
  priceLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
  },
  priceChange: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  giftsContainer: {
    marginBottom: spacing.large,
  },
  giftItem: {
    marginBottom: spacing.small,
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  giftRecipient: {
    fontSize: typography.fontSize.medium,
    fontWeight: '500',
  },
  giftStatusBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.large,
  },
  giftStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  giftDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  giftAmount: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  giftDate: {
    fontSize: typography.fontSize.small,
  },
  emptyGiftsCard: {
    padding: spacing.large,
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  emptyGiftsText: {
    fontSize: typography.fontSize.medium,
    marginBottom: spacing.medium,
  },
  sendGiftButton: {
    minWidth: 150,
  },
  cryptoIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cryptoImage: {
    width: 32,
    height: 32,
  },
});

export default AssetDetails; 