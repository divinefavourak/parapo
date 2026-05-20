import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'purple' | 'transparent';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  );
};

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  elevated: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  purple: {
    backgroundColor: Colors.bgElevated,
    borderColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    borderWidth: 1,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
