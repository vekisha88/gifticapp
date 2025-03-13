import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import commonStyles, { colors, fonts } from "../../styles/commonStyles";
import { useClipboard } from "../../utils/useClipboard";

interface GiftSuccessProps {
  visible: boolean; // Controls the modal visibility
  giftCode: string;
  recipientName: string; // Combined first and last name
  unlockDate: Date | null; // New prop for the unlock datetime
  onClose: () => void; // Renamed from onDone for consistency with close button
}

const GiftSuccess: React.FC<GiftSuccessProps> = ({
  visible,
  giftCode,
  recipientName,
  unlockDate,
  onClose,
}) => {
  const { copyToClipboard } = useClipboard();

  const shareGiftCode = useCallback(async () => {
    try {
      await Share.share({
        message: `🎉 A gift for ${recipientName}! Use this gift code: ${giftCode}`,
      });
    } catch (error) {
      alert("Failed to share the gift code.");
    }
  }, [giftCode, recipientName]);

  // Format the unlock date and time
  const formatUnlockDateTime = (date: Date | null): string => {
    if (!date) return "Unspecified time"; // Changed to match styling of giftCode and recipientName
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format for consistency
    }).format(date);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[commonStyles.container, styles.modalContent]}>
          {/* Close Button - Styled to match ClaimedGift.tsx */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={commonStyles.sectionTitle}>Gift Created!</Text>
          <Text style={styles.subtitle}>
            Your gift for{" "}
            <Text style={styles.recipientName}>{recipientName}</Text> has been
            successfully created.
          </Text>
          <Text style={styles.lockedUntilText}>
            Assets will be locked until
            {"\n"}
            {" "}
            <Text style={styles.unlockDateText}>{formatUnlockDateTime(unlockDate)}</Text>.
          </Text>

          <Text style={styles.giftCodeLabel}>Gift Code:</Text>
          <View style={styles.giftCodeContainer}>
            <Text style={styles.giftCode}>{giftCode}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(giftCode)}
              style={styles.copyIcon}
              accessibilityLabel="Copy gift code"
            >
              <Feather name="copy" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[commonStyles.button, styles.shareButton]}
            onPress={shareGiftCode}
            accessibilityLabel="Share gift code"
          >
            <Text style={commonStyles.buttonText}>Share</Text>
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
    alignItems: "center",
    paddingVertical: 20, // Reduced to 20 for consistency with other modals
    paddingHorizontal: 20, // Reduced to 20 for consistency with other modals
    width: "90%",
    position: "relative",
    backgroundColor: colors.background, // Dark background from commonStyles
  },
  closeButton: {
    position: "absolute",
    top: 8, // Matches ClaimedGift.tsx positioning
    right: 8, // Matches ClaimedGift.tsx positioning
    zIndex: 1,
  },
  subtitle: {
    fontSize: fonts.size.medium, // Increased for readability (from commonStyles)
    textAlign: "center",
    color: colors.text, // Light text
    marginVertical: 10,
  },
  recipientName: {
    fontWeight: "bold",
    color: colors.primary, // Bright blue for emphasis, matching giftCode
  },
  lockedUntilText: {
    fontSize: fonts.size.medium, // Introductory text size
    color: colors.text,
    textAlign: "center",
    marginVertical: 10,
  },
  unlockDateText: {
    fontSize: 22, // Match giftCode size for prominence
    fontWeight: "bold", // Match giftCode and recipientName for consistency
    color: colors.primary, // Match giftCode and recipientName for emphasis
  },
  giftCodeLabel: {
    fontSize: fonts.size.large, // Increased for emphasis (from commonStyles)
    fontFamily: "System",
    color: colors.text, // Light text
    marginBottom: 5,
  },
  giftCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  giftCode: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary, // Bright blue
    marginRight: 10,
  },
  copyIcon: {
    padding: 5,
  },
  shareButton: {
    backgroundColor: colors.primary, // Use primary color instead of hardcoded blue
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    marginTop: 0,
    marginBottom: 20,
  },
});

export default GiftSuccess;