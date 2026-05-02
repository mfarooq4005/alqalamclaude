// ═══════════════════════════════════════════════════════════════
//  AL Qalam EMS — Notification Center
//  All roles see this screen — categorized, read/unread, deeplink
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../src/theme';
import { useNotificationStore, AppNotification } from '../src/store/notifications';
import { NOTIFICATION_CONFIGS, timeAgo } from '../src/notifications';

// ── Filter tabs ────────────────────────────────────────────────
type FilterTab = 'all' | 'fee' | 'attendance' | 'academic' | 'general';

const FILTER_TABS: { key: FilterTab; label: string; icon: string; color: string }[] = [
  { key: 'all',        label: 'Sab',       icon: 'bell',           color: Colors.green  },
  { key: 'fee',        label: 'Fee',        icon: 'money-bill',     color: Colors.gold   },
  { key: 'attendance', label: 'Attendance', icon: 'clipboard-check',color: Colors.red    },
  { key: 'academic',   label: 'Academic',   icon: 'graduation-cap', color: Colors.purple },
  { key: 'general',    label: 'General',    icon: 'bullhorn',       color: Colors.cyan   },
];

function getCategory(type: string): FilterTab {
  if (['new_challan','fee_due','fee_paid','fee_overdue'].includes(type))             return 'fee';
  if (['attendance_low','attendance_absent','attendance_marked'].includes(type))     return 'attendance';
  if (['result_published','marks_entered','homework_assigned','exam_schedule'].includes(type)) return 'academic';
  return 'general';
}

// ── Single notification card ───────────────────────────────────
function NotifCard({
  notif,
  onPress,
  onDelete,
}: {
  notif: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const config = NOTIFICATION_CONFIGS[notif.type] ?? {
    icon: 'bell', color: Colors.green,
  };

  return (
    <TouchableOpacity
      style={[styles.card, !notif.isRead && styles.cardUnread]}
      onPress={onPress}
      onLongPress={() =>
        Alert.alert('Delete', 'Yeh notification delete karein?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ])
      }
      activeOpacity={0.8}>

      {/* Unread dot */}
      {!notif.isRead && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: config.color + '18' }]}>
        <FontAwesome5 name={config.icon} size={15} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !notif.isRead && styles.cardTitleBold]}>
          {notif.title}
        </Text>
        <Text style={styles.cardBody} numberOfLines={2}>
          {notif.body}
        </Text>
        <Text style={styles.cardTime}>{timeAgo(notif.createdAt)}</Text>
      </View>

      {/* Chevron */}
      <FontAwesome5
        name="chevron-right"
        size={10}
        color={Colors.textMuted}
        style={{ marginLeft: 6 }}
      />
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────
export default function NotificationCenter() {
  const router = useRouter();
  const {
    notifications, markRead, markAllRead,
    removeNotification, clearAll, unreadCount,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => getCategory(n.type) === activeTab);

  const handlePress = (notif: AppNotification) => {
    markRead(notif.id);
    if (notif.screen) {
      try {
        router.push(notif.screen as any);
      } catch {
        router.back();
      }
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      'Tamam notifications delete karein?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const unread = unreadCount();

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={16} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread > 0 && (
            <Text style={styles.headerSub}>{unread} nai notifications</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
              <FontAwesome5 name="check-double" size={13} color={Colors.green} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
              <FontAwesome5 name="trash" size={13} color={Colors.red} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}>
        {FILTER_TABS.map((tab) => {
          const tabCount = tab.key === 'all'
            ? notifications.filter(n => !n.isRead).length
            : notifications.filter(n => getCategory(n.type) === tab.key && !n.isRead).length;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                isActive && { backgroundColor: tab.color + '18', borderColor: tab.color + '60' },
              ]}>
              <FontAwesome5
                name={tab.icon}
                size={11}
                color={isActive ? tab.color : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>
                {tab.label}
              </Text>
              {tabCount > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                  <Text style={styles.tabBadgeText}>{tabCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome5 name="bell-slash" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Koi notification nahi</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'all'
              ? 'Abhi tak koi notification nahi aayi'
              : `Is category mein koi notification nahi`}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}>

          {/* Group: Today */}
          {(() => {
            const today = filtered.filter((n) => {
              const diff = Date.now() - new Date(n.createdAt).getTime();
              return diff < 86400000;
            });
            if (today.length === 0) return null;
            return (
              <View>
                <Text style={styles.groupLabel}>Aaj</Text>
                {today.map((n) => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onPress={() => handlePress(n)}
                    onDelete={() => removeNotification(n.id)}
                  />
                ))}
              </View>
            );
          })()}

          {/* Group: This Week */}
          {(() => {
            const week = filtered.filter((n) => {
              const diff = Date.now() - new Date(n.createdAt).getTime();
              return diff >= 86400000 && diff < 604800000;
            });
            if (week.length === 0) return null;
            return (
              <View>
                <Text style={styles.groupLabel}>Is Hafte</Text>
                {week.map((n) => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onPress={() => handlePress(n)}
                    onDelete={() => removeNotification(n.id)}
                  />
                ))}
              </View>
            );
          })()}

          {/* Group: Older */}
          {(() => {
            const older = filtered.filter((n) => {
              const diff = Date.now() - new Date(n.createdAt).getTime();
              return diff >= 604800000;
            });
            if (older.length === 0) return null;
            return (
              <View>
                <Text style={styles.groupLabel}>Pehle</Text>
                {older.map((n) => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onPress={() => handlePress(n)}
                    onDelete={() => removeNotification(n.id)}
                  />
                ))}
              </View>
            );
          })()}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:    { color: Colors.text, fontSize: Font.xl, fontWeight: '800' },
  headerSub:      { color: Colors.green, fontSize: 11, marginTop: 1 },
  headerActions:  { flexDirection: 'row', gap: 8 },
  headerBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  // Tabs
  tabsContainer:  { paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8 },
  tab:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  tabLabel:       { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  tabBadge:       { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText:   { color: '#fff', fontSize: 9, fontWeight: '900' },

  // List
  list:           { paddingHorizontal: Spacing.md, paddingTop: 4 },
  groupLabel:     { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 8, paddingLeft: 2 },

  // Card
  card:           { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: Colors.bg2, borderRadius: Radius.lg, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  cardUnread:     { backgroundColor: Colors.bg3, borderColor: Colors.green + '30' },
  unreadDot:      { position: 'absolute', top: 14, left: 6, width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.green },
  iconBox:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  cardContent:    { flex: 1 },
  cardTitle:      { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600', marginBottom: 3 },
  cardTitleBold:  { color: Colors.text, fontWeight: '800' },
  cardBody:       { color: Colors.textMuted, fontSize: 12, lineHeight: 17 },
  cardTime:       { color: Colors.textMuted, fontSize: 10, marginTop: 4, opacity: 0.7 },

  // Empty
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle:     { color: Colors.text, fontSize: Font.lg, fontWeight: '700', marginTop: 16 },
  emptySub:       { color: Colors.textMuted, fontSize: Font.sm, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
