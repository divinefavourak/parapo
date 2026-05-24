import React, { useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Bell, ChevronRight, Timer, BookOpen, Zap, FileText } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useTaskStore } from '../../src/store/taskStore';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const CARD2  = '#1A1A2E';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const GREEN  = '#4ADE80';
const ORANGE = '#FB923C';

const W = Dimensions.get('window').width;

const CATEGORY_COLORS: Record<string, string> = {
  Logistics: '#60A5FA',
  Finance:   '#F87171',
  Review:    '#A78BFA',
  Creative:  '#34D399',
  Engagement:'#FBBF24',
};

// ── Circular progress ring ─────────────────────────────────────────────────────
function Ring({ pct, size = 110, stroke = 10, color = '#fff' }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size/2} cy={size/2} r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${Math.max(0.01, pct) * c} ${c}`}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const initials  = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  const total    = tasks.length;
  const done     = tasks.filter((t) => t.column === 'done').length;
  const inProg   = tasks.filter((t) => t.column === 'in_progress');
  const progress = total > 0 ? done / total : 0;

  const groups = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      if (!map[t.category]) map[t.category] = { total: 0, done: 0 };
      map[t.category].total++;
      if (t.column === 'done') map[t.category].done++;
    });
    return Object.entries(map).map(([cat, v]) => ({
      label: cat,
      count: v.total,
      progress: v.total > 0 ? v.done / v.total : 0,
      color: CATEGORY_COLORS[cat] ?? P,
    }));
  }, [tasks]);

  const motivText = progress >= 0.8
    ? 'Almost done!'
    : progress >= 0.5
    ? 'Keep going!'
    : total === 0
    ? 'No tasks yet!'
    : "Let's get started!";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
          <Text style={styles.dateLine}>{todayLabel()}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings/notifications')}>
            <Bell size={18} color={TEXT2} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress Card ── */}
      <View style={styles.progressCard}>
        <View style={styles.progressLeft}>
          <Text style={styles.progressLabel}>Your today's tasks</Text>
          <Text style={styles.progressTitle}>{motivText}</Text>
          <TouchableOpacity style={styles.progressBtn} onPress={() => router.navigate('/(tabs)/tasks')}>
            <Text style={styles.progressBtnText}>View Tasks</Text>
            <ChevronRight size={13} color={P} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressRight}>
          <Ring pct={progress} size={100} stroke={9} color="#fff" />
          <View style={styles.progressPctWrap}>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </View>

      {/* ── In Progress ── */}
      {inProg.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/tasks')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
          >
            {inProg.slice(0, 6).map((t) => {
              const color = CATEGORY_COLORS[t.category] ?? P;
              return (
                <View key={t.id} style={[styles.inProgCard, { borderLeftColor: color }]}>
                  <Text style={[styles.inProgCat, { color }]}>{t.category}</Text>
                  <Text style={styles.inProgTitle} numberOfLines={2}>{t.title}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Task Groups ── */}
      {groups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Groups</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/tasks')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.groupList}>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.label}
                style={styles.groupItem}
                activeOpacity={0.75}
                onPress={() => router.navigate('/(tabs)/tasks')}
              >
                <View style={[styles.groupIconWrap, { backgroundColor: g.color + '20' }]}>
                  <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupLabel}>{g.label}</Text>
                  <Text style={styles.groupCount}>{g.count} Tasks</Text>
                </View>
                <Text style={[styles.groupPct, { color: g.color }]}>
                  {Math.round(g.progress * 100)}%
                </Text>
                <ChevronRight size={14} color={TEXT3} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: P_DIM, borderColor: P + '30' }]}
            onPress={() => router.navigate('/(tabs)/focus')}
            activeOpacity={0.8}
          >
            <Timer size={22} color={P} strokeWidth={1.8} />
            <Text style={[styles.quickLabel, { color: P }]}>Focus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: GREEN + '30' }]}
            onPress={() => router.navigate('/(tabs)/academic')}
            activeOpacity={0.8}
          >
            <BookOpen size={22} color={GREEN} strokeWidth={1.8} />
            <Text style={[styles.quickLabel, { color: GREEN }]}>Study</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: 'rgba(251,146,60,0.1)', borderColor: ORANGE + '30' }]}
            onPress={() => router.navigate('/(tabs)/notes')}
            activeOpacity={0.8}
          >
            <FileText size={22} color={ORANGE} strokeWidth={1.8} />
            <Text style={[styles.quickLabel, { color: ORANGE }]}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: '#A78BFA30' }]}
            onPress={() => router.push('/ai')}
            activeOpacity={0.8}
          >
            <Zap size={22} color="#A78BFA" strokeWidth={1.8} />
            <Text style={[styles.quickLabel, { color: '#A78BFA' }]}>AI</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 20, gap: 24 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },
  dateLine: { fontSize: 13, color: TEXT2, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Progress card
  progressCard: {
    backgroundColor: P,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressLeft: { flex: 1, gap: 8 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  progressTitle: { fontSize: 20, fontWeight: '700', color: '#fff', lineHeight: 26 },
  progressBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start',
  },
  progressBtnText: { fontSize: 12, fontWeight: '700', color: P },
  progressRight: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  progressPctWrap: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // In Progress
  section: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  seeAll: { fontSize: 13, color: P, fontWeight: '500' },

  inProgCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    width: 140,
    borderLeftWidth: 3,
    gap: 6,
    borderWidth: 1,
    borderColor: BDR,
  },
  inProgCat: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inProgTitle: { fontSize: 13, fontWeight: '600', color: TEXT, lineHeight: 18 },

  // Groups
  groupList: {
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BDR, overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: BDR,
  },
  groupIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupInfo: { flex: 1 },
  groupLabel: { fontSize: 14, fontWeight: '600', color: TEXT },
  groupCount: { fontSize: 12, color: TEXT2, marginTop: 1 },
  groupPct: { fontSize: 14, fontWeight: '700' },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingVertical: 16, alignItems: 'center', gap: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: '600' },
});
