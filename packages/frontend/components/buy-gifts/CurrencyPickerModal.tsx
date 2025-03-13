import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Added Ionicons import
import { CurrencyOption } from "../../src/types";
import commonStyles, { colors } from "../../styles/commonStyles";

/**
 * Type definition for historical price data.
 */
type HistoricalPriceData = {
  [key: string]: {
    "5y": number;
    "10y": number;
    "15y": number;
  };
};

/**
 * Historical price data for non-stablecoins (could be fetched dynamically in a real app).
 */
const historicalPrices: HistoricalPriceData = {
  "bitcoin": { "5y": 8566, "10y": 230.6, "15y": 0.05 },
  ethereum: { "5y": 145.47, "10y": 0.65, "15y": 0.65 },
  "matic-network": { "5y": 0.008, "10y": 0.00263, "15y": 0.00263 },
};

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCurrency: (key: string) => void;
  currencyOptions: CurrencyOption[];
}

/**
 * A modal component for selecting a currency with price change information.
 */
const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
  onSelectCurrency,
  currencyOptions,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"5y" | "10y" | "15y">("5y");

  /**
   * Memoized currency options to prevent unnecessary re-renders.
   */
  const memoizedCurrencyOptions = useMemo(() => currencyOptions, [currencyOptions]);

  /**
   * Calculates the price change percentage for a currency over a specified period.
   * @param key The currency key (e.g., "wrapped-bitcoin").
   * @param currentPrice The current price in USD.
   * @param period The time period ("5y", "10y", or "15y").
   * @returns A React element displaying the price change percentage or "N/A".
   */
  const calculatePriceChange = useCallback(
    (key: string, currentPrice: number | undefined, period: "5y" | "10y" | "15y") => {
      const historicalPrice = historicalPrices[key]?.[period];
      if (historicalPrice && currentPrice !== undefined && currentPrice > 0) {
        const change = ((currentPrice - historicalPrice) / historicalPrice) * 100;
        const sign = change > 0 ? "+" : "";
        const color = change > 0 ? colors.success : colors.error; // Use success/error from commonStyles
        return (
          <Text style={{ color }}>
            {sign}{change.toFixed(2)}%
          </Text>
        );
      }
      return <Text style={{ color: colors.placeholder }}>N/A</Text>; // Use placeholder color for N/A
    },
    [] // Removed historicalPrices from dependencies since it’s static
  );

  const renderCurrencyItem = useCallback(
    ({ item }: { item: CurrencyOption }) => (
      <TouchableOpacity
        style={styles.currencyItem}
        onPress={() => {
          onSelectCurrency(item.key);
          onClose();
        }}
        accessibilityLabel={`Select ${item.label} currency`}
        accessibilityHint={`Selects ${item.label} with price $${item.priceInUSD?.toFixed(2) || "loading"}`}
      >
        <Image source={item.icon} style={styles.currencyIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.currencyLabel}>
            1 {item.label} = $
            {item.priceInUSD !== undefined && item.priceInUSD > 0
              ? item.priceInUSD.toFixed(2)
              : "Loading..."}
          </Text>
          {historicalPrices[item.key] && (
            <Text style={styles.priceChange}>
              {calculatePriceChange(item.key, item.priceInUSD, selectedPeriod)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [onSelectCurrency, onClose, selectedPeriod, calculatePriceChange]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      accessibilityLabel="Currency Picker Modal"
      accessibilityHint="Select a currency for your gift"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Close Button - Now matches ClaimedGift */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close Currency Picker"
            accessibilityHint="Closes the currency selection modal"
          >
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Modal Title */}
          <Text style={styles.modalTitle}>Available currencies</Text>

          <FlatList
            data={memoizedCurrencyOptions}
            renderItem={renderCurrencyItem}
            keyExtractor={(item) => item.key}
            accessibilityLabel="Currency Options List"
          />

          {/* Period Selector */}
          <View style={styles.periodTextContainer}>
            <Text style={styles.periodTitle}>Price change in the last:</Text>
            <View style={styles.periodOptions}>
              {["5y", "10y", "15y"].map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period as "5y" | "10y" | "15y")}
                  accessibilityLabel={`Select ${period} year period`}
                  accessibilityHint={`Shows price change for the last ${period} years`}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === period && styles.selectedPeriodOptionText,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker overlay for contrast
  },
  modalContent: {
    ...commonStyles.container,
    width: "90%",
    borderRadius: commonStyles.container.borderRadius,
    padding: 20,
    maxHeight: "80%",
    backgroundColor: colors.background, // Dark background from commonStyles
  },
  closeButton: {
    position: "absolute",
    top: 8,  // Changed to match ClaimedGift
    right: 8, // Changed to match ClaimedGift
    zIndex: 1, // Added to match ClaimedGift
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text, // Light text
    textAlign: "left",
    marginBottom: 10,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Subtle border color
  },
  currencyIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  currencyLabel: {
    fontSize: commonStyles.inputField.fontSize,
    color: colors.text, // Light text for readability
    marginBottom: 4,
  },
  priceChange: {
    fontSize: commonStyles.placeholderText.fontSize,
    color: colors.placeholder, // Default to placeholder, overridden by calculatePriceChange
  },
  periodTextContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  periodTitle: {
    fontSize: commonStyles.placeholderText.fontSize,
    color: colors.text, // Light text
    marginBottom: 8,
  },
  periodOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  periodOptionText: {
    fontSize: commonStyles.placeholderText.fontSize,
    color: colors.primary, // Bright blue for clickable text
    marginHorizontal: 10,
    textDecorationLine: "underline",
  },
  selectedPeriodOptionText: {
    fontWeight: "bold",
    textDecorationLine: "none",
    color: colors.primary, // Maintain bright blue
  },
});

export default CurrencyPickerModal;