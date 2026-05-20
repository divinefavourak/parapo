import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/Colors';

const { width, height } = Dimensions.get('window');

const GRID_COLS = 8;
const GRID_ROWS = 12;
const DOT_SIZE = 3;
const DOT_GAP = width / GRID_COLS;

const STATUS_PHASES = [
  'Initializing modules',
  'Connecting intelligence',
  'Calibrating workspace',
  'Ready',
];

function GridDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.06, duration: 1200, useNativeDriver: true }),
        Animated.delay(Math.random() * 2000),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: Colors.accentBlue,
        opacity,
      }}
    />
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;
  const [statusIndex, setStatusIndex] = useState(0);

  const dots = React.useMemo(() => {
    const arr: { id: string; x: number; y: number; delay: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        arr.push({
          id: `${r}-${c}`,
          x: c * DOT_GAP + DOT_GAP / 2,
          y: r * (height / GRID_ROWS) + (height / GRID_ROWS) / 2,
          delay: Math.random() * 3000,
        });
      }
    }
    return arr;
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(statusOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(loadingWidth, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    const phaseTimers = STATUS_PHASES.slice(0, -1).map((_, i) =>
      setTimeout(() => setStatusIndex(i + 1), 600 + i * 480)
    );

    const nav = setTimeout(() => router.replace('/onboarding'), 3000);
    return () => {
      phaseTimers.forEach(clearTimeout);
      clearTimeout(nav);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Animated grid background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {dots.map((d) => (
          <GridDot key={d.id} x={d.x} y={d.y} delay={d.delay} />
        ))}
      </View>

      {/* Ambient glow rings */}
      <Animated.View style={[styles.glowOuter, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowInner, { opacity: glowOpacity }]} />

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={styles.logoBg}>
            <Image
              source={require('../assets/logo_5-removebg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', gap: 6 }}>
          <Text style={styles.brandName}>PARAPO</Text>
          <Text style={styles.tagline}>UNIFIED COMMAND FOR STUDENT LEADERS</Text>
        </Animated.View>

        <Animated.View style={[styles.statusRow, { opacity: statusOpacity }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{STATUS_PHASES[statusIndex]}</Text>
        </Animated.View>
      </View>

      {/* Loading bar */}
      <View style={styles.loadingTrack}>
        <Animated.View
          style={[
            styles.loadingFill,
            {
              width: loadingWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(77,142,255,0.05)',
  },
  glowInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(77,142,255,0.07)',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    marginBottom: 4,
  },
  logoBg: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#131313',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173,198,255,0.15)',
    padding: 14,
    shadowColor: Colors.accentBlueDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: 92,
    height: 92,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#d8e2ff',
    letterSpacing: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8c909f',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentGreen,
  },
  statusText: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 48,
    width: 180,
    height: 2,
    borderRadius: 4,
    backgroundColor: '#1e1e1e',
    overflow: 'hidden',
  },
  loadingFill: {
    height: 2,
    borderRadius: 4,
    backgroundColor: Colors.accentBlueDark,
    shadowColor: Colors.accentBlueDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
