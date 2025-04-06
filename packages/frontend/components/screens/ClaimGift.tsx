import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card } from '../ui/Card';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { giftService, userService, formatErrorMessage } from '../../services';

interface ClaimGiftProps {
  onBack: () => void;
  onClaimSuccess: (giftCode: string, walletAddress: string, mnemonic: string) => void;
}

const ClaimGift: React.FC<ClaimGiftProps> = ({ onBack, onClaimSuccess }) => {
  const { colors, isDark } = useTheme();
  const [giftCode, setGiftCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Gift details state when verified
  const [verifiedGift, setVerifiedGift] = useState<{
    giftCode: string;
    recipientName: string;
    amount: number;
    currency: string;
    unlockDate: string;
    walletAddress: string;
    paymentStatus: string;
  } | null>(null);

  // Load user email on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const email = await userService.getUserEmail();
      if (email) {
        setUserEmail(email);
      } else {
        // For testing, use a default email if none is found
        const defaultEmail = 'vksha88+receiver@gmail.com';
        await userService.setUserEmail(defaultEmail);
        setUserEmail(defaultEmail);
      }
    };
    
    fetchUserEmail();
  }, []);

  // Verify gift code
  const handleVerifyGiftCode = async () => {
    if (!giftCode.trim()) {
      setError('Please enter a gift code');
      return;
    }

    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await giftService.verifyGiftCode(giftCode.trim());
      
      if (response.success && response.giftDetails) {
        const { giftDetails } = response;
        
        // Check payment status
        if (giftDetails.paymentStatus !== 'received') {
          setError('This gift payment is still being processed. Please try again later.');
          setVerifiedGift(null);
          return;
        }
        
        // Check if gift is already claimed
        if (giftDetails.isClaimed) {
          setError('This gift has already been claimed.');
          setVerifiedGift(null);
          return;
        }
        
        // Store verified gift details
        setVerifiedGift({
          giftCode: giftDetails.giftCode,
          recipientName: `${giftDetails.recipientFirstName} ${giftDetails.recipientLastName || ''}`,
          amount: giftDetails.amount,
          currency: giftDetails.currency,
          unlockDate: giftDetails.unlockDate,
          walletAddress: giftDetails.walletAddress,
          paymentStatus: giftDetails.paymentStatus,
        });
      } else {
        setError(response.error || 'Failed to verify gift code. Please check and try again.');
        setVerifiedGift(null);
      }
    } catch (error) {
      setError(formatErrorMessage(error, 'Failed to verify gift code'));
      setVerifiedGift(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Claim the gift
  const handleClaimGift = async () => {
    if (!verifiedGift || !userEmail) {
      setError('Gift verification required before claiming');
      return;
    }

    setIsClaiming(true);
    setError(null);
    
    try {
      // First try to preclaim to get the wallet access info without marking as claimed
      const preclaimResponse = await giftService.preClaimGift(
        verifiedGift.giftCode, 
        userEmail, 
        verifiedGift.walletAddress
      );
      
      if (preclaimResponse.success && preclaimResponse.mnemonic) {
        // Show confirmation dialog
        Alert.alert(
          'Gift Verification Successful',
          `You're about to claim a gift of ${verifiedGift.amount} ${verifiedGift.currency}. You will receive a wallet recovery phrase that must be saved securely.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsClaiming(false),
            },
            {
              text: 'Continue',
              onPress: async () => {
                // Finalize the claim
                const claimResponse = await giftService.claimGift(
                  verifiedGift.giftCode, 
                  userEmail, 
                  verifiedGift.walletAddress
                );
                
                if (claimResponse.success && claimResponse.mnemonic) {
                  // Pass the success to parent component
                  onClaimSuccess(
                    verifiedGift.giftCode, 
                    verifiedGift.walletAddress, 
                    claimResponse.mnemonic
                  );
                } else {
                  setError(claimResponse.error || 'Failed to claim gift. Please try again.');
                }
                setIsClaiming(false);
              },
            },
          ]
        );
      } else {
        setError(preclaimResponse.error || 'Failed to access gift wallet. Please try again.');
        setIsClaiming(false);
      }
    } catch (error) {
      setError(formatErrorMessage(error, 'Failed to claim gift'));
      setIsClaiming(false);
    }
  };

  // Clear form and state
  const handleReset = () => {
    setGiftCode('');
    setVerifiedGift(null);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Claim a Gift
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.instructionText, { color: colors.text }]}>
            Enter the gift code you received to claim your crypto gift.
          </Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <Input
              label="Gift Code"
              value={giftCode}
              onChangeText={setGiftCode}
              placeholder="Enter gift code"
              autoCapitalize="characters"
              disabled={isVerifying || isClaiming || !!verifiedGift}
              leftIcon={<FontAwesome5 name="gift" size={16} color={colors.primary} />}
            />

            {!verifiedGift ? (
              <Button
                title="Verify Gift Code"
                onPress={handleVerifyGiftCode}
                variant="primary"
                loading={isVerifying}
                disabled={isVerifying || !giftCode.trim()}
              />
            ) : (
              <View style={styles.giftDetails}>
                <Card style={styles.giftCard}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Gift Details
                  </Text>
                  
                  <View style={styles.giftInfoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      Recipient:
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {verifiedGift.recipientName}
                    </Text>
                  </View>
                  
                  <View style={styles.giftInfoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      Amount:
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {verifiedGift.amount} {verifiedGift.currency}
                    </Text>
                  </View>
                  
                  <View style={styles.giftInfoRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      Unlocks:
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {new Date(verifiedGift.unlockDate).toLocaleDateString()}
                    </Text>
                  </View>
                </Card>

                <View style={styles.buttonGroup}>
                  <Button
                    title="Reset"
                    onPress={handleReset}
                    variant="outline"
                    style={{ marginRight: spacing.small }}
                  />
                  <Button
                    title="Claim Gift"
                    onPress={handleClaimGift}
                    variant="primary"
                    loading={isClaiming}
                    disabled={isClaiming}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
  },
  instructionText: {
    fontSize: typography.fontSize.medium,
    marginBottom: spacing.large,
  },
  errorContainer: {
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  errorText: {
    fontSize: typography.fontSize.small,
  },
  formContainer: {
    marginBottom: spacing.large,
  },
  giftDetails: {
    marginTop: spacing.medium,
  },
  giftCard: {
    marginBottom: spacing.medium,
  },
  cardTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  giftInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  label: {
    fontSize: typography.fontSize.small,
  },
  value: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ClaimGift; 