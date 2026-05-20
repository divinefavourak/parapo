import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { useFocusStore } from '../../src/store/focusStore';
import { FOCUS_MODES, mockFocusStats } from '../../src/features/focus/mockData';
import { ProgressBar } from '../../src/components/ui/ProgressBar';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { mode, state, elapsedSeconds, totalSeconds, sessionTitle, setMode, setSessionTitle, start, pause, reset, tick } = useFocusStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
  const remaining = totalSeconds - elapsedSeconds;
  const stats = mockFocusStats;

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  const currentMode = FOCUS_MODES.find((m) => m.key === mode) ?? FOCUS_MODES[1];

  return (
    <View style={styles.container}>
      <TopBar title="Focus Mode" subtitle="Deep work & performance" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 32, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode selector */}
        <View style={styles.modeSelector}>
          {FOCUS_MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
              onPress={() => {
                if (state === 'idle') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMode(m.key);
                }
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeLabel, mode === m.key && styles.modeLabelActive]}>{m.label}</Text>
              <Text style={[styles.modeDesc, mode === m.key && styles.modeDescActive]}>{m.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session title input — only shown when idle */}
        {state === 'idle' && (
          <View style={styles.sessionInputWrap}>
            <Text style={styles.sessionInputLabel}>WHAT ARE YOU WORKING ON?</Text>
            <TextInput
              style={styles.sessionInputField}
              placeholder="e.g. Q3 Strategic Review..."
              placeholderTextColor={Colors.textDisabled}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              maxLength={60}
              returnKeyType="done"
            />
          </View>
        )}

        {/* Timer display */}
        <View style={styles.timerContainer}>
          <View style={styles.timerRing}>
            <View style={styles.timerInner}>
              {state === 'break' ? (
                <Text style={styles.breakLabel}>BREAK TIME</Text>
              ) : (
                <>
                  <Text style={styles.timerText}>{formatTime(remaining)}</Text>
                  <Text style={styles.timerSub}>{state === 'running' ? 'RUNNING' : state === 'paused' ? 'PAUSED' : 'READY'}</Text>
                </>
              )}
            </View>
          </View>
          <ProgressBar
            progress={progress}
            color={Colors.accentBlue}
            height={4}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{Math.round(progress * 100)}% of {currentMode.duration}m session</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              reset();
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.resetIcon}>↺</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, state === 'running' ? styles.pauseBtn : styles.startBtn]}
            onPress={() => {
              Haptics.impactAsync(
                state === 'running'
                  ? Haptics.ImpactFeedbackStyle.Light
                  : Haptics.ImpactFeedbackStyle.Medium
              );
              state === 'running' ? pause() : start();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>
              {state === 'running' ? '⏸ Pause' : state === 'paused' ? '▶ Resume' : '▶ Start Focus'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Session label — shows the title entered above */}
        {state !== 'idle' && (
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              {sessionTitle.trim() || 'Focus Session'}
            </Text>
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Today" value={`${stats.todayMinutes}m`} accent={Colors.accentBlue} />
          <StatCard label="This Week" value={`${stats.weekSessions} sessions`} accent={Colors.accentPurple} />
          <StatCard label="Streak" value={`${stats.currentStreak} days`} accent={Colors.accentGreen} />
          <StatCard label="Avg Session" value={`${stats.avgSessionMin}m`} accent={Colors.accentRed} />
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>✦</Text>
          <Text style={styles.tipText}>
            Your peak focus window is 9–11am. Consider scheduling deep work sessions then.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderColor: accent + '30' }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 24 },

  modeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.overlayBlue,
  },
  modeLabel: {
    ...Typography.labelLarge,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modeLabelActive: { color: Colors.accentBlue },
  modeDesc: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: 2,
  },
  modeDescActive: { color: Colors.accentBlue + 'aa' },

  sessionInputWrap: {
    gap: 8,
  },
  sessionInputLabel: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  sessionInputField: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 13,
    color: Colors.textPrimary,
    fontSize: 14,
  },

  timerContainer: {
    alignItems: 'center',
    gap: 16,
  },
  timerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    borderColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
  },
  timerInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.accentBlue,
    letterSpacing: -2,
  },
  timerSub: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 2,
  },
  breakLabel: {
    ...Typography.h2,
    color: Colors.accentGreen,
    letterSpacing: 2,
  },
  progressBar: { width: '100%' },
  progressText: {
    ...Typography.labelMedium,
    color: Colors.textMuted,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: {
    color: Colors.textMuted,
    fontSize: 20,
  },
  mainBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: { backgroundColor: Colors.accentBlue },
  pauseBtn: { backgroundColor: Colors.bgSubtle, borderWidth: 1, borderColor: Colors.border },
  mainBtnText: {
    ...Typography.labelLarge,
    fontWeight: '700',
    color: Colors.accentBlueDeeper,
    fontSize: 15,
  },

  sessionBadge: {
    backgroundColor: Colors.overlayBlue,
    borderWidth: 1,
    borderColor: Colors.overlayBlueStrong,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sessionBadgeText: {
    ...Typography.labelLarge,
    color: Colors.accentBlue,
    textAlign: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.labelMedium,
    color: Colors.textMuted,
  },

  tipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(208,188,255,0.2)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    color: Colors.accentPurpleLight,
    fontSize: 14,
    marginTop: 2,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
