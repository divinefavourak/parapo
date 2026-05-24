import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="focus" />
      <Tabs.Screen name="academic" />
      <Tabs.Screen name="notes" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="teams" options={{ href: null }} />
    </Tabs>
  );
}
