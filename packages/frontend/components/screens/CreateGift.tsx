import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../ui/ThemeContext';
import { borderRadius, spacing, typography } from '../ui/styles';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { giftService, formatErrorMessage } from '../../services';
import DateTimePicker from '@react-native-community/datetimepicker';

// Types for unlock options
interface UnlockOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface CreateGiftProps {
  onBack: () => void;
  onContinue: (giftDetails: GiftDetails) => void;
}

export interface GiftDetails {
  recipientFirstName: string;
  recipientLastName: string;
  dateOfBirth: string;
  cryptocurrency: string;
  amount: string;
  unlockDate: Date | null;
}

const CreateGift: React.FC<CreateGiftProps> = ({ onBack, onContinue }) => {
  const { colors, isDark } = useTheme();

  // State
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [selectedUnlockOption, setSelectedUnlockOption] = useState<string | null>(null);
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [customUnlockDate, setCustomUnlockDate] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Unlock options
  const unlockOptions: UnlockOption[] = [
    { id: '18', label: '18th', sublabel: 'Birthday' },
    { id: '21', label: '21st', sublabel: 'Birthday' },
    { id: 'custom', label: 'Custom' },
  ];

  // Cryptocurrencies
  const cryptocurrencies = [
    { key: 'BTC', name: 'Bitcoin', icon: 'bitcoin' },
    { key: 'ETH', name: 'Ethereum', icon: 'ethereum' },
    { key: 'XRP', name: 'Ripple', icon: '' },
    { key: 'BNB', name: 'BNB', icon: '' },
    { key: 'SOL', name: 'Solana', icon: '' },
    { key: 'DOGE', name: 'Dogecoin', icon: '' },
    { key: 'ADA', name: 'Cardano', icon: '' },
    { key: 'TRX', name: 'TRON', icon: '' },
    { key: 'TON', name: 'TON', icon: '' },
    { key: 'LINK', name: 'Chainlink', icon: '' },
  ];

  // Get selected cryptocurrency 
  const getSelectedCryptoInfo = () => {
    return cryptocurrencies.find(c => c.key === selectedCrypto) || cryptocurrencies[0];
  };

  // Calculate unlock date based on date of birth and selected option
  const calculateUnlockDate = useCallback(() => {
    // If custom date is selected, return that directly
    if (selectedUnlockOption === 'custom') {
      return customUnlockDate;
    }
    
    // If no date of birth or unlock option, return null
    if (!birthDate || !selectedUnlockOption) {
      return null;
    }

    try {
      // Use the birthDate directly (it's already a Date object)
      const year = birthDate.getFullYear();
      const month = birthDate.getMonth();
      const day = birthDate.getDate();
      
      // Calculate target year
      const targetYear = year + parseInt(selectedUnlockOption, 10);
      
      // Create unlock date (same day/month, but in target year)
      const unlockDate = new Date(targetYear, month, day);
      
      return unlockDate;
    } catch (error) {
      console.error('Error calculating unlock date:', error);
      return null;
    }
  }, [birthDate, selectedUnlockOption, customUnlockDate]);

  // Form validation
  const isFormValid = recipientFirstName.trim() !== '' && 
                      birthDate !== null && 
                      amount.trim() !== '' && 
                      parseFloat(amount) > 0 && 
                      ((selectedUnlockOption !== 'custom' && selectedUnlockOption !== null) || 
                       (selectedUnlockOption === 'custom' && customUnlockDate !== null));

  // Handle continue button
  const handleContinue = async () => {
    if (!isFormValid) {
      setError('Please fill out all required fields correctly');
      return;
    }

    const unlockDate = calculateUnlockDate();
    if (!unlockDate) {
      setError('Invalid unlock date. Please check the date of birth and unlock option.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get buyer email (in a real app, this would come from auth)
      const buyerEmail = process.env.BUYER_EMAIL || 'vksha88+buyer@gmail.com';

      // Prepare gift details for API
      const giftDetails: GiftDetails = {
        recipientFirstName,
        recipientLastName,
        dateOfBirth,
        cryptocurrency: selectedCrypto,
        amount,
        unlockDate,
      };

      // Pass to parent component which will handle the API call
      onContinue(giftDetails);
    } catch (error) {
      setError(formatErrorMessage(error, 'Failed to create gift. Please try again.'));
    } finally {
      setIsLoading(false);
    }
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
            Create a Gift
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recipient
          </Text>

          <View style={styles.recipientButtons}>
            <TouchableOpacity
              style={[
                styles.recipientButton,
                {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <FontAwesome5
                name="user-plus"
                size={24}
                color={colors.primary}
                style={styles.recipientButtonIcon}
              />
              <Text style={[styles.recipientButtonText, { color: colors.text }]}>
                New Recipient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recipientButton,
                {
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <FontAwesome5
                name="address-book"
                size={24}
                color={colors.textSecondary}
                style={styles.recipientButtonIcon}
              />
              <Text style={[styles.recipientButtonText, { color: colors.text }]}>
                Past Recipients
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recipient Details
          </Text>

          <Input
            label="First Name"
            placeholder="e.g., Emma"
            value={recipientFirstName}
            onChangeText={setRecipientFirstName}
            required
          />

          <Input
            label="Last Name"
            placeholder="e.g., Smith"
            value={recipientLastName}
            onChangeText={setRecipientLastName}
          />

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Date of Birth <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : colors.background,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: birthDate ? colors.text : colors.textSecondary }]}>
                {birthDate 
                  ? birthDate.toLocaleDateString()
                  : 'Select date of birth'}
              </Text>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBirthDate(selectedDate);
                  // Update dateOfBirth string format for backward compatibility
                  const day = selectedDate.getDate().toString().padStart(2, '0');
                  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                  const year = selectedDate.getFullYear();
                  setDateOfBirth(`${day}.${month}.${year}`);
                }
              }}
            />
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Cryptocurrency
          </Text>

          <TouchableOpacity
            style={[
              styles.cryptoSelector,
              {
                borderColor: colors.border,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : colors.background,
              },
            ]}
            onPress={() => setShowCryptoDropdown(!showCryptoDropdown)}
          >
            <View style={styles.cryptoIconContainer}>
              {getSelectedCryptoInfo().icon === 'bitcoin' ? (
                <FontAwesome5 name="bitcoin" size={20} color={colors.text} />
              ) : getSelectedCryptoInfo().icon === 'ethereum' ? (
                <FontAwesome5 name="ethereum" size={20} color={colors.text} />
              ) : (
                <Text style={{ color: colors.text }}>{getSelectedCryptoInfo().key}</Text>
              )}
            </View>
            <Text style={[styles.cryptoName, { color: colors.text }]}>
              {getSelectedCryptoInfo().name} ({getSelectedCryptoInfo().key})
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCryptoDropdown && (
            <View
              style={[
                styles.cryptoDropdown,
                {
                  backgroundColor: isDark
                    ? colors.card
                    : colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              {cryptocurrencies.map((crypto) => (
                <TouchableOpacity
                  key={crypto.key}
                  style={[
                    styles.cryptoOption,
                    {
                      backgroundColor:
                        selectedCrypto === crypto.key
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(99, 102, 241, 0.1)'
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelectedCrypto(crypto.key);
                    setShowCryptoDropdown(false);
                  }}
                >
                  <Text style={[styles.cryptoOptionText, { color: colors.text }]}>
                    {crypto.name} ({crypto.key})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Input
            label="Amount"
            placeholder="0.0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            required
            rightElement={
              <Text style={{ color: colors.textSecondary }}>
                {selectedCrypto}
              </Text>
            }
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Unlock Date
          </Text>

          <View style={styles.unlockOptions}>
            {unlockOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.unlockOption,
                  {
                    borderColor:
                      selectedUnlockOption === option.id
                        ? colors.primary
                        : colors.border,
                    borderWidth:
                      selectedUnlockOption === option.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedUnlockOption(option.id)}
              >
                <Text
                  style={[
                    styles.unlockOptionLabel,
                    {
                      color:
                        selectedUnlockOption === option.id
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {option.sublabel && (
                  <Text
                    style={[
                      styles.unlockOptionSublabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.sublabel}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedUnlockOption === 'custom' && (
            <View style={styles.customDateContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Custom Unlock Date <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : colors.background,
                  },
                ]}
                onPress={() => setShowCustomDatePicker(true)}
              >
                <Text style={[styles.dateText, { color: customUnlockDate ? colors.text : colors.textSecondary }]}>
                  {customUnlockDate 
                    ? customUnlockDate.toLocaleDateString()
                    : 'Select custom unlock date'}
                </Text>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {showCustomDatePicker && (
            <DateTimePicker
              value={customUnlockDate || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()} // Can't select dates in the past
              onChange={(event, selectedDate) => {
                setShowCustomDatePicker(false);
                if (selectedDate) {
                  // Set time to midnight
                  selectedDate.setHours(0, 0, 0, 0);
                  setCustomUnlockDate(selectedDate);
                }
              }}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              disabled={!isFormValid || isLoading}
              loading={isLoading}
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  recipientButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipientButton: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginRight: spacing.small,
  },
  recipientButtonIcon: {
    marginBottom: spacing.small,
  },
  recipientButtonText: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
  },
  cryptoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    marginBottom: spacing.medium,
  },
  cryptoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
  },
  cryptoName: {
    flex: 1,
    fontSize: typography.fontSize.medium,
  },
  cryptoDropdown: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    marginTop: -spacing.small,
    marginBottom: spacing.medium,
  },
  cryptoOption: {
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cryptoOptionText: {
    fontSize: typography.fontSize.medium,
  },
  unlockOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.medium,
  },
  unlockOption: {
    width: '30%',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '5%',
    marginBottom: spacing.small,
  },
  unlockOptionLabel: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  unlockOptionSublabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.large,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    padding: spacing.medium,
    marginHorizontal: spacing.medium,
    marginTop: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  errorText: {
    fontSize: typography.fontSize.small,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.medium,
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  dateText: {
    fontSize: typography.fontSize.medium,
  },
  customDateContainer: {
    marginTop: spacing.small,
  },
  inputContainer: {
    marginBottom: spacing.medium,
  },
  inputLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
});

export default CreateGift; 