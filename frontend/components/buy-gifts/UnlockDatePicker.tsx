import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import commonStyles, { colors, fonts, spacing } from "../../styles/commonStyles";

interface UnlockDatePickerProps {
  unlockDate: Date | null;
  onDateChange: (date: Date) => void;
  onBlur: () => void;
  isDisabled?: boolean; // Optional
  error?: string; // Optional
}

const UnlockDatePicker = ({
  unlockDate,
  onDateChange,
  onBlur,
  isDisabled = false, // Explicit default
  error, // No default, handled conditionally
}: UnlockDatePickerProps) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    if (!isDisabled) {
      setDatePickerVisibility(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    onBlur();
  };

  const handleConfirm = (date: Date) => {
    // Check if the selected date/time is at least 2 hours from now
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

    if (date < twoHoursFromNow) {
      Alert.alert(
        "Invalid Time",
        "Please select a date and time at least 2 hours from now.",
        [{ text: "OK", onPress: () => setDatePickerVisibility(true) }]
      );
      return;
    }

    onDateChange(date);
    hideDatePicker();
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return "Select Date & Time";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format for consistency
    }).format(date);
  };

  // Calculate minimum date/time (2 hours from now) for the picker
  const minimumDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Text style={[commonStyles.title, styles.label]}>Lock until</Text>
      <TouchableOpacity
        style={[
          commonStyles.button, // Use commonStyles.button for consistency (ensures padding: spacing.medium, 16)
          styles.dateButton,
          isDisabled && commonStyles.disabledButton, // Use commonStyles.disabledButton for disabled state
        ]}
        onPress={showDatePicker}
        disabled={isDisabled}
      >
        <Text
          style={[
            isDisabled ? styles.disabledDateTimeText : styles.selectedDateTimeText, // Use disabled text style when disabled
            { fontSize: fonts.size.medium, fontFamily: fonts.bold }, // Reduced to match input fields (16, fonts.size.medium), kept bold for consistency with buttons
          ]}
        >
          {formatDateTime(unlockDate)}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime" // Changed from "date" to "datetime" for date and time selection
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={minimumDateTime} // Enforce minimum 2 hours from now
        maximumDate={new Date("2100-12-31T23:59:59")} // Optional: cap at a far future date
        themeVariant="light"
        accentColor={colors.primary}
        textColor={colors.text}
        date={unlockDate || minimumDateTime} // Default to minimum date/time if no unlockDate
      />

      {error && <Text style={commonStyles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.small,
    paddingTop: 0,
  },
  label: {
    flex: 1,
    marginRight: spacing.small,
  },
  dateButton: {
    width: 180, // Kept wider to accommodate date and time, but adjusted padding will balance it
    // Removed custom padding, relying on commonStyles.button for padding: spacing.medium (16)
    marginTop: 5,
  },
  selectedDateTimeText: {
    color: colors.background, // Dark gray (#1C2526) for enabled state, matching Wrap a Gift
  },
  disabledDateTimeText: {
    color: colors.background, // Dark gray (#1C2526) for disabled state, faded due to commonStyles.disabledButton opacity
  },
  // Removed placeholderText, as we’ll use selectedDateTimeText for consistency, with color handled by disabled state
});

export default UnlockDatePicker;