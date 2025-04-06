import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface DashboardProps {
  cryptoData: any[];
  onSendGift: () => void;
  onClaimGift: () => void;
  onAssetPress: (assetId: string) => void;
  onGiftPress: (giftId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  cryptoData = [],
  onSendGift,
  onClaimGift,
  onAssetPress,
  onGiftPress,
}) => {
  const { colors } = useTheme();

  // Sample recent gifts data
  const recentGifts = [
    { id: 'gift1', recipient: 'John Doe', amount: 0.5, currency: 'ETH', date: '2023-03-15' },
    { id: 'gift2', recipient: 'Jane Smith', amount: 100, currency: 'MATIC', date: '2023-03-10' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>Hello!</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
          Welcome to Giftic
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onSendGift}
        >
          <Ionicons name="gift-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Send Gift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={onClaimGift}
        >
          <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Claim Gift</Text>
        </TouchableOpacity>
      </View>

      {/* Asset Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Assets</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.assetList}>
          {cryptoData.map((crypto, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.assetItem, { backgroundColor: colors.card }]}
              onPress={() => onAssetPress(crypto.symbol)}
            >
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: colors.text }]}>{crypto.name}</Text>
                <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
                  {crypto.symbol}
                </Text>
              </View>
              <View style={styles.assetValues}>
                <Text style={[styles.assetPrice, { color: colors.text }]}>
                  ${crypto.price.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.assetChange,
                    { color: crypto.change >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Gifts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Gifts</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.giftList}>
          {recentGifts.map((gift, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.giftItem, { backgroundColor: colors.card }]}
              onPress={() => onGiftPress(gift.id)}
            >
              <View style={styles.giftInfo}>
                <Text style={[styles.giftRecipient, { color: colors.text }]}>
                  To: {gift.recipient}
                </Text>
                <Text style={[styles.giftDate, { color: colors.textSecondary }]}>
                  {gift.date}
                </Text>
              </View>
              <View style={styles.giftAmount}>
                <Text style={[styles.giftValue, { color: colors.text }]}>
                  {gift.amount} {gift.currency}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  assetList: {
    marginBottom: 16,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  assetInfo: {
    flexDirection: 'column',
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assetSymbol: {
    fontSize: 14,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assetChange: {
    fontSize: 14,
  },
  giftList: {},
  giftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  giftInfo: {
    flexDirection: 'column',
  },
  giftRecipient: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  giftDate: {
    fontSize: 14,
  },
  giftAmount: {},
  giftValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Dashboard;