// ═══════════════════════════════════════════════════════
//  Parent → Profile & Settings
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
import { Card, SectionHeader } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';

export default function ParentProfile() {
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs]       = useState(true);
  const [feeAlerts, setFeeAlerts] = useState(true);
  const [attAlerts, setAttAlerts] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya ap waqai logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const INFO = [
    { icon: 'envelope',      label: 'Email',   value: user?.email   || 'parent_ali@alqalam.edu.pk' },
    { icon: 'phone',         label: 'Phone',   value: user?.phone   || '0300-1234567'              },
    { icon: 'child',         label: 'Children',value: '2 (Muhammad Bilal, Zara Saeed)'              },
    { icon: 'id-card',       label: 'Parent ID',value: 'PRT-2024-0089'                             },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile Header */}
        <LinearGradient colors={['#161b22', '#0d1117']} style={styles.header}>
          <View style={styles.avatar}>
            <FontAwesome5 name="user-friends" size={28} color={Colors.green} />
          </View>
          <Text style={styles.name}>{user?.full_name || 'Parent'}</Text>
          <Text style={styles.sub}>Parent / Guardian</Text>
          <View style={styles.schoolBadge}>
            <Text style={styles.schoolBadgeText}>AL QALAM INTERNATIONAL</Text>
          </View>
        </LinearGradient>

        {/* Info */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Account Information" />
          {INFO.map((row, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && styles.rowBorder]}>
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

        {/* Notification Settings */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Notification Settings" />
          {[
            { icon: 'bell',                label: 'All Notifications', state: notifs,    setter: setNotifs,    color: Colors.green  },
            { icon: 'money-bill',          label: 'Fee Reminders',     state: feeAlerts, setter: setFeeAlerts, color: Colors.gold   },
            { icon: 'clipboard-check',     label: 'Attendance Alerts', state: attAlerts, setter: setAttAlerts, color: Colors.cyan   },
          ].map((item, i) => (
            <View key={i} style={[styles.toggleRow, i > 0 && styles.rowBorder]}>
              <View style={[styles.toggleIcon, { backgroundColor: item.color + '18' }]}>
                <FontAwesome5 name={item.icon} size={13} color={item.color} />
              </View>
              <Text style={styles.toggleLabel}>{item.label}</Text>
              <Switch value={item.state} onValueChange={item.setter} trackColor={{ true: item.color }} thumbColor="#fff" />
            </View>
          ))}
        </Card>

        {/* Help */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Help & Contact" />
          {[
            { icon: 'phone',     label: 'School Office', value: '+92-42-1234567',       color: Colors.green  },
            { icon: 'whatsapp',  label: 'WhatsApp',      value: '+92-300-1234567',      color: Colors.green  },
            { icon: 'envelope',  label: 'Email',         value: 'info@alqalam.edu.pk',  color: Colors.cyan   },
            { icon: 'globe',     label: 'Website',       value: 'www.alqalam.edu.pk',   color: Colors.purple },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.contactRow, i > 0 && styles.rowBorder]} activeOpacity={0.75}>
              <View style={[styles.contactIcon, { backgroundColor: item.color + '18' }]}>
                <FontAwesome5 name={item.icon} size={13} color={item.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={[styles.contactValue, { color: item.color }]}>{item.value}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={11} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <FontAwesome5 name="graduation-cap" size={20} color={Colors.gold} />
          <Text style={styles.appName}>AL Qalam EMS v1.0</Text>
          <Text style={styles.appSub}>alqalam.edu.pk · All rights reserved</Text>
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
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatar:        { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.green + '18', borderWidth: 2, borderColor: Colors.green + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  name:          { color: Colors.text, fontSize: Font.xl, fontWeight: '800' },
  sub:           { color: Colors.textMuted, fontSize: Font.sm, marginTop: 4 },
  schoolBadge:   { marginTop: 10, backgroundColor: Colors.gold + '18', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold + '40' },
  schoolBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  rowBorder:     { borderTopWidth: 1, borderTopColor: Colors.border },
  infoIcon:      { width: 30, alignItems: 'center', paddingTop: 2 },
  infoLabel:     { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue:     { color: Colors.text, fontSize: Font.sm },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  toggleIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  toggleLabel:   { flex: 1, color: Colors.text, fontSize: Font.base, fontWeight: '600' },
  contactRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  contactIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactLabel:  { color: Colors.textMuted, fontSize: 11, marginBottom: 1 },
  contactValue:  { fontSize: Font.sm, fontWeight: '700' },
  appInfo:       { alignItems: 'center', paddingVertical: 20, gap: 4 },
  appName:       { color: Colors.gold, fontSize: Font.md, fontWeight: '800' },
  appSub:        { color: Colors.textMuted, fontSize: Font.sm },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: Spacing.md, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.red + '50', backgroundColor: Colors.red + '10' },
  logoutText:    { color: Colors.red, fontSize: Font.base, fontWeight: '700' },
});
