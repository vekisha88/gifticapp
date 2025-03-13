import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import commonStyles, { colors, fonts, spacing } from "../../styles/commonStyles";
import { StyleSheet } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  confirmationData: { totalAmount: number; paymentAddress: string } | null;
  onConfirm: () => void;
  onRequestClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  confirmationData,
  onConfirm,
  onRequestClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[commonStyles.container, styles.modalContent]}>
          <Text style={styles.modalText}>
            {confirmationData ? " The transaction has to be confirmed on blockchain within 60 minutes or the gift code will be deleted." : ""}
          </Text>
          <TouchableOpacity
            style={[
              commonStyles.button, // Use commonStyles.button for base styling
              styles.okButton, // Custom style to match Share button size and padding
              !confirmationData && commonStyles.disabledButton, // Ensure disabled state
            ]}
            onPress={onConfirm}
            disabled={!confirmationData}
          >
            <Text style={commonStyles.buttonText}>OK</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker overlay for contrast, matching GiftSuccess
  },
  modalContent: {
    alignItems: "center",
    paddingVertical: 20, // Kept for consistency with GiftSuccess
    paddingHorizontal: spacing.large, // Increased to 24 (spacing.large) for better text spacing from edges
    width: "95%", // Increased to 95% for a larger modal, or use 350 (e.g., minWidth: 350) for fixed size on larger screens
    position: "relative",
    backgroundColor: colors.background, // Dark background from commonStyles, matching GiftSuccess
    // Optional: Add minHeight for taller content if needed, e.g., minHeight: 200
  },
  modalText: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    marginHorizontal: spacing.small, // Added 8px margin on left/right for text spacing from edges
    fontFamily: "System", // Matching GiftSuccess
  },
  okButton: {
    paddingVertical: 10, // Match Share button padding from GiftSuccess
    paddingHorizontal: 16, // Match Share button padding from GiftSuccess
    borderRadius: 8, // Match Share button borderRadius from GiftSuccess
    alignItems: "center",
    justifyContent: "center",
    width: 120, // Match Share button width from GiftSuccess
    marginTop: 20,
    marginBottom: 20, // Match Share button marginBottom from GiftSuccess
  },
});

export default ConfirmationModal;