import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import commonStyles, { colors } from "../../styles/commonStyles";
import Checkbox from "../ui/Checkbox";

// Extended colors with additional UI elements
const extendedColors = {
  ...colors,
  textSecondary: colors.secondary, // Use secondary color for textSecondary
  cardBackground: "#2A3435", // Dark card background
  disabled: "#4A4A4A", // Disabled button color
  textDisabled: "#888888", // Disabled text color
};

interface RecoveryPhraseModalProps {
  visible: boolean;
  mnemonic: string;
  unlockMessage?: string; // Add unlock message prop
  onClose: (mnemonicConfirmed: boolean) => void;
}

const RecoveryPhraseModal: React.FC<RecoveryPhraseModalProps> = ({
  visible,
  mnemonic,
  unlockMessage,
  onClose,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [mnemonicArray, setMnemonicArray] = useState<string[]>([]);

  useEffect(() => {
    if (mnemonic && visible) {
      // Ensure mnemonic is split into an array of words
      setMnemonicArray(mnemonic.trim().split(/\s+/).filter(Boolean));
    }
  }, [mnemonic, visible]);

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(mnemonicArray.join(" "));
      Alert.alert("Copied!", "Recovery phrases copied to clipboard.");
    } catch (error) {
      console.error("⚠️ Error copying phrases:", error);
      Alert.alert("Error", "Failed to copy phrases. Please try again.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.titleText}>Secret Recovery Phrase</Text>
          <Text style={styles.subtitleText}>
            Write these words down in order and store them securely. They are the only
            way to recover this wallet.
          </Text>
          
          {/* Display unlock message if available */}
          {unlockMessage && (
            <Text style={styles.unlockMessage}>
              {unlockMessage}
            </Text>
          )}

          <View style={styles.mnemonicContainer}>
            <FlatList
              data={mnemonicArray}
              numColumns={2}
              renderItem={({ item, index }) => (
                <View style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}.</Text>
                  <Text style={styles.wordText}>{item}</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.mnemonicList}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              checked={confirmed}
              onChecked={setConfirmed}
              label="I've written down my recovery phrase"
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={() => onClose(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonConfirm,
                !confirmed && styles.buttonDisabled,
              ]}
              disabled={!confirmed}
              onPress={() => onClose(true)}
            >
              <Text style={[styles.buttonText, !confirmed && styles.buttonTextDisabled]}>
                Access Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
  },
  modalView: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 14,
    color: extendedColors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  unlockMessage: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  mnemonicContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: extendedColors.cardBackground,
    borderRadius: 10,
    marginBottom: 20,
  },
  mnemonicList: {
    alignItems: "flex-start",
  },
  wordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    padding: 8,
  },
  wordNumber: {
    fontSize: 14,
    color: extendedColors.textSecondary,
    marginRight: 5,
    width: 20,
    textAlign: "right",
  },
  wordText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    width: "48%",
    alignItems: "center",
  },
  buttonConfirm: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    backgroundColor: extendedColors.disabled,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: extendedColors.textDisabled,
  },
});

export default RecoveryPhraseModal;