// commonStyles.ts
import { StyleSheet } from "react-native";

export const colors = {
  primary: "#1E90FF", // A brighter blue for contrast
  secondary: "#A9A9A9", // Dark gray for secondary elements
  background: "#1C2526", // Dark background
  border: "#3A4445", // Slightly lighter border for contrast
  text: "#E0E0E0", // Light gray text for readability
  placeholder: "#7A8A8C", // Muted placeholder text
  success: "#32CD32", // Bright green for success
  error: "#FF4040", // Bright red for errors
};

export const fonts = {
  regular: "System",
  bold: "System",
  size: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
  },
};

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
};

// No changes needed below unless you want to tweak shadows or other properties
const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.large * 2,
  },
  container: {
    backgroundColor: colors.background,
    padding: spacing.small,
    borderRadius: 8,
    width: "95%",
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: fonts.size.large,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.small,
  },
  input: {
    width: "100%",
    padding: spacing.medium,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fonts.size.medium,
    color: colors.text,
    backgroundColor: "#2A3435", // Darker input background
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#2A3435", // Darker input background
    paddingHorizontal: spacing.medium,
    height: 50,
    width: "100%",
    marginBottom: 20,
  },
  inputField: {
    flex: 1,
    fontSize: fonts.size.medium,
    fontFamily: fonts.regular,
    color: colors.text,
    height: "100%",
    textAlignVertical: "center",
  },
  focusedBorder: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  placeholderText: {
    fontSize: fonts.size.medium,
    color: colors.placeholder,
    textAlignVertical: "center",
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.small,
    marginBottom: spacing.small,
    width: "90%",
    alignSelf: "center",
  },
  disabledButton: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  buttonText: {
    color: colors.background, // Dark text on buttons for contrast
    fontSize: fonts.size.large,
    fontFamily: fonts.bold,
  },
  emptyText: {
    textAlign: "center",
    fontSize: fonts.size.medium,
    color: colors.placeholder,
    marginTop: spacing.medium,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -20,
    marginBottom: 4,
    marginLeft: 10,
  },
  footer: {
    position: "absolute",
    padding: spacing.small,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.large * 2,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, // Slightly stronger shadow for dark mode
    shadowRadius: 4,
    elevation: 5, // Increased elevation for Android
  },
  title: {
    fontSize: fonts.size.large,
    fontWeight: "bold",
    color: colors.text,
  },
  primaryColor: {
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.medium,
  },
  loadingText: {
    fontSize: fonts.size.medium,
    color: colors.text,
    opacity: 0.7,
  },
});

export default commonStyles;