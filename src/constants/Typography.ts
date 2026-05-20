import { TextStyle } from 'react-native';

export const FontFamily = {
  interBold: 'Inter_700Bold',
  interSemiBold: 'Inter_600SemiBold',
  interMedium: 'Inter_500Medium',
  interRegular: 'Inter_400Regular',
  geistBold: 'Geist-Bold',
  geistSemiBold: 'Geist-SemiBold',
  geistMedium: 'Geist-Medium',
  geistRegular: 'Geist-Regular',
} as const;

// Fallback to system fonts when custom fonts aren't loaded
const systemBold = 'System';
const systemRegular = 'System';

export const Typography = {
  // Display
  displayLarge: {
    fontSize: 48,
    fontFamily: systemBold,
    fontWeight: '700',
    letterSpacing: -2.4,
  } as TextStyle,

  // Headlines
  h1: {
    fontSize: 28,
    fontFamily: systemBold,
    fontWeight: '600',
    lineHeight: 36,
  } as TextStyle,

  h2: {
    fontSize: 20,
    fontFamily: systemBold,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,

  h3: {
    fontSize: 16,
    fontFamily: systemBold,
    fontWeight: '700',
    lineHeight: 24,
  } as TextStyle,

  h4: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.26,
  } as TextStyle,

  // Brand
  brandName: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 9.6,
    lineHeight: 56,
  } as TextStyle,

  // Labels
  labelLarge: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.26,
  } as TextStyle,

  labelMedium: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.55,
  } as TextStyle,

  labelSmall: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.5,
  } as TextStyle,

  labelUppercase: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  // Special
  timerDisplay: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 72,
  } as TextStyle,

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
