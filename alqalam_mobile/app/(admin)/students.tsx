// ═══════════════════════════════════════════════════════
//  Admin → Students
//  Search, filter by class, view profile, quick actions
// ═══════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Button, EmptyState, SectionHeader } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { StudentsAPI } from '../../src/api';

// ── Mock data ──────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 1,  student_id: 'AQ-2024-1001', name: 'Muhammad Hamza',   class: 'IX-A',  father: 'Tariq Mehmood', phone: '0300-1234567', fee_status: 'paid',    gender: 'male'   },
  { id: 2,  student_id: 'AQ-2024-1002', name: 'Aisha Fatima',     class: 'IX-A',  father: 'Khalid Hussain', phone: '0312-2345678', fee_status: 'pending', gender: 'female' },
  { id: 3,  student_id: 'AQ-2024-1003', name: 'Ali Hassan',       class: 'IX-B',  father: 'Shahid Ali',     phone: '0321-3456789', fee_status: 'paid',    gender: 'male'   },
  { id: 4,  student_id: 'AQ-2024-1004', name: 'Zainab Malik',     class: 'X-A',   father: 'Asif Malik',     phone: '0333-4567890', fee_status: 'overdue', gender: 'female' },
  { id: 5,  student_id: 'AQ-2024-1005', name: 'Usman Raza',       class: 'X-A',   father: 'Imran Raza',     phone: '0345-5678901', fee_status: 'paid',    gender: 'male'   },
  { id: 6,  student_id: 'AQ-2024-1006', name: 'Maryam Qureshi',   class: 'X-B',   father: 'Nadeem Qureshi', phone: '0301-6789012', fee_status: 'pending', gender: 'female' },
  { id: 7,  student_id: 'AQ-2024-1007', name: 'Ibrahim Siddiqui', class: 'XI-A',  father: 'Salman Siddiqui',phone: '0311-7890123', fee_status: 'paid',    gender: 'male'   },
  { id: 8,  student_id: 'AQ-2024-1008', name: 'Hina Baig',        class: 'XI-A',  father: 'Akram Baig',     phone: '0322-8901234', fee_status: 'paid',    gender: 'female' },
  { id: 9,  student_id: 'AQ-2024-1009', name: 'Bilal Akhtar',     class: 'XI-B',  father: 'Akhtar Saeed',   phone: '0334-9012345', fee_status: 'overdue', gender: 'male'   },
  { id: 10, student_id: 'AQ-2024-1010', name: 'Nadia Farooq',     class: 'XII-A', father: 'Farooq Ahmed',   phone: '0346-0123456', fee_status: 'paid',    gender: 'female' },
];

const CLASSES = ['All', 'IX-A', 'IX-B', 'X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A', 'XII-B'];

const feeColor: Record<string, string> = {
  paid: Colors.green, pending: Colors.gold, overdue: Colors.red,
};

