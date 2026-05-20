import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  showOnlineIndicator?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  size = 32,
  color = Colors.accentBlueDark,
  style,
  showOnlineIndicator = false,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2.5, backgroundColor: color }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
      {showOnlineIndicator && (
        <View style={[styles.indicator, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initials: {
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.accentGreen,
    borderWidth: 2,
    borderColor: Colors.bgElevated,
  },
});
