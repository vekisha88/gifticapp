import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from './ThemeContext';
import styles, { borderRadius, spacing, typography } from './styles';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...rest
}) => {
  const { colors, isDark } = useTheme();

  // Define button styles based on variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? (isDark ? colors.card : 'rgba(99, 102, 241, 0.5)') : colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? colors.card : 'rgba(99, 102, 241, 0.1)',
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? (isDark ? colors.border : 'rgba(99, 102, 241, 0.5)') : colors.primary,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
    }
  };

  // Define text styles based on variant
  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          color: 'white',
        };
      case 'secondary':
        return {
          color: disabled ? (isDark ? colors.textSecondary : 'rgba(99, 102, 241, 0.5)') : colors.primary,
        };
      case 'outline':
        return {
          color: disabled ? (isDark ? colors.textSecondary : 'rgba(99, 102, 241, 0.5)') : colors.primary,
        };
      default:
        return {
          color: 'white',
        };
    }
  };

  // Define button size styles
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.medium,
          borderRadius: borderRadius.medium,
          height: 36,
        };
      case 'large':
        return {
          paddingVertical: spacing.medium,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.xl,
          height: 56,
        };
      default:
        return {
          paddingVertical: spacing.small,
          paddingHorizontal: spacing.large,
          borderRadius: borderRadius.large,
          height: 48,
        };
    }
  };

  // Define text size styles
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: typography.fontSize.small,
        };
      case 'large':
        return {
          fontSize: typography.fontSize.large,
        };
      default:
        return {
          fontSize: typography.fontSize.medium,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        buttonStyles.button,
        getButtonStyle(),
        getSizeStyle(),
        fullWidth && buttonStyles.fullWidth,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? 'white' : colors.primary}
          size="small"
        />
      ) : (
        <View style={buttonStyles.contentContainer}>
          {leftIcon && <View style={buttonStyles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              buttonStyles.text,
              getTextStyle(),
              getTextSizeStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={buttonStyles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.small,
  },
  rightIcon: {
    marginLeft: spacing.small,
  },
});

export default Button; 