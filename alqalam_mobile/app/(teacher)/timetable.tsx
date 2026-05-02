// ═══════════════════════════════════════════════════════
//  Teacher → Timetable
//  Full weekly schedule view
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIMETABLE: Record<string, { period: number; subject: string; class: string; time: string; room: string }[]> = {
  Mon: [
    { period: 1, subject: 'Mathematics', class: 'IX-A',  time: '08:00-08:45', room: 'R-101' },
    { period: 2, subject: 'Mathematics', class: 'X-B',   time: '08:45-09:30', room: 'R-102' },
    { period: 3, subject: 'Statistics',  class: 'XI-A',  time: '09:45-10:30', room: 'R-103' },
    { period: 5, subject: 'Mathematics', class: 'IX-B',  time: '11:30-12:15', room: 'R-101' },
  ],
  Tue: [
    { period: 1, subject: 'Statistics',  class: 'XII-A', time: '08:00-08:45', room: 'R-104' },
    { period: 3, subject: 'Mathematics', class: 'X-A',   time: '09:45-10:30', room: 'R-101' },
    { period: 4, subject: 'Mathematics', class: 'IX-A',  time: '10:30-11:15', room: 'R-101' },
    { period: 6, subject: 'Statistics',  class: 'XI-A',  time: '12:15-01:00', room: 'R-103' },
  ],
  Wed: [
    { period: 2, subject: 'Mathematics', class: 'IX-B',  time: '08:45-09:30', room: 'R-101' },
    { period: 3, subject: 'Mathematics', class: 'X-B',   time: '09:45-10:30', room: 'R-102' },
    { period: 5, subject: 'Statistics',  class: 'XII-A', time: '11:30-12:15', room: 'R-104' },
  ],
  Thu: [
    { period: 1, subject: 'Mathematics', class: 'X-A',   time: '08:00-08:45', room: 'R-101' },
    { period: 2, subject: 'Statistics',  class: 'XI-A',  time: '08:45-09:30', room: 'R-103' },
    { period: 4, subject: 'Mathematics', class: 'IX-A',  time: '10:30-11:15', room: 'R-101' },
    { period: 5, subject: 'Mathematics', class: 'IX-B',  time: '11:30-12:15', room: 'R-101' },
  ],
  Fri: [
    { period: 2, subject: 'Statistics',  class: 'XII-A', time: '08:45-09:30', room: 'R-104' },
    { period: 3, subject: 'Mathematics', class: 'X-A',   time: '09:45-10:30', room: 'R-101' },
    { period: 4, subject: 'Statistics',  class: 'XI-A',  time: '10:30-11:15', room: 'R-103' },
  ],
  Sat: [
    { period: 1, subject: 'Mathematics', class: 'X-B',   time: '08:00-08:45', room: 'R-102' },
    { period: 2, subject: 'Mathematics', class: 'IX-A',  time: '08:45-09:30', room: 'R-101' },
  ],
};

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': Colors.cyan,
  'Statistics':  Colors.purple,
};

export default function TeacherTimetable() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(today) ? today : 'Mon');

  const periods = TIMETABLE[selectedDay] || [];
  const weeklyTotal = Object.values(TIMETABLE).reduce((sum, d) => sum + d.length, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Timetable</Text>
        <View style={styles.statPill}>
          <Text style={styles.statPillText}>{weeklyTotal} periods/week</Text>
        </View>
      </View>

      {/* Day Selector */}
      <View style={styles.dayRow}>
        {DAYS.map(d => (
          <TouchableOpacity key={d}
            onPress={() => setSelectedDay(d)}
            style={[styles.dayBtn, selectedDay === d && styles.dayBtnActive, d === today && styles.dayBtnToday]}>
            <Text style={[styles.dayText, selectedDay === d && styles.dayTextActive]}>{d}</Text>
            {d === today && <View style={styles.todayDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Day Summary */}
      <View style={styles.summaryRow}>
        <FontAwesome5 name="chalkboard" size={12} color={Colors.textMuted} />
        <Text style={styles.summaryText}>
          {periods.length > 0 ? `${periods.length} periods on ${selectedDay}` : `No classes on ${selectedDay}`}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 24 }}>
        {periods.length === 0 ? (
          <View style={styles.freeDay}>
            <FontAwesome5 name="coffee" size={36} color={Colors.textMuted} />
            <Text style={styles.freeDayTitle}>Free Day</Text>
            <Text style={styles.freeDayText}>No classes scheduled for {selectedDay}</Text>
          </View>
        ) : (
          periods.map((p, i) => {
            const color = SUBJECT_COLORS[p.subject] || Colors.gold;
            return (
              <View key={i} style={[styles.card, { borderLeftColor: color }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.periodCircle, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.periodNum, { color }]}>{p.period}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.subject}>{p.subject}</Text>
                    <Text style={[styles.class, { color }]}>Class {p.class}</Text>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="clock" size={11} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="door-open" size={11} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.room}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.metaBadgeText, { color }]}>Period {p.period}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:         { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  statPill:      { backgroundColor: Colors.cyan + '18', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cyan + '40' },
  statPillText:  { color: Colors.cyan, fontSize: 11, fontWeight: '700' },
  dayRow:        { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 8, marginBottom: 10 },
  dayBtn:        { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  dayBtnActive:  { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  dayBtnToday:   { borderColor: Colors.cyan + '80' },
  dayText:       { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  dayTextActive: { color: Colors.bg },
  todayDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.cyan, marginTop: 3 },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, marginBottom: 12 },
  summaryText:   { color: Colors.textMuted, fontSize: Font.sm },
  freeDay:       { alignItems: 'center', paddingTop: 60, gap: 12 },
  freeDayTitle:  { color: Colors.textMuted, fontSize: Font.xl, fontWeight: '800' },
  freeDayText:   { color: Colors.textMuted, fontSize: Font.sm },
  card:          { backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4 },
  cardTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  periodCircle:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  periodNum:     { fontSize: Font.xl, fontWeight: '900' },
  subject:       { color: Colors.text, fontSize: Font.md, fontWeight: '800' },
  class:         { fontSize: Font.sm, fontWeight: '600', marginTop: 2 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:      { color: Colors.textMuted, fontSize: Font.sm },
  metaBadge:     { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  metaBadgeText: { fontSize: 11, fontWeight: '700' },
});
