import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import commonStyles, { colors } from "../../styles/commonStyles";

interface RecoveryPhraseModalProps {
  visible: boolean;
  mnemonic?: string; // Optional, but prioritized
  onClose: (mnemonicConfirmed: boolean) => void; // Updated to return confirmation status
}

const RecoveryPhraseModal = ({
  visible,
  mnemonic = "", // Default to empty string if undefined
  onClose,
}: RecoveryPhraseModalProps) => {
  const [confirmed, setConfirmed] = useState(false); // Switch defaults to off

  // Use mnemonic if provided
  const recoveryPhrases = mnemonic ? mnemonic.split(" ") : [];

  // Ensure we have phrases to display
  if (visible && recoveryPhrases.length === 0) {
    console.error("No recovery phrases or mnemonic provided.");
    Alert.alert("Error", "No recovery phrases available. Please contact support.");
    onClose(false); // Close modal if no mnemonic, no claim
    return null;
  }

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(recoveryPhrases.join(" "));
      Alert.alert("Copied!", "Recovery phrases copied to clipboard.");
    } catch (error) {
      console.error("⚠️ Error copying phrases:", error);
      Alert.alert("Error", "Failed to copy phrases. Please try again.");
    }
  };

  const handleConfirmAndClose = () => {
    onClose(confirmed); // Pass confirmation status back to parent
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => onClose(false)} // Close without claiming if user cancels (back button/swipe)
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={commonStyles.sectionTitle}>Recovery Phrases</Text>
          <Text style={styles.description}>
            Write down these recovery phrases in the exact order. You’ll need them to access your wallet.
            Once this modal is closed, the phrases cannot be retrieved.
          </Text>

          {/* Phrases Grid */}
          {recoveryPhrases.length > 0 ? (
            <View style={styles.gridContainer}>
              {recoveryPhrases.map((phrase, index) => (
                <View key={`${phrase}-${index}`} style={styles.gridItem}>
                  <Text style={styles.phraseIndex}>{index + 1}.</Text>
                  <Text style={styles.phraseText}>{phrase}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.errorText}>No recovery phrases available.</Text>
          )}

          {/* Copy Button with Confirmation */}
          <TouchableOpacity
            style={[
              styles.copyButton,
              recoveryPhrases.length === 0 && styles.disabledCopyButton,
            ]}
            onPress={handleCopyToClipboard}
            disabled={recoveryPhrases.length === 0}
          >
            <Text style={styles.copyButtonText}>Copy Phrases</Text>
          </TouchableOpacity>

          {/* Secure Confirmation Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>I have securely stored the phrases.</Text>
            <Switch
              value={confirmed}
              onValueChange={setConfirmed}
              trackColor={{ false: colors.secondary, true: colors.primary }} // Use valid colors
              thumbColor={confirmed ? colors.background : colors.text}
            />
          </View>

          {/* Secure Access Button */}
          <TouchableOpacity
            style={[commonStyles.button, !confirmed && commonStyles.disabledButton]}
            onPress={handleConfirmAndClose}
            disabled={!confirmed} // Disabled until switch is toggled on
          >
            <Text style={commonStyles.buttonText}>Access Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    width: "90%",
    backgroundColor: colors.background, // Dark background from commonStyles
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    color: colors.placeholder, // Muted text for description
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  gridItem: {
    width: "30%",
    marginVertical: 8,
    alignItems: "center",
  },
  phraseIndex: {
    fontWeight: "bold",
    fontSize: 14,
    color: colors.text, // Light text for readability
  },
  phraseText: {
    fontSize: 16,
    color: colors.primary, // Bright blue for phrases
    textAlign: "center",
  },
  copyButton: {
    padding: 10,
    backgroundColor: colors.primary, // Bright blue from commonStyles
    borderRadius: 5,
    marginVertical: 10,
    width: 140,
    alignItems: "center",
  },
  disabledCopyButton: {
    backgroundColor: colors.secondary, // Dark gray for disabled state
  },
  copyButtonText: {
    color: colors.background, // Dark text on buttons for contrast
    fontWeight: "bold",
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  switchText: {
    marginRight: 10,
    fontSize: 14,
    color: colors.text, // Light text
  },
  errorText: {
    fontSize: 14,
    color: colors.error, // Bright red for errors
    marginVertical: 10,
  },
});

export default RecoveryPhraseModal;