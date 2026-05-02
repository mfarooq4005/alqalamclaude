// ═══════════════════════════════════════════════════════
//  Parent → Children
//  Detailed view per child: profile, academic, attendance
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, Badge, StatCard } from '../../src/components';

const CHILDREN = [
  {
    id: 1, name: 'Muhammad Bilal', student_id: 'AQ-2024-1045', class: 'XI-A', roll: 15,
    gender: 'male', dob: '2008-03-15', father: 'Mr. Saeed Akhtar', mother: 'Mrs. Nadia Saeed',
    phone: '0334-9012345', address: 'House #45, Block C, Johar Town, Lahore',
    att_pct: 96, att_present: 82, att_absent: 3, att_total: 85,
    results: [
      { exam: 'Monthly Test 2', subject: 'Mathematics', marks: 21, total: 25, grade: 'A+' },
      { exam: 'Monthly Test 2', subject: 'Physics',     marks: 19, total: 25, grade: 'A'  },
      { exam: 'Monthly Test 2', subject: 'Chemistry',   marks: 18, total: 25, grade: 'A'  },
      { exam: 'Monthly Test 2', subject: 'English',     marks: 22, total: 25, grade: 'A+' },
    ],
    fee_status: 'paid', monthly_fee: 4500,
  },
  {
    id: 2, name: 'Zara Saeed', student_id: 'AQ-2024-1078', class: 'VIII-B', roll: 8,
    gender: 'female', dob: '2011-07-22', father: 'Mr. Saeed Akhtar', mother: 'Mrs. Nadia Saeed',
    phone: '0334-9012345', address: 'House #45, Block C, Johar Town, Lahore',
    att_pct: 88, att_present: 75, att_absent: 10, att_total: 85,
    results: [
      { exam: 'Monthly Test 2', subject: 'Mathematics', marks: 17, total: 25, grade: 'B+' },
      { exam: 'Monthly Test 2', subject: 'Science',     marks: 19, total: 25, grade: 'A'  },
      { exam: 'Monthly Test 2', subject: 'English',     marks: 20, total: 25, grade: 'A'  },
      { exam: 'Monthly Test 2', subject: 'Urdu',        marks: 18, total: 25, grade: 'A'  },
    ],
    fee_status: 'pending', monthly_fee: 4000,
  },
];

const gradeColor = (g: string) => g.startsWith('A') ? Colors.green : g.startsWith('B') ? Colors.cyan : Colors.gold;
const attColor   = (p: number) => p >= 90 ? Colors.green : p >= 75 ? Colors.gold : Colors.red;

