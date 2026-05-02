// ═══════════════════════════════════════════════════════════════
//  AL Qalam International EMS — Push Notification Service
//  Handles: registration, permissions, token storage, FCM send,
//           local scheduling, notification types & deeplink routing
// ═══════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ── Notification handler (foreground behaviour) ────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Notification Types ─────────────────────────────────────────
export type NotificationType =
  | 'new_challan'           // Admin generates fee challan
  | 'fee_due'               // Monthly fee reminder
  | 'fee_paid'              // Payment confirmed
  | 'fee_overdue'           // Fee overdue warning
  | 'attendance_low'        // Attendance below 75%
  | 'attendance_absent'     // Student marked absent today
  | 'attendance_marked'     // Teacher marked class attendance
  | 'result_published'      // New exam result published
  | 'marks_entered'         // Teacher entered marks
  | 'homework_assigned'     // New homework assigned
  | 'announcement'          // General school announcement
  | 'leave_approved'        // Teacher leave approved/rejected
  | 'timetable_changed'     // Timetable update
  | 'exam_schedule'         // Upcoming exam notice
  | 'library_due';          // Library book return reminder

export interface NotificationData {
  type:       NotificationType;
  title:      string;
  body:       string;
  screen?:    string;   // deeplink target screen
  params?:    Record<string, any>;
  icon?:      string;
  color?:     string;
}

// ── Notification Configs (type → display info) ─────────────────
export const NOTIFICATION_CONFIGS: Record<NotificationType, { icon: string; color: string; screen: string }> = {
  new_challan:       { icon: 'file-invoice-dollar', color: '#F59E0B', screen: '/(parent)/fee'       },
  fee_due:           { icon: 'money-bill',           color: '#F59E0B', screen: '/(parent)/fee'       },
  fee_paid:          { icon: 'check-circle',         color: '#10B981', screen: '/(parent)/fee'       },
  fee_overdue:       { icon: 'exclamation-circle',   color: '#EF4444', screen: '/(parent)/fee'       },
  attendance_low:    { icon: 'user-times',           color: '#EF4444', screen: '/(student)/attendance'},
  attendance_absent: { icon: 'clipboard-check',      color: '#EF4444', screen: '/(parent)/attendance' },
  attendance_marked: { icon: 'clipboard-check',      color: '#10B981', screen: '/(teacher)/attendance'},
  result_published:  { icon: 'graduation-cap',       color: '#8B5CF6', screen: '/(student)/results'  },
  marks_entered:     { icon: 'pencil-alt',           color: '#8B5CF6', screen: '/(teacher)/results'  },
  homework_assigned: { icon: 'book-open',            color: '#06B6D4', screen: '/(student)/index'    },
  announcement:      { icon: 'bullhorn',             color: '#3B82F6', screen: '/(student)/index'    },
  leave_approved:    { icon: 'calendar-check',       color: '#10B981', screen: '/(teacher)/profile'  },
  timetable_changed: { icon: 'calendar-alt',         color: '#06B6D4', screen: '/(student)/timetable'},
  exam_schedule:     { icon: 'calendar-day',         color: '#F59E0B', screen: '/(student)/results'  },
  library_due:       { icon: 'book',                 color: '#F97316', screen: '/(student)/index'    },
};

// ── Register for push notifications ───────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[NOTIF] Push notifications require a physical device');
    return null;
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Notifications Disabled',
      'Fee reminders aur attendance alerts ke liye notifications enable karein.',
      [{ text: 'OK' }]
    );
    return null;
  }

  // Configure Android channel with custom sound
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alqalam-default', {
      name:               'AL Qalam Notifications',
      importance:         Notifications.AndroidImportance.HIGH,
      vibrationPattern:   [0, 250, 150, 250],
      lightColor:         '#10B981',
      sound:              'alqalam_notification.wav',
      enableLights:       true,
      enableVibrate:      true,
    });

    await Notifications.setNotificationChannelAsync('alqalam-fee', {
      name:               'Fee Reminders',
      importance:         Notifications.AndroidImportance.HIGH,
      vibrationPattern:   [0, 300, 200, 300, 200, 300],
      lightColor:         '#F59E0B',
      sound:              'alqalam_notification.wav',
    });

    await Notifications.setNotificationChannelAsync('alqalam-attendance', {
      name:               'Attendance Alerts',
      importance:         Notifications.AndroidImportance.DEFAULT,
      vibrationPattern:   [0, 200, 100, 200],
      lightColor:         '#EF4444',
      sound:              'alqalam_notification.wav',
    });

    await Notifications.setNotificationChannelAsync('alqalam-academic', {
      name:               'Academic Updates',
      importance:         Notifications.AndroidImportance.DEFAULT,
      vibrationPattern:   [0, 200],
      lightColor:         '#8B5CF6',
      sound:              'alqalam_notification.wav',
    });
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    const token = tokenData.data;

    // Save token locally
    await SecureStore.setItemAsync('expo_push_token', token);
    console.log('[NOTIF] Push token registered:', token.slice(0, 30) + '...');
    return token;
  } catch (err) {
    console.error('[NOTIF] Failed to get push token:', err);
    return null;
  }
}

