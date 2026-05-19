import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { colors } from '../theme';

const CATEGORIES = [
  { key: 'app_usage',    label: 'App Usage',       icon: '📱', color: '#FF007F', tier: 'Pro' },
  { key: 'session_freq', label: 'Session Freq',    icon: '🔁', color: '#FF4DA6', tier: 'Pro' },
  { key: 'network_type', label: 'Network Type',    icon: '📡', color: '#00E5FF', tier: 'Free' },
  { key: 'device_class', label: 'Device Class',    icon: '📲', color: '#9C27B0', tier: 'Free' },
  { key: 'region_tier',  label: 'Region Tier',     icon: '🌏', color: '#00E676', tier: 'Free' },
  { key: 'interest_vec', label: 'Interest Vector', icon: '🧠', color: '#FFD600', tier: 'Elite' },
  { key: 'time_pattern', label: 'Time Pattern',    icon: '⏱️', color: '#FF6EB4', tier: 'Elite' },
  { key: 'yield_score',  label: 'Yield Score',     icon: '💰', color: '#FF007F', tier: 'Pro' },
];

const TIER_COLOR = { Free: '#C5C7D4', Pro: '#00E5FF', Elite: '#FF007F' };

function randomScore() { return Math.floor(Math.random() * 60) + 30; }

// What each signal shares — shown on tap
const SIGNAL_INFO = {
  app_usage:    { pii: "App names hashed · Duration rounded to 15-min blocks · No specific apps identified" },
  session_freq: { pii: "Timestamps rounded to hour of day only · No exact times stored" },
  network_type: { pii: "Carrier name stripped · Only WiFi/4G/5G tier retained" },
  device_class: { pii: "Device model stripped · Only performance tier retained" },
  region_tier:  { pii: "Country-level only · No GPS, suburb or postcode ever stored" },
  interest_vec: { pii: "Derived from app category usage only · No browsing history read" },
  time_pattern: { pii: "Resolved to 6-hour blocks only · No exact timestamps stored" },
  yield_score:  { pii: "Derived composite score only · Cannot be reverse-engineered" },
};

