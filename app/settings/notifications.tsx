import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';

const PREFS_KEY = 'notif_prefs';

interface NotifPrefs {
  taskReminders: boolean;
  focusComplete: boolean;
  meetingReminders: boolean;
  dailyBriefing: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  taskReminders: true,
  focusComplete: true,
  meetingReminders: true,
  dailyBriefing: false,
  weeklyDigest: false,
};

const SECTIONS = [
  {
    title: 'Task & Focus',
    items: [
      { key: 'taskReminders' as const, label: 'Task Reminders', sublabel: 'Alert 1 hour before due date' },
      { key: 'focusComplete' as const, label: 'Focus Session Done', sublabel: 'When your focus timer ends' },
    ],
  },
  {
    title: 'Calendar',
    items: [
      { key: 'meetingReminders' as const, label: 'Meeting Reminders', sublabel: '10 minutes before meetings' },
    ],
  },
  {
    title: 'AI & Reports',
    items: [
      { key: 'dailyBriefing' as const, label: 'Daily Briefing', sublabel: '8 AM summary of your day' },
      { key: 'weeklyDigest' as const, label: 'Weekly Digest', sublabel: 'Sunday productivity recap' },
    ],
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    });
  }, []);

  const toggle = async (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Preferences are saved instantly. Actual delivery requires notification permissions granted on your device.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <View
                  key={item.key}
                  style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowSublabel}>{item.sublabel}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: Colors.bgSubtle, true: Colors.accentBlueDark }}
                    thumbColor={prefs[item.key] ? Colors.accentBlue : Colors.textMuted}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.bgElevated, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { padding: 8, minWidth: 60 },
  headerBtnText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  headerTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },

  content: { padding: 20, gap: 20 },

  hint: {
    ...Typography.bodySmall, color: Colors.textDisabled, lineHeight: 18,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 12,
  },

  section: { gap: 8 },
  sectionTitle: {
    ...Typography.labelSmall, color: Colors.textMuted, letterSpacing: 1.2, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500' },
  rowSublabel: { ...Typography.labelSmall, color: Colors.textMuted },
});
