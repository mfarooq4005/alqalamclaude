// ═══════════════════════════════════════════════════════
//  Student → My Attendance
//  Monthly view with day-by-day status calendar
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, StatCard } from '../../src/components';

// ── Mock attendance calendar data (May 2026) ──────────
const MOCK_DAYS: Record<number, 'present' | 'absent' | 'late' | 'holiday' | 'weekend'> = {
  1: 'present', 2: 'present', 3: 'weekend',  4: 'holiday',
  5: 'present', 6: 'present', 7: 'present',  8: 'present',  9: 'present', 10: 'weekend',
  11: 'weekend', 12: 'present', 13: 'present', 14: 'absent', 15: 'present', 16: 'late', 17: 'weekend',
  18: 'weekend', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 23: 'present', 24: 'weekend',
  25: 'weekend', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 30: 'present', 31: 'weekend',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLOR: Record<string, string> = {
  present: Colors.green,
  absent:  Colors.red,
  late:    Colors.gold,
  holiday: Colors.purple,
  weekend: Colors.bg4,
};
const STATUS_LABEL: Record<string, string> = {
  present: 'P', absent: 'A', late: 'L', holiday: 'H', weekend: '',
};

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Monthly stats ──────────────────────────────────────
const stats = Object.values(MOCK_DAYS).reduce((acc, s) => {
  acc[s] = (acc[s] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const schoolDays = stats.present + stats.absent + stats.late;
const attPct = Math.round(((stats.present + stats.late) / schoolDays) * 100);

export default function StudentAttendance() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4); // May = index 4

  // Build calendar grid (May 2026 starts on Friday = day index 5)
  const firstDayOfWeek = 4; // May 1, 2026 is Thursday (0=Sun, 4=Thu)
  const daysInMonth    = 31;

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Attendance</Text>
        <View style={styles.pctBadge}>
          <Text style={[styles.pctText, { color: attPct >= 75 ? Colors.green : Colors.red }]}>{attPct}%</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Month Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity key={m}
              onPress={() => setSelectedMonth(i)}
              style={[styles.monthChip, selectedMonth === i && styles.monthChipActive]}>
              <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statRow}>
          <StatCard label="Present" value={stats.present || 0} icon="check-circle" color={Colors.green}  style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <StatCard label="Absent"  value={stats.absent  || 0} icon="times-circle" color={Colors.red}    style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <StatCard label="Late"    value={stats.late    || 0} icon="clock"        color={Colors.gold}   style={{ flex: 1 }} />
        </View>

        {/* Progress */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Attendance Rate</Text>
            <Text style={[styles.progressPct, { color: attPct >= 75 ? Colors.green : Colors.red }]}>{attPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${attPct}%`, backgroundColor: attPct >= 75 ? Colors.green : Colors.red }]} />
          </View>
          <Text style={styles.progressSub}>{stats.present + (stats.late || 0)} attended out of {schoolDays} school days</Text>
          {attPct < 75 && (
            <View style={styles.alertBox}>
              <FontAwesome5 name="exclamation-triangle" size={12} color={Colors.red} />
              <Text style={styles.alertText}>Minimum required attendance is 75%</Text>
            </View>
          )}
        </Card>

        {/* Calendar */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <Text style={styles.calTitle}>{MONTHS[selectedMonth]} {selectedYear}</Text>

          {/* Day headers */}
          <View style={styles.calHeaderRow}>
            {DAY_HEADERS.map(d => (
              <View key={d} style={styles.calHeaderCell}>
                <Text style={styles.calHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {Array.from({ length: calendarCells.length / 7 }, (_, week) => (
            <View key={week} style={styles.calRow}>
              {calendarCells.slice(week * 7, week * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={styles.calCell} />;
                const status = MOCK_DAYS[day];
                const color  = STATUS_COLOR[status] || Colors.bg4;
                const label  = STATUS_LABEL[status];
                return (
                  <View key={col} style={styles.calCell}>
                    <View style={[styles.calDayWrap, { backgroundColor: color + (status === 'weekend' ? '30' : '25') }]}>
                      <Text style={[styles.calDayNum, { color: status === 'weekend' ? Colors.textMuted : Colors.text }]}>{day}</Text>
                      {label ? <Text style={[styles.calDayStatus, { color }]}>{label}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries({ present: 'Present', absent: 'Absent', late: 'Late', holiday: 'Holiday' }).map(([k, v]) => (
              <View key={k} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLOR[k] }]} />
                <Text style={styles.legendText}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:            { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  pctBadge:         { backgroundColor: Colors.bg2, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  pctText:          { fontSize: Font.md, fontWeight: '900' },
  monthScroll:      { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 8 },
  monthChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  monthChipActive:  { backgroundColor: Colors.purple, borderColor: Colors.purple },
  monthText:        { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  monthTextActive:  { color: '#fff' },
  statRow:          { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:    { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  progressPct:      { fontSize: Font.sm, fontWeight: '900' },
  progressBar:      { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:     { height: 8, borderRadius: 4 },
  progressSub:      { color: Colors.textMuted, fontSize: 11 },
  alertBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: Radius.md, padding: 10, marginTop: 10 },
  alertText:        { color: Colors.red, fontSize: 11 },
  calTitle:         { color: Colors.text, fontSize: Font.md, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  calHeaderRow:     { flexDirection: 'row', marginBottom: 6 },
  calHeaderCell:    { flex: 1, alignItems: 'center' },
  calHeaderText:    { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  calRow:           { flexDirection: 'row', marginBottom: 4 },
  calCell:          { flex: 1, alignItems: 'center' },
  calDayWrap:       { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calDayNum:        { fontSize: 12, fontWeight: '700' },
  calDayStatus:     { fontSize: 8, fontWeight: '800', marginTop: -2 },
  legend:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:        { width: 8, height: 8, borderRadius: 4 },
  legendText:       { color: Colors.textMuted, fontSize: 11 },
});
