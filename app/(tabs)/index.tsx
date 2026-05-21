import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import { useAuthStore } from '../../src/store/authStore';

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${prefix}, ${name.split(' ')[0]}` : prefix;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [fabOpen, setFabOpen] = useState(false);

  const greeting = getGreeting(user?.full_name);
  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  const displayTasks = mockDashboardData.urgentTasks;

  return (
    <View style={styles.container}>
      <TopBar
        title="Command Center"
        subtitle={greeting}
        showLogo
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/ai/index')}>
              <Text style={styles.searchIcon}>✦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <Avatar initials={initials} size={32} color={Colors.accentBlueDark} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top section: AI Briefing + Productivity Score */}
        <View style={styles.section}>
          <AIBriefingCard data={mockDashboardData.aiBriefing} />
          <ProductivityScore score={mockDashboardData.productivityScore} delta={mockDashboardData.productivityDelta} />
        </View>

        {/* Today's Focus */}
        <TodaysFocusCard session={mockDashboardData.focusSession} />

        {/* Urgent Tasks */}
        <UrgentTasksCard tasks={displayTasks} />

        {/* Meeting Pulse */}
        <MeetingPulseCard meeting={mockDashboardData.nextMeeting} />
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabArea, { bottom: 80 + insets.bottom }]}>
        {fabOpen && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setFabOpen(false); router.push('/notes/index'); }}
            >
              <Text style={styles.fabMenuIcon}>✎</Text>
              <Text style={styles.fabMenuText}>New Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setFabOpen(false); router.push('/ai/index'); }}
            >
              <Text style={styles.fabMenuIcon}>✦</Text>
              <Text style={styles.fabMenuText}>Ask AI</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFabOpen((v) => !v);
          }}
        >
          <Text style={styles.fabIcon}>{fabOpen ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>
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
    color: Colors.accentPurpleLight,
    fontSize: 16,
  },
  avatarBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fabArea: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  fabMenu: {
    gap: 8,
    alignItems: 'flex-end',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fabMenuIcon: { color: Colors.accentPurpleLight, fontSize: 14 },
  fabMenuText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  fab: {
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
