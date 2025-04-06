import { StyleSheet, Dimensions, Platform } from 'react-native';
import { lightTheme } from './ThemeContext';

const { width, height } = Dimensions.get('window');

// Common style variables used across the app

// Spacing
export const spacing = {
  xs: 4,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  fontSize: {
    xs: 12,
    small: 14,
    medium: 16,
    large: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Dimensions
export const dimensions = {
  screen: {
    width,
    height,
  },
  headerHeight: 56,
  tabBarHeight: 60,
  buttonHeight: 48,
  inputHeight: 48,
  borderWidth: 1,
  avatarSize: {
    small: 32,
    medium: 48,
    large: 64,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    round: 9999,
  },
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Border radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xl: 16,
  xxl: 24,
  circle: 9999,
};

// Common styles used across the app
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  screenContainer: {
    flex: 1,
    padding: spacing.medium,
    backgroundColor: lightTheme.background,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Card styles
  card: {
    backgroundColor: lightTheme.card,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    ...shadows.small,
  },
  
  // Text styles
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: lightTheme.text,
    marginBottom: spacing.small,
  },
  subtitle: {
    fontSize: typography.fontSize.large,
    fontWeight: '600',
    color: lightTheme.text,
    marginBottom: spacing.small,
  },
  bodyText: {
    fontSize: typography.fontSize.medium,
    color: lightTheme.text,
  },
  captionText: {
    fontSize: typography.fontSize.small,
    color: lightTheme.textSecondary,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: lightTheme.primary,
    borderRadius: borderRadius.large,
    height: dimensions.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.large,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: lightTheme.primary,
    borderWidth: dimensions.borderWidth,
    borderRadius: borderRadius.large,
    height: dimensions.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.large,
  },
  buttonText: {
    color: 'white',
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: lightTheme.primary,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  
  // Input styles
  input: {
    height: dimensions.inputHeight,
    borderWidth: dimensions.borderWidth,
    borderColor: lightTheme.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    fontSize: typography.fontSize.medium,
    color: lightTheme.text,
  },
  inputLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    color: lightTheme.text,
    marginBottom: spacing.xs,
  },
  
  // Helper styles
  divider: {
    height: dimensions.borderWidth,
    backgroundColor: lightTheme.border,
    marginVertical: spacing.medium,
  },
  errorText: {
    fontSize: typography.fontSize.small,
    color: lightTheme.error,
    marginTop: spacing.xs,
  },
});

export default styles; 