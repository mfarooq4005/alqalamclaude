// ═══════════════════════════════════════════════════════
//  Teacher → Profile
//  View profile, change password, leave application, logout
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { Card, Button, SectionHeader } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import Toast from 'react-native-toast-message';

const MOCK_TEACHER = {
  full_name:   'Ms. Fatima Malik',
  employee_id: 'AQ-STAFF-042',
  subject:     'Mathematics & Statistics',
  classes:     'IX-A, IX-B, X-A, X-B, XI-A, XII-A',
  join_date:   '2021-08-01',
  phone:       '0312-2345678',
  email:       'fatima.malik@alqalam.edu.pk',
  address:     'House #12, Block B, Gulberg, Lahore',
  attendance_pct: 96,
  leaves_taken: 3,
  leaves_remaining: 9,
};

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Short Leave'];

export default function TeacherProfile() {
  const { user, logout } = useAuthStore();
  const teacher = { ...MOCK_TEACHER, full_name: user?.full_name || MOCK_TEACHER.full_name, email: user?.email || MOCK_TEACHER.email };

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [notifs, setNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya ap waqai logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleLeaveSubmit = () => {
    if (!leaveFrom || !leaveTo || !leaveReason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    Toast.show({ type: 'success', text1: 'Leave Applied ✓', text2: `${leaveType}: ${leaveFrom} to ${leaveTo}` });
    setShowLeaveForm(false);
    setLeaveFrom(''); setLeaveTo(''); setLeaveReason('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile Header */}
        <LinearGradient colors={['#161b22', '#0d1117']} style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="chalkboard-teacher" size={32} color={Colors.cyan} />
          </View>
          <Text style={styles.name}>{teacher.full_name}</Text>
          <Text style={styles.empId}>{teacher.employee_id}</Text>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectText}>{teacher.subject}</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.green }]}>{teacher.attendance_pct}%</Text>
            <Text style={styles.statLbl}>Attendance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.gold }]}>{teacher.leaves_taken}</Text>
            <Text style={styles.statLbl}>Leaves Used</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.cyan }]}>{teacher.leaves_remaining}</Text>
            <Text style={styles.statLbl}>Remaining</Text>
          </View>
        </View>

        {/* Info Card */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Personal Information" />
          {[
            { icon: 'envelope',     label: 'Email',    value: teacher.email     },
            { icon: 'phone',        label: 'Phone',    value: teacher.phone     },
            { icon: 'map-marker-alt',label: 'Address', value: teacher.address   },
            { icon: 'calendar-alt', label: 'Joined',   value: teacher.join_date },
            { icon: 'users',        label: 'Classes',  value: teacher.classes   },
          ].map((row, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
              <View style={styles.infoIcon}>
                <FontAwesome5 name={row.icon} size={13} color={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Leave Application */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Apply for Leave" action={showLeaveForm ? 'Cancel' : 'Apply'} onAction={() => setShowLeaveForm(!showLeaveForm)} />
          {showLeaveForm && (
            <View style={styles.leaveForm}>
              {/* Leave Type */}
              <Text style={styles.formLabel}>Leave Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {LEAVE_TYPES.map(t => (
                    <TouchableOpacity key={t}
                      onPress={() => setLeaveType(t)}
                      style={[styles.typeChip, leaveType === t && styles.typeChipActive]}>
                      <Text style={[styles.typeChipText, leaveType === t && styles.typeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>From Date</Text>
                  <View style={styles.formInput}>
                    <TextInput value={leaveFrom} onChangeText={setLeaveFrom} placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted} style={styles.formTextInput} />
                  </View>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>To Date</Text>
                  <View style={styles.formInput}>
                    <TextInput value={leaveTo} onChangeText={setLeaveTo} placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted} style={styles.formTextInput} />
                  </View>
                </View>
              </View>

              <Text style={styles.formLabel}>Reason</Text>
              <View style={[styles.formInput, { height: 80 }]}>
                <TextInput value={leaveReason} onChangeText={setLeaveReason}
                  placeholder="Reason for leave..."
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.formTextInput, { textAlignVertical: 'top', height: 70 }]}
                  multiline />
              </View>

              <Button label="Submit Leave Application" icon="paper-plane" color={Colors.cyan} onPress={handleLeaveSubmit} style={{ marginTop: 8 }} />
            </View>
          )}
          {!showLeaveForm && (
            <Text style={styles.leaveHint}>
              You have <Text style={{ color: Colors.cyan, fontWeight: '800' }}>{teacher.leaves_remaining}</Text> leaves remaining this year
            </Text>
          )}
        </Card>

        {/* Settings */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Settings" />
          <View style={styles.toggleRow}>
            <FontAwesome5 name="bell" size={15} color={Colors.purple} style={{ marginRight: 12 }} />
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: Colors.cyan }} thumbColor="#fff" />
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <FontAwesome5 name="sign-out-alt" size={15} color={Colors.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>AL Qalam EMS v1.0 · alqalam.edu.pk</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  profileHeader:   { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatarCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.cyan + '18', borderWidth: 2, borderColor: Colors.cyan + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  name:            { color: Colors.text, fontSize: Font.xl, fontWeight: '800' },
  empId:           { color: Colors.textMuted, fontSize: Font.sm, marginTop: 4 },
  subjectBadge:    { marginTop: 8, backgroundColor: Colors.cyan + '18', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cyan + '40' },
  subjectText:     { color: Colors.cyan, fontSize: Font.sm, fontWeight: '700' },
  statsRow:        { flexDirection: 'row', backgroundColor: Colors.bg2, marginHorizontal: Spacing.md, borderRadius: Radius.lg, paddingVertical: 16, marginBottom: 4, borderWidth: 1, borderColor: Colors.border },
  statItem:        { flex: 1, alignItems: 'center' },
  statVal:         { fontSize: Font.xl, fontWeight: '900' },
  statLbl:         { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: Colors.border },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  infoRowBorder:   { borderTopWidth: 1, borderTopColor: Colors.border },
  infoIcon:        { width: 32, alignItems: 'center', paddingTop: 2 },
  infoLabel:       { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue:       { color: Colors.text, fontSize: Font.sm },
  leaveForm:       { marginTop: 4 },
  formLabel:       { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600', marginBottom: 6 },
  formInput:       { backgroundColor: Colors.bg3, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  formTextInput:   { color: Colors.text, fontSize: Font.base },
  dateRow:         { flexDirection: 'row' },
  typeChip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3 },
  typeChipActive:  { backgroundColor: Colors.cyan + '20', borderColor: Colors.cyan },
  typeChipText:    { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600' },
  typeChipTextActive: { color: Colors.cyan },
  leaveHint:       { color: Colors.textMuted, fontSize: Font.sm, marginTop: 4 },
  toggleRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  toggleLabel:     { flex: 1, color: Colors.text, fontSize: Font.base, fontWeight: '600' },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: Spacing.md, marginTop: 8, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.red + '50', backgroundColor: Colors.red + '10' },
  logoutText:      { color: Colors.red, fontSize: Font.base, fontWeight: '700' },
  footer:          { textAlign: 'center', color: Colors.textMuted, fontSize: Font.sm, marginTop: 20 },
});
