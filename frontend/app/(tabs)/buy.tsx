import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  StyleProp,
  ViewStyle,
  AppState,
  StatusBar,
  TextInput,
  TouchableWithoutFeedback as RNTouchableWithoutFeedback, // Import for wallet address tap
  StyleSheet, // Ensure StyleSheet is imported
} from "react-native"; // Removed Modal, as it’s now in ConfirmationModal
import axios from "axios";
import { AxiosError } from "axios";
import { useDebounce } from "use-debounce";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Constants
import { API_BASE_URL } from "../../config/env";
import { CURRENCY_OPTIONS } from "../../constants/currencies";
import { CurrencyOption } from "../../src/types";
import commonStyles, { colors } from "../../styles/commonStyles";

// Components
import CurrencyPickerModal from "../../components/buy-gifts/CurrencyPickerModal";
import GiftAmountInput from "../../components/buy-gifts/GiftAmountInput";
import UnlockDatePicker from "../../components/buy-gifts/UnlockDatePicker";
import RecipientInfoInput from "../../components/buy-gifts/RecipientInfoInput";
import TotalAmountDisplay from "../../components/buy-gifts/TotalAmountDisplay";
import PaymentAddressDisplay from "../../components/buy-gifts/PaymentAddressDisplay";
import GiftSuccess from "../../components/buy-gifts/GiftSuccess"; // Import the extracted component
import ConfirmationModal from "../../components/buy-gifts/ConfirmationModal"; // Import the new component

// Utility functions
import { formatErrorMessage } from "../../utils/errorUtils";

interface BackendErrorResponse {
  success?: boolean;
  error?: string;
}

interface BuyGiftsScreenProps {}

