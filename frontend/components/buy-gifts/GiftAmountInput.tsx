import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Image, StyleSheet, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import commonStyles from "../../styles/commonStyles";

interface GiftAmountInputProps {
  giftAmount: string;
  onAmountChange: (amount: string) => void;
  onSelectCurrency: () => void;
  currencyIcon: any;
  inputRef: React.RefObject<TextInput>;
}

const GiftAmountInput: React.FC<GiftAmountInputProps> = ({
  giftAmount,
  onAmountChange,
  onSelectCurrency,
  currencyIcon,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (text: string) => {
    let filteredText = text.replace(/[^0-9.]/g, ""); // Allow only numbers and a single decimal point
    const parts = filteredText.split(".");

    // Prevent invalid formatting
    if (parts.length > 2) return; // Only one decimal point allowed
    if (filteredText.startsWith("0") && filteredText.length > 1 && filteredText[1] !== ".") {
      filteredText = filteredText.replace(/^0+/, ""); // Remove leading zeros unless there's a decimal point
    }
    if (parts.length === 2 && parts[1].length > 4) {
      filteredText = `${parts[0]}.${parts[1].substring(0, 4)}`; // Limit to 4 decimal places
    }

    setError(null); // Clear error when valid input is detected
    onAmountChange(filteredText); // Update the amount in the parent component
  };

  const validateAmount = () => {
    if (!giftAmount || isNaN(Number(giftAmount)) || Number(giftAmount) <= 0) {
      setError("Amount must be greater than zero");
      onAmountChange("");
    } else {
      setError(null); // Clear error when amount is valid
    }
    setIsFocused(false);
  };

  return (
    <View>
      <View style={[commonStyles.inputContainer, isFocused && commonStyles.focusedBorder]}>
        <TextInput
          ref={inputRef}
          style={commonStyles.inputField}
          placeholder={isFocused ? "" : "Enter Gift Amount"}
          placeholderTextColor={commonStyles.placeholderText.color}
          keyboardType="numeric"
          returnKeyType="done"
          value={giftAmount}
          onChangeText={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={validateAmount}
        />
        <TouchableOpacity style={styles.currencyDropdown} onPress={onSelectCurrency}>
          {currencyIcon ? (
            <Image source={currencyIcon} style={styles.currencyIcon} />
          ) : (
            <Text style={styles.placeholderText}>Select</Text>
          )}
          <AntDesign name="down" size={14} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Display error message if present */}
      {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  currencyDropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  currencyIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  placeholderText: {
    fontSize: commonStyles.placeholderText.fontSize,
    color: commonStyles.placeholderText.color,
    marginRight: 5,
  },
});

export default GiftAmountInput;
