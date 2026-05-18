import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

const PLANS = [
  {
    id: 'free', label: 'FREE', price: '$0', period: '/mo',
    color: colors.textMuted, badge: null,
    features: ['DNS tracker blocking', 'Basic Ghost mode', 'Up to $0.50/mo yield', '1 persona'],
  },
  {
    id: 'pro', label: 'PRO', price: '$10', period: '/mo',
    color: colors.cyan, badge: 'MOST POPULAR',
    features: ['Everything in Free', 'Priority yield pool', 'Up to $8/mo yield', '3 personas', 'Advanced fingerprint mask'],
  },
  {
    id: 'elite', label: 'ELITE', price: '$30', period: '/mo',
    color: colors.pink, badge: 'MAX YIELD',
    features: ['Everything in Pro', 'Elite yield tier', 'Up to $30/mo yield', 'Unlimited personas', 'Real-time payload log', 'Priority data licensing'],
  },
];

const B2B = {
  label: 'ENTERPRISE', price: '$2,000', period: '/mo',
  founderNote: 'Founder rate — first 100 subscribers only',
  features: [
    'Direct API access to anonymised dataset',
    'Custom data cohort filtering',
    'Dedicated account manager',
    'SLA 99.9% uptime guarantee',
    'GDPR / APPs / CCPA data processing agreement',
    'White-label licensing available',
  ],
};

export default function PlansScreen() {
  const [selected, setSelected] = useState('pro');

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>PLANS</Text>
      <Text style={s.sub}>Your data, your yield. Upgrade anytime.</Text>

      {PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[s.planCard, selected === plan.id && { borderColor: plan.color }]}
          onPress={() => setSelected(plan.id)}
          activeOpacity={0.8}
        >
          {plan.badge && (
            <View style={[s.badge, { backgroundColor: plan.color }]}>
              <Text style={s.badgeText}>{plan.badge}</Text>
            </View>
          )}
          <View style={s.planHeader}>
            <Text style={[s.planLabel, { color: plan.color }]}>{plan.label}</Text>
            <View style={s.priceRow}>
              <Text style={[s.price, { color: plan.color }]}>{plan.price}</Text>
              <Text style={s.period}>{plan.period}</Text>
            </View>
          </View>
          {plan.features.map((f, i) => (
            <Text key={i} style={s.feature}>✓  {f}</Text>
          ))}
          {selected === plan.id && (
            <View style={[s.selectBtn, { backgroundColor: plan.color }]}>
              <Text style={s.selectBtnText}>SELECTED</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* B2B Enterprise */}
      <View style={s.b2bCard}>
        <View style={s.b2bHeader}>
          <Text style={s.b2bLabel}>B2B {B2B.label}</Text>
          <View style={s.priceRow}>
            <Text style={s.b2bPrice}>{B2B.price}</Text>
            <Text style={s.period}>{B2B.period}</Text>
          </View>
        </View>
        <Text style={s.founderNote}>⚡ {B2B.founderNote}</Text>
        {B2B.features.map((f, i) => (
          <Text key={i} style={s.feature}>◆  {f}</Text>
        ))}
        <TouchableOpacity style={s.b2bBtn} activeOpacity={0.8}>
          <Text style={s.b2bBtnText}>CONTACT ENTERPRISE SALES</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  content:      { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  title:        { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:          { color: colors.textMuted, fontSize: 12, marginBottom: 24, marginTop: 4 },
  planCard:     { backgroundColor: colors.panel, borderRadius: 14, padding: 18,
                  borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  badge:        { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  badgeText:    { color: colors.bg, fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
  planHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  planLabel:    { fontSize: 18, fontWeight: 'bold', letterSpacing: 3, fontFamily: 'monospace' },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline' },
  price:        { fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  period:       { color: colors.textMuted, fontSize: 13, marginLeft: 2 },
  feature:      { color: colors.textSec, fontSize: 13, marginBottom: 6, lineHeight: 20 },
  selectBtn:    { marginTop: 14, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  selectBtnText:{ color: colors.bg, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
  b2bCard:      { backgroundColor: '#0A000F', borderRadius: 14, padding: 18,
                  borderWidth: 1, borderColor: colors.borderPink, marginBottom: 14 },
  b2bHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  b2bLabel:     { color: colors.pink, fontSize: 16, fontWeight: 'bold', letterSpacing: 3, fontFamily: 'monospace' },
  b2bPrice:     { color: colors.pink, fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace' },
  founderNote:  { color: colors.pink, fontSize: 11, marginBottom: 14, fontFamily: 'monospace' },
  b2bBtn:       { backgroundColor: colors.pink, borderRadius: 8, paddingVertical: 12,
                  alignItems: 'center', marginTop: 14 },
  b2bBtnText:   { color: colors.bg, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
});
