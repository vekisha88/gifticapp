import React, { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClipboard } from "../../utils/useClipboard";
import { useLivePrice } from "../../utils/useLivePrice";
import commonStyles, { colors } from "../../styles/commonStyles";

// Define the currency keys as a type
type CurrencyKey = "MATIC" | "ETH" | "WBTC" | "USDC" | "USDT" | "DAI";

// Interface for the gift details
interface GiftDetails {
  currency: CurrencyKey;
  amount: number;
  recipientFirstName: string;
  recipientLastName: string;
  unlockDate: string;
  walletAddress: string;
  paymentStatus?: string;
}

interface ClaimedGiftProps {
  details: GiftDetails; // Required prop
  onShowWallet: (walletAddress: string) => void; // Required prop
}

const currencyIcons: Record<CurrencyKey, any> = {
  "MATIC": require("cryptocurrency-icons/128/color/matic.png"),
  "ETH": require("cryptocurrency-icons/128/color/eth.png"),
  "WBTC": require("cryptocurrency-icons/128/color/btc.png"),
  "USDC": require("cryptocurrency-icons/128/color/usdc.png"),
  "USDT": require("cryptocurrency-icons/128/color/usdt.png"),
  "DAI": require("cryptocurrency-icons/128/color/dai.png"),
};

const currencyLabels: Record<CurrencyKey, string> = {
  "MATIC": "MATIC",
  "ETH": "ETH",
  "WBTC": "WBTC",
  "USDC": "USDC",
  "USDT": "USDT",
  "DAI": "DAI",
};

const currencyToCoinGecko: Record<CurrencyKey, string> = {
  "MATIC": "matic-network",
  "ETH": "ethereum",
  "WBTC": "wrapped-bitcoin",
  "USDC": "usd-coin",
  "USDT": "tether",
  "DAI": "dai",
};

const ClaimedGift = ({ details, onShowWallet }: ClaimedGiftProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { copyToClipboard } = useClipboard();
  const { fetchLivePrices } = useLivePrice();

  const handleShowWallet = () => {
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchPriceWithRetry = async () => {
      try {
        const currencyKey = currencyToCoinGecko[details.currency] || details.currency.toLowerCase();
        const prices = await fetchLivePrices(currencyKey);
        const price = prices[currencyKey];
        if (price !== null) {
          setLivePrice(price);
          setPriceError(null);
        } else {
          setPriceError("Unable to fetch current price.");
        }
      } catch (error) {
        console.error("⚠️ Failed to fetch live price:", error);
        setPriceError("Unable to fetch current price.");
      }
    };
    fetchPriceWithRetry();
  }, [details.currency, fetchLivePrices]);

  // Format the unlock date and time in a single line with a single space between date and time
  const formatUnlockDateTime = (dateStr: string | null): string => {
    if (!dateStr) return "Unspecified date";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Unspecified date";
    const dateFormatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format for consistency
    });
    const formattedDate = dateFormatter.format(date);
    const formattedTime = timeFormatter.format(date);
    return `${formattedDate} ${formattedTime}`; // Ensures a single space between date and time (e.g., "28 Feb 2025 18:38")
  };

  return (
    <View style={styles.container}>
      <View style={styles.valueContainer}>
        <View style={styles.valueRow}>
          <View style={styles.amountWrapper}>
            {currencyIcons[details.currency] && (
              <Image source={currencyIcons[details.currency]} style={styles.currencyIcon} />
            )}
            <View style={styles.amountTextContainer}>
              <View style={styles.amountLine}>
                <Text style={styles.coinAmount}>{details.amount.toFixed(2)}</Text>
                <Text style={styles.coinLabel}>{currencyLabels[details.currency]}</Text>
              </View>
              {livePrice !== null ? (
                <Text style={styles.usdValue}>${(details.amount * livePrice).toFixed(2)}</Text>
              ) : priceError ? (
                <Text style={styles.errorText}>{priceError}</Text>
              ) : (
                <Text style={styles.errorText}>Fetching...</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.walletButton} onPress={handleShowWallet}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.detailText}>
            {details.recipientFirstName} {details.recipientLastName}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Unlocks On</Text>
          <Text style={styles.detailText}>
            {formatUnlockDateTime(details.unlockDate)}
          </Text>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Wallet Address</Text>
            <View style={styles.walletAddressContainer}>
              <Text style={styles.walletAddress}>{details.walletAddress}</Text>
              <TouchableOpacity
                onPress={() => {
                  copyToClipboard(details.walletAddress);
                  Alert.alert("Copied!", "Wallet address copied to clipboard.");
                }}
                style={styles.copyIcon}
              >
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginVertical: 6,
    marginHorizontal: 16,
    height: 140,
  },
  valueContainer: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    flexWrap: "wrap",
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
  },
  currencyIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    marginLeft: 5,
  },
  coinAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  coinLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginLeft: 4,
  },
  usdValue: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    height: 24,
  },
  errorText: {
    fontSize: 10,
    color: colors.error,
    marginTop: 4,
    height: 24,
  },
  walletButton: {
    padding: 6,
    marginRight: 10,
    backgroundColor: "#2A3435",
    borderRadius: 6,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#2A3435",
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.placeholder,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  walletAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    backgroundColor: "#2A3435",
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  walletAddress: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  copyIcon: {
    marginLeft: 12,
    marginRight: -6,
  },
});

const arePropsEqual = (prevProps: ClaimedGiftProps, nextProps: ClaimedGiftProps) => {
  const prevDetails = prevProps.details;
  const nextDetails = nextProps.details;
  return (
    prevDetails.currency === nextDetails.currency &&
    prevDetails.amount === nextDetails.amount &&
    prevDetails.recipientFirstName === nextDetails.recipientFirstName &&
    prevDetails.recipientLastName === nextDetails.recipientLastName &&
    prevDetails.unlockDate === nextDetails.unlockDate &&
    prevDetails.walletAddress === nextDetails.walletAddress &&
    prevProps.onShowWallet === nextProps.onShowWallet
  );
};

export default memo(ClaimedGift, arePropsEqual);