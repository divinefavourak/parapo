import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: '◉', label: 'Profile Settings', sublabel: 'Name, photo, contact info' },
      { icon: '⚡', label: 'Organization', sublabel: 'Student Council President' },
      { icon: '🔔', label: 'Notifications', sublabel: 'Alerts & reminders' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: '◎', label: 'Focus Settings', sublabel: 'Default mode, auto-start' },
      { icon: '◈', label: 'AI Assistant', sublabel: 'Briefing preferences, tone' },
      { icon: '☑', label: 'Task Defaults', sublabel: 'Priority, labels, views' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: '◻', label: 'Appearance', sublabel: 'Dark mode, accent color' },
      { icon: '⇲', label: 'Data & Sync', sublabel: 'Backup, export, cloud' },
      { icon: '?', label: 'Help & Feedback', sublabel: 'Support, bug reports' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarLarge}>
            <Image
              source={require('../../assets/logo_5-removebg.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Student Commander</Text>
            <Text style={styles.profileRole}>Student Council President</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>PARAPO PRO</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Tasks Done', value: '127' },
            { label: 'Focus Hours', value: '43h' },
            { label: 'Team Score', value: '94%' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
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
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.75}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PARAPO v1.0.0 — Built for student leaders</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 24 },

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
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  avatarImage: {
    width: 56,
    height: 56,
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
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
  statLabel: {
    ...Typography.labelMedium,
    color: Colors.textMuted,
    marginTop: 2,
  },

  settingsSection: {
    gap: 8,
  },
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
  settingsIconText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingsText: {
    flex: 1,
  },
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
  settingsChevron: {
    color: Colors.textMuted,
    fontSize: 18,
  },

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
