// ═══════════════════════════════════════════════════════════════
//  AL Qalam EMS — Notification Store (Zustand)
//  Persists notification history, unread count, preferences
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { NotificationType, NOTIFICATION_CONFIGS } from '../notifications';

// ── Types ──────────────────────────────────────────────────────
export interface AppNotification {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  screen?:   string;
  params?:   Record<string, any>;
  createdAt: string;
  isRead:    boolean;
}

export interface NotificationPreferences {
  allNotifications:  boolean;
  feeReminders:      boolean;
  attendanceAlerts:  boolean;
  academicUpdates:   boolean;
  announcements:     boolean;
}

interface NotificationStore {
  notifications:  AppNotification[];
  preferences:    NotificationPreferences;
  pushToken:      string | null;

  // Actions
  addNotification:     (n: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markRead:            (id: string) => void;
  markAllRead:         () => void;
  removeNotification:  (id: string) => void;
  clearAll:            () => void;
  setPushToken:        (token: string) => void;
  updatePreferences:   (prefs: Partial<NotificationPreferences>) => void;

  // Computed
  unreadCount:         () => number;
  getByType:           (type: NotificationType) => AppNotification[];
}

// ── Store ──────────────────────────────────────────────────────
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  pushToken: null,
  preferences: {
    allNotifications: true,
    feeReminders:     true,
    attendanceAlerts: true,
    academicUpdates:  true,
    announcements:    true,
  },

  // Pre-loaded demo notifications
  notifications: [
    {
      id: 'n1',
      type: 'new_challan',
      title: '🧾 New Challan Generated',
      body:  'Muhammad Bilal (XI-A) ka May 2026 challan generate ho gaya — Rs. 4,500',
      screen: '/(parent)/fee',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),   // 15 min ago
      isRead: false,
    },
    {
      id: 'n2',
      type: 'attendance_absent',
      title: '⚠️ Absence Alert',
      body:  'Zara Saeed (VIII-B) aaj absent hai',
      screen: '/(parent)/attendance',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
      isRead: false,
    },
    {
      id: 'n3',
      type: 'result_published',
      title: '📊 Result Published',
      body:  'Mid-Term 2026 nataij publish ho gaye — check karein',
      screen: '/(student)/results',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
      isRead: true,
    },
    {
      id: 'n4',
      type: 'announcement',
      title: '📢 School Announcement',
      body:  'AL Qalam International: 10 May ko Sports Day hoga. Tamam talbah shuboa attend karein.',
      screen: '/(student)/index',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: true,
    },
    {
      id: 'n5',
      type: 'fee_paid',
      title: '✅ Fee Payment Confirmed',
      body:  'Muhammad Bilal ki April 2026 fee Rs. 4,500 confirm ho gayi',
      screen: '/(parent)/fee',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      isRead: true,
    },
    {
      id: 'n6',
      type: 'attendance_low',
      title: '🔴 Low Attendance Warning',
      body:  'Zara Saeed ki attendance 71% hai — class teacher se rabta karein',
      screen: '/(parent)/attendance',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
      isRead: true,
    },
    {
      id: 'n7',
      type: 'exam_schedule',
      title: '📅 Final Exams Schedule',
      body:  'Final exams 1 June 2026 se shuru honge — schedule download karein',
      screen: '/(student)/results',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
      isRead: true,
    },
  ],

  // ── Actions ──
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id:        `n_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          isRead:    false,
        },
        ...s.notifications,
      ],
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  setPushToken: (token) => set({ pushToken: token }),

  updatePreferences: (prefs) =>
    set((s) => ({ preferences: { ...s.preferences, ...prefs } })),

  // ── Computed ──
  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  getByType: (type) => get().notifications.filter((n) => n.type === type),
}));
