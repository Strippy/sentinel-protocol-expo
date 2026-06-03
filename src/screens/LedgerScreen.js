import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { useVpn } from '../context/VpnContext';

const RISK_COLOR = { HIGH: '#FF4D4D', MEDIUM: '#FFB800', LOW: colors.green };
const SORT_OPTIONS = ['TIME', 'RISK', 'DOMAIN'];

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
}

function EventRow({ event }) {
  const riskColor = RISK_COLOR[event.riskLabel] || colors.textMuted;
  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: event.blocked ? '#FF4D4D' : riskColor }]} />
      <View style={s.rowBody}>
        <Text style={s.domain} numberOfLines={1}>{event.domain}</Text>
        <Text style={s.meta}>{formatTime(event.timestamp)} · {event.packetSizeBytes}B · {event.riskLabel}</Text>
      </View>
      {event.blocked
        ? <View style={s.blockedBadge}><Text style={s.blockedText}>BLOCKED</Text></View>
        : <View style={s.allowedBadge}><Text style={s.allowedText}>ALLOWED</Text></View>
      }
    </View>
  );
}

export default function LedgerScreen() {
  const { recentEvents, vpnActive, trackers, blocked } = useVpn();
  const [query, setQuery] = useState('');
  const [sort, setSort]   = useState('TIME');
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    let list = recentEvents;
    if (query) list = list.filter(e => e.domain.toLowerCase().includes(query.toLowerCase()));
    if (filter === 'BLOCKED') list = list.filter(e => e.blocked);
    if (filter === 'ALLOWED') list = list.filter(e => !e.blocked);
    if (filter === 'HIGH')    list = list.filter(e => e.riskLabel === 'HIGH');

    if (sort === 'RISK') {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      list = [...list].sort((a, b) => (order[a.riskLabel] ?? 3) - (order[b.riskLabel] ?? 3));
    } else if (sort === 'DOMAIN') {
      list = [...list].sort((a, b) => a.domain.localeCompare(b.domain));
    }
    return list;
  }, [recentEvents, query, sort, filter]);

  const highCount    = recentEvents.filter(e => e.riskLabel === 'HIGH').length;
  const allowedCount = recentEvents.length - blocked;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>LEDGER</Text>
        <Text style={[s.vpnStatus, { color: vpnActive ? colors.green : colors.textMuted }]}>
          {vpnActive ? '● LIVE' : '○ OFFLINE'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statNum}>{recentEvents.length}</Text>
          <Text style={s.statLabel}>INTERCEPTED</Text>
        </View>
        <View style={[s.stat, s.statDivider]}>
          <Text style={[s.statNum, { color: '#FF4D4D' }]}>{blocked}</Text>
          <Text style={s.statLabel}>BLOCKED</Text>
        </View>
        <View style={[s.stat, s.statDivider]}>
          <Text style={[s.statNum, { color: '#FF4D4D' }]}>{highCount}</Text>
          <Text style={s.statLabel}>HIGH RISK</Text>
        </View>
        <View style={[s.stat, s.statDivider]}>
          <Text style={[s.statNum, { color: colors.green }]}>{allowedCount}</Text>
          <Text style={s.statLabel}>ALLOWED</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Filter domains..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
        {['ALL','BLOCKED','ALLOWED','HIGH'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.chipSep} />
        {SORT_OPTIONS.map(o => (
          <TouchableOpacity
            key={o}
            style={[s.chip, sort === o && s.chipActive]}
            onPress={() => setSort(o)}
          >
            <Text style={[s.chipText, sort === o && s.chipTextActive]}>↕ {o}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{vpnActive ? '📡' : '⬡'}</Text>
          <Text style={s.emptyText}>
            {vpnActive
              ? 'Monitoring — events will appear here as DNS queries are intercepted'
              : 'Start the VPN shield to begin intercepting DNS events'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => String(e.id)}
          renderItem={({ item }) => <EventRow event={item} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14 },
  title:        { color: colors.white, fontSize: 22, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
  vpnStatus:    { fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' },

  statsRow:     { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14,
                  backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  stat:         { flex: 1, paddingVertical: 12, alignItems: 'center' },
  statDivider:  { borderLeftWidth: 1, borderLeftColor: colors.border },
  statNum:      { color: colors.white, fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
  statLabel:    { color: colors.textMuted, fontSize: 8, letterSpacing: 1,
                  fontFamily: 'monospace', marginTop: 2 },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
                  backgroundColor: colors.panel, borderRadius: 10, borderWidth: 1,
                  borderColor: colors.border, paddingHorizontal: 12, marginBottom: 10 },
  searchIcon:   { fontSize: 14, marginRight: 8 },
  search:       { flex: 1, color: colors.white, fontSize: 14, paddingVertical: 11 },

  chips:        { maxHeight: 44, marginBottom: 8 },
  chipsContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip:         { borderRadius: 20, borderWidth: 1, borderColor: colors.border,
                  paddingHorizontal: 12, paddingVertical: 5 },
  chipActive:   { borderColor: colors.pink, backgroundColor: colors.pink10 },
  chipText:     { color: colors.textMuted, fontSize: 9, letterSpacing: 1, fontFamily: 'monospace' },
  chipTextActive:{ color: colors.pink },
  chipSep:      { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 },

  list:         { paddingHorizontal: 20, paddingBottom: 20 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel,
                  borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                  padding: 12, marginBottom: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  rowBody:      { flex: 1, marginRight: 8 },
  domain:       { color: colors.white, fontSize: 13, fontWeight: '500', fontFamily: 'monospace' },
  meta:         { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  blockedBadge: { backgroundColor: 'rgba(255,77,77,0.12)', borderRadius: 5, borderWidth: 1,
                  borderColor: '#FF4D4D', paddingHorizontal: 6, paddingVertical: 2 },
  blockedText:  { color: '#FF4D4D', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'monospace' },
  allowedBadge: { backgroundColor: 'rgba(0,230,118,0.08)', borderRadius: 5, borderWidth: 1,
                  borderColor: colors.green, paddingHorizontal: 6, paddingVertical: 2 },
  allowedText:  { color: colors.green, fontSize: 8, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'monospace' },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { fontSize: 40, marginBottom: 16 },
  emptyText:    { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
