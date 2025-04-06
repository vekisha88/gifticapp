import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Share,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { giftService, userService, ClaimedGift } from '../../services';
import { formatDateLocalized, getTimeUntilDate } from '@gifticapp/shared';

interface GiftDetailsProps {
  giftId: string;
  onBack: () => void;
  onSendNewGift: () => void;
}

const GiftDetails: React.FC<GiftDetailsProps> = ({
  giftId,
  onBack,
  onSendNewGift,
}) => {
  const { colors, isDark } = useTheme();
  const [gift, setGift] = useState<ClaimedGift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [showTransferInput, setShowTransferInput] = useState(false);

  // Fetch gift data on mount
  useEffect(() => {
    const fetchData = async () => {
      const email = await userService.getUserEmail();
      setUserEmail(email);
      
      if (email) {
        fetchGiftDetails(email);
      }
    };
    
    fetchData();
  }, [giftId]);

  // Fetch gift details
  const fetchGiftDetails = async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // Get all gifts for this user
      const response = await giftService.getClaimedGifts(email);
      
      if (response.success && response.gifts) {
        // Find the specific gift by ID
        const foundGift = response.gifts.find(g => g.giftCode === giftId);
        
        if (foundGift) {
          // Add additional properties
          const enhancedGift = {
            ...foundGift,
            id: foundGift.giftCode,
            status: determineGiftStatus(foundGift),
            type: determineGiftType(foundGift, email),
          };
          
          setGift(enhancedGift);
        }
      }
    } catch (error) {
      console.error('Error fetching gift details:', error);
      Alert.alert('Error', 'Failed to load gift details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine gift status
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

  // Determine if gift is sent or received
  const determineGiftType = (gift: ClaimedGift, email: string): 'sent' | 'received' => {
    return gift.senderName ? 'received' : 'sent';
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (userEmail) {
      fetchGiftDetails(userEmail);
    }
  };

  // Check transferability
  const checkTransferability = async () => {
    if (!gift) return;
    
    setIsLoading(true);
    
    try {
      const response = await giftService.checkGiftTransferable(gift.giftCode);
      
      if (response.success && response.isTransferable) {
        setShowTransferInput(true);
      } else {
        Alert.alert(
          'Transfer Unavailable',
          response.error || 'This gift cannot be transferred at this time.'
        );
      }
    } catch (error) {
      console.error('Error checking transferability:', error);
      Alert.alert('Error', 'Failed to check if gift can be transferred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transfer funds
  const handleTransferFunds = async () => {
    if (!gift || !transferAddress) return;
    
    // Basic validation
    if (!transferAddress.startsWith('0x') || transferAddress.length !== 42) {
      Alert.alert('Invalid Address', 'Please enter a valid Ethereum wallet address.');
      return;
    }
    
    setIsTransferring(true);
    
    try {
      const response = await giftService.transferFunds(gift.giftCode, transferAddress);
      
      if (response.success) {
        Alert.alert(
          'Transfer Successful',
          'The funds have been successfully transferred.',
          [{ text: 'OK', onPress: () => {
            setShowTransferInput(false);
            handleRefresh();
          }}]
        );
      } else {
        Alert.alert('Transfer Failed', response.error || 'Failed to transfer funds.');
      }
    } catch (error) {
      console.error('Error transferring funds:', error);
      Alert.alert('Error', 'Failed to transfer funds. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  // Render cryptocurrency icon
  const getCryptoIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc' || lowerCurrency === 'bitcoin') {
      return <FontAwesome5 name="bitcoin" size={24} color={colors.text} />;
    } else if (lowerCurrency === 'eth' || lowerCurrency === 'ethereum') {
      return <FontAwesome5 name="ethereum" size={24} color={colors.text} />;
    } else {
      return (
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>
          {currency.substring(0, 1)}
        </Text>
      );
    }
  };

  // Get status color
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

  if (isLoading && !gift) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Gift Details
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading gift details...
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
          Gift Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {gift && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        >
          {/* Gift Status Card */}
          <Card style={styles.statusCard}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(gift.status) + '20' },
            ]}>
              <Text style={[styles.statusText, { color: getStatusColor(gift.status) }]}>
                {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
              </Text>
            </View>
            
            {gift.status === 'pending' && (
              <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
                Payment is being processed. This may take a few minutes.
              </Text>
            )}
            
            {gift.status === 'locked' && (
              <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
                {getTimeUntilDate(gift.unlockDate)}
              </Text>
            )}
            
            {gift.status === 'unlocked' && (
              <Text style={[styles.statusMessage, { color: colors.success }]}>
                Funds are available for transfer
              </Text>
            )}
          </Card>

          {/* Gift Amount Card */}
          <Card style={styles.amountCard}>
            <View style={styles.cryptoIconContainer}>
              {getCryptoIcon(gift.currency)}
            </View>
            
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
              Gift Amount
            </Text>
            
            <Text style={[styles.amount, { color: colors.text }]}>
              {gift.amount} {gift.currency}
            </Text>
            
            {gift.value !== undefined && (
              <Text style={[styles.value, { color: colors.textSecondary }]}>
                ${gift.value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </Card>

          {/* Gift Information Card */}
          <Card style={styles.infoCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Gift Information
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {gift.type === 'sent' ? 'To' : 'From'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {gift.recipientFirstName} {gift.recipientLastName}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Unlock Date
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDateLocalized(gift.unlockDate)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Gift Code
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {gift.giftCode}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Wallet Address
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
                {gift.walletAddress}
              </Text>
            </View>
          </Card>

          {/* Actions Card */}
          <Card style={styles.actionsCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Actions
            </Text>
            
            {gift.status === 'unlocked' && (
              <>
                <Button
                  title="Transfer Funds"
                  onPress={checkTransferability}
                  variant="primary"
                  disabled={isLoading || isTransferring}
                  loading={isLoading}
                  style={styles.actionButton}
                />
                
                {showTransferInput && (
                  <View style={styles.transferContainer}>
                    <Text style={[styles.transferLabel, { color: colors.text }]}>
                      Destination Address
                    </Text>
                    <TextInput
                      style={[
                        styles.transferInput,
                        { 
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                        },
                      ]}
                      placeholder="Enter wallet address (0x...)"
                      placeholderTextColor={colors.textSecondary}
                      value={transferAddress}
                      onChangeText={setTransferAddress}
                    />
                    <Button
                      title="Confirm Transfer"
                      onPress={handleTransferFunds}
                      variant="primary"
                      disabled={isTransferring || !transferAddress}
                      loading={isTransferring}
                      style={styles.transferButton}
                    />
                  </View>
                )}
              </>
            )}
            
            <Button
              title="Send Another Gift"
              onPress={onSendNewGift}
              variant={gift.status === 'unlocked' ? 'outline' : 'primary'}
              style={styles.actionButton}
            />
          </Card>
        </ScrollView>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: typography.fontSize.medium,
  },
  statusCard: {
    alignItems: 'center',
    padding: spacing.large,
    marginBottom: spacing.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.large,
    marginBottom: spacing.small,
  },
  statusText: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  statusMessage: {
    textAlign: 'center',
    fontSize: typography.fontSize.medium,
    marginTop: spacing.small,
  },
  amountCard: {
    alignItems: 'center',
    padding: spacing.large,
    marginBottom: spacing.medium,
  },
  cryptoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  amountLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  value: {
    fontSize: typography.fontSize.medium,
    marginTop: spacing.xs,
  },
  infoCard: {
    padding: spacing.large,
    marginBottom: spacing.medium,
  },
  cardTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  infoLabel: {
    fontSize: typography.fontSize.small,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  actionsCard: {
    padding: spacing.large,
    marginBottom: spacing.medium,
  },
  actionButton: {
    marginBottom: spacing.small,
  },
  transferContainer: {
    marginVertical: spacing.medium,
  },
  transferLabel: {
    fontSize: typography.fontSize.small,
    marginBottom: spacing.xs,
  },
  transferInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.small,
  },
  transferButton: {
    marginTop: spacing.small,
  },
});

export default GiftDetails; 