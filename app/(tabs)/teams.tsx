import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Button } from '../../src/components/ui/Button';
import {
  mockTeamMembers,
  mockDelegations,
  mockMeetings,
  mockMilestones,
} from '../../src/features/leadership/mockData';

const statusVariant: Record<string, 'blocker' | 'success' | 'info' | 'purple' | 'neutral'> = {
  PENDING: 'blocker',
  COMPLETED: 'success',
  ACTIVE: 'purple',
  UPCOMING: 'neutral',
};

export default function TeamsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <TopBar title="Leadership Hub" subtitle="Command Center" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Team Pulse */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Pulse</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>8 ACTIVE</Text>
            </View>
          </View>

          {mockTeamMembers.filter((m) => m.isOnline).map((member) => (
            <TouchableOpacity key={member.id} style={styles.memberCard} activeOpacity={0.8}>
              <View style={styles.memberLeft}>
                <Avatar
                  initials={member.initials}
                  size={48}
                  showOnlineIndicator={member.isOnline}
                  color={Colors.accentBlueDark}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberActivity}>{member.currentActivity}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          <Button label="View All Active Members" variant="secondary" fullWidth />
        </View>

        {/* Delegation Board */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delegation Board</Text>
          </View>

          {['LOGISTICS', 'CREATIVE', 'ENGAGEMENT'].map((category) => {
            const items = mockDelegations.filter((d) => d.category === category);
            const categoryColor = items[0]?.categoryColor ?? Colors.textMuted;
            return (
              <View key={category} style={styles.delegationGroup}>
                <View style={styles.delegationGroupHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.categoryLabel}>{category}</Text>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.delegationCard}>
                    <View style={styles.delegationTop}>
                      <Text style={styles.delegationTitle}>{item.title}</Text>
                      <Badge label={item.status} variant={statusVariant[item.status] ?? 'neutral'} />
                    </View>
                    <Text style={styles.delegationDesc}>{item.description}</Text>
                    {item.progress !== undefined && (
                      <ProgressBar
                        progress={item.progress}
                        color={categoryColor}
                        style={styles.delegationProgress}
                      />
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Org Architecture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Org Architecture</Text>
          <View style={styles.orgChart}>
            <View style={styles.orgRoot}>
              <Text style={styles.orgRootText}>Executive Board</Text>
            </View>
            <View style={styles.orgConnector} />
            <View style={styles.orgRow}>
              {['Operations', 'Finance', 'Marketing'].map((dept) => (
                <View key={dept} style={styles.orgNode}>
                  <Text style={styles.orgNodeText}>{dept}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Meeting Pulse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Pulse</Text>
          {mockMeetings.map((meeting) => (
            <View key={meeting.id} style={[styles.meetingCard, meeting.status === 'upcoming' && meeting.minutesUntil && styles.meetingCardLive]}>
              {meeting.minutesUntil && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>IN {meeting.minutesUntil}M</Text>
                </View>
              )}
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Text style={styles.meetingMeta}>{meeting.time}{meeting.location ? ` • ${meeting.location}` : ''}</Text>
              {meeting.minutesUntil && (
                <Button label="Join Huddle" variant="purple" style={styles.joinBtn} />
              )}
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project: Fall Orientation</Text>
          <Text style={styles.timelineSubtitle}>Strategic roadmap and critical path</Text>
          <View style={styles.timeline}>
            {mockMilestones.map((m, i) => (
              <View key={i} style={styles.milestone}>
                <View style={[
                  styles.milestoneNode,
                  m.isCurrent && styles.milestoneNodeCurrent,
                  m.isComplete && styles.milestoneNodeComplete,
                ]} />
                <Text style={[
                  styles.milestoneDate,
                  m.isCurrent && styles.milestoneDateCurrent,
                ]}>
                  {m.month} {m.date}
                </Text>
                <Text style={[
                  styles.milestoneLabel,
                  m.isCurrent && styles.milestoneLabelCurrent,
                  !m.isCurrent && !m.isComplete && styles.milestoneLabelDim,
                ]}>
                  {m.label}
                </Text>
                {m.isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
            ))}
            <View style={styles.timelineLine} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0e0e' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 24 },

  section: {
    backgroundColor: 'rgba(32,31,31,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 25,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: Colors.overlayGreen,
    borderWidth: 1,
    borderColor: Colors.overlayGreenStrong,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  activeBadgeText: {
    ...Typography.labelLarge,
    color: Colors.accentGreen,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  memberCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  memberInfo: { flex: 1 },
  memberName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  memberActivity: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 18,
  },

  delegationGroup: { gap: 8 },
  delegationGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  delegationCard: {
    backgroundColor: '#1c1b1b',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 8,
    padding: 17,
    gap: 8,
  },
  delegationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  delegationTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  delegationDesc: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  delegationProgress: {},

  orgChart: {
    alignItems: 'center',
    gap: 0,
  },
  orgRoot: {
    backgroundColor: Colors.overlayBlue,
    borderWidth: 2,
    borderColor: Colors.accentBlue,
    borderRadius: 8,
    paddingHorizontal: 34,
    paddingVertical: 14,
  },
  orgRootText: {
    ...Typography.bodyMedium,
    color: Colors.accentBlue,
    fontWeight: '600',
  },
  orgConnector: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
  },
  orgRow: {
    flexDirection: 'row',
    gap: 12,
  },
  orgNode: {
    backgroundColor: Colors.bgMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orgNodeText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },

  meetingCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  meetingCardLive: {
    borderColor: 'rgba(160,120,255,0.3)',
    backgroundColor: 'rgba(160,120,255,0.1)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentGreen,
  },
  liveText: {
    ...Typography.labelLarge,
    color: Colors.accentGreen,
    fontWeight: '700',
  },
  meetingTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  meetingMeta: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  joinBtn: {
    marginTop: 8,
  },

  timelineSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: -8,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    paddingTop: 20,
  },
  timelineLine: {
    position: 'absolute',
    top: 28,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  milestone: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    zIndex: 1,
  },
  milestoneNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 2,
    borderColor: Colors.textDisabled,
  },
  milestoneNodeCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentBlue,
    borderColor: '#131313',
    borderWidth: 3,
  },
  milestoneNodeComplete: {
    backgroundColor: Colors.accentGreen,
    borderColor: '#131313',
  },
  milestoneDate: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  milestoneDateCurrent: { color: Colors.accentBlue },
  milestoneLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  milestoneLabelCurrent: { color: Colors.accentBlue, fontWeight: '700' },
  milestoneLabelDim: { color: Colors.textMuted },
  currentBadge: {
    backgroundColor: Colors.overlayBlue,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    ...Typography.labelSmall,
    color: Colors.accentBlue,
    fontSize: 9,
  },
});
