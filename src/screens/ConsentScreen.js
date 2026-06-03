import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

const PRINCIPLES = [
  {
    icon: '🔒',
    title: 'Zero Logs',
    desc: 'Your DNS queries are never stored, logged, or transmitted off-device.',
  },
  {
    icon: '🎭',
    title: 'Privacy by Default',
    desc: 'All filtering runs locally. No traffic inspection. No third-party telemetry.',
  },
  {
    icon: '💰',
    title: 'Your Data, Your Yield',
    desc: 'Usage telemetry is strictly opt-in, SHA-256 hashed, and you earn from it.',
  },
  {
    icon: '🇦🇺',
    title: 'APPs & GDPR Compliant',
    desc: 'We comply with the Australian Privacy Principles, GDPR, and CCPA.',
  },
  {
    icon: '🗑️',
    title: 'Right to Erasure',
    desc: 'Request full deletion of any hashed records within 30 days, any time.',
  },
];

export default function ConsentScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={s.icon}>⬡</Text>
          <Text style={s.title}>SENTINEL PROTOCOL</Text>
          <Text style={s.sub}>Before you begin, here is our privacy commitment</Text>

          {PRINCIPLES.map((p, i) => (
            <View key={i} style={s.card}>
              <Text style={s.cardIcon}>{p.icon}</Text>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{p.title}</Text>
                <Text style={s.cardDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}

          <Text style={s.legal}>
            By continuing you confirm you have read and agree to our{' '}
            <Text style={s.link}>Privacy Policy v1.2</Text>
            {' '}and{' '}
            <Text style={s.link}>Terms of Service</Text>
            .{'\n\n'}
            Effective 1 Jan 2026 · APPs · GDPR · CCPA
          </Text>
        </Animated.View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.btn}
          onPress={async () => {
            await AsyncStorage.setItem('@sentinel_consented', 'true');
            navigation.replace('Main');
          }}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>I UNDERSTAND — CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  content:   { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 20 },
  icon:      { fontSize: 48, textAlign: 'center', color: colors.pink, marginBottom: 16 },
  title:     { color: colors.white, fontSize: 24, fontWeight: 'bold', letterSpacing: 5,
               fontFamily: 'monospace', textAlign: 'center' },
  sub:       { color: colors.textMuted, fontSize: 13, textAlign: 'center',
               marginTop: 8, marginBottom: 32, lineHeight: 20 },
  card:      { flexDirection: 'row', backgroundColor: colors.panel, borderRadius: 14,
               borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  cardIcon:  { fontSize: 28, marginRight: 14, marginTop: 2 },
  cardBody:  { flex: 1 },
  cardTitle: { color: colors.white, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardDesc:  { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  legal:     { color: colors.textMuted, fontSize: 11, lineHeight: 18, textAlign: 'center',
               marginTop: 12, marginBottom: 8 },
  link:      { color: colors.pink },
  footer:    { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
               backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  btn:       { backgroundColor: colors.pink, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText:   { color: colors.bg, fontWeight: 'bold', fontSize: 13, letterSpacing: 3, fontFamily: 'monospace' },
});
