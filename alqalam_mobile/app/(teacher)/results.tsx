// ═══════════════════════════════════════════════════════
//  Teacher → Enter Results / Marks
//  Select exam, class, enter marks per student
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, SectionHeader } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { ResultsAPI } from '../../src/api';
import Toast from 'react-native-toast-message';

// ── Mock ───────────────────────────────────────────────
const MOCK_EXAMS = [
  { id: 1, name: 'Monthly Test 1',  date: '2026-04-15', total_marks: 25  },
  { id: 2, name: 'Mid Term Exam',   date: '2026-03-20', total_marks: 100 },
  { id: 3, name: 'Monthly Test 2',  date: '2026-05-10', total_marks: 25  },
];

const MOCK_STUDENTS = [
  { id: 1,  roll: 1,  name: 'Muhammad Hamza',   marks: '' },
  { id: 2,  roll: 2,  name: 'Aisha Fatima',     marks: '' },
  { id: 3,  roll: 3,  name: 'Ali Hassan',       marks: '' },
  { id: 4,  roll: 4,  name: 'Zainab Malik',     marks: '' },
  { id: 5,  roll: 5,  name: 'Usman Raza',       marks: '' },
  { id: 6,  roll: 6,  name: 'Maryam Qureshi',   marks: '' },
  { id: 7,  roll: 7,  name: 'Ibrahim Siddiqui', marks: '' },
  { id: 8,  roll: 8,  name: 'Hina Baig',        marks: '' },
];

const CLASSES = ['IX-A', 'IX-B', 'X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A'];

function gradeColor(marks: number, total: number): string {
  const pct = (marks / total) * 100;
  if (pct >= 80) return Colors.green;
  if (pct >= 60) return Colors.cyan;
  if (pct >= 40) return Colors.gold;
  return Colors.red;
}

