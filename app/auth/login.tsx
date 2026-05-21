import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, error, clearError, status } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isLoading = status === 'loading';

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/logo_5-removebg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>PARAPO</Text>
          <Text style={styles.brandSub}>Sign in to your command center</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@university.edu"
              placeholderTextColor={Colors.textDisabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Your password"
                placeholderTextColor={Colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeText}>{showPassword ? '○' : '●'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, (!email || !password || isLoading) && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.accentBlueDeeper} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.signupBtnText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>PARAPO · Student Leadership Platform</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 24, gap: 32 },

  brand: { alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    padding: 10,
  },
  logo: { width: 60, height: 60 },
  brandName: {
    fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    letterSpacing: 6,
  },
  brandSub: { ...Typography.bodyMedium, color: Colors.textMuted },

  form: { gap: 16 },
  errorBanner: {
    backgroundColor: Colors.overlayRed,
    borderWidth: 1, borderColor: Colors.overlayRedStrong,
    borderRadius: 8, padding: 12,
  },
  errorText: { ...Typography.bodySmall, color: Colors.accentRed },

  field: { gap: 8 },
  label: { ...Typography.labelUppercase, color: Colors.textMuted, letterSpacing: 1.2 },
  input: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 14,
    color: Colors.textPrimary, fontSize: 15,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute', right: 14, top: 0, bottom: 0,
    justifyContent: 'center',
  },
  eyeText: { color: Colors.textMuted, fontSize: 12 },

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { ...Typography.labelMedium, color: Colors.accentBlue },

  loginBtn: {
    backgroundColor: Colors.accentBlueDark,
    borderRadius: 10, padding: 16, alignItems: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.45 },
  loginBtnText: { ...Typography.labelLarge, color: Colors.accentBlueDeeper, fontWeight: '700', fontSize: 15 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.labelSmall, color: Colors.textMuted },

  signupBtn: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 15, alignItems: 'center',
  },
  signupBtnText: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '600' },

  footer: { ...Typography.labelSmall, color: Colors.textDisabled, textAlign: 'center' },
});
