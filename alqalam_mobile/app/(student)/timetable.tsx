// ═══════════════════════════════════════════════════════
//  Student → My Timetable
//  Class XI-A weekly schedule
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card } from '../../src/components';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CLASS_TIMETABLE: Record<string, { period: number; subject: string; teacher: string; time: string; room: string }[]> = {
  Mon: [
    { period: 1, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '08:00-08:45', room: 'R-101' },
    { period: 2, subject: 'Physics',     teacher: 'Mr. Hassan Raza',    time: '08:45-09:30', room: 'Lab-1' },
    { period: 3, subject: 'Chemistry',   teacher: 'Ms. Huma Shafiq',    time: '09:45-10:30', room: 'Lab-2' },
    { period: 4, subject: 'English',     teacher: 'Mr. Bilal Khan',     time: '10:30-11:15', room: 'R-105' },
    { period: 5, subject: 'Urdu',        teacher: 'Ms. Asma Iqbal',     time: '11:30-12:15', room: 'R-103' },
    { period: 6, subject: 'Islamiat',    teacher: 'Mr. Ahmed Khan',     time: '12:15-01:00', room: 'R-106' },
  ],
  Tue: [
    { period: 1, subject: 'Physics',     teacher: 'Mr. Hassan Raza',    time: '08:00-08:45', room: 'Lab-1' },
    { period: 2, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '08:45-09:30', room: 'R-101' },
    { period: 3, subject: 'English',     teacher: 'Mr. Bilal Khan',     time: '09:45-10:30', room: 'R-105' },
    { period: 4, subject: 'Chemistry',   teacher: 'Ms. Huma Shafiq',    time: '10:30-11:15', room: 'Lab-2' },
    { period: 5, subject: 'Statistics',  teacher: 'Ms. Fatima Malik',   time: '11:30-12:15', room: 'R-101' },
    { period: 6, subject: 'Urdu',        teacher: 'Ms. Asma Iqbal',     time: '12:15-01:00', room: 'R-103' },
  ],
  Wed: [
    { period: 1, subject: 'Chemistry',   teacher: 'Ms. Huma Shafiq',    time: '08:00-08:45', room: 'Lab-2' },
    { period: 2, subject: 'Islamiat',    teacher: 'Mr. Ahmed Khan',     time: '08:45-09:30', room: 'R-106' },
    { period: 3, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '09:45-10:30', room: 'R-101' },
    { period: 4, subject: 'Physics',     teacher: 'Mr. Hassan Raza',    time: '10:30-11:15', room: 'Lab-1' },
    { period: 5, subject: 'English',     teacher: 'Mr. Bilal Khan',     time: '11:30-12:15', room: 'R-105' },
  ],
  Thu: [
    { period: 1, subject: 'English',     teacher: 'Mr. Bilal Khan',     time: '08:00-08:45', room: 'R-105' },
    { period: 2, subject: 'Statistics',  teacher: 'Ms. Fatima Malik',   time: '08:45-09:30', room: 'R-101' },
    { period: 3, subject: 'Urdu',        teacher: 'Ms. Asma Iqbal',     time: '09:45-10:30', room: 'R-103' },
    { period: 4, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '10:30-11:15', room: 'R-101' },
    { period: 5, subject: 'Chemistry',   teacher: 'Ms. Huma Shafiq',    time: '11:30-12:15', room: 'Lab-2' },
    { period: 6, subject: 'Physics',     teacher: 'Mr. Hassan Raza',    time: '12:15-01:00', room: 'Lab-1' },
  ],
  Fri: [
    { period: 1, subject: 'Islamiat',    teacher: 'Mr. Ahmed Khan',     time: '08:00-08:45', room: 'R-106' },
    { period: 2, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '08:45-09:30', room: 'R-101' },
    { period: 3, subject: 'Physics',     teacher: 'Mr. Hassan Raza',    time: '09:45-10:30', room: 'Lab-1' },
    { period: 4, subject: 'English',     teacher: 'Mr. Bilal Khan',     time: '10:30-11:15', room: 'R-105' },
  ],
  Sat: [
    { period: 1, subject: 'Mathematics', teacher: 'Ms. Fatima Malik',   time: '08:00-08:45', room: 'R-101' },
    { period: 2, subject: 'Urdu',        teacher: 'Ms. Asma Iqbal',     time: '08:45-09:30', room: 'R-103' },
    { period: 3, subject: 'Chemistry',   teacher: 'Ms. Huma Shafiq',    time: '09:45-10:30', room: 'Lab-2' },
  ],
};

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': Colors.cyan,
  'Physics':     Colors.purple,
  'Chemistry':   Colors.green,
  'English':     Colors.gold,
  'Urdu':        Colors.orange,
  'Islamiat':    Colors.red,
  'Statistics':  Colors.cyan,
};

export default function StudentTimetable() {
  const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(todayShort) ? todayShort : 'Mon');
  const periods = CLASS_TIMETABLE[selectedDay] || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Class Timetable</Text>
          <Text style={styles.subtitle}>Class XI-A — Session 2025-26</Text>
        </View>
      </View>

      {/* Day Selector */}
      <View style={styles.dayRow}>
        {DAYS.map(d => (
          <TouchableOpacity key={d}
            onPress={() => setSelectedDay(d)}
            style={[styles.dayBtn, selectedDay === d && styles.dayBtnActive, d === todayShort && selectedDay !== d && styles.dayBtnToday]}>
            <Text style={[styles.dayText, selectedDay === d && styles.dayTextActive]}>{d}</Text>
            {d === todayShort && <View style={[styles.todayIndicator, selectedDay === d && { backgroundColor: Colors.bg }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 24 }}>
        {periods.length === 0 ? (
          <View style={styles.noClass}>
            <FontAwesome5 name="moon" size={32} color={Colors.textMuted} />
            <Text style={styles.noClassText}>No classes on {selectedDay}</Text>
          </View>
        ) : (
          periods.map((p, i) => {
            const color = SUBJECT_COLORS[p.subject] || Colors.purple;
            return (
              <View key={i} style={[styles.card, { borderLeftColor: color }]}>
                <View style={styles.cardRow}>
                  <View style={[styles.periodBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.periodNum, { color }]}>{p.period}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.subject}>{p.subject}</Text>
                    <View style={styles.metaRow}>
                      <FontAwesome5 name="chalkboard-teacher" size={10} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{p.teacher}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="clock" size={10} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="door-open" size={10} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{p.room}</Text>
                  </View>
                  <View style={[styles.subjectBadge, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.subjectBadgeText, { color }]}>P{p.period}</Text>
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
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:            { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  subtitle:         { color: Colors.textMuted, fontSize: Font.sm, marginTop: 2 },
  dayRow:           { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 6, marginBottom: 14 },
  dayBtn:           { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  dayBtnActive:     { backgroundColor: Colors.purple, borderColor: Colors.purple },
  dayBtnToday:      { borderColor: Colors.purple + '60' },
  dayText:          { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  dayTextActive:    { color: '#fff' },
  todayIndicator:   { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.purple, marginTop: 3 },
  noClass:          { alignItems: 'center', paddingTop: 60, gap: 14 },
  noClassText:      { color: Colors.textMuted, fontSize: Font.md, fontWeight: '600' },
  card:             { backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4 },
  cardRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  periodBadge:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  periodNum:        { fontSize: Font.lg, fontWeight: '900' },
  subject:          { color: Colors.text, fontSize: Font.md, fontWeight: '800' },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  cardFooter:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:         { color: Colors.textMuted, fontSize: Font.sm },
  subjectBadge:     { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  subjectBadgeText: { fontSize: 11, fontWeight: '700' },
});
