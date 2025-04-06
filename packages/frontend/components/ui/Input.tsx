import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { borderRadius, dimensions, spacing, typography } from './styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputContainerStyle,
      labelStyle,
      inputStyle,
      helperStyle,
      errorStyle,
      style,
      ...rest
    },
    ref
  ) => {
    const { colors, isDark } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: colors.text }, labelStyle]}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.background,
              borderColor: error ? colors.error : colors.border,
            },
            inputContainerStyle,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.text,
                paddingLeft: leftIcon ? 0 : spacing.medium,
                paddingRight: rightIcon ? 0 : spacing.medium,
              },
              inputStyle,
              style,
            ]}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            autoCapitalize="none"
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>

        {(error || helper) && (
          <Text
            style={[
              styles.helperText,
              { color: error ? colors.error : colors.textSecondary },
              error ? errorStyle : helperStyle,
            ]}
          >
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
  },
  label: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: dimensions.borderWidth,
    borderRadius: borderRadius.medium,
    height: dimensions.inputHeight,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSize.medium,
  },
  leftIcon: {
    paddingLeft: spacing.medium,
    paddingRight: spacing.small,
  },
  rightIcon: {
    paddingRight: spacing.medium,
    paddingLeft: spacing.small,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default Input; 