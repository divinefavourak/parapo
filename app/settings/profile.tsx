import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { useAuthStore } from '../../src/store/authStore';
import { authService } from '../../src/services/auth';

const ROLES = ['President', 'Vice President', 'Secretary', 'Treasurer', 'PRO', 'Director', 'Member'];

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [saving, setSaving] = useState(false);

  const isDirty =
    fullName !== (user?.full_name ?? '') ||
    role !== (user?.role ?? '') ||
    organization !== (user?.organization ?? '');

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName.trim(),
        role: role.trim(),
        organization: organization.trim(),
      });
      updateUser(updated);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isDirty || saving}
          style={[styles.headerBtn, (!isDirty || saving) && { opacity: 0.4 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.accentBlue} />
            : <Text style={[styles.headerBtnText, { color: Colors.accentBlue, fontWeight: '700' }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Initials are auto-generated from your name</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL</Text>
          <View style={styles.card}>
            <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ROLE</Text>
          <View style={styles.card}>
            <View style={styles.chipGrid}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, role === r && styles.chipActive]}
                  onPress={() => setRole(role === r ? '' : r)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
            <Field
              label="Custom role"
              value={ROLES.includes(role) ? '' : role}
              onChange={setRole}
              placeholder="Or type a custom role…"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORGANIZATION</Text>
          <View style={styles.card}>
            <Field
              label="Organization name"
              value={organization}
              onChange={setOrganization}
              placeholder="e.g. UNILAG Student Union"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyLabel}>Email</Text>
              <Text style={styles.readonlyValue}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
      />
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

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.accentBlueDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.accentBlueDeeper },
  avatarHint: { ...Typography.labelSmall, color: Colors.textDisabled },

  section: { gap: 8 },
  sectionTitle: {
    ...Typography.labelSmall, color: Colors.textMuted,
    letterSpacing: 1.2, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 14 },

  field: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  fieldLabel: { ...Typography.labelSmall, color: Colors.textMuted },
  fieldInput: {
    ...Typography.bodyMedium, color: Colors.textPrimary,
    paddingVertical: 4,
  },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  chip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.bgSurface,
  },
  chipActive: { backgroundColor: Colors.overlayBlue, borderColor: Colors.accentBlue },
  chipText: { ...Typography.labelMedium, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: Colors.accentBlue, fontWeight: '700' },

  readonlyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  readonlyLabel: { ...Typography.labelMedium, color: Colors.textMuted },
  readonlyValue: { ...Typography.bodySmall, color: Colors.textSecondary },
});
