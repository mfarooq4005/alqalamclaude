// ═══════════════════════════════════════════════════════
//  AL Qalam EMS — Shared Components
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, Shadow } from '../theme';

const { width: W } = Dimensions.get('window');

// ── Card ───────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: any;
  accent?: string;
  noPad?: boolean;
}
export function Card({ children, style, accent, noPad }: CardProps) {
  return (
    <View style={[styles.card, accent && { borderLeftColor: accent, borderLeftWidth: 3 }, noPad && { padding: 0 }, style]}>
      {children}
    </View>
  );
}

// ── Stat Card ──────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  style?: any;
  onPress?: () => void;
}
export function StatCard({ label, value, icon, color = Colors.gold, style, onPress }: StatCardProps) {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp onPress={onPress} style={[styles.statCard, style, { borderColor: color + '33' }]} activeOpacity={0.75}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <FontAwesome5 name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Comp>
  );
}

// ── Button ─────────────────────────────────────────────
interface BtnProps {
  onPress: () => void;
  label: string;
  icon?: string;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  outline?: boolean;
  style?: any;
  small?: boolean;
}
export function Button({ onPress, label, icon, color = Colors.gold, loading, disabled, outline, style, small }: BtnProps) {
  if (outline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.btnOutline, { borderColor: color }, small && styles.btnSm, style]}
        activeOpacity={0.7}>
        {loading ? <ActivityIndicator size="small" color={color} /> : (
          <>
            {icon && <FontAwesome5 name={icon} size={small ? 11 : 13} color={color} style={{ marginRight: 6 }} />}
            <Text style={[styles.btnOutlineText, { color }, small && { fontSize: 12 }]}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={[small && styles.btnSm, style]}>
      <LinearGradient colors={[color, color + 'bb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.btn, small && styles.btnSmInner]}>
        {loading ? <ActivityIndicator size="small" color="#000" /> : (
          <>
            {icon && <FontAwesome5 name={icon} size={small ? 11 : 14} color="#000" style={{ marginRight: 6 }} />}
            <Text style={[styles.btnText, small && { fontSize: 12 }]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Input ──────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon?: string;
  error?: string;
  multiline?: boolean;
  style?: any;
}
export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, icon, error, multiline, style }: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.inputWrap, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputRow, error && { borderColor: Colors.red }]}>
        {icon && (
          <FontAwesome5 name={icon} size={14} color={Colors.textMuted}
            style={{ marginRight: 10, width: 18, textAlign: 'center' }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(!show)}>
            <FontAwesome5 name={show ? 'eye-slash' : 'eye'} size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

// ── Badge ──────────────────────────────────────────────
export function Badge({ label, color = Colors.gold }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Section Header ─────────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.secHeader}>
      <Text style={styles.secTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: Colors.cyan, fontSize: Font.sm }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Loading Overlay ────────────────────────────────────
export function LoadingOverlay({ visible, label = 'Loading...' }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={{ color: Colors.text, marginTop: 12, fontSize: Font.sm }}>{label}</Text>
      </View>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <FontAwesome5 name={icon} size={40} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Status Dot ─────────────────────────────────────────
export function StatusDot({ status }: { status: 'present' | 'absent' | 'late' | 'leave' | string }) {
  const colorMap: Record<string, string> = {
    present: Colors.green, absent: Colors.red, late: Colors.gold,
    leave: Colors.purple, holiday: Colors.cyan,
  };
  const c = colorMap[status] || Colors.textMuted;
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />;
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  statCard: {
    backgroundColor: Colors.bg2, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, flex: 1, ...Shadow.sm,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: Font.xl, fontWeight: Font.weight.bold, marginBottom: 2 },
  statLabel: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },
  btn: {
    borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#000', fontWeight: Font.weight.bold, fontSize: Font.md },
  btnOutline: {
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontWeight: Font.weight.semibold, fontSize: Font.base },
  btnSm: { alignSelf: 'flex-start' },
  btnSmInner: { paddingVertical: 8, paddingHorizontal: 14 },
  inputWrap: { marginBottom: Spacing.md },
  inputLabel: { color: Colors.textMuted, fontSize: Font.sm, marginBottom: 6, fontWeight: Font.weight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg3, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  input: { flex: 1, color: Colors.text, fontSize: Font.base },
  inputError: { color: Colors.red, fontSize: Font.sm, marginTop: 4 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: Font.weight.bold },
  secHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  secTitle: { color: Colors.text, fontSize: Font.md, fontWeight: Font.weight.bold },
  loadingOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  loadingBox: {
    backgroundColor: Colors.bg2, borderRadius: Radius.xl,
    padding: 32, alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.textMuted, fontSize: Font.md,
    fontWeight: Font.weight.semibold, marginTop: 16, textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textMuted, fontSize: Font.sm,
    marginTop: 6, textAlign: 'center',
  },
});

// ── Skeleton Loader ────────────────────────────────────────────
import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

export function SkeletonBox({ width, height, style }: { width?: any; height?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View style={[{ width: width ?? '100%', height: height ?? 16, borderRadius: 6, backgroundColor: Colors.bg3 }, style, { opacity }]} />
  );
}

export function ScreenLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, padding: 20, paddingTop: 32 }}>
      <SkeletonBox height={32} width="60%" style={{ marginBottom: 20 }} />
      <SkeletonBox height={90} style={{ marginBottom: 12, borderRadius: 12 }} />
      <SkeletonBox height={90} style={{ marginBottom: 12, borderRadius: 12 }} />
      <SkeletonBox height={60} style={{ marginBottom: 12, borderRadius: 12 }} />
      <SkeletonBox height={60} style={{ borderRadius: 12 }} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <FontAwesome5 name="exclamation-circle" size={40} color={Colors.red} />
      <Text style={{ color: Colors.text, fontSize: Font.md, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
        Data load nahi ho saka
      </Text>
      <Text style={{ color: Colors.textMuted, fontSize: Font.sm, marginTop: 8, textAlign: 'center' }}>
        {message ?? 'Internet connection check karein aur dobara try karein'}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.green + '20', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.green + '50' }}>
          <Text style={{ color: Colors.green, fontWeight: '700' }}>Dobara Try Karein</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Notification Bell with Badge ───────────────────────────────
export function NotifBell({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
      <FontAwesome5 name="bell" size={17} color={Colors.text} />
      {count > 0 && (
        <View style={{
          position: 'absolute', top: 2, right: 2,
          width: 16, height: 16, borderRadius: 8,
          backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1.5, borderColor: Colors.bg,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
