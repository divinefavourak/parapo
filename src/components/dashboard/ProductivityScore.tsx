import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface Props {
  score: number;
  delta: string;
}

export const ProductivityScore: React.FC<Props> = ({ score, delta }) => {
  // Circumference of circle SVG approximation using View-based ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = score / 100;

  return (
    <View style={styles.container}>
      <Text style={styles.efficiencyLabel}>Efficiency Score</Text>

      <View style={styles.ringContainer}>
        {/* Track ring */}
        <View style={styles.trackRing} />
        {/* Progress indicator - simplified visual */}
        <View style={[styles.progressArc, { opacity: progressFraction }]} />
        {/* Center content */}
        <View style={styles.centerContent}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scorePercent}>%</Text>
          </View>
        </View>
      </View>

      <View style={styles.deltaRow}>
        <Text style={styles.deltaArrow}>↑</Text>
        <Text style={styles.deltaText}>{delta}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 17,
    alignItems: 'center',
  },
  efficiencyLabel: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  ringContainer: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 8,
    borderColor: Colors.bgSubtle,
  },
  progressArc: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 8,
    borderColor: Colors.accentBlue,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accentBlue,
    letterSpacing: -2.4,
    lineHeight: 56,
  },
  scorePercent: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.accentBlue,
    lineHeight: 32,
    marginBottom: 4,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  deltaArrow: {
    color: Colors.accentGreen,
    fontSize: 10,
    fontWeight: '700',
  },
  deltaText: {
    ...Typography.labelMedium,
    color: Colors.accentGreen,
  },
});
