export const Colors = {
  // Backgrounds
  bg: '#0a0a0a',
  bgElevated: '#121212',
  bgCard: '#1a1c1e',
  bgSurface: '#201f1f',
  bgMuted: '#2a2a2a',
  bgSubtle: '#353534',

  // Text
  textPrimary: '#e5e2e1',
  textSecondary: '#c2c6d6',
  textMuted: '#8c909f',
  textDisabled: '#424754',

  // Accent Blue (brand)
  accentBlue: '#adc6ff',
  accentBlueDark: '#4d8eff',
  accentBlueDeep: '#002e6a',
  accentBlueDeeper: '#00285d',

  // Accent Purple (AI)
  accentPurple: '#a078ff',
  accentPurpleLight: '#d0bcff',
  accentPurpleDark: '#8b5cf6',
  accentPurpleDeep: '#340080',

  // Accent Green (success)
  accentGreen: '#4edea3',
  accentGreenDark: '#00a572',

  // Accent Red (urgent/error)
  accentRed: '#ffb4ab',
  accentRedDark: '#93000a',
  accentRedDeep: '#ffdad6',

  // Borders
  border: 'rgba(255,255,255,0.1)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.2)',

  // Semantic overlays
  overlayBlue: 'rgba(173,198,255,0.1)',
  overlayBlueStrong: 'rgba(173,198,255,0.2)',
  overlayPurple: 'rgba(160,120,255,0.1)',
  overlayPurpleStrong: 'rgba(160,120,255,0.2)',
  overlayGreen: 'rgba(78,222,163,0.1)',
  overlayGreenStrong: 'rgba(78,222,163,0.2)',
  overlayRed: 'rgba(255,180,171,0.1)',
  overlayRedStrong: 'rgba(255,180,171,0.2)',

  // Navigation
  navBg: 'rgba(32,31,31,0.9)',
  headerBg: 'rgba(19,19,19,0.8)',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
