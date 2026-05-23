import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CheckSquare, Timer, BookOpen, Users } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';

type TabName = 'index' | 'tasks' | 'focus' | 'academic' | 'teams';

interface TabIconProps {
  name: TabName;
  focused: boolean;
}

const LABELS: Record<TabName, string> = {
  index: 'Home',
  tasks: 'Tasks',
  focus: 'Focus',
  academic: 'Academic',
  teams: 'Teams',
};

const ICON_SIZE = 20;

function TabIcon({ name, focused }: TabIconProps) {
  const color = focused ? Colors.accentBlue : Colors.textMuted;
  const icons: Record<TabName, React.ReactNode> = {
    index:    <Home size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
    tasks:    <CheckSquare size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
    focus:    <Timer size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
    academic: <BookOpen size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
    teams:    <Users size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
  };

  return (
    <View style={styles.tabItem}>
      {focused && <View style={styles.activeIndicator} />}
      {icons[name]}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {LABELS[name]}
      </Text>
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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
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
    gap: 3,
    width: 60,
    paddingTop: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accentBlue,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.accentBlue,
    fontWeight: '700',
  },
});
