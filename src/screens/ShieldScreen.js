import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Switch,
} from 'react-native';
import { colors } from '../theme';
import { useVpn } from '../context/VpnContext';

const RISK_COLOR = { HIGH: '#FF4D4D', MEDIUM: '#FFB800', LOW: colors.green };

function formatUptime(s) {
  const h   = Math.floor(s / 3600).toString().padStart(2,'0');
  const m   = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
  const sec = (s % 60).toString().padStart(2,'0');
  return `${h}:${m}:${sec}`;
}

function LiveRow({ event }) {
  return (
    <View style={s.liveRow}>
      <View style={[s.liveDot, { backgroundColor: event.blocked ? '#FF4D4D' : colors.green }]} />
      <Text style={s.liveDomain} numberOfLines={1}>{event.domain}</Text>
      <Text style={[s.liveRisk, { color: RISK_COLOR[event.riskLabel] || colors.textMuted }]}>
        {event.riskLabel}
      </Text>
    </View>
  );
}

export default function ShieldScreen() {
  const {
    vpnActive, yieldOn, trackers, blocked, yieldAmt,
    uptime, recentEvents, toggleVpn, setYieldOn,
  } = useVpn();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (vpnActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }
  }, [vpnActive]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0, 0.9] });
  const liveFeed    = recentEvents.slice(0, 5);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={s.wordmark}>SENTINEL</Text>
      <Text style={s.sub}>P R O T O C O L</Text>

      {/* Status chip */}
      <View style={s.chip}>
        <View style={[s.dot, { backgroundColor: vpnActive ? colors.green : colors.textMuted }]} />
        <Text style={[s.chipText, { color: vpnActive ? colors.green : colors.textMuted }]}>
          {vpnActive ? 'DNS FILTER ACTIVE' : 'SHIELD OFFLINE'}
        </Text>
      </View>

      {/* Shield orb */}
      <View style={s.shieldWrap}>
        <Animated.View style={[s.glowRing3, { opacity: glowOpacity }]} />
        <Animated.View style={[s.glowRing2, { opacity: glowOpacity }]} />
        <Animated.View style={[s.glowRing1, { opacity: glowOpacity }]} />

        <TouchableOpacity activeOpacity={0.85} onPress={toggleVpn}>
          <Animated.View style={[
            s.shieldBtn,
            { transform: [{ scale: pulseAnim }] },
            vpnActive && s.shieldBtnActive,
          ]}>
            <Text style={[s.shieldIcon, vpnActive && { color: colors.pink }]}>⬡</Text>
            <Text style={[s.shieldLabel, vpnActive && { color: colors.pink }]}>
              {vpnActive ? 'TAP TO DEACTIVATE' : 'TAP TO ACTIVATE'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{trackers}</Text>
          <Text style={s.statLabel}>INTERCEPTED</Text>
          <View style={s.statBar} />
        </View>
        <View style={[s.statCard, { borderColor: 'rgba(255,77,77,0.3)' }]}>
          <Text style={[s.statNum, { color: '#FF4D4D' }]}>{blocked}</Text>
          <Text style={s.statLabel}>BLOCKED</Text>
          <View style={[s.statBar, { backgroundColor: '#FF4D4D' }]} />
        </View>
        <View style={[s.statCard, s.statCardPink]}>
          <Text style={[s.statNum, { color: colors.pink }]}>${yieldAmt.toFixed(2)}</Text>
          <Text style={s.statLabel}>YIELD</Text>
          <View style={[s.statBar, { backgroundColor: colors.pink }]} />
        </View>
      </View>

      {/* Yield Engine toggle */}
      <View style={s.panel}>
        <View style={s.panelRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>Yield Engine</Text>
            <Text style={s.panelSub}>Opt in to earn from anonymised usage telemetry</Text>
          </View>
          <Switch
            value={yieldOn}
            onValueChange={setYieldOn}
            trackColor={{ false: colors.border, true: colors.pink50 }}
            thumbColor={yieldOn ? colors.pink : colors.textMuted}
          />
        </View>
        {yieldOn && (
          <Text style={s.yieldActive}>
            Yield Engine active · Earning from anonymised usage telemetry
          </Text>
        )}
      </View>

      {/* DNS Filter panel */}
      <View style={s.panel}>
        <Text style={s.panelMeta}>DNS FILTER — SESSION STATS</Text>
        <View style={s.rowBetween}>
          <Text style={s.panelMeta}>ACTIVE RULES</Text>
          <Text style={[s.panelTitle, { color: colors.white }]}>47 domains</Text>
        </View>
        <View style={s.rowBetween}>
          <Text style={s.panelMeta}>SESSION UPTIME</Text>
          <Text style={[s.panelTitle, { color: colors.white, fontFamily: 'monospace', fontSize: 14 }]}>
            {formatUptime(uptime)}
          </Text>
        </View>
      </View>

      {/* Live Feed */}
      {liveFeed.length > 0 && (
        <View style={s.panel}>
          <Text style={s.panelMeta}>LIVE FEED — RECENT EVENTS</Text>
          {liveFeed.map(e => <LiveRow key={String(e.id)} event={e} />)}
        </View>
      )}

      {/* Compliance note */}
      <Text style={s.compliance}>
        All filtering happens locally on your device. No traffic is inspected, logged, or transmitted.
        Usage telemetry is opt-in only, anonymised, and SHA-256 hashed before any transmission.
      </Text>

      <Text style={s.privacyLink}>Privacy Policy v1.2  ·  v2.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  content:        { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  wordmark:       { color: colors.white, fontSize: 30, fontWeight: 'bold', letterSpacing: 5, fontFamily: 'monospace' },
  sub:            { color: colors.pink, fontSize: 11, letterSpacing: 6, marginBottom: 14 },
  chip:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel,
                    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28,
                    borderWidth: 1, borderColor: colors.border },
  dot:            { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  chipText:       { fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },
  shieldWrap:     { alignItems: 'center', justifyContent: 'center', width: 260, height: 260, marginBottom: 32 },
  glowRing3:      { position:'absolute', width: 260, height: 260, borderRadius: 130,
                    backgroundColor: 'rgba(255,0,127,0.04)', borderWidth: 1, borderColor: 'rgba(255,0,127,0.1)' },
  glowRing2:      { position:'absolute', width: 210, height: 210, borderRadius: 105,
                    backgroundColor: 'rgba(255,0,127,0.06)', borderWidth: 1, borderColor: 'rgba(255,0,127,0.2)' },
  glowRing1:      { position:'absolute', width: 165, height: 165, borderRadius: 83,
                    backgroundColor: 'rgba(255,0,127,0.08)', borderWidth: 1, borderColor: 'rgba(255,0,127,0.35)' },
  shieldBtn:      { width: 140, height: 140, borderRadius: 70, backgroundColor: '#0D0010',
                    borderWidth: 2, borderColor: colors.textMuted,
                    alignItems: 'center', justifyContent: 'center' },
  shieldBtnActive:{ borderColor: colors.pink, backgroundColor: '#1A0015' },
  shieldIcon:     { fontSize: 44, color: colors.textMuted, marginBottom: 4 },
  shieldLabel:    { fontSize: 8, letterSpacing: 2, color: colors.textMuted, fontFamily: 'monospace' },
  statsRow:       { flexDirection: 'row', width: '100%', marginBottom: 14 },
  statCard:       { flex: 1, backgroundColor: colors.panel, borderRadius: 12, padding: 14,
                    alignItems: 'center', marginHorizontal: 4,
                    borderWidth: 1, borderColor: colors.border },
  statCardPink:   { borderColor: colors.borderPink },
  statNum:        { color: colors.white, fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace' },
  statLabel:      { color: colors.textMuted, fontSize: 8, letterSpacing: 2, marginTop: 4, fontFamily: 'monospace' },
  statBar:        { width: 28, height: 2, backgroundColor: colors.border, marginTop: 8, borderRadius: 1 },
  panel:          { width: '100%', backgroundColor: colors.panel, borderRadius: 12, padding: 18,
                    marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  panelRow:       { flexDirection: 'row', alignItems: 'center' },
  panelTitle:     { color: colors.white, fontSize: 15, fontWeight: '600' },
  panelSub:       { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  panelMeta:      { color: colors.textMuted, fontSize: 9, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 8 },
  rowBetween:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  yieldActive:    { color: colors.pink, fontSize: 11, marginTop: 10, fontFamily: 'monospace' },
  liveRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 5,
                    borderBottomWidth: 1, borderBottomColor: colors.border },
  liveDot:        { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  liveDomain:     { flex: 1, color: colors.textSec, fontSize: 12, fontFamily: 'monospace' },
  liveRisk:       { fontSize: 9, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'monospace' },
  compliance:     { color: colors.textMuted, fontSize: 10, textAlign: 'center',
                    lineHeight: 16, marginTop: 8, paddingHorizontal: 10 },
  privacyLink:    { color: colors.pink, fontSize: 11, marginTop: 16, letterSpacing: 1 },
});
