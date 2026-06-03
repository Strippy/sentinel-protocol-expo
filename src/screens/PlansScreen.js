import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'free', label: 'FREE', price: '$0', period: '/mo',
    color: colors.textMuted, badge: null,
    features: ['DNS tracker blocking', 'Basic Ghost mode', 'Up to $0.50/mo yield', '1 persona', 'Ledger history (7 days)'],
  },
  {
    id: 'pro', label: 'PRO', price: '$10', period: '/mo',
    color: colors.cyan, badge: 'MOST POPULAR',
    features: ['Everything in Free', 'Priority yield pool', 'Up to $8/mo yield', '3 personas', 'Advanced fingerprint mask', 'Kill switch', '90-day ledger history'],
  },
  {
    id: 'elite', label: 'ELITE', price: '$30', period: '/mo',
    color: colors.pink, badge: 'MAX YIELD',
    features: ['Everything in Pro', 'Elite yield tier', 'Up to $30/mo yield', 'Unlimited personas', 'Real-time payload log', 'Priority data licensing', 'Cloud sync'],
  },
];

export default function PlansScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [selected, setSelected] = useState('pro');

  function handleSubscribe(plan) {
    if (!isAuthenticated || (!user && !isAuthenticated)) {
      Alert.alert(
        'Sign In Required',
        'Create an account to subscribe.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    Alert.alert(
      `Subscribe to ${plan.label}`,
      `Start your ${plan.label} subscription for ${plan.price}${plan.period}?\n\nPowered by Stripe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => Alert.alert('Success', 'Subscription activated! (demo)') },
      ]
    );
  }

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
          {selected === plan.id && plan.id !== 'free' && (
            <TouchableOpacity
              style={[s.selectBtn, { backgroundColor: plan.color }]}
              onPress={() => handleSubscribe(plan)}
              activeOpacity={0.85}
            >
              <Text style={s.selectBtnText}>SUBSCRIBE NOW</Text>
            </TouchableOpacity>
          )}
          {selected === plan.id && plan.id === 'free' && (
            <View style={[s.selectBtn, { backgroundColor: plan.color }]}>
              <Text style={s.selectBtnText}>CURRENT PLAN</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* B2B Enterprise */}
      <View style={s.b2bCard}>
        <View style={s.b2bHeader}>
          <Text style={s.b2bLabel}>B2B ENTERPRISE</Text>
          <View style={s.priceRow}>
            <Text style={s.b2bPrice}>Custom</Text>
          </View>
        </View>
        <Text style={s.founderNote}>⚡ Direct API access to anonymised domain dataset</Text>
        {[
          'Starter · $49/mo + GST · 1,000 domains/day',
          'Professional · $199/mo + GST · 25,000 domains/day',
          'Enterprise · $999/mo + GST · Unlimited domains',
          'GDPR / APPs / CCPA data processing agreement',
          'GST tax invoice on payment',
          'Dedicated account manager (Enterprise)',
        ].map((f, i) => (
          <Text key={i} style={s.feature}>◆  {f}</Text>
        ))}
        <TouchableOpacity
          style={s.b2bBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('B2BPayment')}
        >
          <Text style={s.b2bBtnText}>START B2B PAYMENT</Text>
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
  b2bPrice:     { color: colors.pink, fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' },
  founderNote:  { color: colors.pink, fontSize: 11, marginBottom: 14, fontFamily: 'monospace' },
  b2bBtn:       { backgroundColor: colors.pink, borderRadius: 8, paddingVertical: 12,
                  alignItems: 'center', marginTop: 14 },
  b2bBtnText:   { color: colors.bg, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
});