// ── Send token to server ───────────────────────────────────────
export async function syncTokenWithServer(
  token: string,
  userId: string,
  role: string
): Promise<void> {
  try {
    const phpUrl = process.env.EXPO_PUBLIC_PHP_API;
    await fetch(phpUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register_push_token',
        user_id: userId,
        role,
        token,
        platform: Platform.OS,
      }),
    });
    console.log('[NOTIF] Token synced to server');
  } catch (err) {
    console.error('[NOTIF] Failed to sync token:', err);
  }
}

// ── Schedule a local notification ─────────────────────────────
export async function scheduleLocalNotification(
  data: NotificationData,
  delaySeconds = 0
): Promise<string> {
  const config = NOTIFICATION_CONFIGS[data.type];

  const channelId = (() => {
    if (['new_challan','fee_due','fee_paid','fee_overdue'].includes(data.type)) return 'alqalam-fee';
    if (['attendance_low','attendance_absent','attendance_marked'].includes(data.type)) return 'alqalam-attendance';
    if (['result_published','marks_entered','homework_assigned','exam_schedule'].includes(data.type)) return 'alqalam-academic';
    return 'alqalam-default';
  })();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title:  data.title,
      body:   data.body,
      sound:  'alqalam_notification.wav',
      badge:  1,
      data: {
        type:   data.type,
        screen: data.screen ?? config.screen,
        params: data.params ?? {},
      },
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: delaySeconds > 0
      ? { seconds: delaySeconds, repeats: false } as any
      : null,
  });

  return id;
}

// ── Schedule daily fee reminder ────────────────────────────────
export async function scheduleFeeReminder(
  studentName: string,
  amount: number,
  dueDate: string
): Promise<void> {
  // Cancel existing fee reminders first
  await cancelNotificationsByType('fee_due');

  await scheduleLocalNotification({
    type:  'fee_due',
    title: '💰 Fee Reminder — AL Qalam',
    body:  `${studentName} ki fee Rs. ${amount.toLocaleString()} — ${dueDate} tak pay karein`,
    screen: '/(parent)/fee',
  });
}

// ── Schedule attendance alert ──────────────────────────────────
export async function scheduleAttendanceAlert(
  studentName: string,
  percentage: number
): Promise<void> {
  if (percentage >= 75) return; // Only alert if below threshold

  await scheduleLocalNotification({
    type:  'attendance_low',
    title: '⚠️ Low Attendance — AL Qalam',
    body:  `${studentName} ki attendance ${percentage}% hai — class teacher se rabta karein`,
    screen: '/(parent)/attendance',
  });
}

// ── Cancel notifications by type ──────────────────────────────
export async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if ((notif.content.data as any)?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ── Get notification screen route ─────────────────────────────
export function getNotificationRoute(data: Record<string, any>): { screen: string; params?: any } {
  const type   = data?.type as NotificationType;
  const config = NOTIFICATION_CONFIGS[type];
  return {
    screen: data?.screen ?? config?.screen ?? '/(admin)/index',
    params: data?.params ?? {},
  };
}

// ── Badge management ──────────────────────────────────────────
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ── Format time ago ───────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60)         return 'Abhi abhi';
  if (diff < 3600)       return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)} ghante pehle`;
  if (diff < 604800)     return `${Math.floor(diff / 86400)} din pehle`;
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}
