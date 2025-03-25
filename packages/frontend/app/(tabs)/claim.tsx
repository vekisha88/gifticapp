import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import axios from "axios";
import ClaimedGift from "../../components/claim-gifts/ClaimedGifts";
import RecoveryPhraseModal from "../../components/claim-gifts/RecoveryPhraseModal";
import commonStyles, { colors } from "../../styles/commonStyles";
import { API_BASE_URL, RECEIVER_EMAIL } from "../../config/env";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import the CurrencyKey type from ClaimedGift.tsx or define it here
// TODO: Type Redundancy Issue - This type should be imported from @gifticapp/shared
type CurrencyKey = "MATIC" | "ETH" | "WBTC" | "USDC" | "USDT" | "DAI";

// TODO: Type Redundancy Issue - This interface should be imported from @gifticapp/shared
interface ClaimedGiftType {
  giftCode: string;
  currency: CurrencyKey;
  amount: number;
  recipientFirstName: string;
  recipientLastName: string;
  unlockDate: string;
  walletAddress: string;
  paymentStatus?: string;
  mnemonic?: string; // Add mnemonic to the interface
  claimed?: boolean; // Add claimed status for tracking
  fee?: number; // Add fee for transparency (optional, not shown to user)
  totalAmount?: number; // Add total payment amount (optional, not shown to user)
  gasFee?: number; // Add gas fee for transparency (optional, not shown to user)
  fundsUnlocked?: boolean; // Add fundsUnlocked status for transparency (optional, not shown to user)
  unlockMessage?: string; // Add unlockMessage for transparency (optional, not shown to user)
}

