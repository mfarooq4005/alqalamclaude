// ═══════════════════════════════════════════════════════
//  Login Screen — All Roles
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { Input, Button } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';

const QUICK_LOGINS = [
  { label: '👑 Admin',    u: 'admin',      p: 'AqAdmin@2024',    color: Colors.gold   },
  { label: '🎓 Principal',u: 'principal',  p: 'AqPrincipal@24',  color: Colors.purple },
  { label: '📚 Teacher',  u: 'teacher01',  p: 'AqTeach@2024',    color: Colors.cyan   },
  { label: '🎒 Student',  u: 'AQ-2024-1045',p:'Student@123',     color: Colors.text   },
  { label: '👨 Parent',   u: 'parent_ali', p: 'Parent@2024',     color: Colors.green  },
  { label: '💰 Accounts', u: 'accountant1',p: 'AqAcct@2024',     color: Colors.orange },
];

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    clearError();
    await login(username.trim(), password);
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u); setPassword(p); setShowQuick(false);
  };

  return (
    <LinearGradient colors={['#0d1117', '#161b22', '#0d1117']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <FontAwesome5 name="graduation-cap" size={36} color={Colors.gold} />
            </View>
            <Text style={styles.schoolName}>AL QALAM INTERNATIONAL</Text>
            <Text style={styles.schoolSub}>Education Management System</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back 👋</Text>
            <Text style={styles.cardSub}>Apna role select karein ya credentials enter karein</Text>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <FontAwesome5 name="exclamation-circle" size={13} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Inputs */}
            <Input
              label="Username / Student ID"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              icon="user"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              icon="lock"
              secureTextEntry
            />

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              label="Login"
              icon="sign-in-alt"
              color={Colors.gold}
              loading={isLoading}
              disabled={!username || !password}
              style={{ marginTop: 4 }}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>ya Quick Login</Text>
              <View style={styles.divLine} />
            </View>

            {/* Quick Login Toggle */}
            <TouchableOpacity onPress={() => setShowQuick(!showQuick)} style={styles.quickToggle}>
              <FontAwesome5 name={showQuick ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
              <Text style={styles.quickToggleText}>Demo Accounts {showQuick ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>

            {showQuick && (
              <View style={styles.quickGrid}>
                {QUICK_LOGINS.map((q, i) => (
                  <TouchableOpacity key={i} onPress={() => quickFill(q.u, q.p)}
                    style={[styles.quickBtn, { borderColor: q.color + '40' }]}>
                    <Text style={[styles.quickBtnText, { color: q.color }]}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>AL Qalam EMS v1.0 · alqalam.edu.pk</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 2, borderColor: Colors.gold + '50',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  schoolName: { fontSize: 18, fontWeight: '800', color: Colors.gold, letterSpacing: 1.5, textAlign: 'center' },
  schoolSub:  { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.bg2, borderRadius: Radius.xl,
    padding: 24, borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontSize: Font['2xl'], fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub:   { fontSize: Font.sm, color: Colors.textMuted, marginBottom: 20 },
  errorBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: Colors.red + '12', borderRadius: Radius.md,
    borderLeftWidth: 3, borderLeftColor: Colors.red,
    padding: 12, marginBottom: 16,
  },
  errorText:  { color: Colors.red, fontSize: Font.sm, flex: 1 },
  divider:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divLine:    { flex: 1, height: 1, backgroundColor: Colors.border },
  divText:    { fontSize: Font.sm, color: Colors.textMuted },
  quickToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', padding: 8,
  },
  quickToggleText: { color: Colors.textMuted, fontSize: Font.sm },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    backgroundColor: Colors.bg3,
  },
  quickBtnText: { fontSize: Font.sm, fontWeight: '600' },
  footer:     { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: Font.sm, color: Colors.textMuted },
});
