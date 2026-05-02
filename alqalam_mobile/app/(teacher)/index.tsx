// ═══════════════════════════════════════════════════════════════
//  Teacher Dashboard — Real API (no mock data)
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
import { useMyTimetable, useStaffAttendanceToday, useServerNotifications } from '../../src/api/hooks';

// Subject color map
const SUBJ_COLORS: Record<string, string> = {
  Mathematics: Colors.cyan,   Physics: Colors.purple,  Chemistry: Colors.green,
  Biology: '#10B981',         English: Colors.gold,    Urdu: '#F97316',
  'Computer Science': Colors.cyan, History: Colors.purple, default: Colors.textMuted,
};

function subjectColor(name: string): string {
  return SUBJ_COLORS[name] ?? SUBJ_COLORS.default;
}

export default function TeacherDashboard() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const unread   = useNotificationStore((s) => s.unreadCount());

  const ttQuery    = useMyTimetable();
  const attQuery   = useStaffAttendanceToday();
  const notifQuery = useServerNotifications();

  const isLoading = ttQuery.isLoading;
  const isError   = ttQuery.isError;
  const isFetching = ttQuery.isFetching || attQuery.isFetching;

  const refetch = () => { ttQuery.refetch(); attQuery.refetch(); notifQuery.refetch(); };

  if (isLoading) return <ScreenLoader />;
  if (isError)   return <ErrorState onRetry={ttQuery.refetch} />;

  // Today's timetable
  const today        = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const timetable    = ttQuery.data ?? {};
  const todayPeriods = (timetable[today] ?? timetable.today ?? []) as any[];

  // My attendance today
  const myAtt    = attQuery.data ?? {};
  const checkedIn  = myAtt.checked_in  ?? !!myAtt.check_in_time;
  const checkInTime = myAtt.check_in_time  ?? null;

  // Notices
  const notices = (notifQuery.data ?? [])
    .filter((n: any) => n.type === 'announcement')
    .slice(0, 3);

  // Current period
  const now          = new Date();
  const nowMins      = now.getHours() * 60 + now.getMinutes();
  const currentPeriod = todayPeriods.find((p: any) => {
    const [sh, sm] = (p.start_time ?? '00:00').split(':').map(Number);
    const [eh, em] = (p.end_time   ?? '00:00').split(':').map(Number);
    return nowMins >= sh * 60 + sm && nowMins <= eh * 60 + em;
  });

  const STATS = [
    { label: "Today's Classes", value: todayPeriods.length,             icon: 'chalkboard-teacher', color: Colors.cyan   },
    { label: 'Check-in',        value: checkedIn ? 'Done ✓' : 'Pending', icon: 'clock',             color: checkedIn ? Colors.green : Colors.gold },
    { label: 'Current',         value: currentPeriod?.subject_name ?? 'Free', icon: 'book-open',    color: Colors.purple },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.cyan} />}>

        {/* Header */}
        <LinearGradient colors={['#0d1a2a', '#0d1117']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Assalam o Alaikum 👋</Text>
            <Text style={styles.name}>{user?.full_name ?? user?.username ?? 'Teacher'}</Text>
            <Text style={styles.meta}>{user?.subject ?? 'Teacher'} · {today}</Text>
          </View>
          <NotifBell count={unread} onPress={() => router.push('/notifications')} />
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} style={{ flex: 1 }} />
          ))}
        </View>

        {/* Today's Schedule */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title={`${today}'s Schedule`} action={{ label: 'Full Timetable', onPress: () => router.push('/(teacher)/timetable') }} />
          {todayPeriods.length === 0 ? (
            <View style={styles.freeDay}>
              <FontAwesome5 name="coffee" size={24} color={Colors.gold} />
              <Text style={styles.freeDayText}>Aaj koi class schedule nahi</Text>
            </View>
          ) : (
            todayPeriods.map((p: any, i: number) => {
              const isCurrent = currentPeriod?.id === p.id || currentPeriod?.period_no === p.period_no;
              const color     = subjectColor(p.subject_name ?? '');
              return (
                <View key={i} style={[styles.periodRow, i > 0 && styles.rowBorder, isCurrent && styles.periodCurrent]}>
                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowText}>NOW</Text>
                    </View>
                  )}
                  <View style={[styles.periodTimeCol, isCurrent && { borderColor: color }]}>
                    <Text style={[styles.periodStart, isCurrent && { color }]}>{p.start_time ?? '—'}</Text>
                    <Text style={styles.periodEnd}>{p.end_time ?? '—'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.periodSubject}>{p.subject_name ?? p.subject}</Text>
                    <Text style={styles.periodMeta}>{p.class_name ?? p.class} {p.section} · Room {p.room ?? '—'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(teacher)/attendance')}
                    style={[styles.attBtn, isCurrent && { backgroundColor: color + '25', borderColor: color + '50' }]}>
                    <FontAwesome5 name="clipboard-check" size={12} color={isCurrent ? color : Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionRow}>
            {[
              { label: 'Attendance', icon: 'clipboard-check', color: Colors.green,  route: '/(teacher)/attendance' },
              { label: 'Enter Marks', icon: 'pencil-alt',    color: Colors.purple, route: '/(teacher)/results'    },
              { label: 'Timetable',  icon: 'calendar-alt',   color: Colors.cyan,   route: '/(teacher)/timetable'  },
              { label: 'Profile',    icon: 'user',           color: Colors.gold,   route: '/(teacher)/profile'    },
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

        {/* Notices */}
        {notices.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Notices" />
            {notices.map((n: any, i: number) => (
              <View key={i} style={[styles.noticeRow, i > 0 && styles.rowBorder]}>
                <View style={styles.noticeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle}>{n.title}</Text>
                  <Text style={styles.noticeBody} numberOfLines={2}>{n.body ?? n.message}</Text>
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
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 20 },
  greeting:       { color: Colors.textMuted, fontSize: Font.sm },
  name:           { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginTop: 2 },
  meta:           { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  statsRow:       { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: 8 },
  freeDay:        { alignItems: 'center', paddingVertical: 24, gap: 10 },
  freeDayText:    { color: Colors.textMuted, fontSize: Font.sm },
  periodRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, position: 'relative' },
  rowBorder:      { borderTopWidth: 1, borderTopColor: Colors.border },
  periodCurrent:  { backgroundColor: Colors.bg3, borderRadius: Radius.md, paddingHorizontal: 8 },
  nowBadge:       { position: 'absolute', top: 8, right: 40, backgroundColor: Colors.green, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nowText:        { color: '#fff', fontSize: 9, fontWeight: '900' },
  periodTimeCol:  { width: 50, borderRightWidth: 2, borderColor: Colors.border, paddingRight: 8, alignItems: 'flex-end' },
  periodStart:    { color: Colors.text, fontSize: 12, fontWeight: '800' },
  periodEnd:      { color: Colors.textMuted, fontSize: 10 },
  periodSubject:  { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  periodMeta:     { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  attBtn:         { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  actionRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:      { flex: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1 },
  actionLabel:    { fontSize: Font.sm, fontWeight: '700' },
  noticeRow:      { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  noticeDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cyan, marginTop: 5 },
  noticeTitle:    { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  noticeBody:     { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
