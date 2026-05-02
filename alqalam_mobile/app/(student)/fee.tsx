// ═══════════════════════════════════════════════════════
//  Student → My Fee
//  Fee history, challan details, payment status
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, Badge } from '../../src/components';

// ── Mock fee data ──────────────────────────────────────
const MOCK_FEE_SUMMARY = {
  monthly_fee: 4500,
  annual_paid: 40500,
  arrears:     0,
  advance:     0,
};

const MOCK_FEE_HISTORY = [
  { id: 1,  month: 'May 2026',  amount: 4500, status: 'paid',    paid_on: '2026-05-01', mode: 'cash',   challan: 'CH-2026-1045' },
  { id: 2,  month: 'Apr 2026',  amount: 4500, status: 'paid',    paid_on: '2026-04-03', mode: 'bank',   challan: 'CH-2026-0988' },
  { id: 3,  month: 'Mar 2026',  amount: 4500, status: 'paid',    paid_on: '2026-03-05', mode: 'cash',   challan: 'CH-2026-0921' },
  { id: 4,  month: 'Feb 2026',  amount: 4500, status: 'paid',    paid_on: '2026-02-02', mode: 'cheque', challan: 'CH-2026-0854' },
  { id: 5,  month: 'Jan 2026',  amount: 4500, status: 'paid',    paid_on: '2026-01-04', mode: 'cash',   challan: 'CH-2026-0789' },
  { id: 6,  month: 'Dec 2025',  amount: 4500, status: 'paid',    paid_on: '2025-12-03', mode: 'online', challan: 'CH-2025-0755' },
  { id: 7,  month: 'Nov 2025',  amount: 4500, status: 'paid',    paid_on: '2025-11-05', mode: 'cash',   challan: 'CH-2025-0698' },
  { id: 8,  month: 'Oct 2025',  amount: 4500, status: 'paid',    paid_on: '2025-10-02', mode: 'bank',   challan: 'CH-2025-0641' },
  { id: 9,  month: 'Sep 2025',  amount: 4500, status: 'paid',    paid_on: '2025-09-04', mode: 'cash',   challan: 'CH-2025-0587' },
];

const statusColor: Record<string, string> = { paid: Colors.green, pending: Colors.gold, overdue: Colors.red };
const modeIcon: Record<string, string> = { cash: 'money-bill', bank: 'university', cheque: 'file-invoice', online: 'mobile-alt' };
const modeColor: Record<string, string> = { cash: Colors.green, bank: Colors.cyan, cheque: Colors.gold, online: Colors.purple };

