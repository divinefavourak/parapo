import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ToastAndroid, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { useAuthStore } from '../../src/store/authStore';
import { useFocusStore } from '../../src/store/focusStore';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: '◉', label: 'Profile Settings', sublabel: 'Name, photo, contact info', route: '/settings/profile' as const },
      { icon: '⚡', label: 'Organization', sublabel: 'Student council & team', route: '/settings/profile' as const },
      { icon: '🔔', label: 'Notifications', sublabel: 'Alerts & reminders', route: '/settings/notifications' as const },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: '◎', label: 'Focus Settings', sublabel: 'Default mode, auto-start', route: '/settings/focus' as const },
      { icon: '◈', label: 'AI Assistant', sublabel: 'Briefing preferences, tone', route: null },
      { icon: '☑', label: 'Task Defaults', sublabel: 'Priority, labels, views', route: null },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: '◻', label: 'Appearance', sublabel: 'Dark mode (always on)', route: null },
      { icon: '⇲', label: 'Data & Sync', sublabel: 'Backup, export, cloud', route: null },
      { icon: '?', label: 'Help & Feedback', sublabel: 'Support, bug reports', route: null },
    ],
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { stats } = useFocusStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const initials = user?.full_name ? getInitials(user.full_name) : 'U';

  const showComingSoon = (label: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} — coming soon`, ToastAndroid.SHORT);
    } else {
      Alert.alert(label, 'This feature is coming soon.');
    }
  };
  const focusHours = Math.round(stats.todayMinutes / 60 * 10) / 10;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Profile hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.profileRole}>{user?.role || 'Student Leader'}</Text>
            {user?.organization ? (
              <Text style={styles.profileOrg}>{user.organization}</Text>
            ) : null}
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>PARAPO PRO</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Focus Today', value: `${stats.todayMinutes}m` },
            { label: 'This Week', value: `${stats.weekSessions} sessions` },
            { label: 'Streak', value: `${stats.currentStreak}d` },
          ].map((stat, i) => (
            <View
              key={stat.label}
              style={[styles.statItem, i < 2 && styles.statItemBorder]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/ai')}>
            <Text style={styles.quickLinkIcon}>✦</Text>
            <Text style={styles.quickLinkText}>PARAPO AI</Text>
            <Text style={styles.quickLinkChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, styles.quickLinkBorder]} onPress={() => router.push('/notes')}>
            <Text style={styles.quickLinkIcon}>✎</Text>
            <Text style={styles.quickLinkText}>Notes</Text>
            <Text style={styles.quickLinkChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>{section.title}</Text>
            <View style={styles.settingsList}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingsItem,
                    i < section.items.length - 1 && styles.settingsItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => item.route ? router.push(item.route) : showComingSoon(item.label)}
                >
                  <View style={styles.settingsIcon}>
                    <Text style={styles.settingsIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingsText}>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <Text style={styles.settingsSublabel}>{item.sublabel}</Text>
                  </View>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PARAPO v1.0.0 · {user?.email || ''}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 20 },

  backBtn: { alignSelf: 'flex-start', padding: 4 },
  backText: { ...Typography.bodyMedium, color: Colors.accentBlue },

  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.accentBlueDark,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.accentBlueDeeper,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  profileRole: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  profileOrg: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
  },
  profileBadge: {
    backgroundColor: Colors.overlayBlue,
    borderWidth: 1,
    borderColor: Colors.overlayBlueStrong,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  profileBadgeText: {
    ...Typography.labelSmall,
    color: Colors.accentBlue,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginTop: 2,
  },

  quickLinks: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  quickLinkBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  quickLinkIcon: { color: Colors.accentPurpleLight, fontSize: 16 },
  quickLinkText: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
  quickLinkChevron: { color: Colors.textMuted, fontSize: 18 },

  settingsSection: { gap: 8 },
  settingsSectionTitle: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  settingsList: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: { fontSize: 14, color: Colors.textSecondary },
  settingsText: { flex: 1 },
  settingsLabel: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingsSublabel: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginTop: 1,
  },
  settingsChevron: { color: Colors.textMuted, fontSize: 18 },

  signOutBtn: {
    backgroundColor: Colors.overlayRed,
    borderWidth: 1,
    borderColor: Colors.overlayRedStrong,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: {
    ...Typography.labelLarge,
    color: Colors.accentRed,
    fontWeight: '600',
  },

  version: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
});
