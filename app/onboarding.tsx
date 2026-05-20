import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/Colors';
import { useUserStore } from '../src/store/userStore';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: '⚡',
    accentColor: Colors.accentBlueDark,
    glowColor: 'rgba(77,142,255,0.12)',
    title: 'Command Center',
    subtitle: 'Every task, team, and deadline — unified in one intelligent hub built for student leaders.',
    features: [
      { icon: '◈', label: 'Dashboard intelligence' },
      { icon: '☑', label: 'Priority-first task system' },
      { icon: '◉', label: 'Real-time team pulse' },
    ],
  },
  {
    id: '2',
    icon: '✦',
    accentColor: Colors.accentPurple,
    glowColor: 'rgba(160,120,255,0.12)',
    title: 'AI Intelligence',
    subtitle: 'PARAPO learns your patterns and surfaces what matters most — before you even ask.',
    features: [
      { icon: '✦', label: 'Daily AI briefings' },
      { icon: '◎', label: 'Smart task suggestions' },
      { icon: '⟳', label: 'Predictive scheduling' },
    ],
  },
  {
    id: '3',
    icon: '◎',
    accentColor: Colors.accentGreen,
    glowColor: 'rgba(78,222,163,0.12)',
    title: 'Peak Performance',
    subtitle: 'Focus modes, academic tracking, and leadership tools — built for student executives.',
    features: [
      { icon: '◎', label: 'Deep focus timer' },
      { icon: '✎', label: 'Academic hub' },
      { icon: '⚡', label: 'Team delegation board' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboarded = useUserStore((s) => s.setOnboarded);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentIndex(index);
    },
    []
  );

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      setOnboarded(true);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  const slide = slides[currentIndex];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      {/* Ambient background glow — changes with slide */}
      <View style={[styles.bgGlow, { backgroundColor: slide.glowColor }]} />

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Icon container */}
            <View style={[styles.iconWrap, { borderColor: item.accentColor + '50', shadowColor: item.accentColor }]}>
              <View style={[styles.iconInner, { backgroundColor: item.accentColor + '20' }]}>
                <Text style={[styles.iconText, { color: item.accentColor }]}>{item.icon}</Text>
              </View>
            </View>

            <Text style={[styles.slideTitle, { color: item.accentColor }]}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

            {/* Feature rows */}
            <View style={styles.features}>
              {item.features.map((f, i) => (
                <View key={i} style={[styles.featureRow, { borderColor: item.accentColor + '25' }]}>
                  <View style={[styles.featureIconWrap, { backgroundColor: item.accentColor + '18' }]}>
                    <Text style={[styles.featureIcon, { color: item.accentColor }]}>{f.icon}</Text>
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      {/* Progress dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? [styles.dotActive, { backgroundColor: slide.accentColor }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: slide.accentColor }]}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 4,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 36,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  features: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.bgSubtle,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  skipBtn: {
    padding: 14,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  nextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bg,
    letterSpacing: 0.2,
  },
});