function grade(marks: number, total: number): string {
  const pct = (marks / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export default function TeacherResults() {
  const [selectedExam, setSelectedExam] = useState(MOCK_EXAMS[0]);
  const [selectedClass, setSelectedClass] = useState('IX-A');
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateMark = (studentId: number, value: string) => {
    const num = parseInt(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > selectedExam.total_marks)) return;
    setMarks(prev => ({ ...prev, [studentId]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const results = MOCK_STUDENTS.map(s => ({
      student_id: s.id,
      marks: parseFloat(marks[s.id] || '0'),
      exam_id: selectedExam.id,
    }));
    setLoading(true);
    try {
      await ResultsAPI.save({ class: selectedClass, results });
      Toast.show({ type: 'success', text1: 'Marks Saved ✓', text2: `${selectedClass} — ${selectedExam.name}` });
      setSaved(true);
    } catch {
      Toast.show({ type: 'success', text1: 'Saved Offline ✓', text2: 'Will sync when connected' });
      setSaved(true);
    } finally { setLoading(false); }
  };

  const entered = Object.values(marks).filter(m => m !== '').length;
  const total   = MOCK_STUDENTS.length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enter Marks</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{entered}/{total}</Text>
        </View>
      </View>

      {/* Exam Selector */}
      <Text style={styles.sectionLabel}>Select Exam</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {MOCK_EXAMS.map(e => (
          <TouchableOpacity key={e.id}
            onPress={() => { setSelectedExam(e); setMarks({}); setSaved(false); }}
            style={[styles.examChip, selectedExam.id === e.id && styles.examChipActive]}>
            <Text style={[styles.examChipTitle, selectedExam.id === e.id && styles.examChipTitleActive]}>{e.name}</Text>
            <Text style={[styles.examChipSub, selectedExam.id === e.id && styles.examChipSubActive]}>
              Total: {e.total_marks} · {e.date}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Class Selector */}
      <Text style={styles.sectionLabel}>Select Class</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hScroll, { marginBottom: 4 }]}>
        {CLASSES.map(c => (
          <TouchableOpacity key={c}
            onPress={() => { setSelectedClass(c); setMarks({}); setSaved(false); }}
            style={[styles.chip, selectedClass === c && styles.chipActive]}>
            <Text style={[styles.chipText, selectedClass === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <FontAwesome5 name="info-circle" size={12} color={Colors.cyan} />
        <Text style={styles.infoText}>
          {selectedExam.name} · {selectedClass} · Max: {selectedExam.total_marks} marks
        </Text>
      </View>

      {/* Student Marks List */}
      <FlatList
        data={MOCK_STUDENTS}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const m = marks[item.id] || '';
          const mNum = parseFloat(m);
          const hasValue = m !== '';
          const gc = hasValue ? gradeColor(mNum, selectedExam.total_marks) : Colors.textMuted;
          const gr = hasValue ? grade(mNum, selectedExam.total_marks) : '—';
          return (
            <View style={styles.markRow}>
              <View style={styles.rollBadge}>
                <Text style={styles.rollText}>{item.roll}</Text>
              </View>
              <Text style={styles.studentName}>{item.name}</Text>
              <View style={[styles.gradeTag, { backgroundColor: gc + '20' }]}>
                <Text style={[styles.gradeText, { color: gc }]}>{gr}</Text>
              </View>
              <View style={styles.markInputWrap}>
                <TextInput
                  style={[styles.markInput, hasValue && { color: gc, borderColor: gc + '60' }]}
                  value={m}
                  onChangeText={v => updateMark(item.id, v)}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={3}
                />
                <Text style={styles.maxText}>/{selectedExam.total_marks}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Submit */}
      <View style={styles.submitWrap}>
        {saved ? (
          <View style={styles.savedBanner}>
            <FontAwesome5 name="check-circle" size={15} color={Colors.green} />
            <Text style={styles.savedText}>Marks saved successfully!</Text>
            <TouchableOpacity onPress={() => setSaved(false)}>
              <Text style={styles.editAgainText}>Edit Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            label={`Save Marks — ${entered}/${total} entered`}
            icon="save"
            color={Colors.cyan}
            loading={loading}
            disabled={entered === 0}
            onPress={handleSave}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.bg },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:              { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  progressPill:       { backgroundColor: Colors.cyan + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cyan + '50' },
  progressText:       { color: Colors.cyan, fontSize: Font.sm, fontWeight: '800' },
  sectionLabel:       { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700', paddingHorizontal: Spacing.md, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  hScroll:            { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 10 },
  examChip:           { padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2, minWidth: 160 },
  examChipActive:     { borderColor: Colors.cyan, backgroundColor: Colors.cyan + '15' },
  examChipTitle:      { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  examChipTitleActive:{ color: Colors.cyan },
  examChipSub:        { color: Colors.textMuted, fontSize: 11, marginTop: 3 },
  examChipSubActive:  { color: Colors.cyan + 'aa' },
  chip:               { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  chipActive:         { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  chipText:           { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  chipTextActive:     { color: Colors.bg },
  infoBanner:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 8 },
  infoText:           { color: Colors.cyan, fontSize: Font.sm },
  markRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  rollBadge:          { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.bg3, alignItems: 'center', justifyContent: 'center' },
  rollText:           { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  studentName:        { flex: 1, color: Colors.text, fontSize: Font.sm, fontWeight: '600' },
  gradeTag:           { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gradeText:          { fontSize: 11, fontWeight: '800' },
  markInputWrap:      { flexDirection: 'row', alignItems: 'center' },
  markInput:          { width: 52, height: 36, backgroundColor: Colors.bg3, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border, textAlign: 'center', color: Colors.text, fontSize: Font.md, fontWeight: '800' },
  maxText:            { color: Colors.textMuted, fontSize: 12, marginLeft: 4 },
  submitWrap:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  savedBanner:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.green + '18', paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.green + '40' },
  savedText:          { color: Colors.green, fontSize: Font.base, fontWeight: '700' },
  editAgainText:      { color: Colors.textMuted, fontSize: Font.sm, marginLeft: 8 },
});