// ── Student Detail Modal ───────────────────────────────
function StudentModal({ student, onClose }: { student: any; onClose: () => void }) {
  if (!student) return null;
  return (
    <Modal visible={!!student} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          {/* Avatar */}
          <View style={[styles.modalAvatar, { backgroundColor: student.gender === 'male' ? Colors.cyan + '20' : Colors.purple + '20' }]}>
            <FontAwesome5 name="user-graduate" size={32} color={student.gender === 'male' ? Colors.cyan : Colors.purple} />
          </View>
          <Text style={styles.modalName}>{student.name}</Text>
          <Text style={styles.modalId}>{student.student_id}</Text>
          <Badge label={student.class} color={Colors.gold} />

          <View style={styles.modalDivider} />

          <View style={styles.modalInfoRow}>
            <FontAwesome5 name="user-tie" size={13} color={Colors.textMuted} />
            <Text style={styles.modalInfoText}>Father: {student.father}</Text>
          </View>
          <View style={styles.modalInfoRow}>
            <FontAwesome5 name="phone" size={13} color={Colors.textMuted} />
            <Text style={styles.modalInfoText}>{student.phone}</Text>
          </View>
          <View style={styles.modalInfoRow}>
            <FontAwesome5 name="money-bill" size={13} color={feeColor[student.fee_status]} />
            <Text style={[styles.modalInfoText, { color: feeColor[student.fee_status] }]}>
              Fee: {student.fee_status.charAt(0).toUpperCase() + student.fee_status.slice(1)}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button label="Fee Details" icon="receipt" color={Colors.gold} small outline onPress={onClose} />
            <Button label="Attendance" icon="clipboard-check" color={Colors.cyan} small outline onPress={onClose} />
            <Button label="Results" icon="chart-bar" color={Colors.purple} small outline onPress={onClose} />
          </View>

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <FontAwesome5 name="times" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Student Row ────────────────────────────────────────
function StudentRow({ student, onPress }: { student: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowAvatar, {
        backgroundColor: student.gender === 'male' ? Colors.cyan + '18' : Colors.purple + '18',
      }]}>
        <FontAwesome5 name="user" size={14} color={student.gender === 'male' ? Colors.cyan : Colors.purple} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowName}>{student.name}</Text>
        <Text style={styles.rowSub}>{student.student_id} · {student.class}</Text>
      </View>
      <View style={[styles.feeTag, { backgroundColor: feeColor[student.fee_status] + '20' }]}>
        <Text style={[styles.feeTagText, { color: feeColor[student.fee_status] }]}>
          {student.fee_status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StudentsScreen() {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selected, setSelected] = useState<any>(null);

  const { data: students = MOCK_STUDENTS, isLoading } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      try { return (await StudentsAPI.getAll()).data; }
      catch { return MOCK_STUDENTS; }
    },
  });

  const filtered = useMemo(() => {
    return students.filter((s: any) => {
      const matchClass = selectedClass === 'All' || s.class.startsWith(selectedClass.split('-')[0]) && (selectedClass === 'All' || s.class === selectedClass);
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.includes(search);
      return matchClass && matchSearch;
    });
  }, [students, search, selectedClass]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Students</Text>
        <TouchableOpacity style={styles.addBtn}>
          <FontAwesome5 name="user-plus" size={14} color={Colors.bg} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <FontAwesome5 name="search" size={13} color={Colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or student ID..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <FontAwesome5 name="times-circle" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Class Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {CLASSES.map(c => (
          <TouchableOpacity key={c}
            onPress={() => setSelectedClass(c)}
            style={[styles.filterChip, selectedClass === c && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, selectedClass === c && styles.filterChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} students</Text>
        <View style={styles.legendRow}>
          {Object.entries(feeColor).map(([k, c]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendLabel}>{k}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="user-slash" title="No students found" subtitle="Try a different search or class" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <StudentRow student={item} onPress={() => setSelected(item)} />}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <StudentModal student={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:            { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  addBtnText:       { color: Colors.bg, fontWeight: '700', fontSize: Font.sm },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: Spacing.md, marginBottom: 12 },
  searchInput:      { flex: 1, color: Colors.text, fontSize: Font.base },
  filterScroll:     { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 8 },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  filterChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterChipText:   { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600' },
  filterChipTextActive: { color: Colors.bg },
  countRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: 8 },
  countText:        { color: Colors.textMuted, fontSize: Font.sm },
  legendRow:        { flexDirection: 'row', gap: 12 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:        { width: 7, height: 7, borderRadius: 3.5 },
  legendLabel:      { color: Colors.textMuted, fontSize: 11 },
  row:              { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowAvatar:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowName:          { color: Colors.text, fontSize: Font.base, fontWeight: '600' },
  rowSub:           { color: Colors.textMuted, fontSize: Font.sm, marginTop: 2 },
  feeTag:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  feeTagText:       { fontSize: 11, fontWeight: '700' },
  // Modal
  modalBg:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.border },
  modalAvatar:      { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalName:        { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginBottom: 4 },
  modalId:          { color: Colors.textMuted, fontSize: Font.sm, marginBottom: 10 },
  modalDivider:     { width: '100%', height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  modalInfoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10 },
  modalInfoText:    { color: Colors.text, fontSize: Font.base },
  modalActions:     { flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' },
  modalClose:       { position: 'absolute', top: 20, right: 20 },
});