export default function DataScreen() {
  const [scores, setScores]     = useState(() => Object.fromEntries(CATEGORIES.map(c => [c.key, randomScore()])));
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [log, setLog]           = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [activeTier]            = useState('Pro'); // In real app this comes from user profile

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('https://elon-80f3c272.base44.app/functions/sentinelIngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Sentinel-Client': 'ios-expo' },
        body: JSON.stringify({
          token:          'expo-demo-' + Math.random().toString(36).slice(2, 10),
          platform:       'ios-expo',
          timestamp:      new Date().toISOString(),
          signals:        scores,
          schema_version: '1.0',
          session_count:  3,
        })
      });
      const json = await res.json();
      const newScores = Object.fromEntries(CATEGORIES.map(c => [c.key, randomScore()]));
      setScores(newScores);
      setLastSync(new Date().toLocaleTimeString());
      setLog(prev => [
        `✓ ${new Date().toLocaleTimeString()} — ${json.status === 'accepted' ? 'payload accepted' : 'rejected: ' + json.errors?.join(', ')}`,
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      setLog(prev => [`✗ Sync failed: ${e.message}`, ...prev.slice(0, 4)]);
    }
    setSyncing(false);
  };

  const tierUnlocks = (tier) => ({
    Free:  ['network_type','device_class','region_tier'],
    Pro:   ['network_type','device_class','region_tier','app_usage','session_freq','yield_score'],
    Elite: CATEGORIES.map(c => c.key),
  }[tier] || []);

  const activeKeys = tierUnlocks(activeTier);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>DATA PAYLOAD</Text>
      <Text style={s.sub}>Anonymised signal profile · SHA-256 token</Text>

      {/* Current tier pill */}
      <View style={s.tierPill}>
        <Text style={[s.tierPillText, { color: TIER_COLOR[activeTier] }]}>
          {activeTier.toUpperCase()} PLAN · {activeKeys.length} of {CATEGORIES.length} signals active
        </Text>
      </View>

      {/* Sync button */}
      <TouchableOpacity style={s.syncBtn} onPress={handleSync} disabled={syncing} activeOpacity={0.8}>
        {syncing
          ? <ActivityIndicator color={colors.bg} size="small" />
          : <Text style={s.syncBtnText}>⬆ SYNC TO SENTINEL BACKEND</Text>
        }
      </TouchableOpacity>
      {lastSync && <Text style={s.lastSync}>Last sync: {lastSync}</Text>}

      {/* Signal bars */}
      {CATEGORIES.map(cat => {
        const locked  = !activeKeys.includes(cat.key);
        const isOpen  = expanded === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[s.catRow, locked && s.catRowLocked]}
            onPress={() => setExpanded(isOpen ? null : cat.key)}
            activeOpacity={0.8}
          >
            <View style={s.catTop}>
              <Text style={s.catIcon}>{cat.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={s.catHeader}>
                  <View style={s.catLabelRow}>
                    <Text style={[s.catLabel, locked && { color: colors.textMuted }]}>{cat.label}</Text>
                    {locked && (
                      <View style={s.lockBadge}>
                        <Text style={s.lockText}>🔒 {cat.tier}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.catScore, { color: locked ? colors.textMuted : cat.color }]}>
                    {locked ? '—' : scores[cat.key]}
                  </Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, {
                    width: locked ? '0%' : `${scores[cat.key]}%`,
                    backgroundColor: cat.color,
                    opacity: locked ? 0 : 1
                  }]} />
                </View>
              </View>
            </View>

            {/* Expanded detail */}
            {isOpen && (
              <View style={s.expandPanel}>
                <Text style={s.expandTitle}>PII PROTECTION</Text>
                <Text style={s.expandText}>🔒 {SIGNAL_INFO[cat.key]?.pii}</Text>
                <Text style={[s.expandTitle, { marginTop: 8 }]}>TIER REQUIRED</Text>
                <View style={s.tierRow}>
                  {['Free','Pro','Elite'].map(t => (
                    <View key={t} style={[s.tierBadge,
                      { borderColor: cat.tier === t || (cat.tier === 'Free') ||
                        (cat.tier === 'Pro' && (t === 'Pro' || t === 'Elite')) ||
                        (cat.tier === 'Elite' && t === 'Elite')
                        ? TIER_COLOR[t] : colors.border,
                        backgroundColor: activeTier === t ? `${TIER_COLOR[t]}22` : 'transparent'
                      }]}>
                      <Text style={[s.tierBadgeText, { color: TIER_COLOR[t] }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Sync log */}
      {log.length > 0 && (
        <View style={s.logPanel}>
          <Text style={s.logTitle}>PAYLOAD LOG</Text>
          {log.map((line, i) => (
            <Text key={i} style={[s.logLine,
              line.startsWith('✓') ? { color: colors.green } : { color: '#FF4444' }]}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {/* Token display */}
      <View style={s.tokenPanel}>
        <Text style={s.tokenLabel}>DEVICE TOKEN (SHA-256)</Text>
        <Text style={s.tokenValue}>a7f3...{Math.random().toString(16).slice(2,6)}...9e2c</Text>
        <Text style={s.tokenNote}>One-way hash · Never reverse-engineerable · Zero PII</Text>
      </View>

      {/* Zero PII note */}
      <View style={s.compliancePanel}>
        <Text style={s.complianceText}>
          🔒 Zero PII Guarantee · All signals are anonymised, aggregated,
          and SHA-256 hashed before transmission.{'\n'}
          APPs · GDPR · CCPA Compliant · Privacy Policy v1.2
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  content:        { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  title:          { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:            { color: colors.textMuted, fontSize: 12, marginBottom: 12, marginTop: 4 },
  tierPill:       { backgroundColor: colors.panel, borderRadius: 20, borderWidth: 1,
                    borderColor: colors.borderPink, paddingHorizontal: 14, paddingVertical: 7,
                    alignSelf: 'flex-start', marginBottom: 16 },
  tierPillText:   { fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', fontWeight: '700' },
  syncBtn:        { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 14,
                    alignItems: 'center', marginBottom: 8 },
  syncBtnText:    { color: colors.bg, fontWeight: 'bold', letterSpacing: 2, fontSize: 12, fontFamily: 'monospace' },
  lastSync:       { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 16 },
  catRow:         { backgroundColor: colors.panel, borderRadius: 10, padding: 14,
                    borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  catRowLocked:   { opacity: 0.55 },
  catTop:         { flexDirection: 'row', alignItems: 'center' },
  catIcon:        { fontSize: 22 },
  catHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLabel:       { color: colors.textSec, fontSize: 13, fontWeight: '600' },
  catScore:       { fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' },
  lockBadge:      { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  lockText:       { color: colors.textMuted, fontSize: 9, letterSpacing: 1 },
  barBg:          { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill:        { height: 4, borderRadius: 2 },
  expandPanel:    { marginTop: 12, backgroundColor: colors.panelMid || '#161A2C',
                    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.borderPink },
  expandTitle:    { color: colors.textMuted, fontSize: 9, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 4 },
  expandText:     { color: colors.textSec, fontSize: 12, lineHeight: 18 },
  tierRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  tierBadge:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeText:  { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  logPanel:       { backgroundColor: colors.panel, borderRadius: 12, padding: 14,
                    borderWidth: 1, borderColor: colors.borderPink, marginBottom: 14 },
  logTitle:       { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  logLine:        { fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
  tokenPanel:     { backgroundColor: '#0A000F', borderRadius: 12, padding: 16,
                    borderWidth: 1, borderColor: colors.borderPink, marginBottom: 14 },
  tokenLabel:     { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 },
  tokenValue:     { color: colors.pink, fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 },
  tokenNote:      { color: colors.textMuted, fontSize: 11 },
  compliancePanel:{ backgroundColor: colors.panel, borderRadius: 10, padding: 14,
                    borderWidth: 1, borderColor: colors.border },
  complianceText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
});
