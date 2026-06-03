import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.sentinelprotocol.app';
const API_KEY     = process.env.EXPO_PUBLIC_API_KEY     || '';

const PACKAGES = [
  {
    id:          'STARTER',
    label:       'STARTER',
    price:       '$49',
    priceDetail: '+ GST / month',
    domains:     '1,000 domains/day',
    retention:   '30-day retention',
    color:       colors.textSec,
  },
  {
    id:          'PROFESSIONAL',
    label:       'PROFESSIONAL',
    price:       '$199',
    priceDetail: '+ GST / month',
    domains:     '25,000 domains/day',
    retention:   '90-day retention',
    color:       colors.cyan,
    badge:       'POPULAR',
  },
  {
    id:          'ENTERPRISE',
    label:       'ENTERPRISE',
    price:       '$999',
    priceDetail: '+ GST / month',
    domains:     'Unlimited domains',
    retention:   '365-day retention',
    color:       colors.pink,
    badge:       'FULL ACCESS',
  },
];

function validateAbn(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  const d = digits.split('').map(Number);
  d[0] -= 1;
  const W = [10,1,3,5,7,9,11,13,15,17,19];
  const sum = W.reduce((acc, w, i) => acc + w * d[i], 0);
  return sum % 89 === 0;
}

export default function B2BPaymentScreen({ navigation }) {
  const [pkg, setPkg]       = useState('PROFESSIONAL');
  const [abn, setAbn]       = useState('');
  const [bizName, setBiz]   = useState('');
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [step, setStep]     = useState('form'); // 'form' | 'success'
  const [orderId, setOrderId] = useState(null);
  const [invoiceNum, setInvoiceNum] = useState(null);

  function formatAbn(raw) {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
    return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,8)} ${d.slice(8)}`;
  }

  async function handleSubmit() {
    setError(null);
    const abnRaw = abn.replace(/\D/g, '');

    if (!validateAbn(abnRaw)) {
      setError('Please enter a valid 11-digit ABN');
      return;
    }
    if (!bizName.trim()) {
      setError('Business name is required');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const createRes = await fetch(`${BACKEND_URL}/api/b2b/create-payment`, {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'X-Sentinel-API-Key': API_KEY,
        },
        body: JSON.stringify({
          abn:           abnRaw,
          business_name: bizName.trim(),
          contact_email: email.trim(),
          package_id:    pkg,
          currency:      'aud',
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Payment initialisation failed');

      // In a real app: present Stripe payment sheet here using createData.client_secret
      // For the prototype we simulate a confirmed payment after a delay
      await new Promise(r => setTimeout(r, 1200));

      const confirmRes = await fetch(`${BACKEND_URL}/api/b2b/confirm-order`, {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'X-Sentinel-API-Key': API_KEY,
        },
        body: JSON.stringify({
          payment_intent_id: createData.payment_intent_id,
          abn:               abnRaw,
          contact_email:     email.trim(),
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Order confirmation failed');

      setOrderId(confirmData.order_id);
      setInvoiceNum(confirmData.invoice_number);
      setStep('success');
    } catch (e) {
      setError(e.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <View style={s.root}>
        <View style={s.successWrap}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>ORDER CONFIRMED</Text>
          <Text style={s.successSub}>Your data package is being provisioned</Text>
          <View style={s.successCard}>
            <InfoRow label="Order ID"      value={orderId} />
            <InfoRow label="Invoice"       value={invoiceNum} />
            <InfoRow label="Package"       value={PACKAGES.find(p => p.id === pkg)?.label} />
            <InfoRow label="Contact"       value={email} />
          </View>
          <Text style={s.successNote}>
            A GST tax invoice has been emailed to {email}.{'\n'}
            API credentials will be delivered within 24 hours.
          </Text>
          <TouchableOpacity style={s.successBtn} onPress={() => navigation.goBack()}>
            <Text style={s.successBtnText}>BACK TO PLANS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.title}>B2B DATA ACCESS</Text>
        <Text style={s.sub}>Direct API access to anonymised domain data</Text>

        {/* Package selection */}
        <Text style={s.sectionLabel}>SELECT PACKAGE</Text>
        {PACKAGES.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[s.pkgCard, pkg === p.id && { borderColor: p.color }]}
            onPress={() => setPkg(p.id)}
            activeOpacity={0.8}
          >
            {p.badge && (
              <View style={[s.pkgBadge, { backgroundColor: p.color }]}>
                <Text style={s.pkgBadgeText}>{p.badge}</Text>
              </View>
            )}
            <View style={s.pkgHeader}>
              <Text style={[s.pkgLabel, { color: p.color }]}>{p.label}</Text>
              <View style={s.priceRow}>
                <Text style={[s.pkgPrice, { color: p.color }]}>{p.price}</Text>
                <Text style={s.pkgPeriod}> {p.priceDetail}</Text>
              </View>
            </View>
            <Text style={s.pkgFeature}>◆  {p.domains}</Text>
            <Text style={s.pkgFeature}>◆  {p.retention}</Text>
            <Text style={s.pkgFeature}>◆  GDPR / APPs compliant data processing agreement</Text>
            {pkg === p.id && (
              <View style={[s.pkgSelectedBar, { backgroundColor: p.color }]}>
                <Text style={s.pkgSelectedText}>SELECTED</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Form */}
        <Text style={s.sectionLabel}>BUSINESS DETAILS</Text>
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>ABN (11 digits)</Text>
          <TextInput
            style={s.input}
            value={abn}
            onChangeText={v => setAbn(formatAbn(v))}
            placeholder="51 824 753 556"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          {abn.replace(/\D/g,'').length === 11 && (
            <Text style={[s.abnStatus, { color: validateAbn(abn) ? colors.green : '#FF4D4D' }]}>
              {validateAbn(abn) ? '✓ Valid ABN' : '✗ Invalid ABN'}
            </Text>
          )}
        </View>
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>BUSINESS NAME</Text>
          <TextInput
            style={s.input}
            value={bizName}
            onChangeText={setBiz}
            placeholder="Acme Corp Pty Ltd"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>
        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>CONTACT EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="billing@acme.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {error && <Text style={s.errorText}>{error}</Text>}

        <Text style={s.gstNote}>
          All prices shown exclude GST. A 10% GST will be applied at checkout.
          A GST tax invoice will be emailed immediately on payment.
        </Text>

        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={s.submitText}>PROCEED TO PAYMENT</Text>
          }
        </TouchableOpacity>

        <Text style={s.secureNote}>🔒 Payments secured by Stripe · PCI DSS Level 1</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  content:        { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 50 },
  backBtn:        { marginBottom: 20 },
  backText:       { color: colors.pink, fontSize: 12, letterSpacing: 2, fontFamily: 'monospace' },
  title:          { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:            { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 24 },
  sectionLabel:   { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10, marginTop: 6 },

  pkgCard:        { backgroundColor: colors.panel, borderRadius: 14, padding: 16,
                    borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  pkgBadge:       { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  pkgBadgeText:   { color: colors.bg, fontSize: 8, fontWeight: 'bold', letterSpacing: 2 },
  pkgHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pkgLabel:       { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, fontFamily: 'monospace' },
  priceRow:       { flexDirection: 'row', alignItems: 'baseline' },
  pkgPrice:       { fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
  pkgPeriod:      { color: colors.textMuted, fontSize: 11 },
  pkgFeature:     { color: colors.textSec, fontSize: 12, marginBottom: 5 },
  pkgSelectedBar: { marginTop: 12, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  pkgSelectedText:{ color: colors.bg, fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },

  inputWrap:      { marginBottom: 16 },
  inputLabel:     { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 },
  input:          { backgroundColor: colors.panel, borderRadius: 10, borderWidth: 1,
                    borderColor: colors.border, color: colors.white, fontSize: 15,
                    paddingHorizontal: 16, paddingVertical: 13 },
  abnStatus:      { fontSize: 11, marginTop: 6, fontFamily: 'monospace' },

  errorText:      { color: '#FF6B6B', fontSize: 12, marginBottom: 12, textAlign: 'center' },
  gstNote:        { color: colors.textMuted, fontSize: 11, lineHeight: 16,
                    backgroundColor: colors.panel, borderRadius: 10, padding: 12, marginBottom: 16 },

  submitBtn:      { backgroundColor: colors.pink, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitText:     { color: colors.bg, fontWeight: 'bold', fontSize: 13, letterSpacing: 3, fontFamily: 'monospace' },
  secureNote:     { color: colors.textMuted, fontSize: 11, textAlign: 'center' },

  // Success
  successWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:    { fontSize: 60, color: colors.green, marginBottom: 16 },
  successTitle:   { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  successSub:     { color: colors.textMuted, fontSize: 13, marginTop: 8, marginBottom: 24 },
  successCard:    { width: '100%', backgroundColor: colors.panel, borderRadius: 14,
                    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
                    borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:      { color: colors.textMuted, fontSize: 12 },
  infoVal:        { color: colors.white, fontSize: 12, fontFamily: 'monospace', maxWidth: '60%', textAlign: 'right' },
  successNote:    { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 28 },
  successBtn:     { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  successBtnText: { color: colors.bg, fontWeight: 'bold', fontSize: 12, letterSpacing: 3, fontFamily: 'monospace' },
});
