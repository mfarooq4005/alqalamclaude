// ═══════════════════════════════════════════════════════
//  Admin → Attendance
//  Staff live check-in feed + Student attendance by class
// ═══════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, SectionHeader, StatCard, EmptyState, StatusDot } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { AttendanceAPI } from '../../src/api';

// ── Mock ───────────────────────────────────────────────
const MOCK_STAFF_ATT = [
  { id: 1,  name: 'Mr. Ahmed Khan',      role: 'Principal',   status: 'present', check_in: '07:45', check_out: null,  device: 'mobile' },
  { id: 2,  name: 'Ms. Fatima Malik',    role: 'Teacher',     status: 'present', check_in: '07:52', check_out: null,  device: 'tablet' },
  { id: 3,  name: 'Mr. Usman Ali',       role: 'Teacher',     status: 'late',    check_in: '08:22', check_out: null,  device: 'mobile' },
  { id: 4,  name: 'Ms. Sara Qureshi',    role: 'Accountant',  status: 'absent',  check_in: null,    check_out: null,  device: null     },
  { id: 5,  name: 'Mr. Hassan Raza',     role: 'Teacher',     status: 'present', check_in: '08:01', check_out: null,  device: 'web'    },
  { id: 6,  name: 'Ms. Huma Shafiq',     role: 'Teacher',     status: 'present', check_in: '07:58', check_out: null,  device: 'mobile' },
  { id: 7,  name: 'Mr. Bilal Khan',      role: 'Librarian',   status: 'leave',   check_in: null,    check_out: null,  device: null     },
  { id: 8,  name: 'Ms. Asma Iqbal',      role: 'Teacher',     status: 'present', check_in: '08:05', check_out: null,  device: 'mobile' },
];

const MOCK_CLASS_ATT = [
  { class: 'IX-A',  total: 38, present: 35, absent: 2, late: 1 },
  { class: 'IX-B',  total: 36, present: 30, absent: 5, late: 1 },
  { class: 'X-A',   total: 40, present: 38, absent: 1, late: 1 },
  { class: 'X-B',   total: 39, present: 36, absent: 3, late: 0 },
  { class: 'XI-A',  total: 35, present: 32, absent: 2, late: 1 },
  { class: 'XI-B',  total: 34, present: 34, absent: 0, late: 0 },
  { class: 'XII-A', total: 32, present: 28, absent: 4, late: 0 },
  { class: 'XII-B', total: 31, present: 27, absent: 3, late: 1 },
];

const statusColor: Record<string, string> = {
  present: Colors.green,
  late:    Colors.gold,
  absent:  Colors.red,
  leave:   Colors.purple,
};

const deviceIcon: Record<string, string> = {
  mobile: 'mobile-alt',
  tablet: 'tablet-alt',
  web:    'desktop',
};

// ── Tabs ───────────────────────────────────────────────
const TABS = ['Staff', 'Students'];

