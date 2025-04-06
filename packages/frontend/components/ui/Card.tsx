import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { borderRadius, shadows, spacing } from './styles';

interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'outlined';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

interface TouchableCardProps extends TouchableOpacityProps {
  variant?: 'default' | 'flat' | 'outlined';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  style,
  children,
  ...rest
}) => {
  const { colors, isDark } = useTheme();

  const getCardStyle = () => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: isDark ? colors.card : colors.background,
          borderWidth: 0,
          ...(!isDark && shadows.small),
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderWidth: 0,
          ...(isDark ? {} : shadows.small),
        };
    }
  };

  return (
    <View
      style={[cardStyles.card, getCardStyle(), style]}
      {...rest}
    >
      {children}
    </View>
  );
};

export const TouchableCard: React.FC<TouchableCardProps> = ({
  variant = 'default',
  style,
  children,
  ...rest
}) => {
  const { colors, isDark } = useTheme();

  const getCardStyle = () => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: isDark ? colors.card : colors.background,
          borderWidth: 0,
          ...(!isDark && shadows.small),
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderWidth: 0,
          ...(isDark ? {} : shadows.small),
        };
    }
  };

  return (
    <TouchableOpacity
      style={[cardStyles.card, getCardStyle(), style]}
      activeOpacity={0.7}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    overflow: 'hidden',
  },
});

export default Card; 