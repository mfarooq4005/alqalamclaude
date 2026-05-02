// ═══════════════════════════════════════════════════════
//  Parent → Fee
//  Fee status for all children, payment history
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius } from '../../src/theme';
import { Card, SectionHeader, Button, Badge } from '../../src/components';
import Toast from 'react-native-toast-message';

const CHILDREN_FEE = [
  {
    id: 1, name: 'Muhammad Bilal', class: 'XI-A', monthly_fee: 4500, gender: 'male',
    current_status: 'paid', paid_on: '2026-05-01', next_month: 'June 2026',
    history: [
      { month: 'May 2026', amount: 4500, status: 'paid', paid_on: '2026-05-01', mode: 'cash',   challan: 'CH-2026-1045' },
      { month: 'Apr 2026', amount: 4500, status: 'paid', paid_on: '2026-04-03', mode: 'bank',   challan: 'CH-2026-0988' },
      { month: 'Mar 2026', amount: 4500, status: 'paid', paid_on: '2026-03-05', mode: 'online', challan: 'CH-2026-0921' },
    ],
  },
  {
    id: 2, name: 'Zara Saeed', class: 'VIII-B', monthly_fee: 4000, gender: 'female',
    current_status: 'pending', paid_on: null, next_month: 'May 2026',
    history: [
      { month: 'Apr 2026', amount: 4000, status: 'paid', paid_on: '2026-04-05', mode: 'cash',   challan: 'CH-2026-0991' },
      { month: 'Mar 2026', amount: 4000, status: 'paid', paid_on: '2026-03-08', mode: 'cheque', challan: 'CH-2026-0924' },
    ],
  },
];

const modeIcon: Record<string, string> = { cash: 'money-bill', bank: 'university', cheque: 'file-invoice', online: 'mobile-alt' };
const modeColor: Record<string, string> = { cash: Colors.green, bank: Colors.cyan, cheque: Colors.gold, online: Colors.purple };

// ── Challan Modal ──────────────────────────────────────
function ChallanModal({ item, childName, onClose }: { item: any; childName: string; onClose: () => void }) {
  if (!item) return null;
  return (
    <Modal visible={!!item} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Receipt</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.receiptSchool}>
            <FontAwesome5 name="graduation-cap" size={18} color={Colors.gold} />
            <Text style={styles.receiptSchoolName}>AL QALAM INTERNATIONAL</Text>
          </View>
          <View style={styles.receiptDivider} />
          {[
            { label: 'Student',      value: childName                },
            { label: 'Challan No.',  value: item.challan             },
            { label: 'Month',        value: item.month               },
            { label: 'Amount',       value: `Rs. ${item.amount.toLocaleString()}` },
            { label: 'Mode',         value: item.mode.charAt(0).toUpperCase() + item.mode.slice(1) },
            { label: 'Paid On',      value: item.paid_on             },
            { label: 'Status',       value: 'PAID'                   },
          ].map(row => (
            <View key={row.label} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{row.label}</Text>
              <Text style={[styles.receiptValue, row.label === 'Status' && { color: Colors.green }]}>{row.value}</Text>
            </View>
          ))}
          <View style={styles.receiptDivider} />
          <View style={styles.stampRow}>
            <FontAwesome5 name="check-circle" size={14} color={Colors.green} />
            <Text style={styles.stampText}>PAID — Official Receipt</Text>
          </View>
          <Button label="Print / Share Receipt" icon="print" color={Colors.gold} onPress={onClose} style={{ marginTop: 12 }} />
        </View>
      </View>
    </Modal>
  );
}

