import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { borderRadius, shadows, spacing, typography } from './styles';
import { Card, TouchableCard } from './Card';
import Button from './Button';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { giftService, userService, ClaimedGift } from '../../services';

interface GiftsProps {
  gifts?: ClaimedGift[];
  onSendGift: () => void;
  onClaimGift: () => void;
  onGiftPress: (giftId: string) => void;
}

const Gifts: React.FC<GiftsProps> = ({
  gifts: initialGifts,
  onSendGift,
  onClaimGift,
  onGiftPress,
}) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');
  const [gifts, setGifts] = useState<ClaimedGift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user email and gifts on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user email
        const email = await userService.getUserEmail();
        setUserEmail(email);
        
        if (email) {
          fetchGifts(email);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Fetch gifts from the backend
  const fetchGifts = async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      const response = await giftService.getClaimedGifts(email);
      
      if (response.success && response.gifts) {
        // Map backend gift data to the format expected by the component
        const formattedGifts = response.gifts.map(gift => ({
          ...gift,
          // Add any missing properties or transform as needed
          id: gift.giftCode,
          status: determineGiftStatus(gift),
          type: determineGiftType(gift, email)
        }));
        
        setGifts(formattedGifts);
      } else {
        setGifts([]);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
      setGifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine gift status based on backend data
  const determineGiftStatus = (gift: ClaimedGift): 'locked' | 'unlocked' | 'pending' => {
    // Check if gift is locked based on unlock date
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

  // Determine if gift is sent or received based on user email
  const determineGiftType = (gift: ClaimedGift, email: string): 'sent' | 'received' => {
    // This is a simplified logic - in a real implementation, you'd check
    // against the backend data to see if this user is sender or recipient
    return gift.senderName ? 'received' : 'sent';
  };

  // Filter gifts based on active tab
  const filteredGifts = gifts.filter(gift => {
    if (activeTab === 'all') return true;
    return gift.type === activeTab;
  });

  // Handle refresh
  const handleRefresh = async () => {
    if (userEmail) {
      await fetchGifts(userEmail);
    }
  };

  const getCryptoIcon = (currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc' || lowerCurrency === 'bitcoin') {
      return <FontAwesome5 name="bitcoin" size={18} color={colors.text} />;
    } else if (lowerCurrency === 'eth' || lowerCurrency === 'ethereum') {
      return <FontAwesome5 name="ethereum" size={18} color={colors.text} />;
    } else {
      return (
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
          {currency.substring(0, 1)}
        </Text>
      );
    }
  };

  const getStatusColor = (status: ClaimedGift['status']) => {
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

  const getStatusLabel = (status: ClaimedGift['status']) => {
    switch (status) {
      case 'locked':
        return 'Locked';
      case 'unlocked':
        return 'Unlocked';
      case 'pending':
        return 'Pending';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderGiftItem = ({ item }: { item: ClaimedGift }) => (
    <TouchableCard
      style={styles.giftCard}
      onPress={() => onGiftPress(item.id)}
    >
      <View style={styles.giftHeader}>
        <View style={styles.recipientContainer}>
          <Text style={[styles.recipientLabel, { color: colors.textSecondary }]}>
            {item.type === 'sent' ? 'To' : 'From'}:
          </Text>
          <Text style={[styles.recipientName, { color: colors.text }]}>
            {item.recipientFirstName} {item.recipientLastName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.giftContent}>
        <View style={styles.cryptoContainer}>
          <View
            style={[
              styles.cryptoIconContainer,
              { backgroundColor: isDark ? colors.card : 'rgba(0, 0, 0, 0.05)' },
            ]}
          >
            {getCryptoIcon(item.currency)}
          </View>
          <View>
            <Text style={[styles.cryptoAmount, { color: colors.text }]}>
              {item.amount} {item.currency}
            </Text>
            <Text style={[styles.cryptoValue, { color: colors.textSecondary }]}>
              ${item.value?.toLocaleString() || '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.unlockContainer}>
          <Text style={[styles.unlockLabel, { color: colors.textSecondary }]}>
            Unlocks
          </Text>
          <Text style={[styles.unlockDate, { color: colors.text }]}>
            {formatDate(item.unlockDate)}
          </Text>
        </View>
      </View>
    </TouchableCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gifts</Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.primary,
              marginRight: spacing.small,
            },
          ]}
          onPress={onSendGift}
        >
          <FontAwesome5 name="gift" size={20} color="white" style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Send Gift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? colors.card : '#F3F4F6',
            },
          ]}
          onPress={onClaimGift}
        >
          <MaterialIcons
            name="qr-code-scanner"
            size={20}
            color={colors.text}
            style={styles.actionButtonIcon}
          />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Claim Gift
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'all' ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sent' && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'sent' ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'received' ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !filteredGifts.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading gifts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGifts}
          renderItem={renderGiftItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.giftsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 
                name="gift" 
                size={40} 
                color={colors.textSecondary}
                style={{ marginBottom: spacing.medium }}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No gifts yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {activeTab === 'sent' 
                  ? 'Send a gift to get started!' 
                  : activeTab === 'received' 
                    ? 'You haven\'t received any gifts yet.' 
                    : 'Start by sending or claiming a gift.'}
              </Text>
              <Button 
                title={activeTab === 'received' ? 'Claim a Gift' : 'Send a Gift'}
                variant="primary"
                style={{ marginTop: spacing.large }}
                onPress={activeTab === 'received' ? onClaimGift : onSendGift}
              />
            </View>
          }
        />
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
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginBottom: spacing.small,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.medium,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.small,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  giftsList: {
    padding: spacing.medium,
  },
  giftCard: {
    marginBottom: spacing.medium,
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientLabel: {
    fontSize: typography.fontSize.small,
    marginRight: spacing.xs,
  },
  recipientName: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.medium,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  giftContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cryptoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
  },
  cryptoAmount: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  cryptoValue: {
    fontSize: typography.fontSize.small,
  },
  unlockContainer: {
    alignItems: 'flex-end',
  },
  unlockLabel: {
    fontSize: typography.fontSize.xs,
  },
  unlockDate: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.large,
    fontWeight: '600',
    marginBottom: spacing.small,
  },
  emptySubtext: {
    fontSize: typography.fontSize.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: typography.fontSize.medium,
  }
});

export default Gifts; 