export default function ParentChildren() {
  const [selectedChild, setSelectedChild] = useState(CHILDREN[0]);
  const [tab, setTab] = useState<'profile' | 'results' | 'attendance'>('profile');

  const c = selectedChild;
  const childColor = c.gender === 'male' ? Colors.cyan : Colors.purple;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Child Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>My Children</Text>
      </View>
      <View style={styles.childSelector}>
        {CHILDREN.map(ch => (
          <TouchableOpacity key={ch.id}
            onPress={() => { setSelectedChild(ch); setTab('profile'); }}
            style={[styles.childTab, selectedChild.id === ch.id && { borderColor: ch.gender === 'male' ? Colors.cyan : Colors.purple, backgroundColor: (ch.gender === 'male' ? Colors.cyan : Colors.purple) + '15' }]}>
            <FontAwesome5 name="user-graduate" size={14} color={ch.gender === 'male' ? Colors.cyan : Colors.purple} />
            <View>
              <Text style={[styles.childTabName, selectedChild.id === ch.id && { color: Colors.text }]}>{ch.name.split(' ')[0]}</Text>
              <Text style={styles.childTabClass}>{ch.class}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile Banner */}
      <LinearGradient colors={['#161b22', '#0d1117']} style={[styles.profileBanner, { borderLeftColor: childColor, borderLeftWidth: 4 }]}>
        <View style={[styles.avatar, { backgroundColor: childColor + '18' }]}>
          <FontAwesome5 name="user-graduate" size={28} color={childColor} />
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.childName}>{c.name}</Text>
          <Text style={styles.childMeta}>{c.student_id} · Class {c.class}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Badge label={`Roll #${c.roll}`} color={childColor} />
            <Badge label={c.fee_status === 'paid' ? '✓ Fee Paid' : '! Fee Due'} color={c.fee_status === 'paid' ? Colors.green : Colors.gold} />
          </View>
        </View>
      </LinearGradient>

      {/* Sub Tabs */}
      <View style={styles.tabs}>
        {(['profile', 'results', 'attendance'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && { color: childColor }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 24 }}>

        {tab === 'profile' && (
          <Card>
            <SectionHeader title="Student Details" />
            {[
              { icon: 'birthday-cake', label: 'Date of Birth',  value: c.dob         },
              { icon: 'user-tie',      label: 'Father Name',    value: c.father      },
              { icon: 'user',          label: 'Mother Name',    value: c.mother      },
              { icon: 'phone',         label: 'Contact',        value: c.phone       },
              { icon: 'map-marker-alt',label: 'Address',        value: c.address     },
            ].map((row, i) => (
              <View key={i} style={[styles.infoRow, i > 0 && styles.rowBorder]}>
                <View style={styles.infoIconWrap}>
                  <FontAwesome5 name={row.icon} size={13} color={Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {tab === 'results' && (
          <Card>
            <SectionHeader title="Recent Results — Monthly Test 2" />
            {c.results.map((r, i) => {
              const gc = gradeColor(r.grade);
              const pct = Math.round((r.marks / r.total) * 100);
              return (
                <View key={i} style={[styles.resultRow, i < c.results.length - 1 && styles.rowBorder]}>
                  <View style={[styles.gradeTag, { backgroundColor: gc + '20' }]}>
                    <Text style={[styles.gradeText, { color: gc }]}>{r.grade}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.resultSubject}>{r.subject}</Text>
                    <View style={styles.resultBar}>
                      <View style={[styles.resultBarFill, { width: `${pct}%`, backgroundColor: gc }]} />
                    </View>
                  </View>
                  <Text style={[styles.resultMarks, { color: gc }]}>{r.marks}/{r.total}</Text>
                </View>
              );
            })}
          </Card>
        )}

        {tab === 'attendance' && (
          <>
            <View style={styles.attStatRow}>
              <StatCard label="Present" value={c.att_present}                       icon="check-circle" color={Colors.green}  style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Absent"  value={c.att_absent}                        icon="times-circle" color={Colors.red}    style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Rate"    value={`${c.att_pct}%`}                     icon="chart-pie"    color={attColor(c.att_pct)} style={{ flex: 1 }} />
            </View>
            <Card>
              <View style={styles.attProgressRow}>
                <Text style={styles.attPctText}>{c.att_pct}%</Text>
                <Text style={styles.attPctLabel}>attendance rate</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${c.att_pct}%`, backgroundColor: attColor(c.att_pct) }]} />
              </View>
              <Text style={styles.barSub}>{c.att_present} present · {c.att_absent} absent · {c.att_total} total school days</Text>
              {c.att_pct < 75 && (
                <View style={styles.alertBox}>
                  <FontAwesome5 name="exclamation-triangle" size={12} color={Colors.red} />
                  <Text style={styles.alertText}>Attendance below 75% — please contact school</Text>
                </View>
              )}
            </Card>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  header:          { paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:           { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  childSelector:   { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 10, marginBottom: 4 },
  childTab:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  childTabName:    { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  childTabClass:   { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  profileBanner:   { marginHorizontal: Spacing.md, borderRadius: Radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  avatar:          { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  childName:       { color: Colors.text, fontSize: Font.lg, fontWeight: '800' },
  childMeta:       { color: Colors.textMuted, fontSize: Font.sm, marginTop: 2 },
  tabs:            { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.md },
  tabBtnActive:    { backgroundColor: Colors.bg3 },
  tabText:         { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  rowBorder:       { borderTopWidth: 1, borderTopColor: Colors.border },
  infoIconWrap:    { width: 30, alignItems: 'center', paddingTop: 2 },
  infoLabel:       { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue:       { color: Colors.text, fontSize: Font.sm },
  resultRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  gradeTag:        { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gradeText:       { fontSize: Font.md, fontWeight: '900' },
  resultSubject:   { color: Colors.text, fontSize: Font.sm, fontWeight: '700', marginBottom: 5 },
  resultBar:       { height: 4, backgroundColor: Colors.bg3, borderRadius: 2, overflow: 'hidden' },
  resultBarFill:   { height: 4, borderRadius: 2 },
  resultMarks:     { fontSize: Font.md, fontWeight: '800', marginLeft: 12 },
  attStatRow:      { flexDirection: 'row', marginBottom: Spacing.md },
  attProgressRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  attPctText:      { color: Colors.green, fontSize: 32, fontWeight: '900' },
  attPctLabel:     { color: Colors.textMuted, fontSize: Font.sm },
  barBg:           { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill:         { height: 8, borderRadius: 4 },
  barSub:          { color: Colors.textMuted, fontSize: Font.sm },
  alertBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: Radius.md, padding: 10, marginTop: 10 },
  alertText:       { color: Colors.red, fontSize: 11, flex: 1 },
});
