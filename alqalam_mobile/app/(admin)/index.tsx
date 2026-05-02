// ═══════════════════════════════════════════════════════════════
//  Admin Dashboard — Real API (no mock data)
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, StatCard, ScreenLoader, ErrorState, NotifBell } from '../../src/components';
import { useAuthStore } from '../../src/store/auth';
import { useNotificationStore } from '../../src/store/notifications';
import { useAdminDashboard } from '../../src/api/hooks';

export default function AdminDashboard() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const unread   = useNotificationStore((s) => s.unreadCount());

  const { data, isLoading, isError, refetch, isFetching } = useAdminDashboard();

  if (isLoading) return <ScreenLoader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const stats         = data?.stats         ?? {};
  const recent_fee    = data?.recent_fee    ?? [];
  const recent_absent = data?.recent_absent ?? [];
  const announcements = data?.announcements ?? [];

  const STAT_CARDS = [
    { label: 'Total Students', value: stats.total_students  ?? '—',  icon: 'user-graduate',      color: Colors.green  },
    { label: 'Total Staff',    value: stats.total_staff     ?? '—',  icon: 'chalkboard-teacher', color: Colors.cyan   },
    { label: "Today's Fee",    value: stats.fee_today ? `Rs. ${Number(stats.fee_today).toLocaleString()}` : '—', icon: 'money-bill', color: Colors.gold },
    { label: 'Absent Today',   value: stats.absent_today    ?? '—',  icon: 'user-times',          color: Colors.red    },
    { label: 'Present Today',  value: stats.present_today   ?? '—',  icon: 'user-check',          color: Colors.purple },
    { label: 'Fee Pending',    value: stats.fee_pending     ?? '—',  icon: 'exclamation-circle',  color: '#F97316'     },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.green} />}>

        {/* Header */}
        <LinearGradient colors={['#161b22', '#0d1117']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Assalam o Alaikum 👋</Text>
            <Text style={styles.name}>{user?.full_name ?? user?.username ?? 'Admin'}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          <NotifBell count={unread} onPress={() => router.push('/notifications')} />
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} style={styles.statItem} />
          ))}
        </View>

        {/* Quick Actions */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionGrid}>
            {[
              { label: 'Add Student',  icon: 'user-plus',       color: Colors.green,  route: '/(admin)/students'   },
              { label: 'Collect Fee',  icon: 'money-bill',      color: Colors.gold,   route: '/(admin)/fee'        },
              { label: 'Attendance',   icon: 'clipboard-check', color: Colors.cyan,   route: '/(admin)/attendance' },
              { label: 'Staff',        icon: 'users',           color: Colors.purple, route: '/(admin)/more'       },
            ].map((a, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionBtn, { backgroundColor: a.color + '15', borderColor: a.color + '40' }]}
                onPress={() => router.push(a.route as any)}>
                <FontAwesome5 name={a.icon} size={18} color={a.color} />
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Recent Fee Collection */}
        {recent_fee.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Recent Fee Collection"
              action={{ label: 'View All', onPress: () => router.push('/(admin)/fee') }} />
            {recent_fee.slice(0, 5).map((item: any, i: number) => (
              <View key={i} style={[styles.listRow, i > 0 && styles.rowBorder]}>
                <View style={styles.listIcon}>
                  <FontAwesome5 name="money-bill" size={13} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.student_name ?? item.name}</Text>
                  <Text style={styles.listSub}>{item.class} · {item.payment_method} · {(item.paid_on ?? item.created_at ?? '').split('T')[0]}</Text>
                </View>
                <Text style={styles.listAmount}>Rs. {Number(item.amount_paid ?? item.amount).toLocaleString()}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Absent Today */}
        {recent_absent.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Absent Today"
              action={{ label: 'View All', onPress: () => router.push('/(admin)/attendance') }} />
            {recent_absent.slice(0, 5).map((item: any, i: number) => (
              <View key={i} style={[styles.listRow, i > 0 && styles.rowBorder]}>
                <View style={[styles.listIcon, { backgroundColor: Colors.red + '18' }]}>
                  <FontAwesome5 name="user-times" size={13} color={Colors.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.student_name ?? item.name}</Text>
                  <Text style={styles.listSub}>{item.class} {item.section} · Roll: {item.roll_no}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Notices & Announcements" />
            {announcements.slice(0, 3).map((ann: any, i: number) => (
              <View key={i} style={[styles.annRow, i > 0 && styles.rowBorder]}>
                <View style={[styles.annDot, { backgroundColor: Colors.cyan }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.annTitle}>{ann.title}</Text>
                  <Text style={styles.annBody} numberOfLines={2}>{ann.message}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 20 },
  greeting:  { color: Colors.textMuted, fontSize: Font.sm },
  name:      { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginTop: 2 },
  date:      { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: 10 },
  statItem:  { width: '47%' },
  actionGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1 },
  actionLabel:{ fontSize: Font.sm, fontWeight: '700' },
  listRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  listIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.gold + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listTitle: { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  listSub:   { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  listAmount:{ color: Colors.green, fontSize: Font.sm, fontWeight: '800' },
  annRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  annDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  annTitle:  { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  annBody:   { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
