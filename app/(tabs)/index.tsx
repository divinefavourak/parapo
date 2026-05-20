import React, { useMemo } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { Avatar } from '../../src/components/ui/Avatar';
import { AIBriefingCard } from '../../src/components/dashboard/AIBriefingCard';
import { ProductivityScore } from '../../src/components/dashboard/ProductivityScore';
import { TodaysFocusCard } from '../../src/components/dashboard/TodaysFocusCard';
import { UrgentTasksCard } from '../../src/components/dashboard/UrgentTasksCard';
import { MeetingPulseCard } from '../../src/components/dashboard/MeetingPulseCard';
import { mockDashboardData } from '../../src/features/dashboard/mockData';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const data = mockDashboardData;

  return (
    <View style={styles.container}>
      <TopBar
        title="Command Center"
        subtitle={data.greeting}
        showLogo
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchBtn}>
              <Text style={styles.searchIcon}>⌕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <Avatar initials="SC" size={32} color={Colors.accentBlueDark} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top section: AI Briefing + Productivity Score */}
        <View style={styles.section}>
          <AIBriefingCard data={data.aiBriefing} />
          <ProductivityScore score={data.productivityScore} delta={data.productivityDelta} />
        </View>

        {/* Today's Focus */}
        <TodaysFocusCard session={data.focusSession} />

        {/* Urgent Tasks */}
        <UrgentTasksCard tasks={data.urgentTasks} />

        {/* Meeting Pulse */}
        <MeetingPulseCard meeting={data.nextMeeting} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: 80 + insets.bottom }]} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    gap: Layout.sectionGap,
  },
  section: {
    gap: Layout.sectionGap,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  searchIcon: {
    color: Colors.textPrimary,
    fontSize: 20,
  },
  avatarBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    elevation: 8,
    shadowColor: Colors.accentBlueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabIcon: {
    color: Colors.accentBlueDeeper,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
});
