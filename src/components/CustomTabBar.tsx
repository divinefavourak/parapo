import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CheckSquare, Timer, BookOpen, FileText } from 'lucide-react-native';

const ROUTE_ORDER = ['index', 'tasks', 'focus', 'academic', 'notes'] as const;
type RouteName = (typeof ROUTE_ORDER)[number];

const BAR_BG   = '#13131F';
const ACTIVE   = '#7C5CFC';
const INACTIVE = '#3D3D5C';
const BORDER   = '#1C1C2E';

const LABELS: Record<RouteName, string> = {
  index:    'Home',
  tasks:    'Tasks',
  focus:    'Focus',
  academic: 'Study',
  notes:    'Notes',
};

function getIcon(name: RouteName, focused: boolean) {
  const color  = focused ? ACTIVE : INACTIVE;
  const stroke = focused ? 2.2 : 1.6;
  const size   = 22;
  switch (name) {
    case 'index':    return <Home       size={size} color={color} strokeWidth={stroke} />;
    case 'tasks':    return <CheckSquare size={size} color={color} strokeWidth={stroke} />;
    case 'focus':    return <Timer      size={size} color={color} strokeWidth={stroke} />;
    case 'academic': return <BookOpen   size={size} color={color} strokeWidth={stroke} />;
    case 'notes':    return <FileText   size={size} color={color} strokeWidth={stroke} />;
  }
}

// ── Tab item ──────────────────────────────────────────────────────────────────
interface TabItemProps {
  name: RouteName;
  focused: boolean;
  onPress: () => void;
}

function TabItem({ name, focused, onPress }: TabItemProps) {
  const pill  = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(focused ? 1 : 0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pill,  { toValue: focused ? 1 : 0,    tension: 160, friction: 10, useNativeDriver: true }),
      Animated.spring(scale, { toValue: focused ? 1 : 0.88, tension: 160, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      {/* Top pill */}
      <Animated.View style={[styles.pill, { transform: [{ scaleX: pill }], opacity: pill }]} />

      {/* Icon */}
      <Animated.View style={{ transform: [{ scale }] }}>
        {getIcon(name, focused)}
      </Animated.View>

      {/* Label */}
      <Text style={[styles.label, { color: focused ? ACTIVE : INACTIVE }]}>
        {LABELS[name]}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main bar ──────────────────────────────────────────────────────────────────
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name as RouteName;

  const go = (name: string, key: string) => {
    const ev = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!ev.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ROUTE_ORDER.map((name) => {
        const route = state.routes.find((r) => r.name === name);
        if (!route) return null;
        return (
          <TabItem
            key={name}
            name={name}
            focused={activeRoute === name}
            onPress={() => go(name, route.key)}
          />
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: BAR_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  pill: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACTIVE,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
