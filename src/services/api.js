import { Platform } from 'react-native';

const BASE = Platform.OS === 'web'
  ? '/api'
  : (__DEV__ ? 'http://localhost:3000/api' : 'https://sentinel-protocol-expo.vercel.app/api');

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const getHealth      = ()            => req('/health');
export const getLiveStats   = ()            => req('/stats');
export const createCheckout = (plan, email) =>
  req('/subscribe', { method: 'POST', body: JSON.stringify({ plan, email }) });
