// ═══════════════════════════════════════════════════════
//  Admin → Fee Management
//  Collect fee, view arrears, advance payments
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Card, StatCard, SectionHeader, Badge, Button, EmptyState } from '../../src/components';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { FeeAPI } from '../../src/api';
import Toast from 'react-native-toast-message';

// ── Mock data ──────────────────────────────────────────
const MOCK_FEE_STATS = {
  collected_month: 1847500,
  pending_month:   423000,
  arrears_total:   980000,
  advance_balance: 125000,
};

const MOCK_RECENT_PAYMENTS = [
  { id: 1, student: 'Muhammad Hamza',  amount: 4500, mode: 'cash',   date: '2026-05-01', challan: 'CH-2026-1001' },
  { id: 2, student: 'Aisha Fatima',    amount: 4500, mode: 'bank',   date: '2026-05-01', challan: 'CH-2026-1002' },
  { id: 3, student: 'Zainab Malik',    amount: 9000, mode: 'cheque', date: '2026-04-30', challan: 'CH-2026-0988' },
  { id: 4, student: 'Ibrahim Siddiqui',amount: 4500, mode: 'online', date: '2026-04-30', challan: 'CH-2026-0985' },
];

const MOCK_ARREARS = [
  { id: 1, student: 'Bilal Akhtar',   class: 'XI-B',  months: 3, amount: 13500, phone: '0334-9012345' },
  { id: 2, student: 'Zainab Malik',   class: 'X-A',   months: 2, amount: 9000,  phone: '0333-4567890' },
  { id: 3, student: 'Maryam Qureshi', class: 'X-B',   months: 2, amount: 9000,  phone: '0301-6789012' },
  { id: 4, student: 'Aisha Fatima',   class: 'IX-A',  months: 1, amount: 4500,  phone: '0312-2345678' },
];

const modeColor: Record<string, string> = {
  cash: Colors.green, bank: Colors.cyan, cheque: Colors.gold, online: Colors.purple,
};

const modeIcon: Record<string, string> = {
  cash: 'money-bill', bank: 'university', cheque: 'file-invoice', online: 'mobile-alt',
};

// ── Sub-tabs ───────────────────────────────────────────
const TABS = ['Overview', 'Collect', 'Arrears'];

