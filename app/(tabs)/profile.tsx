import React from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Alert, ToastAndroid, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User, Bell, Settings, Timer, ChevronRight,
  LogOut, Zap, FileText, Shield, HelpCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useFocusStore } from '../../src/store/focusStore';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const RED    = '#F87171';
const GREEN  = '#4ADE80';

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ── Settings row ──────────────────────────────────────────────────────────────
function SettingRow({
  Icon, iconColor = P, label, sublabel, onPress, last = false,
}: {
  Icon: any; iconColor?: string; label: string; sublabel?: string;
  onPress?: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !last && styles.settingRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={16} color={iconColor} strokeWidth={1.8} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSub}>{sublabel}</Text>}
      </View>
      <ChevronRight size={16} color={TEXT3} strokeWidth={1.8} />
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { stats } = useFocusStore();

  const initials = user?.full_name ? getInitials(user.full_name) : 'U';

  const comingSoon = (label: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} — coming soon`, ToastAndroid.SHORT);
    } else {
      Alert.alert(label, 'Coming soon.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* ── Profile hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.heroRole}>{user?.role || 'Student'}</Text>
            {user?.organization && (
              <Text style={styles.heroOrg}>{user.organization}</Text>
            )}
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>PRO</Text>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsCard}>
          {[
            { label: 'Focus Today', value: `${stats.todayMinutes}m`, color: P },
            { label: 'Sessions', value: `${stats.weekSessions}`, color: '#A78BFA' },
            { label: 'Streak', value: `${stats.currentStreak}d`, color: GREEN },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statsDivider} />}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Account section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.settingCard}>
            <SettingRow
              Icon={User} label="Profile Settings"
              sublabel="Name, photo, contact"
              onPress={() => router.push('/settings/profile')}
            />
            <SettingRow
              Icon={Bell} label="Notifications"
              sublabel="Alerts & reminders"
              onPress={() => router.push('/settings/notifications')}
            />
            <SettingRow
              Icon={Shield} iconColor="#A78BFA"
              label="Privacy" sublabel="Data & permissions"
              onPress={() => comingSoon('Privacy')}
              last
            />
          </View>
        </View>

        {/* ── Preferences section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.settingCard}>
            <SettingRow
              Icon={Timer} label="Focus Settings"
              sublabel="Default mode, durations"
              onPress={() => router.push('/settings/focus')}
            />
            <SettingRow
              Icon={Zap} iconColor="#FBBF24"
              label="AI Assistant"
              sublabel="Briefing preferences"
              onPress={() => router.push('/ai')}
            />
            <SettingRow
              Icon={Settings} iconColor={GREEN}
              label="App Preferences"
              sublabel="Theme, language"
              onPress={() => comingSoon('App Preferences')}
              last
            />
          </View>
        </View>

        {/* ── Quick links ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK LINKS</Text>
          <View style={styles.settingCard}>
            <SettingRow
              Icon={Zap} iconColor={P}
              label="PARAPO AI"
              sublabel="Your intelligent assistant"
              onPress={() => router.push('/ai')}
            />
            <SettingRow
              Icon={FileText} iconColor="#FB923C"
              label="Notes"
              sublabel="All your notes"
              onPress={() => router.navigate('/(tabs)/notes')}
              last
            />
          </View>
        </View>

        {/* ── Help section ── */}
        <View style={styles.section}>
          <View style={styles.settingCard}>
            <SettingRow
              Icon={HelpCircle} iconColor={TEXT2}
              label="Help & Feedback"
              sublabel="Support, bug reports"
              onPress={() => comingSoon('Help')}
              last
            />
          </View>
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color={RED} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PARAPO v1.0.0{user?.email ? ` · ${user.email}` : ''}</Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 20, gap: 20 },

  header: {},
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },

  // Hero card
  heroCard: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BDR,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroInfo: { flex: 1, gap: 2 },
  heroName: { fontSize: 18, fontWeight: '700', color: TEXT },
  heroRole: { fontSize: 13, color: TEXT2 },
  heroOrg: { fontSize: 11, color: TEXT3, marginTop: 1 },
  heroBadge: {
    backgroundColor: P_DIM, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: P + '40',
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: P, letterSpacing: 1 },

  // Stats
  statsCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BDR,
    flexDirection: 'row', overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statsDivider: { width: 1, backgroundColor: BDR },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: TEXT2, marginTop: 3 },

  // Sections
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: TEXT3, letterSpacing: 1.2, paddingHorizontal: 4 },
  settingCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BDR, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: BDR },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: TEXT },
  settingSub: { fontSize: 12, color: TEXT2, marginTop: 1 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: RED + '15', borderWidth: 1, borderColor: RED + '30',
    borderRadius: 14, padding: 14,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: RED },

  version: { fontSize: 11, color: TEXT3, textAlign: 'center' },
});
