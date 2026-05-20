import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, showLogo = false, rightAction }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {showLogo && (
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/logo_5-removebg.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  inner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.bgSurface,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
