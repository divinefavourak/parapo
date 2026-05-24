import '../src/global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { notificationService } from '../src/services/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // navigator not mounted yet
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === 'auth';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (status === 'authenticated') {
      if (user && !user.is_onboarded && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      } else if (user?.is_onboarded && (inAuthGroup || segments[0] === 'onboarding' || segments[0] === 'splash')) {
        router.replace('/(tabs)');
      }
    }
  }, [status, user, segments, navigationState?.key]);

  return <>{children}</>;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    (async () => {
      await initialize();
      SplashScreen.hideAsync();
    })();
  }, []);

  useEffect(() => {
    notificationService.registerPushToken().catch(() => {});
    const sub1 = notificationService.addNotificationListener(() => {});
    const sub2 = notificationService.addResponseListener(() => {});
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AppInitializer>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="splash" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="ai/index" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                <Stack.Screen name="notes/index" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings/profile" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings/notifications" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings/focus" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </AuthGuard>
          </AppInitializer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