export default function BuyGiftsScreen({}: BuyGiftsScreenProps) {
  // State declarations
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [recipientFullName, setRecipientFullName] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [currency, setCurrency] = useState("matic-network");
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencyOptionsWithPrices, setCurrencyOptionsWithPrices] = useState<CurrencyOption[]>(CURRENCY_OPTIONS);
  const [walletAddress, setWalletAddress] = useState<string | null>(null); // Predefined wallet address
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null); // Contract address after creation
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // New state for confirmation modal
  const [confirmationData, setConfirmationData] = useState<{ totalAmount: number; paymentAddress: string } | null>(null); // New state for confirmation data
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoadingGift, setIsLoadingGift] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isWalletReady, setIsWalletReady] = useState(false); // Track wallet readiness

  const scrollRef = useRef<ScrollView>(null);
  const lastNameRef = useRef<any>(null);
  const giftAmountRef = useRef<any>(null);
  const walletInputRef = useRef<TextInput>(null); // New ref for wallet address TextInput (though not used now)

  const buyerEmail = process.env.BUYER_EMAIL || "vksha88+buyer@gmail.com"; // TODO: Move to secure storage
  const insets = useSafeAreaInsets();

  // Form validation with useMemo
  const isFormValid = useMemo(() => {
    return (
      recipientFirstName.trim() &&
      recipientLastName.trim() &&
      giftAmount &&
      !isNaN(Number(giftAmount)) &&
      Number(giftAmount) > 0 &&
      unlockDate // Ensure unlockDate is not null
    );
  }, [recipientFirstName, recipientLastName, giftAmount, unlockDate]);
  const [debouncedIsFormValid] = useDebounce(isFormValid, 500);

  // Keyboard visibility listener
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Animated value for loading spinner
  const rotation = useSharedValue(0);

  // Animated style for the loading spinner
  const animatedLoadingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Start animation when any loading state is true
  useEffect(() => {
    if (isLoadingPrices || isLoadingWallet || isLoadingGift) {
      rotation.value = withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      });
    } else {
      rotation.value = 0; // Reset when loading stops
    }
  }, [isLoadingPrices, isLoadingWallet, isLoadingGift, rotation]);

  // Fetch prices with inline error handling
  const fetchPrices = useCallback(async () => {
    try {
      setIsLoadingPrices(true);
      setPriceError(null);
      const coinIds = CURRENCY_OPTIONS.map((coin) => coin.key).join(",");
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
      );
      const updatedOptions = CURRENCY_OPTIONS.map((coin) => ({
        ...coin,
        priceInUSD: response.data[coin.key]?.usd || 0,
      }));
      setCurrencyOptionsWithPrices(updatedOptions);
    } catch (error) {
      const axiosError = error as AxiosError<BackendErrorResponse>;
      const message =
        axiosError.response?.status === 429
          ? "Too many requests to price service. Please try again later."
          : formatErrorMessage(error, "Failed to fetch currency prices");
      setPriceError(message);
      // Removed Alert.alert, as errors are handled inline
    } finally {
      setIsLoadingPrices(false);
    }
  }, []); // Empty dependency array since fetchPrices doesn't depend on external state

  // Price polling with AppState
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      if (AppState.currentState === "active") fetchPrices();
    }, 300000);
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") fetchPrices();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [fetchPrices]); // Updated to depend on fetchPrices callback

  const currencyPrices = useMemo(
    () =>
      currencyOptionsWithPrices.reduce((acc, coin) => {
        acc[coin.key] = coin.priceInUSD || 0;
        return acc;
      }, {} as { [key: string]: number }),
    [currencyOptionsWithPrices]
  );

  // Fetch wallet address when form is valid
  const fetchWalletAddress = useCallback(async () => {
    if (!debouncedIsFormValid) {
      setWalletAddress(null);
      setIsWalletReady(false); // Reset wallet readiness when form becomes invalid
      return;
    }

    try {
      setIsLoadingWallet(true);
      const response = await axios.get(`${API_BASE_URL}/api/gift/get-wallet`);
      if (response.data.success && response.data.walletAddress) {
        const newWalletAddress = response.data.walletAddress;
        setWalletAddress(newWalletAddress);
        // Validate the wallet address format before marking it ready
        const isValidEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(newWalletAddress);
        setIsWalletReady(isValidEthereumAddress); // Set wallet ready only if valid
        scrollRef.current?.scrollToEnd({ animated: true });
      } else {
        throw new Error(response.data.error || "No available wallets at the moment.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<BackendErrorResponse>;
      let title = "Wallet Fetch Error";
      let message = formatErrorMessage(error, "Error fetching wallet address");
      let buttons: { text: string; onPress?: () => void }[] = [{ text: "OK" }];

      if (axiosError.response?.status === 500 && axiosError.response?.data?.error?.includes("No available wallets")) {
        title = "No Wallets Available";
        message = "No available wallets right now. Would you like to retry?";
        buttons.push({ text: "Retry", onPress: fetchWalletAddress });
      } else if (!axiosError.response) {
        title = "Network Error";
        message = "Unable to connect to the server. Please check your internet connection.";
        buttons.push({ text: "Retry", onPress: fetchWalletAddress });
      }

      setWalletAddress(null);
      setIsWalletReady(false); // Ensure wallet is not ready on error
      Alert.alert(title, message, buttons);
    } finally {
      setIsLoadingWallet(false);
    }
  }, [debouncedIsFormValid]); // Depends on debouncedIsFormValid to trigger only when form validity changes

  useEffect(() => {
    fetchWalletAddress();
  }, [fetchWalletAddress]); // Updated to depend on fetchWalletAddress callback

  const handleDateChange = useCallback((date: Date | null) => {
    if (date) {
      // Validate date/time is at least 2 hours from now (already handled in UnlockDatePicker)
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      if (date < twoHoursFromNow) {
        Alert.alert(
          "Invalid Time",
          "Please select a date and time at least 2 hours from now.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    setUnlockDate(date); // Ensure unlockDate is set correctly
    if (date) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [setUnlockDate]); // Depends on setUnlockDate to update only when the setter changes

  const handleGiftCreation = useCallback(async () => {
    if (!isFormValid || !isWalletReady) { // Wait until wallet is ready
      Alert.alert("Validation Error", "Please fill in all required fields correctly and wait for a valid wallet address.");
      return;
    }

    // Validate walletAddress format to ensure it’s a valid Ethereum address (already validated in fetch)
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      Alert.alert("Validation Error", "Invalid wallet address. Please fetch a new wallet.");
      return;
    }

    // Debug: Log unlockDate to verify it’s set
    console.log("Current unlockDate before gift creation:", unlockDate);

    // Ensure unlockDate is not null, use a fallback if needed
    const finalUnlockDate = unlockDate || new Date(Date.now() + 2 * 60 * 60 * 1000); // Fallback: 2 hours from now if null
    if (!unlockDate) {
      console.warn("Unlock date was null, using fallback: 2 hours from now");
    }

    // Log the payload before sending to debug what’s being sent
    console.log("Gift Creation Payload:", {
      buyerEmail,
      recipientFirstName: recipientFirstName.trim(),
      recipientLastName: recipientLastName.trim(),
      amount: Number(giftAmount),
      currency,
      unlockDate: finalUnlockDate.toISOString(), // Use finalUnlockDate with fallback
      walletAddress,
    });

    try {
      setIsWaitingForPayment(true);
      setIsLoadingGift(true);

      const fullName = `${recipientFirstName.trim()} ${recipientLastName.trim()}`;
      setRecipientFullName(fullName);

      // Map frontend currency keys to backend expected values
      const currencyMap: { [key: string]: string } = {
        "matic-network": "MATIC",
        "ethereum": "ETH",
        "wrapped-bitcoin": "BTC",
        "usd-coin": "USDC",
        "tether": "USDT",
        "dai": "DAI",
      };
      const backendCurrency = currencyMap[currency] || currency.toUpperCase();

      const payload = {
        buyerEmail,
        recipientFirstName: recipientFirstName.trim(),
        recipientLastName: recipientLastName.trim(),
        amount: Number(giftAmount),
        currency: backendCurrency,
        unlockDate: finalUnlockDate.toISOString(), // Use finalUnlockDate with fallback
        walletAddress, // Ensure walletAddress is included and valid
      };

      const response = await axios.post(`${API_BASE_URL}/api/gift/create`, payload);

      // Debug: Log the full response to verify data
      console.log("API Response from /api/gift/create:", JSON.stringify(response.data, null, 2));

      // Store confirmation data before showing the modal
      const tempGiftCode = response.data.giftCode;
      if (!response.data.totalAmount || !response.data.paymentAddress) {
        throw new Error("Missing totalAmount or paymentAddress in API response.");
      }
      setConfirmationData({
        totalAmount: response.data.totalAmount,
        paymentAddress: response.data.paymentAddress,
      });
      setGiftCode(tempGiftCode);
      setShowConfirmationModal(true); // Show confirmation modal instead of GiftSuccess immediately

      // Do not reset fields here—wait until after confirmation
    } catch (error) {
      const axiosError = error as AxiosError<BackendErrorResponse>;
      let title = "Gift Creation Error";
      let message = formatErrorMessage(error, "An error occurred while creating the gift");
      let buttons: { text: string; onPress?: () => void }[] = [{ text: "OK" }];

      if (axiosError.response?.status === 400) {
        title = "Invalid Input";
        message = axiosError.response.data?.error || "Please check your input and try again. Ensure the wallet address is valid.";
      } else if (axiosError.response?.status === 500) {
        title = "Server Error";
        message = axiosError.response.data?.error || "Something went wrong on the server.";
        buttons.push({ text: "Retry", onPress: handleGiftCreation });
      } else if (!axiosError.response) {
        title = "Network Error";
        message = "Unable to connect to the server. Please check your connection.";
        buttons.push({ text: "Retry", onPress: handleGiftCreation });
      }

      Alert.alert(title, message, buttons);
    } finally {
      setIsWaitingForPayment(false);
      setIsLoadingGift(false);
    }
  }, [isFormValid, isWalletReady, walletAddress, recipientFirstName, recipientLastName, giftAmount, currency, unlockDate]); // Updated dependencies to include isWalletReady

  // Handler for confirming payment and proceeding to GiftSuccess
  const handleConfirmPayment = useCallback(() => {
    console.log("Confirming payment, showConfirmationModal:", showConfirmationModal, "confirmationData:", confirmationData);
    setShowConfirmationModal(false);
    setModalVisible(true); // Show GiftSuccess modal after confirmation

    // Reset all fields to default values after confirming
    setRecipientFirstName("");
    setRecipientLastName("");
    setGiftAmount("");
    setCurrency("matic-network");
    setUnlockDate(null);
    setWalletAddress(null); // Clear previous wallet address
    setPaymentAddress(null); // Ensure payment address is cleared
    setIsWalletReady(false); // Reset wallet readiness
    setConfirmationData(null); // Clear confirmation data
  }, []); // No dependencies since it only updates modal visibility and resets state

  // Handle closing the success modal and final reset of giftCode
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setGiftCode(null); // Clear giftCode only after the modal is closed
  }, []); // No dependencies since it only updates modal visibility and giftCode

  const footerStyle: StyleProp<ViewStyle> = {
    ...commonStyles.footer,
    paddingBottom: insets.bottom + 60,
    backgroundColor: commonStyles.footer.backgroundColor,
  };

  const isDatePickerEnabled = useMemo(
    () =>
      recipientFirstName.trim() &&
      recipientLastName.trim() &&
      giftAmount &&
      !isNaN(Number(giftAmount)) &&
      Number(giftAmount) > 0,
    [recipientFirstName, recipientLastName, giftAmount]
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[commonStyles.screen, { flex: 1 }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 120 + insets.bottom + 60,
            backgroundColor: colors.background,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <View style={commonStyles.container}>
                <RecipientInfoInput
                  firstName={recipientFirstName}
                  lastName={recipientLastName}
                  setFirstName={setRecipientFirstName}
                  setLastName={setRecipientLastName}
                  lastNameRef={lastNameRef}
                  giftAmountRef={giftAmountRef}
                />
                <GiftAmountInput
                  giftAmount={giftAmount}
                  onAmountChange={setGiftAmount}
                  onSelectCurrency={() => setShowCurrencyPicker(true)}
                  currencyIcon={CURRENCY_OPTIONS.find((c) => c.key === currency)?.icon}
                  inputRef={giftAmountRef}
                />
                <UnlockDatePicker
                  unlockDate={unlockDate}
                  onDateChange={handleDateChange}
                  isDisabled={!isDatePickerEnabled}
                  onBlur={() => Keyboard.dismiss()}
                />
                <TotalAmountDisplay giftAmount={giftAmount} currency={currency} currencyPrices={currencyPrices} />
                {priceError && <Text style={commonStyles.errorText}>{priceError}</Text>}
                {/* Show walletAddress initially, then paymentAddress after creation */}
                {walletAddress && !paymentAddress && <PaymentAddressDisplay paymentAddress={walletAddress} />}
                {paymentAddress && <PaymentAddressDisplay paymentAddress={paymentAddress} />}
                {(isLoadingPrices || isLoadingWallet || isLoadingGift) && (
                  <View style={commonStyles.loadingContainer}>
                    <Reanimated.View
                      style={[
                        {
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: colors.primary,
                          borderTopColor: "transparent",
                        },
                        animatedLoadingStyle,
                      ]}
                    />
                    <Text style={[commonStyles.loadingText, { marginLeft: 8 }]}>
                      {isLoadingPrices
                        ? "Loading prices..."
                        : isLoadingWallet
                        ? "Loading wallet..."
                        : "Creating gift..."}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        {!isKeyboardVisible && (
          <View style={footerStyle}>
            <TouchableOpacity
              style={[
                commonStyles.button,
                (!isFormValid || !isWalletReady || isWaitingForPayment || isLoadingGift) && commonStyles.disabledButton,
              ]}
              onPress={handleGiftCreation}
              disabled={!isFormValid || !isWalletReady || isWaitingForPayment || isLoadingGift}
              accessibilityLabel="Wrap a gift"
              accessibilityHint="Creates a gift with the provided details"
            >
              <Text style={commonStyles.buttonText}>
                {isWaitingForPayment ? "Wrapping Gift..." : "Wrap a Gift"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <CurrencyPickerModal
          visible={showCurrencyPicker}
          onClose={() => setShowCurrencyPicker(false)}
          onSelectCurrency={(selectedCurrency) => setCurrency(selectedCurrency)}
          currencyOptions={currencyOptionsWithPrices}
        />
        <GiftSuccess
          visible={modalVisible}
          giftCode={giftCode ?? ""} // Ensure giftCode is passed, default to empty string if null
          recipientName={recipientFullName || "Recipient"} // Matches logic for giftCode with fallback
          unlockDate={unlockDate || new Date(Date.now() + 2 * 60 * 60 * 1000)} // Use fallback: 2 hours from now if null, matching recipientName/giftCode logic
          onClose={handleModalClose} // Renamed from onDone for consistency
        />
        <ConfirmationModal
          visible={showConfirmationModal}
          confirmationData={confirmationData}
          onConfirm={handleConfirmPayment}
          onRequestClose={() => setShowConfirmationModal(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

// New styles for the confirmation modal and wallet address
const styles = StyleSheet.create({
  // No changes needed here, as wallet address styling is removed from ConfirmationModal
});