import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api';

// Expo Go removed push notification support in SDK 53 — guard everything
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
  ExpoNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const noop = async () => {};
const noopId = async (): Promise<string> => '';

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (IS_EXPO_GO) return false;
    const { status: existing } = await ExpoNotifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async registerPushToken(): Promise<string | null> {
    if (IS_EXPO_GO) return null;
    const granted = await this.requestPermissions();
    if (!granted) return null;
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
      await ExpoNotifications.setNotificationChannelAsync('focus', {
        name: 'Focus Mode',
        importance: ExpoNotifications.AndroidImportance.LOW,
        sound: undefined,
      });
    }
    try {
      const token = (await ExpoNotifications.getExpoPushTokenAsync()).data;
      await apiClient.post('/notifications/token', { token, platform: Platform.OS });
      return token;
    } catch {
      return null;
    }
  },

  async scheduleTaskReminder(taskId: string, title: string, dueDate: Date): Promise<string> {
    if (IS_EXPO_GO) return '';
    const triggerTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    return ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '⚠ Task Due Soon',
        body: title,
        data: { type: 'task_reminder', taskId },
        sound: 'default',
      },
      trigger: { type: ExpoNotifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
    });
  },

  async scheduleFocusComplete(sessionId: string, durationSeconds: number): Promise<string> {
    if (IS_EXPO_GO) return '';
    return ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Focus Session Complete!',
        body: 'Great work. Time for a break.',
        data: { type: 'focus_complete', sessionId },
        sound: 'default',
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: durationSeconds,
        repeats: false,
      },
    });
  },

  async scheduleMeetingReminder(meetingId: string, title: string, scheduledTime: Date): Promise<string> {
    if (IS_EXPO_GO) return '';
    const triggerTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
    return ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '📅 Meeting Starting Soon',
        body: `${title} in 10 minutes`,
        data: { type: 'meeting_reminder', meetingId },
        sound: 'default',
      },
      trigger: { type: ExpoNotifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
    });
  },

  async cancelNotification(id: string): Promise<void> {
    if (IS_EXPO_GO || !id) return;
    await ExpoNotifications.cancelScheduledNotificationAsync(id);
  },

  async cancelAll(): Promise<void> {
    if (IS_EXPO_GO) return;
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  },

  addNotificationListener(handler: (n: ExpoNotifications.Notification) => void) {
    if (IS_EXPO_GO) return { remove: () => {} };
    return ExpoNotifications.addNotificationReceivedListener(handler);
  },

  addResponseListener(handler: (r: ExpoNotifications.NotificationResponse) => void) {
    if (IS_EXPO_GO) return { remove: () => {} };
    return ExpoNotifications.addNotificationResponseReceivedListener(handler);
  },
};
