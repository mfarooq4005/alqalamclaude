// ═══════════════════════════════════════════════════════════════
//  Student Dashboard — Real API (no mock data)
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
import { useMyAttendance, useMyFee, useMyResults, useServerNotifications } from '../../src/api/hooks';

export default function StudentDashboard() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const unread   = useNotificationStore((s) => s.unreadCount());

  const attQuery  = useMyAttendance();
  const feeQuery  = useMyFee();
  const resQuery  = useMyResults();
  const notifQuery = useServerNotifications();

  const isLoading = attQuery.isLoading || feeQuery.isLoading || resQuery.isLoading;
  const isError   = attQuery.isError && feeQuery.isError && resQuery.isError;

  const refetch = () => {
    attQuery.refetch();
    feeQuery.refetch();
    resQuery.refetch();
    notifQuery.refetch();
  };
  const isFetching = attQuery.isFetching || feeQuery.isFetching;

  if (isLoading) return <ScreenLoader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  // Parse attendance data
  const attData    = attQuery.data ?? {};
  const totalDays  = attData.total_days   ?? 0;
  const present    = attData.present      ?? 0;
  const absent     = attData.absent       ?? 0;
  const late       = attData.late         ?? 0;
  const attPct     = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

  // Parse fee data
  const feeData    = feeQuery.data ?? {};
  const feePending = feeData.pending_amount ?? feeData.current_status === 'pending';
  const feeAmount  = feeData.monthly_fee   ?? feeData.amount ?? 0;

  // Parse results data
  const results    = Array.isArray(resQuery.data) ? resQuery.data : (resQuery.data?.results ?? []);
  const lastExam   = results[0];
  const lastGrade  = lastExam?.grade ?? lastExam?.percentage ? `${Math.round(lastExam.percentage)}%` : '—';

  // Announcements from notifications
  const announcements = (notifQuery.data ?? [])
    .filter((n: any) => n.type === 'announcement' || n.type === 'general')
    .slice(0, 4);

  const STATS = [
    { label: 'Attendance',  value: `${attPct}%`,                    icon: 'clipboard-check', color: attPct >= 75 ? Colors.green : Colors.red  },
    { label: 'Last Grade',  value: lastGrade,                        icon: 'graduation-cap',  color: Colors.purple },
    { label: 'Fee Status',  value: feePending ? 'Pending' : 'Paid', icon: 'money-bill',      color: feePending ? Colors.gold : Colors.green   },
    { label: 'Class',       value: user?.class ?? '—',               icon: 'school',          color: Colors.cyan   },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.purple} />}>

        {/* Header */}
        <LinearGradient colors={['#1a1040', '#0d1117']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Assalam o Alaikum 👋</Text>
            <Text style={styles.name}>{user?.full_name ?? user?.username ?? 'Student'}</Text>
            <Text style={styles.meta}>{user?.class ?? ''} {user?.section ?? ''} · Roll: {user?.roll_no ?? '—'}</Text>
          </View>
          <NotifBell count={unread} onPress={() => router.push('/notifications')} />
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} style={styles.statItem} />
          ))}
        </View>

        {/* Attendance Progress */}
        {totalDays > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Attendance Summary" action={{ label: 'Details', onPress: () => router.push('/(student)/attendance') }} />
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{present + late} / {totalDays} days attended</Text>
              <Text style={[styles.progressPct, { color: attPct >= 75 ? Colors.green : Colors.red }]}>{attPct}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${attPct}%`, backgroundColor: attPct >= 75 ? Colors.green : Colors.red }]} />
            </View>
            {attPct < 75 && (
              <View style={styles.alertBox}>
                <FontAwesome5 name="exclamation-triangle" size={12} color={Colors.red} />
                <Text style={styles.alertText}>Attendance 75% se kam hai — class teacher se rabta karein</Text>
              </View>
            )}
            <View style={styles.attStats}>
              {[
                { label: 'Present', value: present, color: Colors.green },
                { label: 'Absent',  value: absent,  color: Colors.red   },
                { label: 'Late',    value: late,     color: Colors.gold  },
              ].map((s, i) => (
                <View key={i} style={styles.attStatItem}>
                  <Text style={[styles.attStatValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.attStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Recent Results */}
        {results.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Recent Results" action={{ label: 'All Results', onPress: () => router.push('/(student)/results') }} />
            {results.slice(0, 3).map((r: any, i: number) => (
              <View key={i} style={[styles.resultRow, i > 0 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultSubject}>{r.subject_name ?? r.subject}</Text>
                  <Text style={styles.resultExam}>{r.exam_title ?? r.exam}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.resultMarks}>{r.marks_obtained ?? r.marks}/{r.total_marks ?? r.total}</Text>
                  <Text style={[styles.resultGrade, { color: gradeColor(r.grade) }]}>{r.grade}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Fee Status */}
        {feeData.current_status !== undefined && (
          <TouchableOpacity onPress={() => router.push('/(student)/fee')} activeOpacity={0.85}>
            <LinearGradient
              colors={feePending ? [Colors.gold + '20', '#0d1117'] : [Colors.green + '18', '#0d1117']}
              style={[styles.feeBanner, { borderColor: (feePending ? Colors.gold : Colors.green) + '40' }]}>
              <FontAwesome5
                name={feePending ? 'exclamation-circle' : 'check-circle'}
                size={24}
                color={feePending ? Colors.gold : Colors.green}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.feeTitle, { color: feePending ? Colors.gold : Colors.green }]}>
                  {feePending ? 'Fee Pending!' : 'Fee Paid ✓'}
                </Text>
                <Text style={styles.feeSub}>
                  {feePending ? `Rs. ${Number(feeAmount).toLocaleString()} abhi due hai` : 'Is month ki fee jama ho gayi'}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color={Colors.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Announcements / Notices */}
        {announcements.length > 0 && (
          <Card style={{ marginHorizontal: Spacing.md }}>
            <SectionHeader title="Notices" />
            {announcements.map((ann: any, i: number) => (
              <View key={i} style={[styles.annRow, i > 0 && styles.rowBorder]}>
                <View style={styles.annDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.annTitle}>{ann.title}</Text>
                  <Text style={styles.annBody} numberOfLines={2}>{ann.body ?? ann.message}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A+': case 'A': return Colors.green;
    case 'B+': case 'B': return Colors.cyan;
    case 'C+': case 'C': return Colors.gold;
    default: return Colors.red;
  }
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 20 },
  greeting:      { color: Colors.textMuted, fontSize: Font.sm },
  name:          { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginTop: 2 },
  meta:          { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: 10 },
  statItem:      { width: '47%' },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { color: Colors.textMuted, fontSize: Font.sm },
  progressPct:   { fontSize: Font.lg, fontWeight: '900' },
  progressBar:   { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: 8, borderRadius: 4 },
  alertBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: Radius.md, padding: 10, marginBottom: 10 },
  alertText:     { color: Colors.red, fontSize: 11, flex: 1 },
  attStats:      { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  attStatItem:   { alignItems: 'center' },
  attStatValue:  { fontSize: Font.lg, fontWeight: '900' },
  attStatLabel:  { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  resultRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder:     { borderTopWidth: 1, borderTopColor: Colors.border },
  resultSubject: { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  resultExam:    { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  resultMarks:   { color: Colors.text, fontSize: Font.sm, fontWeight: '800' },
  resultGrade:   { fontSize: 11, fontWeight: '900', marginTop: 1 },
  feeBanner:     { marginHorizontal: Spacing.md, borderRadius: Radius.xl, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  feeTitle:      { fontSize: Font.md, fontWeight: '800' },
  feeSub:        { color: Colors.textMuted, fontSize: Font.sm, marginTop: 3 },
  annRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  annDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cyan, marginTop: 5 },
  annTitle:      { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  annBody:       { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
