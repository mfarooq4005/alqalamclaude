// ═══════════════════════════════════════════════════════
//  Admin → More
//  Staff, Library, Transport, Reports, Settings, Logout
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';

// ── Menu Items ─────────────────────────────────────────
const MENU_SECTIONS = [
  {
    title: 'Management',
    items: [
      { icon: 'chalkboard-teacher', label: 'Staff Management', color: Colors.purple, desc: 'View / manage all staff' },
      { icon: 'book-open',          label: 'Library',          color: Colors.cyan,   desc: 'Books, issues & returns' },
      { icon: 'bus',                label: 'Transport',        color: Colors.orange, desc: 'Routes & student tracking' },
      { icon: 'calendar-alt',       label: 'Timetable',        color: Colors.gold,   desc: 'Class schedules & periods' },
      { icon: 'trophy',             label: 'Examinations',     color: Colors.red,    desc: 'Exams, results & reports' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { icon: 'file-invoice-dollar', label: 'Salary Sheets',    color: Colors.green,  desc: 'Monthly payroll management' },
      { icon: 'chart-pie',           label: 'Fee Reports',      color: Colors.gold,   desc: 'Monthly closing reports' },
      { icon: 'piggy-bank',          label: 'Advance Payments', color: Colors.cyan,   desc: 'Track advance fee credits' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { icon: 'chart-bar',   label: 'Attendance Report', color: Colors.purple, desc: 'Staff & student summaries' },
      { icon: 'file-pdf',    label: 'Result Cards',      color: Colors.red,    desc: 'Generate & print result cards' },
      { icon: 'download',    label: 'Export Data',       color: Colors.textMuted, desc: 'CSV / Excel exports' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: 'cog',         label: 'System Settings',  color: Colors.textMuted, desc: 'Branch, fees, SMS config' },
      { icon: 'wifi',        label: 'API Settings',     color: Colors.cyan,      desc: 'Configure server connection' },
      { icon: 'shield-alt',  label: 'User Roles',       color: Colors.gold,      desc: 'Permissions & access control' },
    ],
  },
];

// ── Menu Item Row ──────────────────────────────────────
function MenuItem({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
        <FontAwesome5 name={item.icon} size={16} color={item.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <Text style={styles.menuDesc}>{item.desc}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={11} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Kya ap waqai logout karna chahte hain?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile Card */}
        <LinearGradient colors={['#161b22', '#0d1117']} style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <FontAwesome5 name="user-shield" size={28} color={Colors.gold} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.profileName}>{user?.full_name || 'Administrator'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@alqalam.edu.pk'}</Text>
            <View style={styles.profileRoleBadge}>
              <Text style={styles.profileRoleText}>{user?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <FontAwesome5 name="pen" size={12} color={Colors.gold} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Toggles */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <View style={styles.toggleRow}>
            <FontAwesome5 name="bell" size={15} color={Colors.purple} style={{ marginRight: 12 }} />
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: Colors.gold }} thumbColor="#fff" />
          </View>
          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 }]}>
            <FontAwesome5 name="moon" size={15} color={Colors.cyan} style={{ marginRight: 12 }} />
            <Text style={styles.toggleLabel}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: Colors.gold }} thumbColor="#fff" />
          </View>
        </Card>

        {/* Menu Sections */}
        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={{ marginBottom: 4 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={{ marginHorizontal: Spacing.md }}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <MenuItem item={item} onPress={() => {}} />
                  {i < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <FontAwesome5 name="graduation-cap" size={20} color={Colors.gold} />
          <Text style={styles.appName}>AL Qalam EMS</Text>
          <Text style={styles.appVersion}>v1.0.0 · alqalam.edu.pk</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <FontAwesome5 name="sign-out-alt" size={15} color={Colors.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  profileCard:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, marginBottom: 4 },
  profileAvatar:   { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.gold + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.gold + '40' },
  profileName:     { color: Colors.text, fontSize: Font.lg, fontWeight: '800' },
  profileEmail:    { color: Colors.textMuted, fontSize: Font.sm, marginTop: 2 },
  profileRoleBadge:{ backgroundColor: Colors.gold + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  profileRoleText: { color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  editProfileBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg3, alignItems: 'center', justifyContent: 'center' },
  toggleRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  toggleLabel:     { flex: 1, color: Colors.text, fontSize: Font.base, fontWeight: '600' },
  sectionTitle:    { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: Spacing.md + 4, paddingBottom: 6, paddingTop: 12, textTransform: 'uppercase' },
  menuItem:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIcon:        { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:       { color: Colors.text, fontSize: Font.base, fontWeight: '600' },
  menuDesc:        { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 0 },
  appInfo:         { alignItems: 'center', paddingVertical: 20, gap: 4 },
  appName:         { color: Colors.gold, fontSize: Font.md, fontWeight: '800' },
  appVersion:      { color: Colors.textMuted, fontSize: Font.sm },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: Spacing.md, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.red + '50', backgroundColor: Colors.red + '10' },
  logoutText:      { color: Colors.red, fontSize: Font.base, fontWeight: '700' },
});
