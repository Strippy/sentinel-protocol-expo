import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Switch, ScrollView } from 'react-native';
import { colors } from '../theme';

const PERSONAS = [
  { id: 'ghost',    label: 'Ghost',    desc: 'No identity signature. Minimal footprint.',       icon: '👤' },
  { id: 'tourist',  label: 'Tourist',  desc: 'Appears as casual browser. Random region.',        icon: '🌍' },
  { id: 'dev',      label: 'Dev Mode', desc: 'Tech-forward profile. Low ad relevance score.',    icon: '💻' },
  { id: 'stealth',  label: 'Stealth',  desc: 'Maximum signal suppression. Dark pattern immunity.',icon: '🕶️' },
];

export default function GhostScreen() {
  const [ghostActive, setGhostActive] = useState(false);
  const [selected, setSelected]       = useState('ghost');
  const [maskOn, setMaskOn]           = useState(false);

  const glitchAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ghostActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchAnim, { toValue: 1,  duration: 80,  useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: -1, duration: 80,  useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: 0,  duration: 2800,useNativeDriver: true }),
        ])
      ).start();
    } else {
      glitchAnim.stopAnimation();
      glitchAnim.setValue(0);
    }
  }, [ghostActive]);

  const glitchX = glitchAnim.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>GHOST MODE</Text>
      <Text style={s.sub}>Identity masking & persona engine</Text>

      {/* Ghost avatar */}
      <View style={s.avatarWrap}>
        <Animated.View style={[s.avatarRing, ghostActive && s.avatarRingActive]}>
          <Animated.Text style={[s.avatar, { transform: [{ translateX: glitchX }] }]}>
            {ghostActive ? '👁️' : '👤'}
          </Animated.Text>
        </Animated.View>
        <Text style={[s.statusBadge, { color: ghostActive ? colors.pink : colors.textMuted }]}>
          {ghostActive ? '⚡ IDENTITY MASKED' : 'IDENTITY EXPOSED'}
        </Text>
      </View>

      {/* Master toggle */}
      <View style={[s.panel, ghostActive && s.panelActive]}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>Ghost Protocol</Text>
            <Text style={s.panelSub}>Suppress behavioural identity signals</Text>
          </View>
          <Switch
            value={ghostActive}
            onValueChange={setGhostActive}
            trackColor={{ false: colors.border, true: colors.pink50 }}
            thumbColor={ghostActive ? colors.pink : colors.textMuted}
          />
        </View>
      </View>

      {/* Persona selector */}
      <Text style={s.sectionLabel}>SELECT PERSONA</Text>
      {PERSONAS.map(p => (
        <TouchableOpacity
          key={p.id}
          style={[s.personaCard, selected === p.id && s.personaCardActive]}
          onPress={() => setSelected(p.id)}
          activeOpacity={0.75}
        >
          <Text style={s.personaIcon}>{p.icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.personaLabel, selected === p.id && { color: colors.pink }]}>{p.label}</Text>
            <Text style={s.personaDesc}>{p.desc}</Text>
          </View>
          {selected === p.id && <Text style={s.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}

      {/* Identity mask toggle */}
      <View style={s.panel}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>Fingerprint Mask</Text>
            <Text style={s.panelSub}>Randomise device canvas & audio fingerprint</Text>
          </View>
          <Switch
            value={maskOn}
            onValueChange={setMaskOn}
            trackColor={{ false: colors.border, true: colors.pink50 }}
            thumbColor={maskOn ? colors.pink : colors.textMuted}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: colors.bg },
  content:          { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
  title:            { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  sub:              { color: colors.textMuted, fontSize: 12, marginBottom: 24, marginTop: 4 },
  avatarWrap:       { alignItems: 'center', marginBottom: 28 },
  avatarRing:       { width: 110, height: 110, borderRadius: 55, borderWidth: 2,
                      borderColor: colors.border, backgroundColor: colors.panel,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarRingActive: { borderColor: colors.pink, backgroundColor: '#1A0015',
                      shadowColor: colors.pink, shadowRadius: 20, shadowOpacity: 0.6 },
  avatar:           { fontSize: 44 },
  statusBadge:      { fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', fontWeight: '700' },
  panel:            { backgroundColor: colors.panel, borderRadius: 12, padding: 16,
                      borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  panelActive:      { borderColor: colors.pink },
  row:              { flexDirection: 'row', alignItems: 'center' },
  panelTitle:       { color: colors.white, fontSize: 15, fontWeight: '600' },
  panelSub:         { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionLabel:     { color: colors.textMuted, fontSize: 9, letterSpacing: 3,
                      fontFamily: 'monospace', marginBottom: 8, marginTop: 4 },
  personaCard:      { backgroundColor: colors.panel, borderRadius: 12, padding: 14,
                      borderWidth: 1, borderColor: colors.border,
                      marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  personaCardActive:{ borderColor: colors.pink, backgroundColor: '#0F0015' },
  personaIcon:      { fontSize: 26 },
  personaLabel:     { color: colors.white, fontSize: 14, fontWeight: '600' },
  personaDesc:      { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  checkmark:        { color: colors.pink, fontSize: 16, fontWeight: 'bold' },
});
