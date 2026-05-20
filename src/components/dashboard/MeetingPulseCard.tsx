import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Meeting } from '../../features/dashboard/types';
import { Button } from '../ui/Button';

interface Props {
  meeting: Meeting;
}

export const MeetingPulseCard: React.FC<Props> = ({ meeting }) => {
  return (
    <View style={styles.container}>
      {/* Live indicator */}
      <View style={styles.pulseWrapper}>
        <View style={styles.pulseOuter} />
        <View style={styles.pulseDot} />
      </View>

      <Text style={styles.title}>Meeting Pulse</Text>

      <View style={styles.countdownArea}>
        <View style={styles.minuteRow}>
          <Text style={styles.minuteNumber}>{meeting.minutesUntil}</Text>
          <Text style={styles.minuteUnit}>m</Text>
        </View>
        <Text style={styles.untilLabel}>UNTIL NEXT SYNC</Text>
      </View>

      <View style={styles.meetingInfo}>
        <Text style={styles.meetingTitle}>{meeting.title}</Text>
        <View style={styles.meetingTime}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={styles.meetingTimeText}>{meeting.time}</Text>
        </View>
      </View>

      <Button label="Prepare Brief" variant="primary" fullWidth style={styles.cta} />
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
  pulseWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentGreen,
    opacity: 0.2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentGreen,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  countdownArea: {
    alignItems: 'center',
    marginBottom: 4,
  },
  minuteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  minuteNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -2.4,
    lineHeight: 56,
  },
  minuteUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textSecondary,
    lineHeight: 32,
    marginBottom: 6,
  },
  untilLabel: {
    ...Typography.labelUppercase,
    color: Colors.accentGreen,
    letterSpacing: 1.3,
    marginTop: 4,
    marginBottom: 16,
  },
  meetingInfo: {
    width: '100%',
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 4,
    padding: 13,
    gap: 4,
    marginBottom: 16,
  },
  meetingTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  meetingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockIcon: {
    fontSize: 10,
  },
  meetingTimeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cta: {},
});
