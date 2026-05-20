import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { FocusSession } from '../../features/dashboard/types';
import { ProgressBar } from '../ui/ProgressBar';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface Props {
  session: FocusSession;
}

export const TodaysFocusCard: React.FC<Props> = ({ session }) => {
  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Text style={styles.title}>Today's Focus</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>⏱ {session.timeRemaining}</Text>
        </View>
      </View>

      {/* Session info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.subtitle}>{session.subtitle}</Text>
        <Text style={styles.sessionTitle}>{session.title}</Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <ProgressBar
            progress={session.progress}
            color={Colors.accentBlue}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{Math.round(session.progress * 100)}% Complete</Text>
          <Text style={styles.progressLabel}>Est. finish: {session.estimatedFinish}</Text>
        </View>
      </View>

      {/* Divider + bottom row */}
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.collaborators}>
          {session.collaborators.map((c, i) => (
            <Avatar
              key={i}
              initials={c.initials}
              size={32}
              style={i > 0 ? { marginLeft: -8 } : undefined}
            />
          ))}
        </View>
        <Button label="Join Session" variant="ghost" style={styles.joinBtn} />
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
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  timerBadge: {
    backgroundColor: Colors.overlayBlue,
    borderWidth: 1,
    borderColor: Colors.overlayBlueStrong,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    ...Typography.labelMedium,
    color: Colors.accentBlue,
  },
  sessionInfo: {
    gap: 4,
  },
  subtitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  progressLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collaborators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBtn: {
    paddingVertical: 7,
    paddingHorizontal: 17,
  },
});
