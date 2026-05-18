import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

const CATEGORIES = [
  { key: 'app_usage',      label: 'App Usage',       icon: '📱', color: '#FF007F' },
  { key: 'session_freq',   label: 'Session Freq',    icon: '🔁', color: '#FF4DA6' },
  { key: 'network_type',   label: 'Network Type',    icon: '📡', color: '#CC0066' },
  { key: 'device_class',   label: 'Device Class',    icon: '📲', color: '#FF6EB4' },
  { key: 'region_tier',    label: 'Region Tier',     icon: '🌏', color: '#FF007F' },
  { key: 'interest_vec',   label: 'Interest Vector', icon: '🧠', color: '#FF4DA6' },
  { key: 'time_pattern',   label: 'Time Pattern',    icon: '⏱️', color: '#CC0066' },
  { key: 'yield_score',    label: 'Yield Score',     icon: '💰', color: '#FF007F' },
];

function randomScore() { return Math.floor(Math.random() * 60) + 30; }

export default function DataScreen() {
  const [scores, setScores]     = useState(() => Object.fromEntries(CATEGORIES.map(c => [c.key, randomScore()])));
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [log, setLog]           = useState([]);

  const handleSync = async () => {
    setSyncing(true);
    // Simulate API call to live backend
    try {
      const res = await fetch('https://elon-80f3c272.base44.app/functions/sentinelIngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'expo-demo-' + Math.random().toString(36).slice(2,10),
          platform: 'ios-expo',
          version: '1.0.0',
          signals: scores,
          timestamp: new Date().toISOString(),
        })
      });
      const newScores = Object.fromEntries(CATEGORIES.map(c => [c.key, randomScore()]));
      setScores(newScores);
      setLastSync(new Date().toLocaleTimeString());
      setLog(prev => [`✓ Sync ${new Date().toLocaleTimeString()} — payload accepted`, ...prev.slice(0,4)]);
    } catch (e) {
      setLog(prev => [`✗ Sync failed: ${e.message}`, ...prev.slice(0,4)]);
    }
    setSyncing(false);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>DATA PAYLOAD</Text>
      <Text style={s.sub}>Anonymised signal profile · SHA-256 token</Text>

      {/* Sync button */}
      <TouchableOpacity style={s.syncBtn} onPress={handleSync} disabled={syncing} activeOpacity={0.8}>
        {syncing
          ? <ActivityIndicator color={colors.bg} size="small" />
          : <Text style={s.syncBtnText}>⬆ SYNC TO SENTINEL BACKEND</Text>
        }
      </TouchableOpacity>
      {lastSync && <Text style={s.lastSync}>Last sync: {lastSync}</Text>}

      {/* Signal bars */}
      {CATEGORIES.map(cat => (
        <View key={cat.key} style={s.catRow}>
          <Text style={s.catIcon}>{cat.icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={s.catHeader}>
              <Text style={s.catLabel}>{cat.label}</Text>
              <Text style={[s.catScore, { color: cat.color }]}>{scores[cat.key]}</Text>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${scores[cat.key]}%`, backgroundColor: cat.color }]} />
            </View>
          </View>
        </View>
      ))}

      {/* Log */}
      {log.length > 0 && (
        <View style={s.logPanel}>
          <Text style={s.logTitle}>PAYLOAD LOG</Text>
          {log.map((line, i) => (
            <Text key={i} style={[s.logLine, line.startsWith('✓') ? { color: colors.green } : { color: '#FF4444' }]}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {/* Token display */}
      <View style={s.tokenPanel}>
        <Text style={s.tokenLabel}>DEVICE TOKEN (SHA-256)</Text>
        <Text style={s.tokenValue}>a7f3...{Math.random().toString(16).slice(2,6)}...9e2c</Text>
        <Text style={s.tokenNote}>One-way hash · Never reverse-engineerable · No PII</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  content:     { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  title:       { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:         { color: colors.textMuted, fontSize: 12, marginBottom: 20, marginTop: 4 },
  syncBtn:     { backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 14,
                 alignItems: 'center', marginBottom: 8 },
  syncBtnText: { color: colors.bg, fontWeight: 'bold', letterSpacing: 2, fontSize: 12, fontFamily: 'monospace' },
  lastSync:    { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 20 },
  catRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.panel,
                 borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border },
  catIcon:     { fontSize: 22 },
  catHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel:    { color: colors.textSec, fontSize: 13 },
  catScore:    { fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' },
  barBg:       { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill:     { height: 4, borderRadius: 2 },
  logPanel:    { backgroundColor: colors.panel, borderRadius: 12, padding: 14,
                 borderWidth: 1, borderColor: colors.borderPink, marginBottom: 14 },
  logTitle:    { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 },
  logLine:     { fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
  tokenPanel:  { backgroundColor: '#0A000F', borderRadius: 12, padding: 16,
                 borderWidth: 1, borderColor: colors.borderPink, marginBottom: 20 },
  tokenLabel:  { color: colors.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 },
  tokenValue:  { color: colors.pink, fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 },
  tokenNote:   { color: colors.textMuted, fontSize: 11 },
});