export default function ParentFee() {
  const [selectedChild, setSelectedChild] = useState(CHILDREN_FEE[0]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const totalDue = CHILDREN_FEE.filter(c => c.current_status !== 'paid').reduce((s, c) => s + c.monthly_fee, 0);
  const childColor = selectedChild.gender === 'male' ? Colors.cyan : Colors.purple;

  const handleWhatsApp = () => {
    Alert.alert('WhatsApp', 'Fee reminder will be sent to school via WhatsApp');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Fee Management</Text>
        {totalDue > 0 && (
          <View style={styles.alertPill}>
            <Text style={styles.alertText}>Rs. {totalDue.toLocaleString()} due</Text>
          </View>
        )}
      </View>

      {/* Child Tabs */}
      <View style={styles.childTabs}>
        {CHILDREN_FEE.map(c => (
          <TouchableOpacity key={c.id}
            onPress={() => setSelectedChild(c)}
            style={[styles.childTab, selectedChild.id === c.id && { borderColor: c.gender === 'male' ? Colors.cyan : Colors.purple, backgroundColor: (c.gender === 'male' ? Colors.cyan : Colors.purple) + '15' }]}>
            <Text style={[styles.childTabName, selectedChild.id === c.id && { color: Colors.text }]}>{c.name.split(' ')[0]}</Text>
            <View style={[styles.childStatusDot, { backgroundColor: c.current_status === 'paid' ? Colors.green : Colors.gold }]} />
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Current Month Status */}
        <LinearGradient
          colors={selectedChild.current_status === 'paid' ? [Colors.green + '20', Colors.cyan + '10'] : [Colors.gold + '20', Colors.orange + '10']}
          style={[styles.statusBanner, { borderColor: (selectedChild.current_status === 'paid' ? Colors.green : Colors.gold) + '40' }]}>
          <View style={styles.statusLeft}>
            <FontAwesome5
              name={selectedChild.current_status === 'paid' ? 'check-circle' : 'exclamation-circle'}
              size={28}
              color={selectedChild.current_status === 'paid' ? Colors.green : Colors.gold}
            />
            <View style={{ marginLeft: 14 }}>
              <Text style={[styles.statusTitle, { color: selectedChild.current_status === 'paid' ? Colors.green : Colors.gold }]}>
                {selectedChild.current_status === 'paid' ? 'Fee Paid ✓' : 'Fee Pending!'}
              </Text>
              <Text style={styles.statusSub}>
                {selectedChild.current_status === 'paid' ? `Paid on ${selectedChild.paid_on}` : `Due: ${selectedChild.next_month}`}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statusAmount}>Rs. {selectedChild.monthly_fee.toLocaleString()}</Text>
            <Text style={styles.statusAmountLabel}>per month</Text>
          </View>
        </LinearGradient>

        {/* Action Buttons (if pending) */}
        {selectedChild.current_status !== 'paid' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
              <FontAwesome5 name="whatsapp" size={16} color={Colors.green} />
              <Text style={[styles.actionBtnText, { color: Colors.green }]}>WhatsApp School</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.gold + '50', backgroundColor: Colors.gold + '12' }]}>
              <FontAwesome5 name="phone" size={16} color={Colors.gold} />
              <Text style={[styles.actionBtnText, { color: Colors.gold }]}>Call Office</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Child Info */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <View style={styles.childInfoRow}>
            <Text style={styles.childInfoLabel}>Student</Text>
            <Text style={styles.childInfoValue}>{selectedChild.name}</Text>
          </View>
          <View style={[styles.childInfoRow, styles.rowBorder]}>
            <Text style={styles.childInfoLabel}>Class</Text>
            <Text style={styles.childInfoValue}>{selectedChild.class}</Text>
          </View>
          <View style={[styles.childInfoRow, styles.rowBorder]}>
            <Text style={styles.childInfoLabel}>Monthly Fee</Text>
            <Text style={[styles.childInfoValue, { color: Colors.gold }]}>Rs. {selectedChild.monthly_fee.toLocaleString()}</Text>
          </View>
          <View style={[styles.childInfoRow, styles.rowBorder]}>
            <Text style={styles.childInfoLabel}>Next Due</Text>
            <Text style={styles.childInfoValue}>{selectedChild.next_month}</Text>
          </View>
        </Card>

        {/* Payment History */}
        <Card style={{ marginHorizontal: Spacing.md }}>
          <SectionHeader title="Payment History" />
          {selectedChild.history.map((h, i) => (
            <TouchableOpacity key={i}
              style={[styles.historyRow, i < selectedChild.history.length - 1 && styles.rowBorder]}
              onPress={() => setSelectedReceipt(h)}
              activeOpacity={0.75}>
              <View style={[styles.modeCircle, { backgroundColor: modeColor[h.mode] + '18' }]}>
                <FontAwesome5 name={modeIcon[h.mode]} size={13} color={modeColor[h.mode]} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.historyMonth}>{h.month}</Text>
                <Text style={styles.historyChallan}>{h.challan} · {h.paid_on}</Text>
              </View>
              <Text style={[styles.historyAmount, { color: Colors.green }]}>Rs. {h.amount.toLocaleString()}</Text>
              <FontAwesome5 name="chevron-right" size={10} color={Colors.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </Card>

      </ScrollView>

      <ChallanModal item={selectedReceipt} childName={selectedChild.name} onClose={() => setSelectedReceipt(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  title:            { color: Colors.text, fontSize: Font['2xl'], fontWeight: '800' },
  alertPill:        { backgroundColor: Colors.gold + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold + '40' },
  alertText:        { color: Colors.gold, fontSize: Font.sm, fontWeight: '700' },
  childTabs:        { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 10, marginBottom: 8 },
  childTab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  childTabName:     { color: Colors.textMuted, fontSize: Font.sm, fontWeight: '700' },
  childStatusDot:   { width: 7, height: 7, borderRadius: 3.5 },
  statusBanner:     { marginHorizontal: Spacing.md, borderRadius: Radius.xl, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, marginBottom: Spacing.md },
  statusLeft:       { flexDirection: 'row', alignItems: 'center' },
  statusTitle:      { fontSize: Font.md, fontWeight: '800' },
  statusSub:        { color: Colors.textMuted, fontSize: Font.sm, marginTop: 3 },
  statusAmount:     { color: Colors.text, fontSize: Font.xl, fontWeight: '900' },
  statusAmountLabel:{ color: Colors.textMuted, fontSize: 11 },
  actionRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  actionBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.green + '40', backgroundColor: Colors.green + '12' },
  actionBtnText:    { fontSize: Font.sm, fontWeight: '700' },
  childInfoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  childInfoLabel:   { color: Colors.textMuted, fontSize: Font.sm },
  childInfoValue:   { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  rowBorder:        { borderTopWidth: 1, borderTopColor: Colors.border },
  historyRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  modeCircle:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  historyMonth:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  historyChallan:   { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  historyAmount:    { fontSize: Font.md, fontWeight: '800' },
  // Modal
  modalBg:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:       { color: Colors.text, fontSize: Font.lg, fontWeight: '800' },
  receiptSchool:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  receiptSchoolName:{ color: Colors.gold, fontSize: Font.md, fontWeight: '800', letterSpacing: 1 },
  receiptDivider:   { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  receiptRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel:     { color: Colors.textMuted, fontSize: Font.sm },
  receiptValue:     { color: Colors.text, fontSize: Font.sm, fontWeight: '700' },
  stampRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stampText:        { color: Colors.green, fontSize: Font.sm, fontWeight: '800' },
});
