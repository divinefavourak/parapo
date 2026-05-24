import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  BookOpen,
  House,
  Note,
  SquareCheck,
  Timer,
} from 'phosphor-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

// ─── Layout constants ───────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');
const BAR_H = 72;
const EXTRA_TOP = 24;          // space above bar so the center button can float
const BTN_SIZE = 58;
const CORNER_R = 26;
const NOTCH_R = 50;
const NOTCH_HW = 42;           // half-width of the notch opening at bar top
const ICON_SZ = 22;
const ICON_TOP = 13;           // active-icon distance from bar top
const ICON_CENTER = (BAR_H - ICON_SZ) / 2;  // inactive icon distance from bar top ≈ 25
const ICON_SHIFT = ICON_CENTER - ICON_TOP;   // translate delta ≈ 12

// ─── Colors ─────────────────────────────────────────────────────────────────
const BAR_BG = '#13131F';
const BTN_BG = '#613EEA';
const ACTIVE_CLR = '#5B8AF8';
const INACTIVE_CLR = '#4A4A6A';

// ─── SVG path ────────────────────────────────────────────────────────────────
// Concave arch at centre: sweep=1 makes the arc dip inward (screen-recorder pattern)
function buildPath(h: number): string {
  const cx = W / 2;
  return [
    `M ${CORNER_R},0`,
    `L ${cx - NOTCH_HW},0`,
    `A ${NOTCH_R} ${NOTCH_R} 0 0 1 ${cx + NOTCH_HW} 0`,
    `L ${W - CORNER_R},0`,
    `Q ${W},0 ${W},${CORNER_R}`,
    `L ${W},${h}`,
    `L 0,${h}`,
    `L 0,${CORNER_R}`,
    `Q 0,0 ${CORNER_R},0`,
    `Z`,
  ].join(' ');
}

// ─── Icon registry ───────────────────────────────────────────────────────────
type RouteName = 'index' | 'tasks' | 'academic' | 'notes';

const LABELS: Record<RouteName, string> = {
  index: 'Home',
  tasks: 'Tasks',
  academic: 'Academic',
  notes: 'Notes',
};

function IconPair({
  name,
  activeOpacity,
}: {
  name: RouteName;
  activeOpacity: Animated.AnimatedInterpolation<number>;
}) {
  const inactiveOpacity = activeOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const props = { size: ICON_SZ };
  const active = (w: 'fill') => {
    switch (name) {
      case 'index':    return <House {...props} weight={w} color={ACTIVE_CLR} />;
      case 'tasks':    return <SquareCheck {...props} weight={w} color={ACTIVE_CLR} />;
      case 'academic': return <BookOpen {...props} weight={w} color={ACTIVE_CLR} />;
      case 'notes':    return <Note {...props} weight={w} color={ACTIVE_CLR} />;
    }
  };
  const inactive = (w: 'light') => {
    switch (name) {
      case 'index':    return <House {...props} weight={w} color={INACTIVE_CLR} />;
      case 'tasks':    return <SquareCheck {...props} weight={w} color={INACTIVE_CLR} />;
      case 'academic': return <BookOpen {...props} weight={w} color={INACTIVE_CLR} />;
      case 'notes':    return <Note {...props} weight={w} color={INACTIVE_CLR} />;
    }
  };

  return (
    <View style={{ width: ICON_SZ, height: ICON_SZ }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: inactiveOpacity }]}>
        {inactive('light')}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeOpacity }]}>
        {active('fill')}
      </Animated.View>
    </View>
  );
}

// ─── Single tab button ────────────────────────────────────────────────────────
interface TabItemProps {
  name: RouteName;
  focused: boolean;
  // Shared animation: 0 = non-home mode (icons sit at top), 1 = home mode (icons centered)
  homeAnim: Animated.Value;
  onPress: () => void;
}

function TabItem({ name, focused, homeAnim, onPress }: TabItemProps) {
  const focusAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      tension: 150,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  // Active tab: always sits at ICON_TOP regardless of mode
  // Inactive tab: slides between top (non-home mode) and center (home mode)
  const translateY = focused
    ? focusAnim.interpolate({ inputRange: [0, 1], outputRange: [ICON_SHIFT, 0] })
    : homeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, ICON_SHIFT] });

  const labelOpacity = focusAnim;
  const labelSlide = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  });

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.tabContent, { transform: [{ translateY }] }]}>
        <IconPair name={name} activeOpacity={focusAnim} />
        <Animated.Text
          style={[
            styles.tabLabel,
            { opacity: labelOpacity, transform: [{ translateY: labelSlide }] },
          ]}
          numberOfLines={1}
        >
          {LABELS[name]}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barSvgH = BAR_H + insets.bottom;
  const containerH = EXTRA_TOP + barSvgH;

  const activeRoute = state.routes[state.index]?.name;
  const homeAnim = useRef(new Animated.Value(activeRoute === 'index' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(homeAnim, {
      toValue: activeRoute === 'index' ? 1 : 0,
      tension: 150,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [activeRoute]);

  const go = (name: string) => {
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  const isFocused = (name: string) => activeRoute === name;
  const isFocusFocused = isFocused('focus');

  // Side panel widths (responsive — adapts to any screen width)
  const sideW = (W - NOTCH_HW * 2 - 16) / 2;

  return (
    <View pointerEvents="box-none" style={[styles.container, { height: containerH }]}>
      {/* ── Background bar shape ── */}
      <Svg width={W} height={barSvgH} style={styles.svg}>
        <Path d={buildPath(barSvgH)} fill={BAR_BG} />
      </Svg>

      {/* ── Left tabs: Home, Tasks ── */}
      <View
        pointerEvents="box-none"
        style={[styles.sideRow, { left: 8, width: sideW, bottom: insets.bottom }]}
      >
        <TabItem name="index"   focused={isFocused('index')}   homeAnim={homeAnim} onPress={() => go('index')} />
        <TabItem name="tasks"   focused={isFocused('tasks')}   homeAnim={homeAnim} onPress={() => go('tasks')} />
      </View>

      {/* ── Right tabs: Academic, Notes ── */}
      <View
        pointerEvents="box-none"
        style={[styles.sideRow, { right: 8, width: sideW, bottom: insets.bottom }]}
      >
        <TabItem name="academic" focused={isFocused('academic')} homeAnim={homeAnim} onPress={() => go('academic')} />
        <TabItem name="notes"    focused={isFocused('notes')}    homeAnim={homeAnim} onPress={() => go('notes')} />
      </View>

      {/* ── Centre floating button (Focus) ── */}
      <TouchableOpacity
        style={[styles.centerBtn, isFocusFocused && styles.centerBtnActive]}
        onPress={() => go('focus')}
        activeOpacity={0.85}
      >
        <Timer size={26} color="#fff" weight={isFocusFocused ? 'fill' : 'regular'} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: W,
  },
  svg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  sideRow: {
    position: 'absolute',
    height: BAR_H,
    flexDirection: 'row',
    alignItems: 'flex-start', // items always start from top; animation controls the icon offset
    paddingTop: ICON_TOP,
  },
  tabItem: {
    flex: 1,
    height: BAR_H - ICON_TOP,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ACTIVE_CLR,
    letterSpacing: 0.2,
  },
  centerBtn: {
    position: 'absolute',
    top: 0,
    left: W / 2 - BTN_SIZE / 2,
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: BTN_BG,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BTN_BG,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },
  centerBtnActive: {
    ...Platform.select({
      ios: { shadowOpacity: 0.8 },
      android: { elevation: 16 },
    }),
  },
});
