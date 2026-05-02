// ═══════════════════════════════════════════════════════
//  Student → My Results
//  View marks by exam, subject-wise performance
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, Badge } from '../../src/components';

// ── Mock results ───────────────────────────────────────
const MOCK_EXAMS = [
  {
    id: 1,
    name: 'Mid Term Exam',
    date: '2026-03-20',
    total_marks: 100,
    results: [
      { subject: 'Mathematics', marks: 87, total: 100 },
      { subject: 'Physics',     marks: 79, total: 100 },
      { subject: 'Chemistry',   marks: 82, total: 100 },
      { subject: 'English',     marks: 88, total: 100 },
      { subject: 'Urdu',        marks: 75, total: 100 },
      { subject: 'Islamiat',    marks: 90, total: 100 },
    ],
  },
  {
    id: 2,
    name: 'Monthly Test 1',
    date: '2026-04-15',
    total_marks: 25,
    results: [
      { subject: 'Mathematics', marks: 22, total: 25 },
      { subject: 'Physics',     marks: 18, total: 25 },
      { subject: 'Chemistry',   marks: 20, total: 25 },
      { subject: 'English',     marks: 23, total: 25 },
      { subject: 'Urdu',        marks: 19, total: 25 },
      { subject: 'Islamiat',    marks: 24, total: 25 },
    ],
  },
  {
    id: 3,
    name: 'Monthly Test 2',
    date: '2026-05-10',
    total_marks: 25,
    results: [
      { subject: 'Mathematics', marks: 21, total: 25 },
      { subject: 'Physics',     marks: 19, total: 25 },
      { subject: 'Chemistry',   marks: 18, total: 25 },
      { subject: 'English',     marks: 22, total: 25 },
      { subject: 'Urdu',        marks: 20, total: 25 },
      { subject: 'Islamiat',    marks: 25, total: 25 },
    ],
  },
];

function getGrade(marks: number, total: number) {
  const pct = (marks / total) * 100;
  if (pct >= 90) return { grade: 'A+', color: Colors.green  };
  if (pct >= 80) return { grade: 'A',  color: Colors.green  };
  if (pct >= 70) return { grade: 'B',  color: Colors.cyan   };
  if (pct >= 60) return { grade: 'C',  color: Colors.gold   };
  if (pct >= 50) return { grade: 'D',  color: Colors.orange };
  return              { grade: 'F',  color: Colors.red    };
}

export default function StudentResults() {
  const [selectedExam, setSelectedExam] = useState(MOCK_EXAMS[2]);

  const totalObtained = selectedExam.results.reduce((s, r) => s + r.marks, 0);
  const totalMax      = selectedExam.results.reduce((s, r) => s + r.total, 0);
  const overallPct    = Math.round((totalObtained / totalMax) * 100);
  const { grade: overallGrade, color: overallColor } = getGrade(totalObtained, totalMax);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Results</Text>
      </View>

      {/* Exam Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examScroll}>
        {MOCK_EXAMS.map(e => (
          <TouchableOpacity key={e.id}
            onPress={() => setSelectedExam(e)}
            style={[styles.examChip, selectedExam.id === e.id && styles.examChipActive]}>
            <Text style={[styles.examChipTitle, selectedExam.id === e.id && styles.examChipTitleActive]}>{e.name}</Text>
            <Text style={[styles.examChipDate, selectedExam.id === e.id && { color: Colors.purple + 'bb' }]}>{e.date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Overall Score Card */}
        <Card style={{ marginHorizontal: Spacing.md, alignItems: 'center', paddingVertical: 24 }}>
          <View style={[styles.scoreBadge, { backgroundColor: overallColor + '18', borderColor: overallColor + '50' }]}>
            <Text style={[styles.scoreGrade, { color: overallColor }]}>{overallGrade}</Text>
          </View>
          <Text style={styles.scoreExam}>{selectedExam.name}</Text>
          <Text style={[styles.scorePct, { color: overallColor }]}>{overallPct}%</Text>
          <Text style={styles.scoreMarks}>{totalObtained} / {totalMax} marks</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${overallPct}%`, backgroundColor: overallColor }]} />
          </View>
        </Card>

        {/* Subject-wise Breakdown */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Subject-wise Marks" />
          {selectedExam.results.map((r, i) => {
            const { grade, color } = getGrade(r.marks, r.total);
            const pct = Math.round((r.marks / r.total) * 100);
            return (
              <View key={i} style={[styles.subjectRow, i < selectedExam.results.length - 1 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{r.subject}</Text>
                  <View style={styles.subjectBar}>
                    <View style={[styles.subjectBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <View style={[styles.gradeTag, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.gradeText, { color }]}>{grade}</Text>
                  </View>
                  <Text style={styles.marksText}>{r.marks}/{r.total}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Performance Summary */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Performance Summary" />
          <View style={styles.perfGrid}>
            {[
              { label: 'Highest',  value: Math.max(...selectedExam.results.map(r => Math.round((r.marks/r.total)*100))) + '%', color: Colors.green  },
              { label: 'Lowest',   value: Math.min(...selectedExam.results.map(r => Math.round((r.marks/r.total)*100))) + '%', color: Colors.red    },
              { label: 'Average',  value: overallPct + '%',                                                                     color: Colors.purple },
              { label: 'Position', value: '3rd',                                                                                color: Colors.gold   },
            ].map(s => (
              <View key={s.label} style={styles.perfItem}>
                <Text style={[styles.perfVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.perfLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.bg },
  header:            { paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:             { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  examScroll:        { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 10 },
  examChip:          { padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2, minWidth: 150 },
  examChipActive:    { borderColor: Colors.purple, backgroundColor: Colors.purple + '15' },
  examChipTitle:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  examChipTitleActive: { color: Colors.purple },
  examChipDate:      { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  scoreBadge:        { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 12 },
  scoreGrade:        { fontSize: 32, fontWeight: '900' },
  scoreExam:         { color: Colors.textMuted, fontSize: Font.sm, marginBottom: 4 },
  scorePct:          { fontSize: 36, fontWeight: '900' },
  scoreMarks:        { color: Colors.textMuted, fontSize: Font.sm, marginBottom: 12 },
  scoreBar:          { width: '80%', height: 6, backgroundColor: Colors.bg3, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:      { height: 6, borderRadius: 3 },
  subjectRow:        { paddingVertical: 12 },
  rowBorder:         { borderBottomWidth: 1, borderBottomColor: Colors.border },
  subjectName:       { color: Colors.text, fontSize: Font.sm, fontWeight: '700', marginBottom: 6 },
  subjectBar:        { height: 5, backgroundColor: Colors.bg3, borderRadius: 3, overflow: 'hidden' },
  subjectBarFill:    { height: 5, borderRadius: 3 },
  gradeTag:          { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, marginBottom: 3 },
  gradeText:         { fontSize: 12, fontWeight: '900' },
  marksText:         { color: Colors.textMuted, fontSize: 11 },
  perfGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  perfItem:          { width: '45%', backgroundColor: Colors.bg3, borderRadius: Radius.lg, padding: 14, alignItems: 'center' },
  perfVal:           { fontSize: Font.xl, fontWeight: '900' },
  perfLabel:         { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
});