const ClaimGiftScreen: React.FC = () => {
  const [giftCode, setGiftCode] = useState("");
  const [giftCodeError, setGiftCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<ClaimedGiftType[]>([]);
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [currentGiftDetails, setCurrentGiftDetails] = useState<ClaimedGiftType | null>(null);

  const userEmail = RECEIVER_EMAIL;

  // Memoized gift code change handler
  const handleGiftCodeChange = useCallback((code: string) => {
    setGiftCode(code);
    setGiftCodeError(null); // Clear any existing error when typing
  }, []); // No dependencies since it only updates giftCode and error

  // Memoized fetch claimed gifts function
  const fetchClaimedGifts = useCallback(async () => {
    try {
      // Check if we have a wallet address in storage
      let walletAddress = await AsyncStorage.getItem('recipientWalletAddress');
      
      if (!walletAddress) {
        // Use a default test wallet address for demo purposes
        walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        // Store it for future use
        await AsyncStorage.setItem('recipientWalletAddress', walletAddress);
        console.log("Created and stored default wallet address for claimed gifts:", walletAddress);
      }
      
      console.log(`Fetching claimed gifts for address: ${walletAddress}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/gift/claimed?address=${encodeURIComponent(walletAddress)}`
      );
      
      if (response.data.success) {
        setClaimedGifts(response.data.gifts || []);
        console.log(`Successfully fetched ${response.data.gifts?.length || 0} claimed gifts`);
      } else {
        console.warn("Error in claimed gifts response:", response.data.error);
        // Don't show alert for this error as it's not critical
      }
    } catch (error: unknown) {
      console.error("Error fetching claimed gifts:", error);
      // Don't show alert for network errors as they're not critical for UX
    }
  }, []); // No dependencies since we're getting address from storage

  // Memoized claimed gifts list
  const memoizedClaimedGifts = useMemo(() => claimedGifts, [claimedGifts]);

  // Animated value for loading spinner
  const rotation = useSharedValue(0);

  // Animated style for the loading spinner
  const animatedLoadingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Start animation when submitting
  useEffect(() => {
    if (isSubmitting) {
      rotation.value = withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      });
    } else {
      rotation.value = 0; // Reset when loading stops
    }
  }, [isSubmitting, rotation]);

  // Memoized handle claim gift function
  const handleClaimGift = useCallback(async () => {
    if (!giftCode.trim()) {
      setGiftCodeError("Gift code cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      // First verify the gift code to get gift details
      const verifyResponse = await axios.post(`${API_BASE_URL}/api/gift/verify-code`, { giftCode });
      console.log("Verify response:", JSON.stringify(verifyResponse.data, null, 2)); // Debug log
      
      if (verifyResponse.data.success) {
        const giftDetails = verifyResponse.data.giftDetails as ClaimedGiftType;
        
        // Check payment status explicitly
        if (giftDetails.paymentStatus !== "received") {
          setIsSubmitting(false);
          Alert.alert(
            "Payment Pending", 
            "This gift's payment is still being processed. Please try again after the transaction is confirmed.",
            [{ text: "OK" }]
          );
          return;
        }
        
        // Use wallet address from the gift details
        const recipientAddress = giftDetails.walletAddress;
        await AsyncStorage.setItem('recipientWalletAddress', recipientAddress);
        console.log("Using recipient address from gift:", recipientAddress);
      
        // Fetch the mnemonic without claiming (new /preclaim endpoint)
        const preclaimResponse = await axios.post(`${API_BASE_URL}/api/gift/preclaim`, {
          giftCode: giftDetails.giftCode,
          recipientEmail: userEmail,
          recipientAddress: recipientAddress
        });
      
        console.log("Preclaim response for gift:", JSON.stringify(preclaimResponse.data, null, 2)); // Detailed debug log
      
        if (preclaimResponse.data.success) {
          const { mnemonic, giftAmount, totalAmount, fee, gasFee, fundsUnlocked, unlockMessage } = preclaimResponse.data;
          if (!mnemonic || typeof mnemonic !== "string" || mnemonic.trim() === "") {
            throw new Error("Invalid or missing mnemonic received from backend.");
          }
          
          // Show confirmation before displaying recovery phrases, include unlock message
          Alert.alert(
            "Preview Recovery Phrases?",
            `You're about to view sensitive recovery phrases for this gift. Write them down securely, as they can't be retrieved later. ${unlockMessage}`,
            [
              {
                text: "Cancel",
                onPress: () => {
                  setGiftCode(""); // Clear the gift code if user cancels
                  setIsSubmitting(false); // Reset loading state
                },
                style: "cancel",
              },
              {
                text: "Continue",
                onPress: () => {
                  // Update gift details with the mnemonic, amounts, and unlock status
                  const updatedGiftDetails: ClaimedGiftType = {
                    ...giftDetails,
                    mnemonic, // Store the actual mnemonic
                    claimed: false, // Don't mark as claimed yet
                    amount: giftAmount, // Receiver's exact amount
                    fee, // Fee after gas deduction
                    totalAmount, // Payment amount
                    gasFee, // Gas fee deducted from fee
                    fundsUnlocked, // Whether funds are immediately transferable
                    unlockMessage, // Message about fund availability
                  };
                  setCurrentGiftDetails(updatedGiftDetails);
                  setRecoveryModalVisible(true);
                  setGiftCode(""); // Clear the gift code after confirmation
                },
                style: "default",
              },
            ]
          );
        } else {
          let errorMessage = preclaimResponse.data.error || "Failed to fetch mnemonic.";
          setGiftCodeError(errorMessage);
        }
      } else {
        let errorMessage = "Failed to verify the gift code.";
        if (verifyResponse.data.error?.includes("not found")) {
          errorMessage = "This gift code does not exist. Please check and try again.";
        } else if (verifyResponse.data.error?.includes("claimed")) {
          errorMessage = "This gift has already been claimed.";
        }
        setGiftCodeError(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Error verifying or fetching mnemonic:", error);
      let errorMessage = "Network or server error. Please try again later.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setGiftCodeError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [giftCode, userEmail]);

  // Memoized handle confirm recovery function
  const handleConfirmRecovery = useCallback(async (mnemonicConfirmed: boolean) => {
    if (!currentGiftDetails || !mnemonicConfirmed) {
      setRecoveryModalVisible(false); // Close modal without claiming if not confirmed
      return;
    }

    try {
      // Use the recipient address from the gift details
      const recipientAddress = currentGiftDetails.walletAddress;
      
      console.log("Confirming claim for gift with code:", currentGiftDetails!.giftCode);
      console.log("Using recipient address:", recipientAddress);
      
      const response = await axios.post(`${API_BASE_URL}/api/gift/claim`, {
        giftCode: currentGiftDetails!.giftCode,
        recipientEmail: userEmail,
        recipientAddress: recipientAddress
      });
      console.log("Claim response for gift:", JSON.stringify(response.data, null, 2)); // Detailed debug log
      
      if (response.data.success) {
        const { mnemonic, giftAmount, fundsUnlocked, unlockMessage } = response.data;
        if (!mnemonic || typeof mnemonic !== "string" || mnemonic.trim() === "") {
          throw new Error("Invalid or missing mnemonic received from backend.");
        }
        
        // Update gift details with claimed status and amounts
        const updatedGiftDetails: ClaimedGiftType = {
          ...currentGiftDetails!,
          claimed: true, // Mark as claimed only after confirmation
          amount: giftAmount, // Receiver's exact amount
          fundsUnlocked, // Update funds unlock status
          unlockMessage, // Update unlock message
        };
        
        setCurrentGiftDetails(updatedGiftDetails); // Update state
        setRecoveryModalVisible(false);
        await fetchClaimedGifts(); // Refresh the claimed gifts list
        
        // Show success message with unlock information
        Alert.alert(
          "Wallet Access Successful",
          `Your gift has been claimed successfully! ${unlockMessage}`,
          [{ text: "OK" }]
        );
      } else {
        let errorMessage = response.data.error || "Gift claim failed.";
        if (response.data.error?.includes("not found")) {
          errorMessage = "This gift code does not exist.";
        } else if (response.data.error?.includes("already been claimed")) {
          errorMessage = "This gift has already been claimed.";
        }
        Alert.alert("Error", errorMessage);
      }
    } catch (error: unknown) {
      console.error("Error confirming gift claim:", error);
      let errorMessage = "Server error. Please try again later.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    }
  }, [currentGiftDetails, userEmail, fetchClaimedGifts]);

  // Periodic refresh every 5 minutes and initial fetch
  useEffect(() => {
    fetchClaimedGifts();
    const interval = setInterval(fetchClaimedGifts, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchClaimedGifts]); // Updated to depend on fetchClaimedGifts callback

  return (
    <>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />
      <View
        style={[
          commonStyles.screen,
          {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            flex: 1,
          },
        ]}
      >
        {/* Input field and button for claiming a gift */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              commonStyles.inputField,
              styles.inputField,
              giftCodeError && { borderColor: colors.error },
            ]}
            placeholder="Enter Gift Code"
            placeholderTextColor={commonStyles.placeholderText.color}
            value={giftCode}
            onChangeText={handleGiftCodeChange} // Use memoized handler
            autoCapitalize="characters"
            keyboardAppearance="dark"
          />
          {giftCodeError && <Text style={styles.errorText}>{giftCodeError}</Text>}
          <TouchableOpacity
            style={[styles.claimButton, isSubmitting && commonStyles.disabledButton]}
            onPress={handleClaimGift} // Use memoized handler
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Reanimated.View
                  style={[
                    {
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      borderTopColor: "transparent",
                    },
                    animatedLoadingStyle,
                  ]}
                />
                <Text style={[styles.claimButtonText, { marginLeft: 8 }]}>...</Text>
              </View>
            ) : (
              <Text style={styles.claimButtonText}>Claim</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Claimed Gifts List */}
        <Text
          style={[
            commonStyles.sectionTitle,
            { marginTop: 24, marginBottom: 10, marginLeft: 24 },
          ]}
        >
          Claimed Gifts
        </Text>
        <FlatList
          data={memoizedClaimedGifts} // Use memoized gifts to prevent re-renders
          keyExtractor={(item) => item.giftCode}
          renderItem={({ item }) => item ? (
            <ClaimedGift
              details={item}
              onShowWallet={(walletAddress) => {
                Alert.alert("Wallet Details", `${walletAddress} (Amount: ${item.amount} ${item.currency})`);
              }}
            />
          ) : null}
          ListEmptyComponent={
            <Text style={commonStyles.emptyText}>No claimed gifts yet.</Text>
          }
          contentContainerStyle={{
            paddingBottom: 35,
            flexGrow: 1,
            backgroundColor: colors.background,
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Recovery Phrase Modal */}
        {currentGiftDetails && (
          <RecoveryPhraseModal
            visible={recoveryModalVisible}
            mnemonic={currentGiftDetails.mnemonic ?? ""}
            unlockMessage={currentGiftDetails.unlockMessage}
            onClose={(mnemonicConfirmed: boolean) => handleConfirmRecovery(mnemonicConfirmed)}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    marginHorizontal: 16,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    marginLeft: 0,
    borderColor: colors.border,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: "#2A3435",
    color: colors.text,
  },
  claimButton: {
    marginLeft: 10,
    marginRight: 0,
    width: 90,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  claimButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
    position: "absolute",
    bottom: -20,
    left: 4,
  },
});

export default ClaimGiftScreen;