import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';

const PREFS_KEY = 'focus_prefs';

interface FocusPrefs {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
  autoStartBreak: boolean;
  keepScreenOn: boolean;
}

const DEFAULT: FocusPrefs = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  autoStartBreak: false,
  keepScreenOn: true,
};

const WORK_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];
const LONG_BREAK_OPTIONS = [15, 20, 25, 30];
const SESSION_OPTIONS = [2, 3, 4, 5, 6];

function ChipRow<T extends number | string>({
  label, options, value, onChange,
}: {
  label: string; options: T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={String(opt)}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
              {typeof opt === 'number' && label.toLowerCase().includes('session') ? `×${opt}` : `${opt}${typeof opt === 'number' ? 'm' : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({
  label, sublabel, value, onChange,
}: {
  label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.75}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSublabel}>{sublabel}</Text>
      </View>
      <View style={[styles.pill, value && styles.pillActive]}>
        <View style={[styles.pillThumb, value && styles.pillThumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

export default function FocusSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [prefs, setPrefs] = useState<FocusPrefs>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULT, ...JSON.parse(raw) });
    });
  }, []);

  const update = async (patch: Partial<FocusPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Settings</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIMER DURATIONS</Text>
          <View style={styles.card}>
            <ChipRow
              label="Work session"
              options={WORK_OPTIONS}
              value={prefs.workMinutes}
              onChange={(v) => update({ workMinutes: v })}
            />
            <View style={styles.cardDivider} />
            <ChipRow
              label="Short break"
              options={BREAK_OPTIONS}
              value={prefs.shortBreakMinutes}
              onChange={(v) => update({ shortBreakMinutes: v })}
            />
            <View style={styles.cardDivider} />
            <ChipRow
              label="Long break"
              options={LONG_BREAK_OPTIONS}
              value={prefs.longBreakMinutes}
              onChange={(v) => update({ longBreakMinutes: v })}
            />
            <View style={styles.cardDivider} />
            <ChipRow
              label="Sessions before long break"
              options={SESSION_OPTIONS}
              value={prefs.sessionsBeforeLong}
              onChange={(v) => update({ sessionsBeforeLong: v })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BEHAVIOUR</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Auto-start break"
              sublabel="Immediately start break when session ends"
              value={prefs.autoStartBreak}
              onChange={(v) => update({ autoStartBreak: v })}
            />
            <View style={styles.cardDivider} />
            <ToggleRow
              label="Keep screen on"
              sublabel="Prevent screen sleep during focus sessions"
              value={prefs.keepScreenOn}
              onChange={(v) => update({ keepScreenOn: v })}
            />
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Current Setup</Text>
          <Text style={styles.previewText}>
            {prefs.workMinutes}m work → {prefs.shortBreakMinutes}m break → repeat ×{prefs.sessionsBeforeLong} → {prefs.longBreakMinutes}m long break
          </Text>
        </View>
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

  section: { gap: 8 },
  sectionTitle: {
    ...Typography.labelSmall, color: Colors.textMuted, letterSpacing: 1.2, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: Colors.borderSubtle },

  chipSection: { padding: 14, gap: 8 },
  chipLabel: { ...Typography.labelMedium, color: Colors.textSecondary, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.bgSurface,
  },
  chipActive: { backgroundColor: Colors.overlayBlue, borderColor: Colors.accentBlue },
  chipText: { ...Typography.labelMedium, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: Colors.accentBlue, fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500' },
  toggleSublabel: { ...Typography.labelSmall, color: Colors.textMuted },
  pill: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: Colors.bgSubtle, justifyContent: 'center', paddingHorizontal: 2,
  },
  pillActive: { backgroundColor: Colors.accentBlueDark },
  pillThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textMuted,
  },
  pillThumbActive: { backgroundColor: Colors.accentBlue, alignSelf: 'flex-end' },

  previewCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: 'rgba(77,142,255,0.2)', borderRadius: 10, padding: 16, gap: 6,
  },
  previewTitle: { ...Typography.labelMedium, color: Colors.accentBlue, fontWeight: '700' },
  previewText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
