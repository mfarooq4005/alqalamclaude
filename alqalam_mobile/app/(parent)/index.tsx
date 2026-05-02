// ═══════════════════════════════════════════════════════════════
//  Parent Dashboard — Real API (no mock data)
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, ScreenLoader, ErrorState, NotifBell } from '../../src/components';
import { useAuthStore } from '../../src/store/auth';
import { useNotificationStore } from '../../src/store/notifications';
import { useMyChildren } from '../../src/api/hooks';

export default function ParentDashboard() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const unread   = useNotificationStore((s) => s.unreadCount());

  const { data: children, isLoading, isError, refetch, isFetching } = useMyChildren();

  if (isLoading) return <ScreenLoader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const childList = Array.isArray(children) ? children : [];

  // Calculate total pending fee
  const totalPending = childList
    .filter((c: any) => c.fee_status === 'pending' || c.current_fee_status === 'pending')
    .reduce((sum: number, c: any) => sum + (c.monthly_fee ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.green} />}>

        {/* Header */}
        <LinearGradient colors={['#0d2018', '#0d1117']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Assalam o Alaikum 👋</Text>
            <Text style={styles.name}>{user?.full_name ?? user?.username ?? 'Parent'}</Text>
            <Text style={styles.meta}>{childList.length} {childList.length === 1 ? 'child' : 'children'} enrolled</Text>
          </View>
          <NotifBell count={unread} onPress={() => router.push('/notifications')} />
        </LinearGradient>

        {/* Pending Fee Alert */}
        {totalPending > 0 && (
          <TouchableOpacity onPress={() => router.push('/(parent)/fee')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold + '20', '#0d1117']} style={[styles.alertBanner, { borderColor: Colors.gold + '50' }]}>
              <FontAwesome5 name="exclamation-circle" size={22} color={Colors.gold} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.alertTitle, { color: Colors.gold }]}>Fee Due</Text>
                <Text style={styles.alertSub}>Rs. {totalPending.toLocaleString()} pending — pay karein</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color={Colors.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Children Cards */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="My Children" action={{ label: 'Details', onPress: () => router.push('/(parent)/children') }} />
          {childList.length === 0 ? (
            <Text style={styles.emptyText}>Koi bachcha enroll nahi mila</Text>
          ) : (
            childList.map((child: any, i: number) => {
              const attPct    = child.attendance_pct  ?? child.attendance_percentage ?? 0;
              const feePaid   = child.fee_status === 'paid' || child.current_fee_status === 'paid';
              const lastGrade = child.last_grade ?? child.grade ?? '—';
              const cc        = child.gender === 'female' ? Colors.purple : Colors.cyan;

              return (
                <TouchableOpacity
                  key={child.id ?? i}
                  style={[styles.childCard, i > 0 && styles.rowBorder]}
                  onPress={() => router.push({ pathname: '/(parent)/children', params: { id: child.id } })}
                  activeOpacity={0.8}>

                  {/* Avatar */}
                  <View style={[styles.childAvatar, { backgroundColor: cc + '18' }]}>
                    <FontAwesome5 name="user-graduate" size={16} color={cc} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childMeta}>{child.class} {child.section} · Roll: {child.roll_no}</Text>

                    {/* Mini stats row */}
                    <View style={styles.childStats}>
                      <View style={styles.childStat}>
                        <FontAwesome5 name="clipboard-check" size={10} color={attPct >= 75 ? Colors.green : Colors.red} />
                        <Text style={[styles.childStatVal, { color: attPct >= 75 ? Colors.green : Colors.red }]}>
                          {Math.round(attPct)}%
                        </Text>
                      </View>
                      <View style={styles.childStat}>
                        <FontAwesome5 name="graduation-cap" size={10} color={Colors.purple} />
                        <Text style={[styles.childStatVal, { color: Colors.purple }]}>{lastGrade}</Text>
                      </View>
                      <View style={[styles.childFeePill, { backgroundColor: feePaid ? Colors.green + '18' : Colors.gold + '18', borderColor: (feePaid ? Colors.green : Colors.gold) + '40' }]}>
                        <Text style={[styles.childFeeText, { color: feePaid ? Colors.green : Colors.gold }]}>
                          {feePaid ? 'Fee Paid' : 'Fee Due'}
                        </Text>
                      </View>
                    </View>

                    {/* Attendance bar */}
                    <View style={styles.miniBar}>
                      <View style={[styles.miniBarFill, { width: `${Math.min(100, attPct)}%`, backgroundColor: attPct >= 75 ? Colors.green : Colors.red }]} />
                    </View>
                  </View>

                  <FontAwesome5 name="chevron-right" size={11} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        {/* Quick Navigation */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Quick Access" />
          <View style={styles.quickGrid}>
            {[
              { label: 'Fee',        icon: 'money-bill',      color: Colors.gold,   route: '/(parent)/fee'        },
              { label: 'Attendance', icon: 'clipboard-check', color: Colors.cyan,   route: '/(parent)/attendance' },
              { label: 'Children',   icon: 'user-graduate',   color: Colors.purple, route: '/(parent)/children'   },
              { label: 'Profile',    icon: 'cog',             color: Colors.textMuted, route: '/(parent)/profile' },
            ].map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickBtn, { backgroundColor: q.color + '15', borderColor: q.color + '40' }]}
                onPress={() => router.push(q.route as any)}>
                <FontAwesome5 name={q.icon} size={20} color={q.color} />
                <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 20 },
  greeting:     { color: Colors.textMuted, fontSize: Font.sm },
  name:         { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginTop: 2 },
  meta:         { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  alertBanner:  { marginHorizontal: Spacing.md, borderRadius: Radius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  alertTitle:   { fontSize: Font.md, fontWeight: '800' },
  alertSub:     { color: Colors.textMuted, fontSize: Font.sm, marginTop: 2 },
  childCard:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder:    { borderTopWidth: 1, borderTopColor: Colors.border },
  childAvatar:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  childName:    { color: Colors.text, fontSize: Font.base, fontWeight: '800' },
  childMeta:    { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  childStats:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  childStat:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  childStatVal: { fontSize: 11, fontWeight: '800' },
  childFeePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  childFeeText: { fontSize: 10, fontWeight: '700' },
  miniBar:      { height: 3, backgroundColor: Colors.bg3, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  miniBarFill:  { height: 3, borderRadius: 2 },
  emptyText:    { color: Colors.textMuted, fontSize: Font.sm, textAlign: 'center', paddingVertical: 20 },
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn:     { flex: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: Radius.lg, borderWidth: 1 },
  quickLabel:   { fontSize: Font.sm, fontWeight: '700' },
});