export default function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState('Staff');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: staffAtt = MOCK_STAFF_ATT, refetch: refetchStaff } = useQuery({
    queryKey: ['att-staff-all'],
    queryFn: async () => {
      try { return (await AttendanceAPI.getStaffToday()).data; }
      catch { return MOCK_STAFF_ATT; }
    },
    refetchInterval: 30 * 1000,
  });

  const { data: classAtt = MOCK_CLASS_ATT, refetch: refetchClass } = useQuery({
    queryKey: ['att-class-summary'],
    queryFn: async () => {
      try { return (await AttendanceAPI.getClassSummary()).data; }
      catch { return MOCK_CLASS_ATT; }
    },
    refetchInterval: 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStaff(), refetchClass()]);
    setRefreshing(false);
  }, []);

  // Staff summary
  const staffSummary = staffAtt.reduce((acc: any, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  // Student totals
  const totalPresent = classAtt.reduce((sum: number, c: any) => sum + c.present, 0);
  const totalAbsent  = classAtt.reduce((sum: number, c: any) => sum + c.absent, 0);
  const totalLate    = classAtt.reduce((sum: number, c: any) => sum + c.late, 0);
  const totalAll     = classAtt.reduce((sum: number, c: any) => sum + c.total, 0);

  const filteredStaff = filterStatus
    ? staffAtt.filter((s: any) => s.status === filterStatus)
    : staffAtt;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <View style={styles.dateBadge}>
          <FontAwesome5 name="calendar-day" size={11} color={Colors.gold} />
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        contentContainerStyle={{ paddingBottom: 24 }}>

        {activeTab === 'Staff' ? (
          <>
            {/* Staff Stats */}
            <View style={styles.statRow}>
              <StatCard label="Present" value={staffSummary.present || 0} icon="check-circle" color={Colors.green} style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Late"    value={staffSummary.late    || 0} icon="clock"        color={Colors.gold}  style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Absent"  value={staffSummary.absent  || 0} icon="times-circle" color={Colors.red}   style={{ flex: 1 }} />
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {[null, 'present', 'late', 'absent', 'leave'].map(s => (
                <TouchableOpacity key={String(s)}
                  onPress={() => setFilterStatus(s)}
                  style={[styles.chip, filterStatus === s && styles.chipActive, s && { borderColor: statusColor[s] + '60' }]}>
                  {s && <View style={[styles.chipDot, { backgroundColor: statusColor[s] }]} />}
                  <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Staff List */}
            <Card style={{ marginHorizontal: Spacing.md }}>
              {filteredStaff.map((s: any, i: number) => (
                <View key={s.id} style={[styles.staffRow, i < filteredStaff.length - 1 && styles.rowBorder]}>
                  <View style={[styles.avatar, { backgroundColor: statusColor[s.status] + '18' }]}>
                    <FontAwesome5 name="user-tie" size={15} color={statusColor[s.status]} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.staffName}>{s.name}</Text>
                    <Text style={styles.staffRole}>{s.role}</Text>
                    {s.check_in && (
                      <View style={styles.checkRow}>
                        <FontAwesome5 name="sign-in-alt" size={10} color={Colors.green} />
                        <Text style={styles.checkText}>{s.check_in}</Text>
                        {s.check_out && (
                          <>
                            <FontAwesome5 name="sign-out-alt" size={10} color={Colors.red} style={{ marginLeft: 8 }} />
                            <Text style={styles.checkText}>{s.check_out}</Text>
                          </>
                        )}
                        {s.device && (
                          <FontAwesome5 name={deviceIcon[s.device] || 'mobile-alt'} size={10} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                        )}
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor[s.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor[s.status] }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <>
            {/* Student Summary Stats */}
            <View style={styles.statRow}>
              <StatCard label="Present" value={totalPresent} icon="check-circle" color={Colors.green} style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Late"    value={totalLate}    icon="clock"        color={Colors.gold}  style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Absent"  value={totalAbsent}  icon="times-circle" color={Colors.red}   style={{ flex: 1 }} />
            </View>

            {/* Overall Progress */}
            <Card style={{ marginHorizontal: Spacing.md }}>
              <Text style={styles.overallPct}>
                {Math.round((totalPresent / totalAll) * 100)}%
                <Text style={{ color: Colors.textMuted, fontSize: Font.sm, fontWeight: '400' }}> overall present</Text>
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round((totalPresent / totalAll) * 100)}%`, backgroundColor: Colors.green }]} />
              </View>
            </Card>

            {/* Class-wise breakdown */}
            <Card style={{ marginHorizontal: Spacing.md }}>
              <SectionHeader title="Class-wise Summary" />
              {classAtt.map((c: any, i: number) => {
                const pct = Math.round((c.present / c.total) * 100);
                return (
                  <View key={c.class} style={[styles.classRow, i < classAtt.length - 1 && styles.rowBorder]}>
                    <Text style={styles.className}>{c.class}</Text>
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <View style={styles.classBarBg}>
                        <View style={[styles.classBarFill, {
                          width: `${pct}%`,
                          backgroundColor: pct >= 90 ? Colors.green : pct >= 75 ? Colors.gold : Colors.red,
                        }]} />
                      </View>
                    </View>
                    <Text style={styles.classPct}>{pct}%</Text>
                    <Text style={styles.classCount}>{c.present}/{c.total}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:        { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  dateBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bg2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  dateText:     { color: Colors.gold, fontSize: Font.sm, fontWeight: '700' },
  tabs:         { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabActive:    { backgroundColor: Colors.gold },
  tabText:      { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  tabTextActive:{ color: Colors.bg },
  statRow:      { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: 12 },
  chipScroll:   { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 8 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  chipActive:   { backgroundColor: Colors.bg3 },
  chipDot:      { width: 7, height: 7, borderRadius: 3.5 },
  chipText:     { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.text },
  staffRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  staffName:    { color: Colors.text, fontSize: Font.sm, fontWeight: '600' },
  staffRole:    { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  checkText:    { color: Colors.textMuted, fontSize: 11 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText:   { fontSize: 11, fontWeight: '700' },
  overallPct:   { color: Colors.green, fontSize: Font['2xl'], fontWeight: '800', marginBottom: 8 },
  progressBar:  { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  classRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  className:    { color: Colors.text, fontSize: Font.sm, fontWeight: '700', width: 52 },
  classBarBg:   { height: 6, backgroundColor: Colors.bg3, borderRadius: 3, overflow: 'hidden' },
  classBarFill: { height: 6, borderRadius: 3 },
  classPct:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700', width: 36, textAlign: 'right' },
  classCount:   { color: Colors.textMuted, fontSize: 11, width: 44, textAlign: 'right' },
});
