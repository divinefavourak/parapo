import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';

type TabName = 'index' | 'tasks' | 'focus' | 'academic' | 'teams';

interface TabIconProps {
  name: TabName;
  focused: boolean;
}

const icons: Record<TabName, string> = {
  index: '⌂',
  tasks: '☑',
  focus: '◎',
  academic: '✎',
  teams: '⚡',
};

const labels: Record<TabName, string> = {
  index: 'Home',
  tasks: 'Tasks',
  focus: 'Focus',
  academic: 'Academic',
  teams: 'Teams',
};

function TabIcon({ name, focused }: TabIconProps) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icons[name]}</Text>
      {focused && <Text style={styles.tabLabel}>{labels[name]}</Text>}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navBg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          paddingHorizontal: 4,
          elevation: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="tasks" focused={focused} /> }}
      />
      <Tabs.Screen
        name="focus"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="focus" focused={focused} /> }}
      />
      <Tabs.Screen
        name="academic"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="academic" focused={focused} /> }}
      />
      <Tabs.Screen
        name="teams"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="teams" focused={focused} /> }}
      />
      {/* Profile accessible via header avatar — hidden from tab bar */}
      <Tabs.Screen
        name="profile"
        options={{ tabBarItemStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    minHeight: 44,
    minWidth: 50,
  },
  tabItemActive: {
    backgroundColor: Colors.accentBlueDark,
  },
  tabIcon: {
    fontSize: 19,
    color: Colors.textMuted,
  },
  tabIconActive: {
    color: Colors.accentBlueDeeper,
    fontSize: 19,
  },
  tabLabel: {
    ...Typography.labelSmall,
    color: Colors.accentBlueDeeper,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 10,
  },
});
