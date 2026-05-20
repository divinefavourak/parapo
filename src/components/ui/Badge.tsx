import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type BadgeVariant = 'blocker' | 'review' | 'routine' | 'success' | 'info' | 'purple' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; border: string; color: string }> = {
  blocker: { bg: Colors.overlayRed, border: Colors.overlayRedStrong, color: Colors.accentRed },
  review: { bg: Colors.overlayGreen, border: Colors.overlayGreenStrong, color: Colors.accentGreen },
  routine: { bg: 'rgba(66,71,84,0.3)', border: 'rgba(66,71,84,0.5)', color: Colors.textSecondary },
  success: { bg: Colors.overlayGreen, border: Colors.overlayGreenStrong, color: Colors.accentGreen },
  info: { bg: Colors.overlayBlue, border: Colors.overlayBlueStrong, color: Colors.accentBlue },
  purple: { bg: Colors.overlayPurple, border: Colors.overlayPurpleStrong, color: Colors.accentPurpleLight },
  neutral: { bg: 'rgba(53,53,52,0.8)', border: Colors.borderSubtle, color: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const vs = variantStyles[variant];
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: vs.bg, borderColor: vs.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: vs.color }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSmall,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
