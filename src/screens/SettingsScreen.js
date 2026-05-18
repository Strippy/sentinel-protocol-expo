import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme';

export default function SettingsScreen() {
  const [autoStart, setAutoStart]   = useState(true);
  const [notify, setNotify]         = useState(true);
  const [darkDns, setDarkDns]       = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  const Row = ({ label, sub, value, onChange }) => (
    <View style={s.settingRow}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={s.settingLabel}>{label}</Text>
        {sub && <Text style={s.settingSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.pink50 }}
        thumbColor={value ? colors.pink : colors.textMuted}
      />
    </View>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>CONFIG</Text>
      <Text style={s.sub}>Sentinel Protocol · v1.0.0-MVP</Text>

      <Text style={s.section}>VPN & FILTER</Text>
      <View style={s.card}>
        <Row label="Auto-Start on Boot" sub="Restart DNS filter after reboot" value={autoStart} onChange={setAutoStart} />
        <View style={s.divider} />
        <Row label="Strict DNS Mode" sub="Block all non-whitelisted resolvers" value={strictMode} onChange={setStrictMode} />
        <View style={s.divider} />
        <Row label="Dark Web DNS" sub="Route via privacy-preserving resolver" value={darkDns} onChange={setDarkDns} />
      </View>

      <Text style={s.section}>NOTIFICATIONS</Text>
      <View style={s.card}>
        <Row label="Tracker Alerts" sub="Notify when new trackers are blocked" value={notify} onChange={setNotify} />
      </View>

      <Text style={s.section}>DATA & PRIVACY</Text>
      <View style={s.card}>
        <TouchableOpacity style={s.actionRow} activeOpacity={0.7}
          onPress={() => Alert.alert('Data Deletion', 'Your hashed telemetry records will be removed within 30 days.\n\nEmail: privacy@sentinelprotocol.app')}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Request Data Deletion</Text>
            <Text style={s.settingSub}>Remove your hashed records within 30 days</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity style={s.actionRow} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Privacy Policy v1.2</Text>
            <Text style={s.settingSub}>Effective May 18, 2026 · APPs · GDPR · CCPA</Text>
          </View>
          <Text style={[s.chevron, { color: colors.pink }]}>›</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity style={s.actionRow} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Export My Data</Text>
            <Text style={s.settingSub}>Download a copy of your anonymised data record</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>ABOUT</Text>
      <View style={s.card}>
        <View style={s.infoRow}><Text style={s.infoKey}>Version</Text><Text style={s.infoVal}>1.0.0-MVP</Text></View>
        <View style={s.divider} />
        <View style={s.infoRow}><Text style={s.infoKey}>Backend</Text><Text style={[s.infoVal, { color: colors.green }]}>● LIVE</Text></View>
        <View style={s.divider} />
        <View style={s.infoRow}><Text style={s.infoKey}>Token</Text><Text style={s.infoVal}>SHA-256 · Keychain</Text></View>
        <View style={s.divider} />
        <View style={s.infoRow}><Text style={s.infoKey}>Contact</Text><Text style={[s.infoVal, { color: colors.pink }]}>privacy@sentinelprotocol.app</Text></View>
      </View>

      <Text style={s.compliance}>
        Zero Logs · Zero Tracking · Your Data · Your Yield{'\n'}
        © 2026 Sentinel Protocol
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  content:      { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 48 },
  title:        { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:          { color: colors.textMuted, fontSize: 12, marginBottom: 28, marginTop: 4 },
  section:      { color: colors.textMuted, fontSize: 9, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 8, marginTop: 6 },
  card:         { backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1,
                  borderColor: colors.border, marginBottom: 20, overflow: 'hidden' },
  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  actionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel: { color: colors.white, fontSize: 14 },
  settingSub:   { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  divider:      { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  chevron:      { color: colors.textMuted, fontSize: 20, fontWeight: '300' },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoKey:      { color: colors.textMuted, fontSize: 13 },
  infoVal:      { color: colors.textSec, fontSize: 13, fontFamily: 'monospace' },
  compliance:   { color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});
