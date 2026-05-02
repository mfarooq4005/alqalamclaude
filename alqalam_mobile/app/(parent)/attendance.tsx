// ═══════════════════════════════════════════════════════
//  Parent → Children's Attendance
//  Quick attendance overview for all children
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, StatCard } from '../../src/components';

const CHILDREN_ATT = [
  {
    id: 1, name: 'Muhammad Bilal', class: 'XI-A', gender: 'male',
    present: 82, absent: 3, late: 2, leave: 0, total: 87,
    recent: [
      { date: '2026-05-01', status: 'present' }, { date: '2026-04-30', status: 'present' },
      { date: '2026-04-29', status: 'present' }, { date: '2026-04-28', status: 'late'    },
      { date: '2026-04-27', status: 'weekend'  }, { date: '2026-04-26', status: 'weekend' },
      { date: '2026-04-25', status: 'present' },
    ],
  },
  {
    id: 2, name: 'Zara Saeed', class: 'VIII-B', gender: 'female',
    present: 75, absent: 10, late: 2, leave: 0, total: 87,
    recent: [
      { date: '2026-05-01', status: 'present' }, { date: '2026-04-30', status: 'absent'  },
      { date: '2026-04-29', status: 'present' }, { date: '2026-04-28', status: 'absent'  },
      { date: '2026-04-27', status: 'weekend'  }, { date: '2026-04-26', status: 'weekend' },
      { date: '2026-04-25', status: 'present' },
    ],
  },
];

const statusColor: Record<string, string> = {
  present: Colors.green, absent: Colors.red, late: Colors.gold,
  leave: Colors.purple,  weekend: Colors.bg4,
};
const statusLabel: Record<string, string> = {
  present: 'P', absent: 'A', late: 'L', leave: 'LV', weekend: '',
};

export default function ParentAttendance() {
  const [selected, setSelected] = useState(CHILDREN_ATT[0]);

  const attPct  = Math.round(((selected.present + selected.late) / selected.total) * 100);
  const childColor = selected.gender === 'male' ? Colors.cyan : Colors.purple;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
      </View>

      {/* Child Selector */}
      <View style={styles.selector}>
        {CHILDREN_ATT.map(c => (
          <TouchableOpacity key={c.id}
            onPress={() => setSelected(c)}
            style={[styles.selectorBtn, selected.id === c.id && { borderColor: c.gender === 'male' ? Colors.cyan : Colors.purple, backgroundColor: (c.gender === 'male' ? Colors.cyan : Colors.purple) + '15' }]}>
            <Text style={[styles.selectorName, selected.id === c.id && { color: Colors.text }]}>{c.name.split(' ')[0]}</Text>
            <Text style={styles.selectorClass}>{c.class}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Stats Row */}
        <View style={styles.statRow}>
          <StatCard label="Present" value={selected.present} icon="check-circle" color={Colors.green}  style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <StatCard label="Absent"  value={selected.absent}  icon="times-circle" color={Colors.red}    style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <StatCard label="Late"    value={selected.late}    icon="clock"        color={Colors.gold}   style={{ flex: 1 }} />
        </View>

        {/* Progress Card */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{selected.name}</Text>
            <Text style={[styles.progressPct, { color: attPct >= 75 ? Colors.green : Colors.red }]}>{attPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${attPct}%`, backgroundColor: attPct >= 75 ? Colors.green : Colors.red }]} />
          </View>
          <Text style={styles.progressSub}>{selected.present + selected.late} attended / {selected.total} school days</Text>
          {attPct < 75 && (
            <View style={styles.alertBox}>
              <FontAwesome5 name="exclamation-triangle" size={12} color={Colors.red} />
              <Text style={styles.alertText}>Attendance below 75% — please contact class teacher</Text>
            </View>
          )}
        </Card>

        {/* Recent 7 Days */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Last 7 Days" />
          <View style={styles.recentRow}>
            {selected.recent.map((d, i) => {
              const color  = statusColor[d.status];
              const label  = statusLabel[d.status];
              const dayStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
              const dateNum= d.date.split('-')[2];
              return (
                <View key={i} style={styles.dayCell}>
                  <Text style={styles.dayName}>{dayStr}</Text>
                  <View style={[styles.dayBubble, { backgroundColor: color + (d.status === 'weekend' ? '25' : '22') }]}>
                    <Text style={[styles.dayStatus, { color: d.status === 'weekend' ? Colors.textMuted : color }]}>
                      {label || dateNum}
                    </Text>
                  </View>
                  <Text style={styles.dayDate}>{dateNum}</Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {[['present', 'Present'], ['absent', 'Absent'], ['late', 'Late']].map(([k, v]) => (
              <View key={k} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: statusColor[k] }]} />
                <Text style={styles.legendText}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Monthly Summary for both children */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="All Children Summary" />
          {CHILDREN_ATT.map((c, i) => {
            const pct = Math.round(((c.present + c.late) / c.total) * 100);
            const cc  = c.gender === 'male' ? Colors.cyan : Colors.purple;
            return (
              <View key={c.id} style={[styles.summaryRow, i > 0 && styles.rowBorder]}>
                <View style={[styles.summaryAvatar, { backgroundColor: cc + '18' }]}>
                  <FontAwesome5 name="user-graduate" size={14} color={cc} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.summaryName}>{c.name}</Text>
                  <Text style={styles.summaryClass}>{c.class} · {c.present}P / {c.absent}A / {c.late}L</Text>
                  <View style={styles.summaryBar}>
                    <View style={[styles.summaryBarFill, { width: `${pct}%`, backgroundColor: pct >= 75 ? Colors.green : Colors.red }]} />
                  </View>
                </View>
                <Text style={[styles.summaryPct, { color: pct >= 75 ? Colors.green : Colors.red }]}>{pct}%</Text>
              </View>
            );
          })}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  header:          { paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:           { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  selector:        { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 10, marginBottom: 8 },
  selectorBtn:     { flex: 1, padding: 12, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg2, alignItems: 'center' },
  selectorName:    { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  selectorClass:   { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statRow:         { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle:   { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  progressPct:     { fontSize: Font.lg, fontWeight: '900' },
  progressBar:     { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:    { height: 8, borderRadius: 4 },
  progressSub:     { color: Colors.textMuted, fontSize: Font.sm },
  alertBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: Radius.md, padding: 10, marginTop: 10 },
  alertText:       { color: Colors.red, fontSize: 11, flex: 1 },
  recentRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayCell:         { alignItems: 'center', gap: 4 },
  dayName:         { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  dayBubble:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayStatus:       { fontSize: 11, fontWeight: '900' },
  dayDate:         { color: Colors.textMuted, fontSize: 9 },
  legend:          { flexDirection: 'row', gap: 16 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:       { width: 7, height: 7, borderRadius: 3.5 },
  legendText:      { color: Colors.textMuted, fontSize: 11 },
  summaryRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder:       { borderTopWidth: 1, borderTopColor: Colors.border },
  summaryAvatar:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryName:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  summaryClass:    { color: Colors.textMuted, fontSize: 11, marginTop: 1, marginBottom: 5 },
  summaryBar:      { height: 4, backgroundColor: Colors.bg3, borderRadius: 2, overflow: 'hidden' },
  summaryBarFill:  { height: 4, borderRadius: 2 },
  summaryPct:      { fontSize: Font.md, fontWeight: '900', marginLeft: 12 },
});
