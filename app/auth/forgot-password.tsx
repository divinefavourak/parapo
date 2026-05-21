import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { authService } from '../../src/services/auth';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Could not send reset link. Check your email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Email sent!</Text>
              <Text style={styles.successText}>
                Check your inbox at {email} for reset instructions.
              </Text>
              <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.replace('/auth/login')}>
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <View style={styles.field}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@university.edu"
                  placeholderTextColor={Colors.textDisabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, (!email || isLoading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!email || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.accentBlueDeeper} />
                ) : (
                  <Text style={styles.submitBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 24, gap: 24 },
  backBtn: { alignSelf: 'flex-start', padding: 4 },
  backText: { ...Typography.bodyMedium, color: Colors.accentBlue },
  content: { gap: 20, flex: 1 },
  title: { ...Typography.h1, color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted },
  errorBanner: {
    backgroundColor: Colors.overlayRed, borderWidth: 1,
    borderColor: Colors.overlayRedStrong, borderRadius: 8, padding: 12,
  },
  errorText: { ...Typography.bodySmall, color: Colors.accentRed },
  field: { gap: 8 },
  label: { ...Typography.labelUppercase, color: Colors.textMuted, letterSpacing: 1.2 },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 14, color: Colors.textPrimary, fontSize: 15,
  },
  submitBtn: {
    backgroundColor: Colors.accentBlueDark, borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { ...Typography.labelLarge, color: Colors.accentBlueDeeper, fontWeight: '700', fontSize: 15 },
  successCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: Colors.overlayGreenStrong, borderRadius: 12,
    padding: 24, alignItems: 'center', gap: 12,
  },
  successIcon: { fontSize: 32, color: Colors.accentGreen },
  successTitle: { ...Typography.h2, color: Colors.accentGreen, fontWeight: '700' },
  successText: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },
  backToLoginBtn: {
    backgroundColor: Colors.overlayGreen, borderWidth: 1,
    borderColor: Colors.overlayGreenStrong, borderRadius: 8,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  backToLoginText: { ...Typography.labelLarge, color: Colors.accentGreen, fontWeight: '600' },
});