// ── Challan Detail Modal ───────────────────────────────
function ChallanModal({ item, onClose }: { item: any; onClose: () => void }) {
  if (!item) return null;
  return (
    <Modal visible={!!item} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Fee Receipt</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* School Name */}
          <View style={styles.receiptSchool}>
            <FontAwesome5 name="graduation-cap" size={20} color={Colors.gold} />
            <Text style={styles.receiptSchoolName}>AL QALAM INTERNATIONAL</Text>
          </View>

          <View style={styles.receiptDivider} />

          {[
            { label: 'Challan No.',   value: item.challan },
            { label: 'Month',         value: item.month   },
            { label: 'Amount',        value: `Rs. ${item.amount.toLocaleString()}` },
            { label: 'Payment Mode',  value: item.mode.charAt(0).toUpperCase() + item.mode.slice(1) },
            { label: 'Paid Date',     value: item.paid_on  },
            { label: 'Status',        value: item.status.toUpperCase() },
          ].map(row => (
            <View key={row.label} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{row.label}</Text>
              <Text style={[styles.receiptValue, row.label === 'Status' && { color: Colors.green }]}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.receiptDivider} />
          <View style={styles.receiptStamp}>
            <FontAwesome5 name="check-circle" size={14} color={Colors.green} />
            <Text style={styles.receiptStampText}>PAID — Valid Receipt</Text>
          </View>

          <TouchableOpacity style={styles.printBtn}>
            <FontAwesome5 name="print" size={13} color={Colors.bg} />
            <Text style={styles.printBtnText}>Print / Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function StudentFee() {
  const [selected, setSelected] = useState<any>(null);

  const paidMonths  = MOCK_FEE_HISTORY.filter(f => f.status === 'paid').length;
  const totalPaid   = MOCK_FEE_HISTORY.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Fee</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Summary Banner */}
        <LinearGradient colors={[Colors.green + '20', Colors.cyan + '10']}
          style={[styles.summaryBanner, { borderColor: Colors.green + '30' }]}>
          <View style={styles.summaryLeft}>
            <FontAwesome5 name="check-circle" size={28} color={Colors.green} />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.summaryStatus}>All Fees Clear</Text>
              <Text style={styles.summaryTotal}>Total Paid: Rs. {totalPaid.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryMonthly}>Rs. {MOCK_FEE_SUMMARY.monthly_fee.toLocaleString()}</Text>
            <Text style={styles.summaryMonthlyLabel}>per month</Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.green }]}>{paidMonths}</Text>
            <Text style={styles.statLabel}>Months Paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.gold }]}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.cyan }]}>0</Text>
            <Text style={styles.statLabel}>Arrears</Text>
          </View>
        </View>

        {/* Payment History */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Payment History" />
          {MOCK_FEE_HISTORY.map((f, i) => (
            <TouchableOpacity key={f.id}
              style={[styles.historyRow, i < MOCK_FEE_HISTORY.length - 1 && styles.rowBorder]}
              onPress={() => setSelected(f)}
              activeOpacity={0.75}>
              <View style={[styles.modeIcon, { backgroundColor: modeColor[f.mode] + '18' }]}>
                <FontAwesome5 name={modeIcon[f.mode]} size={13} color={modeColor[f.mode]} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.historyMonth}>{f.month}</Text>
                <Text style={styles.historyChallan}>{f.challan}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyAmount, { color: Colors.green }]}>Rs. {f.amount.toLocaleString()}</Text>
                <View style={[styles.statusTag, { backgroundColor: statusColor[f.status] + '18' }]}>
                  <Text style={[styles.statusTagText, { color: statusColor[f.status] }]}>{f.status}</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </Card>

      </ScrollView>

      <ChallanModal item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.bg },
  header:            { paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:             { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  summaryBanner:     { marginHorizontal: Spacing.md, borderRadius: Radius.xl, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, marginBottom: Spacing.md },
  summaryLeft:       { flexDirection: 'row', alignItems: 'center' },
  summaryStatus:     { color: Colors.green, fontSize: Font.md, fontWeight: '800' },
  summaryTotal:      { color: Colors.textMuted, fontSize: Font.sm, marginTop: 3 },
  summaryRight:      { alignItems: 'flex-end' },
  summaryMonthly:    { color: Colors.text, fontSize: Font.xl, fontWeight: '900' },
  summaryMonthlyLabel: { color: Colors.textMuted, fontSize: 11 },
  statsRow:          { flexDirection: 'row', backgroundColor: Colors.bg2, marginHorizontal: Spacing.md, borderRadius: Radius.lg, paddingVertical: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  statItem:          { flex: 1, alignItems: 'center' },
  statVal:           { fontSize: Font.xl, fontWeight: '900' },
  statLabel:         { color: Colors.textMuted, fontSize: 11, marginTop: 3 },
  statDivider:       { width: 1, backgroundColor: Colors.border },
  historyRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder:         { borderBottomWidth: 1, borderBottomColor: Colors.border },
  modeIcon:          { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  historyMonth:      { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  historyChallan:    { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  historyAmount:     { fontSize: Font.md, fontWeight: '800' },
  statusTag:         { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 3 },
  statusTagText:     { fontSize: 10, fontWeight: '700' },
  // Modal
  modalBg:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:         { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border },
  modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:        { color: Colors.text, fontSize: Font.lg, fontWeight: '800' },
  receiptSchool:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  receiptSchoolName: { color: Colors.gold, fontSize: Font.md, fontWeight: '800', letterSpacing: 1 },
  receiptDivider:    { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  receiptRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel:      { color: Colors.textMuted, fontSize: Font.sm },
  receiptValue:      { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  receiptStamp:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  receiptStampText:  { color: Colors.green, fontSize: Font.sm, fontWeight: '800' },
  printBtn:          { backgroundColor: Colors.gold, borderRadius: Radius.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  printBtnText:      { color: Colors.bg, fontWeight: '800', fontSize: Font.sm },
});