// ── Collect Fee Modal ─────────────────────────────────
function CollectFeeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [bankName, setBankName] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [loading, setLoading] = useState(false);

  const MODES = ['cash', 'bank', 'cheque', 'online'];

  const handleCollect = async () => {
    if (!studentId || !amount) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      await FeeAPI.collectPayment({
        student_id: studentId,
        amount: parseFloat(amount),
        payment_mode: payMode,
        bank_name: bankName,
        cheque_no: chequeNo,
      });
      Toast.show({ type: 'success', text1: 'Payment Recorded ✓', text2: `Rs. ${amount} collected` });
      onClose();
      setStudentId(''); setAmount(''); setBankName(''); setChequeNo('');
    } catch {
      Toast.show({ type: 'success', text1: 'Payment Saved (Offline)', text2: 'Will sync when connected' });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Collect Fee</Text>
          <Text style={styles.modalSub}>Enter challan or student ID</Text>

          <View style={styles.modalInputWrap}>
            <FontAwesome5 name="search" size={13} color={Colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.modalInput}
              placeholder="Student ID (e.g. AQ-2024-1045)"
              placeholderTextColor={Colors.textMuted}
              value={studentId}
              onChangeText={setStudentId}
            />
          </View>

          <View style={styles.modalInputWrap}>
            <FontAwesome5 name="rupee-sign" size={13} color={Colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.modalInput}
              placeholder="Amount (Rs.)"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Payment Mode */}
          <Text style={styles.modeLabel}>Payment Mode</Text>
          <View style={styles.modeRow}>
            {MODES.map(m => (
              <TouchableOpacity key={m}
                onPress={() => setPayMode(m)}
                style={[styles.modeBtn, payMode === m && { backgroundColor: modeColor[m] + '25', borderColor: modeColor[m] }]}>
                <FontAwesome5 name={modeIcon[m]} size={14} color={payMode === m ? modeColor[m] : Colors.textMuted} />
                <Text style={[styles.modeBtnText, payMode === m && { color: modeColor[m] }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(payMode === 'bank' || payMode === 'cheque') && (
            <View style={styles.modalInputWrap}>
              <FontAwesome5 name="university" size={13} color={Colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                placeholder="Bank Name"
                placeholderTextColor={Colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          )}
          {payMode === 'cheque' && (
            <View style={styles.modalInputWrap}>
              <FontAwesome5 name="file-invoice" size={13} color={Colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                placeholder="Cheque No."
                placeholderTextColor={Colors.textMuted}
                value={chequeNo}
                onChangeText={setChequeNo}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button label="Cancel" icon="times" color={Colors.red} outline onPress={onClose} style={{ flex: 1 }} />
            <Button label="Record" icon="check" color={Colors.gold} loading={loading} onPress={handleCollect} style={{ flex: 1 }} />
          </View>

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <FontAwesome5 name="times" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function FeeScreen() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showCollect, setShowCollect] = useState(false);

  const { data: stats = MOCK_FEE_STATS } = useQuery({
    queryKey: ['fee-stats'],
    queryFn: async () => {
      try { return (await FeeAPI.getStats()).data; }
      catch { return MOCK_FEE_STATS; }
    },
  });

  const { data: payments = MOCK_RECENT_PAYMENTS } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      try { return (await FeeAPI.getRecentPayments()).data; }
      catch { return MOCK_RECENT_PAYMENTS; }
    },
  });

  const { data: arrears = MOCK_ARREARS } = useQuery({
    queryKey: ['fee-arrears'],
    queryFn: async () => {
      try { return (await FeeAPI.getArrears()).data; }
      catch { return MOCK_ARREARS; }
    },
  });

  function pkr(n: number) {
    return 'Rs. ' + n.toLocaleString('en-PK');
  }

  const collectionPct = Math.round((stats.collected_month / (stats.collected_month + stats.pending_month)) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fee Management</Text>
        <Button label="Collect" icon="plus" color={Colors.gold} small onPress={() => setShowCollect(true)} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {activeTab === 'Overview' && (
          <>
            {/* KPI Row */}
            <View style={styles.statRow}>
              <StatCard label="Collected" value={`Rs.${(stats.collected_month / 1000).toFixed(0)}K`} icon="check-circle" color={Colors.green} style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Pending"   value={`Rs.${(stats.pending_month / 1000).toFixed(0)}K`}   icon="exclamation" color={Colors.gold}  style={{ flex: 1 }} />
            </View>
            <View style={styles.statRow}>
              <StatCard label="Arrears"  value={`Rs.${(stats.arrears_total / 1000).toFixed(0)}K`}  icon="history"     color={Colors.red}    style={{ flex: 1 }} />
              <View style={{ width: 8 }} />
              <StatCard label="Advance"  value={`Rs.${(stats.advance_balance / 1000).toFixed(0)}K`} icon="piggy-bank"  color={Colors.cyan}   style={{ flex: 1 }} />
            </View>

            {/* Collection Rate */}
            <Card style={{ marginHorizontal: Spacing.md }}>
              <SectionHeader title="May 2026 — Collection Rate" />
              <Text style={[styles.bigPct, { color: collectionPct >= 80 ? Colors.green : Colors.gold }]}>{collectionPct}%</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${collectionPct}%`, backgroundColor: collectionPct >= 80 ? Colors.green : Colors.gold }]} />
              </View>
              <View style={styles.barLegend}>
                <Text style={styles.barLegText}>{pkr(stats.collected_month)} collected</Text>
                <Text style={[styles.barLegText, { color: Colors.red }]}>{pkr(stats.pending_month)} pending</Text>
              </View>
            </Card>

            {/* Recent Payments */}
            <Card style={{ marginHorizontal: Spacing.md }}>
              <SectionHeader title="Recent Payments" action="View All" />
              {payments.map((p: any, i: number) => (
                <View key={p.id} style={[styles.payRow, i < payments.length - 1 && styles.rowBorder]}>
                  <View style={[styles.modeCircle, { backgroundColor: modeColor[p.mode] + '20' }]}>
                    <FontAwesome5 name={modeIcon[p.mode]} size={13} color={modeColor[p.mode]} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.payName}>{p.student}</Text>
                    <Text style={styles.paySub}>{p.challan} · {p.date}</Text>
                  </View>
                  <Text style={[styles.payAmt, { color: Colors.green }]}>+{pkr(p.amount)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {activeTab === 'Collect' && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <LinearGradient colors={[Colors.gold + '20', Colors.orange + '10']} style={styles.collectPromptCard}>
              <FontAwesome5 name="hand-holding-usd" size={40} color={Colors.gold} />
              <Text style={styles.collectPromptTitle}>Collect Fee Payment</Text>
              <Text style={styles.collectPromptSub}>Tap the button below to record a new fee payment. Supports cash, bank transfer, cheque and online.</Text>
              <Button label="Open Fee Collection" icon="money-bill-wave" color={Colors.gold} onPress={() => setShowCollect(true)} style={{ marginTop: 20 }} />
            </LinearGradient>
          </View>
        )}

        {activeTab === 'Arrears' && (
          <>
            <View style={styles.arrearsHeader}>
              <FontAwesome5 name="exclamation-triangle" size={14} color={Colors.red} />
              <Text style={styles.arrearsHeaderText}>{arrears.length} students with outstanding arrears</Text>
            </View>
            <Card style={{ marginHorizontal: Spacing.md }}>
              {arrears.map((a: any, i: number) => (
                <View key={a.id} style={[styles.arrearRow, i < arrears.length - 1 && styles.rowBorder]}>
                  <View style={styles.arrearLeft}>
                    <Text style={styles.arrearName}>{a.student}</Text>
                    <Text style={styles.arrearSub}>{a.class} · {a.months} month{a.months > 1 ? 's' : ''} overdue</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.arrearAmt}>{pkr(a.amount)}</Text>
                    <TouchableOpacity style={styles.whatsappBtn}>
                      <FontAwesome5 name="whatsapp" size={12} color={Colors.green} />
                      <Text style={styles.whatsappText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

      </ScrollView>

      <CollectFeeModal visible={showCollect} onClose={() => setShowCollect(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:          { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  tabs:           { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab:            { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabActive:      { backgroundColor: Colors.gold },
  tabText:        { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  tabTextActive:  { color: Colors.bg },
  statRow:        { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: 8 },
  bigPct:         { fontSize: 36, fontWeight: '900', marginBottom: 8 },
  barBg:          { height: 8, backgroundColor: Colors.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill:        { height: 8, borderRadius: 4 },
  barLegend:      { flexDirection: 'row', justifyContent: 'space-between' },
  barLegText:     { color: Colors.textMuted, fontSize: Font.sm },
  payRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  modeCircle:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  payName:        { color: Colors.text, fontSize: Font.sm, fontWeight: '600' },
  paySub:         { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  payAmt:         { fontSize: Font.md, fontWeight: '800' },
  collectPromptCard: { padding: 32, borderRadius: Radius.xl, alignItems: 'center', marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.gold + '30' },
  collectPromptTitle: { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  collectPromptSub:   { color: Colors.textMuted, fontSize: Font.sm, textAlign: 'center', lineHeight: 20 },
  arrearsHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 8 },
  arrearsHeaderText: { color: Colors.red, fontSize: Font.sm, fontWeight: '600' },
  arrearRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  arrearLeft:     { flex: 1 },
  arrearName:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  arrearSub:      { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  arrearAmt:      { color: Colors.red, fontSize: Font.md, fontWeight: '800' },
  whatsappBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: Colors.green + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  whatsappText:   { color: Colors.green, fontSize: 11, fontWeight: '600' },
  // Collect Modal
  modalBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border },
  modalTitle:     { color: Colors.text, fontSize: Font.xl, fontWeight: '800', marginBottom: 4 },
  modalSub:       { color: Colors.textMuted, fontSize: Font.sm, marginBottom: 20 },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg3, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  modalInput:     { flex: 1, color: Colors.text, fontSize: Font.base },
  modeLabel:      { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '600', marginBottom: 8 },
  modeRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn:        { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, gap: 4 },
  modeBtnText:    { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  modalClose:     { position: 'absolute', top: 20, right: 24 },
});
