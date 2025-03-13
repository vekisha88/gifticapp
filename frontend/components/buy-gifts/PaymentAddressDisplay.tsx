import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useClipboard } from "../../utils/useClipboard";
import commonStyles, { colors } from "../../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";

interface PaymentAddressDisplayProps {
  paymentAddress: string | null;
  error?: string | null; // Optional
}

const PaymentAddressDisplay = ({
  paymentAddress,
  error = null, // Default to null instead of relying on React.FC
}: PaymentAddressDisplayProps) => {
  const { copyToClipboard } = useClipboard();

  // If there's an error, display the error message instead of an empty UI
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // If no payment address is provided, return null
  if (!paymentAddress) return null;

  // Split the payment address into two halves
  const halfLength = Math.ceil(paymentAddress.length / 2);
  const addressFirstHalf = paymentAddress.slice(0, halfLength);
  const addressSecondHalf = paymentAddress.slice(halfLength);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>via Polygon network to</Text>
      <View style={styles.addressContainer}>
        <View style={styles.addressWrapper}>
          <TextInput
            style={[commonStyles.inputField, styles.addressInput]}
            value={`${addressFirstHalf}\n${addressSecondHalf}`}
            editable={false}
            multiline
          />
        </View>
        <TouchableOpacity
          onPress={() => copyToClipboard(paymentAddress)}
          accessibilityLabel="Copy payment address"
          style={styles.copyIconWrapper}
        >
          <Ionicons name="copy-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.background, // Dark background from commonStyles
    borderRadius: commonStyles.container.borderRadius,
    ...commonStyles.cardShadow, // Consistent shadow
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: "#3A2525", // Dark red background for error
    borderColor: colors.error, // Bright red border
    borderWidth: 1,
  },
  label: {
    fontSize: commonStyles.placeholderText.fontSize,
    color: colors.placeholder, // Muted text from commonStyles
    marginBottom: 10,
  },
  errorText: {
    color: colors.error, // Bright red text for errors
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#2A3435", // Darker background for address field
    borderRadius: commonStyles.inputContainer.borderRadius,
    paddingHorizontal: 10,
  },
  addressWrapper: {
    flex: 1,
  },
  addressInput: {
    textAlign: "center",
    backgroundColor: "transparent", // Blend into container
    paddingVertical: 8,
    borderRadius: commonStyles.inputContainer.borderRadius,
    fontSize: commonStyles.inputField.fontSize,
    color: colors.text, // Light text for readability
  },
  copyIconWrapper: {
    marginLeft: 5,
    marginRight: 5,
  },
});

export default PaymentAddressDisplay;