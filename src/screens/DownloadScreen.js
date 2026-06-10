import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { colors } from '../theme';

const ANDROID_APK_URL =
  'https://github.com/strippy/sentinel-protocol-android/raw/main/incoming_files/sentinel-protocol-v3-debug.apk';
const ANDROID_SOURCE_URL =
  'https://github.com/strippy/sentinel-protocol-android/raw/main/incoming_files/Sentinel_Protocol_Complete.zip';
const IOS_TESTFLIGHT_URL = 'https://testflight.apple.com/join/sentinelprotocol';
const IOS_APPSTORE_URL   = 'https://apps.apple.com/app/sentinel-protocol';

async function openLink(url, setLoading) {
  try {
    setLoading(true);
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open Link', 'Please visit the link manually:\n' + url);
    }
  } catch {
    Alert.alert('Error', 'Could not open the download link.');
  } finally {
    setLoading(false);
  }
}

function DownloadCard({ title, subtitle, badge, badgeColor, items, buttons }) {
  const [loading, setLoading] = useState(false);

  return (
    <View style={s.card}>
      {badge && (
        <View style={[s.badge, { backgroundColor: badgeColor }]}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[s.cardTitle, { color: badgeColor || colors.white }]}>{title}</Text>
      {subtitle && <Text style={s.cardSub}>{subtitle}</Text>}

      {items.map((item, i) => (
        <Text key={i} style={s.feature}>◆  {item}</Text>
      ))}

      <View style={s.btnRow}>
        {buttons.map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[s.btn, { borderColor: btn.color || badgeColor || colors.pink }, btn.primary && { backgroundColor: btn.color || badgeColor || colors.pink }]}
            onPress={() => openLink(btn.url, setLoading)}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading && btn.primary ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={[s.btnText, btn.primary && { color: colors.bg }]}>{btn.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepCard({ steps }) {
  return (
    <View style={s.stepCard}>
      <Text style={s.stepTitle}>ANDROID SIDELOAD GUIDE</Text>
      {steps.map((step, i) => (
        <View key={i} style={s.stepRow}>
          <View style={s.stepNum}>
            <Text style={s.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={s.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const SIDELOAD_STEPS = [
  'Open Settings → Security → Install unknown apps',
  'Enable "Allow from this source" for your browser',
  'Tap the APK download button above',
  'Open the downloaded file from your notifications',
  'Tap Install and follow the prompts',
];

export default function DownloadScreen() {
  const isAndroid = Platform.OS === 'android';
  const isIOS     = Platform.OS === 'ios';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>DOWNLOAD</Text>
      <Text style={s.sub}>Install Sentinel Protocol on your device</Text>

      {/* Android */}
      <DownloadCard
        title="ANDROID"
        subtitle="v3 Debug Build · ARM64 / x86_64"
        badge={isAndroid ? 'YOUR PLATFORM' : null}
        badgeColor={colors.green}
        items={[
          'Full VPN + DNS ad-blocking',
          'Ghost mode with rotating personas',
          'Yield dashboard — earn from your data',
          'Kill-switch & always-on VPN',
          'Encrypted local logs',
        ]}
        buttons={[
          {
            label: '⬇  DOWNLOAD APK',
            url: ANDROID_APK_URL,
            color: colors.green,
            primary: true,
          },
          {
            label: 'SOURCE ZIP',
            url: ANDROID_SOURCE_URL,
            color: colors.green,
          },
        ]}
      />

      {isAndroid && <StepCard steps={SIDELOAD_STEPS} />}

      {/* iOS */}
      <DownloadCard
        title="iOS"
        subtitle="iPhone · iPad · Requires iOS 16+"
        badge={isIOS ? 'YOUR PLATFORM' : null}
        badgeColor={colors.cyan}
        items={[
          'Native Swift + SwiftUI',
          'WireGuard tunnel integration',
          'Private DNS-over-HTTPS resolver',
          'Biometric unlock (Face ID / Touch ID)',
          'iCloud encrypted backup',
        ]}
        buttons={[
          {
            label: '✈  TESTFLIGHT BETA',
            url: IOS_TESTFLIGHT_URL,
            color: colors.cyan,
            primary: true,
          },
          {
            label: 'APP STORE',
            url: IOS_APPSTORE_URL,
            color: colors.cyan,
          },
        ]}
      />

      {/* Full source */}
      <View style={s.sourceCard}>
        <Text style={s.sourceTitle}>COMPLETE SOURCE</Text>
        <Text style={s.sourceSub}>
          Sentinel_Protocol_Complete.zip — Android + B2B Backend
        </Text>
        <TouchableOpacity
          style={s.sourceBtn}
          onPress={() => Linking.openURL(ANDROID_SOURCE_URL)}
          activeOpacity={0.8}
        >
          <Text style={s.sourceBtnText}>⬇  DOWNLOAD FULL SOURCE ZIP</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>
        ZERO LOGS · ZERO TRACKING · OPEN SOURCE
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 50 },
  title:         { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:           { color: colors.textMuted, fontSize: 12, marginBottom: 24, marginTop: 4 },

  card:          { backgroundColor: colors.panel, borderRadius: 14, padding: 18,
                   borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  badge:         { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  badgeText:     { color: colors.bg, fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
  cardTitle:     { fontSize: 18, fontWeight: 'bold', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 4 },
  cardSub:       { color: colors.textMuted, fontSize: 11, marginBottom: 14, fontFamily: 'monospace' },
  feature:       { color: colors.textSec, fontSize: 13, marginBottom: 6, lineHeight: 20 },
  btnRow:        { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn:           { flex: 1, borderRadius: 8, paddingVertical: 11, alignItems: 'center',
                   borderWidth: 1 },
  btnText:       { color: colors.white, fontWeight: 'bold', letterSpacing: 1, fontSize: 11, fontFamily: 'monospace' },

  stepCard:      { backgroundColor: '#070B14', borderRadius: 12, padding: 16,
                   borderWidth: 1, borderColor: colors.borderPink, marginBottom: 14 },
  stepTitle:     { color: colors.pink, fontSize: 11, fontWeight: 'bold', letterSpacing: 3,
                   fontFamily: 'monospace', marginBottom: 14 },
  stepRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNum:       { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.pink20,
                   borderWidth: 1, borderColor: colors.pink, alignItems: 'center',
                   justifyContent: 'center', marginRight: 12, marginTop: 1 },
  stepNumText:   { color: colors.pink, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' },
  stepText:      { flex: 1, color: colors.textSec, fontSize: 13, lineHeight: 20 },

  sourceCard:    { backgroundColor: '#0A000F', borderRadius: 14, padding: 18,
                   borderWidth: 1, borderColor: colors.borderPink, marginBottom: 24, alignItems: 'center' },
  sourceTitle:   { color: colors.pink, fontSize: 14, fontWeight: 'bold', letterSpacing: 3,
                   fontFamily: 'monospace', marginBottom: 6 },
  sourceSub:     { color: colors.textMuted, fontSize: 11, fontFamily: 'monospace', marginBottom: 14, textAlign: 'center' },
  sourceBtn:     { backgroundColor: colors.pink20, borderRadius: 8, paddingVertical: 12,
                   paddingHorizontal: 20, borderWidth: 1, borderColor: colors.pink },
  sourceBtnText: { color: colors.pink, fontWeight: 'bold', letterSpacing: 2, fontSize: 11, fontFamily: 'monospace' },

  footer:        { color: colors.textMuted, fontSize: 10, letterSpacing: 3,
                   fontFamily: 'monospace', textAlign: 'center', marginTop: 8 },
});
