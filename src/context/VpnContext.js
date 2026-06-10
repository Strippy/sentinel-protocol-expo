import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { getLiveStats } from '../services/api';
import { pickSieveDomain, BLOCKLIST_COUNT } from '../services/sieve';

const VpnContext = createContext(null);

// ── Service Worker helpers (web only) ─────────────────────────────────────────

function swSend(msg) {
  if (Platform.OS !== 'web' || !navigator?.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage(msg);
}

function listenSW(onEvent) {
  if (Platform.OS !== 'web' || !navigator?.serviceWorker) return () => {};
  const handler = (e) => { if (e.data?.type === 'SENTINEL_BLOCKED') onEvent(e.data); };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

// ── Batch ingest queue ────────────────────────────────────────────────────────

const ingestQueue = [];
async function flushIngest() {
  if (!ingestQueue.length) return;
  const batch = ingestQueue.splice(0, ingestQueue.length);
  try {
    const base = Platform.OS === 'web' ? '/api' : (__DEV__ ? 'http://localhost:3000/api' : 'https://sentinel-protocol-expo.vercel.app/api');
    await fetch(`${base}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch, sessionId: batch[0]?.sessionId }),
    });
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function VpnProvider({ children }) {
  const [vpnActive, setVpnActive]     = useState(false);
  const [yieldOn, setYieldOn]         = useState(false);
  const [trackers, setTrackers]       = useState(0);
  const [blocked, setBlocked]         = useState(0);
  const [yieldAmt, setYieldAmt]       = useState(0.00);
  const [uptime, setUptime]           = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [heatmap, setHeatmap]         = useState([]);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverStats, setServerStats] = useState(null);
  const [swReady, setSwReady]         = useState(false);
  const [rulesCount]                  = useState(BLOCKLIST_COUNT);

  const uptimeRef = useRef(null);
  const eventRef  = useRef(null);
  const flushRef  = useRef(null);
  const sessionId = useRef(`web-${Date.now()}`);

  const toggleVpn = useCallback(() => setVpnActive(v => !v), []);

  // ── SW ready check ───────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const check = () => {
      if (navigator?.serviceWorker?.controller) setSwReady(true);
    };
    check();
    navigator?.serviceWorker?.addEventListener('controllerchange', check);
    return () => navigator?.serviceWorker?.removeEventListener('controllerchange', check);
  }, []);

  // ── SW → app message channel ─────────────────────────────────────────────
  useEffect(() => {
    const addEvent = (data) => {
      const evt = {
        id:              Date.now() + Math.random(),
        domain:          data.domain,
        riskLabel:       data.riskLabel || 'MEDIUM',
        blocked:         true,
        packetSizeBytes: Math.floor(Math.random() * 1500) + 200,
        hourBucket:      new Date().getHours(),
        timestamp:       data.ts || Date.now(),
        source:          'sw',
      };
      setTrackers(t => t + 1);
      setBlocked(b => b + 1);
      if (yieldOn) setYieldAmt(y => parseFloat((y + 0.002).toFixed(3)));
      setRecentEvents(prev => [evt, ...prev].slice(0, 200));
      ingestQueue.push({ ...evt, sessionId: sessionId.current });
    };
    return listenSW(addEvent);
  }, [yieldOn]);

  // ── VPN active: tick events + SW state ───────────────────────────────────
  useEffect(() => {
    if (vpnActive) {
      swSend('SIEVE_ON');

      uptimeRef.current = setInterval(() => setUptime(t => t + 1), 1000);

      eventRef.current = setInterval(() => {
        const sample = pickSieveDomain();
        const evt = {
          id:              Date.now() + Math.random(),
          domain:          sample.domain,
          riskLabel:       sample.riskLabel,
          blocked:         sample.blocked,
          packetSizeBytes: Math.floor(Math.random() * 1500) + 200,
          hourBucket:      new Date().getHours(),
          timestamp:       Date.now(),
          source:          'sieve',
        };
        setTrackers(t => t + 1);
        if (evt.blocked) setBlocked(b => b + 1);
        if (yieldOn && evt.blocked) setYieldAmt(y => parseFloat((y + 0.001).toFixed(3)));
        setRecentEvents(prev => [evt, ...prev].slice(0, 200));

        const hour = new Date().getHours();
        const day  = (new Date().getDay() + 6) % 7;
        setHeatmap(prev => {
          const idx = prev.findIndex(c => c.day === day && c.hour === hour);
          if (idx === -1) return [...prev, { day, hour, intensity: 0.1 }];
          const u = [...prev];
          u[idx] = { ...u[idx], intensity: Math.min(1, u[idx].intensity + 0.05) };
          return u;
        });
        ingestQueue.push({ ...evt, sessionId: sessionId.current });
      }, 2200);

      flushRef.current = setInterval(flushIngest, 5000);
    } else {
      swSend('SIEVE_OFF');
      clearInterval(uptimeRef.current);
      clearInterval(eventRef.current);
      clearInterval(flushRef.current);
      flushIngest();
      setUptime(0);
    }
    return () => {
      swSend('SIEVE_OFF');
      clearInterval(uptimeRef.current);
      clearInterval(eventRef.current);
      clearInterval(flushRef.current);
    };
  }, [vpnActive, yieldOn]);

  // ── Server stats polling ─────────────────────────────────────────────────
  useEffect(() => {
    function poll() {
      getLiveStats()
        .then(d => { setServerConnected(true); setServerStats(d); })
        .catch(() => setServerConnected(false));
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <VpnContext.Provider value={{
      vpnActive, yieldOn, trackers, blocked, yieldAmt,
      uptime, recentEvents, heatmap,
      serverConnected, serverStats, swReady, rulesCount,
      toggleVpn, setYieldOn,
    }}>
      {children}
    </VpnContext.Provider>
  );
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error('useVpn must be used inside VpnProvider');
  return ctx;
}
