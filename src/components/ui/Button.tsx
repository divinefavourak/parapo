import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'purple';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const vs = variantMap[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: vs.bg, borderColor: vs.border, borderWidth: vs.border ? 1 : 0 },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.color} size="small" />
      ) : (
        <Text style={[styles.label, { color: vs.color }, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const variantMap: Record<ButtonVariant, { bg: string; border?: string; color: string }> = {
  primary: { bg: Colors.accentBlue, color: Colors.accentBlueDeep },
  secondary: { bg: Colors.bgSubtle, border: Colors.borderSubtle, color: Colors.textPrimary },
  ghost: { bg: 'transparent', border: Colors.border, color: Colors.textPrimary },
  danger: { bg: Colors.accentRedDark, color: Colors.accentRedDeep },
  purple: { bg: Colors.accentPurple, color: Colors.accentPurpleDeep },
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: {
    ...Typography.labelLarge,
    fontWeight: '500',
    textAlign: 'center',
  },
});
