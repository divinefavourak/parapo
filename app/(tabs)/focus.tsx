import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { RotateCcw, Play, Pause, Zap } from 'lucide-react-native';
import { useFocusStore } from '../../src/store/focusStore';
import { FOCUS_MODES } from '../../src/features/focus/mockData';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const GREEN  = '#4ADE80';

const KEEP_AWAKE_TAG = 'parapo-focus';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Circular timer ring ───────────────────────────────────────────────────────
function TimerRing({ progress, size = 240, stroke = 12 }: {
  progress: number; size?: number; stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size/2} cy={size/2} r={r} stroke={BDR} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size/2} cy={size/2} r={r}
        stroke={P}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${Math.max(0.01, progress) * c} ${c}`}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const {
    mode, state, elapsedSeconds, totalSeconds,
    sessionTitle, stats, prefs,
    setMode, setSessionTitle, start, pause, reset, tick, fetchStats, loadPrefs,
  } = useFocusStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress  = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
  const remaining = totalSeconds - elapsedSeconds;

  useEffect(() => { fetchStats(); loadPrefs(); }, []);

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(tick, 1000);
      if (prefs.keepScreenOn) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [state]);

  const currentMode = FOCUS_MODES.find((m) => m.key === mode) ?? FOCUS_MODES[1];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Focus Mode</Text>
          <Text style={styles.headerSub}>Deep work & performance</Text>
        </View>

        {/* ── Mode pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FOCUS_MODES.map((m) => {
            const active = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.modePill, active && styles.modePillActive]}
                onPress={() => {
                  if (state === 'idle') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode(m.key);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.modePillText, active && styles.modePillTextActive]}>{m.label}</Text>
                <Text style={[styles.modePillSub, active && { color: P + 'aa' }]}>
                  {m.key === 'pomodoro'
                    ? `${prefs.workMinutes}m`
                    : `${m.duration}m`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Session title ── */}
        {state === 'idle' && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputField}
              placeholder="What are you working on?"
              placeholderTextColor={TEXT3}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              maxLength={60}
              returnKeyType="done"
            />
          </View>
        )}

        {/* ── Timer ring ── */}
        <View style={styles.timerWrap}>
          <TimerRing progress={progress} size={240} stroke={12} />
          <View style={styles.timerInner}>
            {state === 'break' ? (
              <>
                <Text style={[styles.timerTime, { color: GREEN }]}>🎉</Text>
                <Text style={[styles.timerState, { color: GREEN }]}>BREAK TIME</Text>
              </>
            ) : (
              <>
                <Text style={styles.timerTime}>{fmt(remaining)}</Text>
                <Text style={styles.timerState}>
                  {state === 'running' ? 'FOCUS' : state === 'paused' ? 'PAUSED' : 'READY'}
                </Text>
              </>
            )}
            {state !== 'idle' && sessionTitle.trim() !== '' && (
              <Text style={styles.timerSession} numberOfLines={1}>{sessionTitle}</Text>
            )}
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              reset();
            }}
            activeOpacity={0.75}
          >
            <RotateCcw size={20} color={TEXT2} strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, state === 'running' && styles.primaryBtnPause]}
            onPress={() => {
              Haptics.impactAsync(state === 'running'
                ? Haptics.ImpactFeedbackStyle.Light
                : Haptics.ImpactFeedbackStyle.Medium);
              state === 'running' ? pause() : start();
            }}
            activeOpacity={0.85}
          >
            {state === 'running'
              ? <Pause size={22} color="#fff" strokeWidth={2} />
              : <Play size={22} color="#fff" strokeWidth={2} fill="#fff" />}
            <Text style={styles.primaryBtnText}>
              {state === 'running' ? 'Pause' : state === 'paused' ? 'Resume' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard label="Today" value={`${stats.todayMinutes}m`} color={P} />
          <StatCard label="This Week" value={`${stats.weekSessions} sessions`} color="#A78BFA" />
          <StatCard label="Streak" value={`${stats.currentStreak}d`} color={GREEN} />
          <StatCard label="Avg Session" value={`${stats.avgSessionMin}m`} color="#FB923C" />
        </View>

        {/* ── Tip ── */}
        <View style={styles.tipCard}>
          <Zap size={16} color={P} strokeWidth={1.8} />
          <Text style={styles.tipText}>
            Your peak focus window is 9–11 am. Schedule deep work then for best results.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 20, gap: 24 },

  header: { gap: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: TEXT2 },

  modePill: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center',
  },
  modePillActive: { backgroundColor: P_DIM, borderColor: P },
  modePillText: { fontSize: 13, fontWeight: '600', color: TEXT2 },
  modePillTextActive: { color: P },
  modePillSub: { fontSize: 10, color: TEXT3, marginTop: 2 },

  inputWrap: {},
  inputField: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    borderRadius: 14, padding: 14, color: TEXT, fontSize: 14,
  },

  timerWrap: { alignItems: 'center', justifyContent: 'center' },
  timerInner: {
    position: 'absolute',
    alignItems: 'center', gap: 4,
  },
  timerTime: { fontSize: 52, fontWeight: '700', color: TEXT, letterSpacing: -2 },
  timerState: { fontSize: 11, fontWeight: '700', color: TEXT2, letterSpacing: 2.5 },
  timerSession: { fontSize: 11, color: P, marginTop: 4, maxWidth: 160, textAlign: 'center' },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secondaryBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1, height: 52, borderRadius: 26,
    backgroundColor: P, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnPause: { backgroundColor: CARD, borderWidth: 1, borderColor: BDR },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: CARD,
    borderWidth: 1, borderRadius: 14, padding: 16, gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: TEXT2 },

  tipCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: CARD, borderWidth: 1, borderColor: P + '30',
    borderRadius: 14, padding: 16, alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, color: TEXT2, lineHeight: 19 },
});
