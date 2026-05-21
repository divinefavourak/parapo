import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { useAuthStore } from '../../src/store/authStore';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signup, error, clearError, status } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Student Council President');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const isLoading = status === 'loading';

  const handleSignup = async () => {
    setLocalError('');
    clearError();
    if (!fullName.trim() || !email.trim() || !password) {
      setLocalError('Please fill all required fields.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || undefined,
        organization: organization || undefined,
      });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join PARAPO and command your leadership.</Text>
        </View>

        {displayError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Field label="FULL NAME *" placeholder="Your full name" value={fullName} onChangeText={setFullName} />
          <Field label="EMAIL *" placeholder="you@university.edu" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" />
          <Field label="ORGANIZATION" placeholder="University / Student Council" value={organization}
            onChangeText={setOrganization} />
          <Field label="YOUR ROLE" placeholder="e.g. Student Council President" value={role}
            onChangeText={setRole} />
          <Field label="PASSWORD *" placeholder="Min 8 characters" value={password}
            onChangeText={setPassword} secureTextEntry />
          <Field label="CONFIRM PASSWORD *" placeholder="Repeat password" value={confirmPassword}
            onChangeText={setConfirmPassword} secureTextEntry />
        </View>

        <TouchableOpacity
          style={[styles.signupBtn, (!fullName || !email || !password || isLoading) && styles.signupBtnDisabled]}
          onPress={handleSignup}
          disabled={!fullName || !email || !password || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.accentBlueDeeper} />
          ) : (
            <Text style={styles.signupBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 24, gap: 20 },
  backBtn: { alignSelf: 'flex-start', padding: 4 },
  backText: { ...Typography.bodyMedium, color: Colors.accentBlue },
  header: { gap: 6 },
  title: { ...Typography.h1, color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted },
  errorBanner: {
    backgroundColor: Colors.overlayRed, borderWidth: 1,
    borderColor: Colors.overlayRedStrong, borderRadius: 8, padding: 12,
  },
  errorText: { ...Typography.bodySmall, color: Colors.accentRed },
  form: { gap: 14 },
  field: { gap: 7 },
  label: { ...Typography.labelUppercase, color: Colors.textMuted, letterSpacing: 1.2 },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 13, color: Colors.textPrimary, fontSize: 14,
  },
  signupBtn: {
    backgroundColor: Colors.accentBlueDark, borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  signupBtnDisabled: { opacity: 0.45 },
  signupBtnText: { ...Typography.labelLarge, color: Colors.accentBlueDeeper, fontWeight: '700', fontSize: 15 },
  terms: { ...Typography.labelSmall, color: Colors.textDisabled, textAlign: 'center' },
});
