// ═══════════════════════════════════════════════════════
//  Splash / Entry — checks saved login
// ═══════════════════════════════════════════════════════

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/auth';
import { Colors, Font } from '../src/theme';

export default function Index() {
  const { loadSaved } = useAuthStore();

  useEffect(() => {
    // 1.5s splash then check saved token
    const t = setTimeout(() => loadSaved(), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={['#0d1117', '#161b22', '#0d1117']} style={styles.container}>
      <View style={styles.logoWrap}>
        {/* School Logo Placeholder */}
        <View style={styles.logoCircle}>
          <FontAwesome5 name="graduation-cap" size={48} color={Colors.gold} />
        </View>
        <Text style={styles.schoolName}>AL QALAM</Text>
        <Text style={styles.schoolSub}>INTERNATIONAL</Text>
        <Text style={styles.ems}>EMS — School Management</Text>
      </View>

      {/* Animated dots */}
      <View style={styles.dotsRow}>
        {[Colors.gold, Colors.cyan, Colors.purple].map((c, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: c, opacity: 0.6 + i * 0.2 }]} />
        ))}
      </View>

      <Text style={styles.loading}>Loading...</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap:  { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 2, borderColor: Colors.gold + '50',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  schoolName: {
    fontSize: 32, fontWeight: '800', color: Colors.gold,
    letterSpacing: 4,
  },
  schoolSub: {
    fontSize: 14, fontWeight: '600', color: Colors.textMuted,
    letterSpacing: 6, marginTop: 2,
  },
  ems: { fontSize: 13, color: Colors.textMuted, marginTop: 10 },
  dotsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  loading: { color: Colors.textMuted, fontSize: Font.sm },
});
