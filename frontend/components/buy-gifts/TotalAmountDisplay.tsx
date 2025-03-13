import React from "react";
import { View, Text, StyleSheet } from "react-native";
import commonStyles from "../../styles/commonStyles";

// Define the currency mapping for acronyms
const currencyAcronyms: { [key: string]: string } = {
  "matic-network": "MATIC",
  ethereum: "ETH",
  "wrapped-bitcoin": "WBTC",
  "usd-coin": "USDC",
  tether: "USDT",
  dai: "DAI",
};

interface TotalAmountDisplayProps {
  giftAmount: string;
  currency: string;
  currencyPrices: { [key: string]: number }; // Prices for all currencies
}

const TotalAmountDisplay: React.FC<TotalAmountDisplayProps> = ({
  giftAmount,
  currency,
  currencyPrices,
}) => {
  const rawTotalCrypto = giftAmount ? parseFloat(giftAmount) * 1.05 : 0; // Adding 5% to the entered amount
  const totalCrypto = parseFloat(rawTotalCrypto.toFixed(4)); // Strip extra zeros after rounding to 4 decimals

  const currencySymbol = currencyAcronyms[currency] || currency; // Get acronym or fallback to key
  const cryptoToUSD = currencyPrices[currency] || 0; // Get USD price, default to 0

  // Calculate equivalent USD value
  const rawTotalInUSD =
    cryptoToUSD > 0 ? totalCrypto * cryptoToUSD : null;
  const totalInUSD =
    rawTotalInUSD !== null
      ? parseFloat(rawTotalInUSD.toFixed(2)) // Strip extra zeros after rounding to 2 decimals
      : null;

  return (
    <View style={[styles.container, commonStyles.cardShadow]}>
      <Text style={commonStyles.title}>Send</Text>
      <Text style={styles.cryptoAmount}>
        {totalCrypto.toString()} {currencySymbol}
      </Text>
      {totalInUSD !== null && (
        <Text style={styles.usdEquivalent}>(~${totalInUSD.toString()} USD)</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: commonStyles.container.backgroundColor,
    borderRadius: 8,
    alignItems: "center",
  },
  cryptoAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: commonStyles.primaryColor.color, // Consistent primary color
    marginTop: 5,
  },
  usdEquivalent: {
    fontSize: 14,
    color: "#555", // Dark gray for better contrast
    marginTop: 4, // Added slight spacing
  },
});

export default TotalAmountDisplay;
