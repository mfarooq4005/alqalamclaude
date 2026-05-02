// ═══════════════════════════════════════════════════════════════
//  Root Layout — Expo Router
//  Handles: OTA updates, push notifications, token registration,
//           notification deeplinks, badge count
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { Colors } from '../src/theme';
import { useAuthStore } from '../src/store/auth';
import { useNotificationStore } from '../src/store/notifications';
import {
  registerForPushNotifications,
  syncTokenWithServer,
  getNotificationRoute,
  clearBadge,
} from '../src/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

// ── Inner component (needs router) ────────────────────────────
function AppRoot() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { addNotification, setPushToken } = useNotificationStore();

  const notifListener    = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ── OTA Update Check ────────────────────────────────────────
  useEffect(() => {
    async function checkForUpdates() {
      try {
        if (!Updates.isEnabled) return;
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            '🎉 Update Available',
            'AL Qalam EMS ka naya version download ho gaya. Abhi restart karein?',
            [
              { text: 'Bad Mein', style: 'cancel' },
              { text: 'Restart ✓', style: 'default', onPress: () => Updates.reloadAsync() },
            ]
          );
        }
      } catch (_) {
        // Silently fail — update check is non-critical
      }
    }
    checkForUpdates();
  }, []);

  // ── Push Notification Setup (after user logs in) ────────────
  useEffect(() => {
    if (!user) return; // Only register after login

    async function setupPushNotifications() {
      const token = await registerForPushNotifications();
      if (!token) return;

      setPushToken(token);

      // Sync token with server
      await syncTokenWithServer(token, String(user.id), user.role);
    }

    setupPushNotifications();
  }, [user?.id]);

  // ── Notification Listeners ──────────────────────────────────
  useEffect(() => {
    // Foreground notification received → add to store
    notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      if (title && body) {
        addNotification({
          type:   (data?.type as any) ?? 'announcement',
          title:  title as string,
          body:   body  as string,
          screen: data?.screen as string | undefined,
          params: data?.params as Record<string, any> | undefined,
        });
      }
    });

    // Notification tapped → navigate to correct screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data   = response.notification.request.content.data ?? {};
      const route  = getNotificationRoute(data);
      clearBadge();
      try {
        router.push(route.screen as any);
      } catch {
        // Screen not available — ignore
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── Clear badge when app comes to foreground ─────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') clearBadge();
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen
        name="notifications"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

// ── Root Provider Wrapper ──────────────────────────────────────
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <AppRoot />
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
