import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api';

// Expo Go removed push notification support in SDK 53 — guard everything
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
  // Suppress banner/sound for focus timer updates so they never spam the shade.
  // isUpdate=true means it's a silent refresh; isUpdate=false (or absent) plays normally.
  ExpoNotifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isSilentUpdate = notification.request.content.data?.isUpdate === true;
      return {
        shouldShowAlert: !isSilentUpdate,
        shouldPlaySound: !isSilentUpdate,
        shouldSetBadge: false,
        shouldShowBanner: !isSilentUpdate,
        shouldShowList: true,
      };
    },
  });
}

async function ensureActionsChannel() {
  if (Platform.OS !== 'android' || IS_EXPO_GO) return;
  await ExpoNotifications.setNotificationChannelAsync('actions', {
    name: 'Action Confirmations',
    importance: ExpoNotifications.AndroidImportance.DEFAULT,
    sound: undefined,
    vibrationPattern: [0, 100],
  });
}

async function ensureFocusChannel() {
  if (Platform.OS !== 'android' || IS_EXPO_GO) return;
  await ExpoNotifications.setNotificationChannelAsync('focus_timer', {
    name: 'Focus Timer',
    importance: ExpoNotifications.AndroidImportance.LOW,
    sound: undefined,
    vibrationPattern: undefined,
  });
}

let _focusTimerNotifId: string | null = null;

// Shows or silently updates the single persistent focus countdown notification.
// isInitial=true on session start (shows banner + sound), false for periodic updates (silent).
export async function showFocusTimerNotification(
  title: string,
  remainingSeconds: number,
  isInitial = false,
): Promise<void> {
  if (IS_EXPO_GO) return;
  await ensureFocusChannel();

  // Dismiss the previous entry from the shade before posting the new one.
  if (_focusTimerNotifId) {
    await ExpoNotifications.dismissNotificationAsync(_focusTimerNotifId).catch(() => {});
  }

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const countdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} remaining`;

  _focusTimerNotifId = await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: `🎯 ${title}`,
      body: countdown,
      // isUpdate=true → handler suppresses banner and sound for this notification
      data: { type: 'focus_timer', isUpdate: !isInitial },
      sticky: true,
      ...(Platform.OS === 'android' ? { channelId: 'focus_timer' } : {}),
    },
    trigger: null,
  });
}

export async function dismissFocusTimerNotification(): Promise<void> {
  if (!_focusTimerNotifId || IS_EXPO_GO) return;
  await ExpoNotifications.dismissNotificationAsync(_focusTimerNotifId).catch(() => {});
  await ExpoNotifications.cancelScheduledNotificationAsync(_focusTimerNotifId).catch(() => {});
  _focusTimerNotifId = null;
}

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
      await apiClient.post('/notifications/tokens', { token, platform: Platform.OS });
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

  async notify(title: string, body: string, data?: Record<string, any>): Promise<void> {
    if (IS_EXPO_GO) return;
    await ensureActionsChannel();
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        ...(Platform.OS === 'android' ? { channelId: 'actions' } : {}),
      },
      trigger: null,
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
