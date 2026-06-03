import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const VpnContext = createContext(null);

const SAMPLE_DOMAINS = [
  { domain: 'doubleclick.net',    riskLabel: 'HIGH',   blocked: true,  packetSizeBytes: 512 },
  { domain: 'googletagmanager.com', riskLabel: 'HIGH', blocked: true,  packetSizeBytes: 1024 },
  { domain: 'facebook.com',       riskLabel: 'HIGH',   blocked: true,  packetSizeBytes: 768 },
  { domain: 'googlesyndication.com', riskLabel: 'HIGH', blocked: true, packetSizeBytes: 2048 },
  { domain: 'analytics.google.com', riskLabel: 'MEDIUM', blocked: false, packetSizeBytes: 256 },
  { domain: 'cdn.amplitude.com',  riskLabel: 'MEDIUM', blocked: true,  packetSizeBytes: 384 },
  { domain: 'api.segment.io',     riskLabel: 'MEDIUM', blocked: false, packetSizeBytes: 640 },
  { domain: 'graph.facebook.com', riskLabel: 'HIGH',   blocked: true,  packetSizeBytes: 896 },
  { domain: 'connect.facebook.net', riskLabel: 'HIGH', blocked: true,  packetSizeBytes: 1536 },
  { domain: 'mixpanel.com',       riskLabel: 'MEDIUM', blocked: false, packetSizeBytes: 320 },
  { domain: 'cloudfront.net',     riskLabel: 'LOW',    blocked: false, packetSizeBytes: 4096 },
  { domain: 'app.adjust.com',     riskLabel: 'HIGH',   blocked: true,  packetSizeBytes: 448 },
  { domain: 'branch.io',          riskLabel: 'MEDIUM', blocked: true,  packetSizeBytes: 512 },
  { domain: 'firebase.io',        riskLabel: 'LOW',    blocked: false, packetSizeBytes: 768 },
  { domain: 'moatads.com',        riskLabel: 'HIGH',   blocked: true,  packetSizeBytes: 256 },
];

function generateEvent() {
  const sample = SAMPLE_DOMAINS[Math.floor(Math.random() * SAMPLE_DOMAINS.length)];
  return {
    id:              Date.now() + Math.random(),
    domain:          sample.domain,
    riskLabel:       sample.riskLabel,
    blocked:         sample.blocked,
    packetSizeBytes: sample.packetSizeBytes + Math.floor(Math.random() * 128),
    hourBucket:      new Date().getHours(),
    timestamp:       Date.now(),
  };
}

export function VpnProvider({ children }) {
  const [vpnActive, setVpnActive]     = useState(false);
  const [yieldOn, setYieldOn]         = useState(false);
  const [trackers, setTrackers]       = useState(0);
  const [blocked, setBlocked]         = useState(0);
  const [yieldAmt, setYieldAmt]       = useState(0.00);
  const [uptime, setUptime]           = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [heatmap, setHeatmap]         = useState([]);

  const uptimeRef  = useRef(null);
  const eventRef   = useRef(null);

  const toggleVpn = useCallback(() => setVpnActive(v => !v), []);

  useEffect(() => {
    if (vpnActive) {
      uptimeRef.current = setInterval(() => setUptime(t => t + 1), 1000);

      eventRef.current = setInterval(() => {
        const event = generateEvent();
        setTrackers(t => t + 1);
        if (event.blocked) setBlocked(b => b + 1);
        if (yieldOn && event.blocked) setYieldAmt(y => parseFloat((y + 0.001).toFixed(3)));

        setRecentEvents(prev => {
          const next = [event, ...prev];
          return next.slice(0, 200);
        });

        // Update heatmap intensity
        const hour = new Date().getHours();
        const day  = (new Date().getDay() + 6) % 7; // Mon=0
        setHeatmap(prev => {
          const idx = prev.findIndex(c => c.day === day && c.hour === hour);
          if (idx === -1) {
            return [...prev, { day, hour, intensity: 0.1 }];
          }
          const updated = [...prev];
          updated[idx] = { ...updated[idx], intensity: Math.min(1, updated[idx].intensity + 0.05) };
          return updated;
        });
      }, 2200);
    } else {
      clearInterval(uptimeRef.current);
      clearInterval(eventRef.current);
      setUptime(0);
    }
    return () => {
      clearInterval(uptimeRef.current);
      clearInterval(eventRef.current);
    };
  }, [vpnActive, yieldOn]);

  return (
    <VpnContext.Provider value={{
      vpnActive, yieldOn, trackers, blocked, yieldAmt,
      uptime, recentEvents, heatmap,
      toggleVpn,
      setYieldOn,
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
