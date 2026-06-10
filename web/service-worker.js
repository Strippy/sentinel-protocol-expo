'use strict';

const TRACKER_DOMAINS = [
  'doubleclick.net','googleadservices.com','googlesyndication.com',
  'googletagmanager.com','googletagservices.com','google-analytics.com',
  'stats.g.doubleclick.net','adservice.google.com',
  'facebook.com','connect.facebook.net','graph.facebook.com','an.facebook.com',
  'audiencenetwork.com','pixel.facebook.com',
  'amplitude.com','cdn.amplitude.com','api.amplitude.com','api2.amplitude.com',
  'segment.io','api.segment.io','cdn.segment.com','cdn.segment.io',
  'mixpanel.com','api.mixpanel.com','cdn4.mxpnl.com',
  'fullstory.com','rs6.fullstory.com',
  'hotjar.com','vars.hotjar.com','static.hotjar.com',
  'intercom.io','widget.intercom.io','nexus-websocket-a.intercom.io',
  'heapanalytics.com','heap.io',
  'mouseflow.com','crazyegg.com',
  'moatads.com','moat.com',
  'criteo.com','static.criteo.net','dis.criteo.com','rtax.criteo.com',
  'taboola.com','trc.taboola.com','cdn.taboola.com',
  'outbrain.com','widgets.outbrain.com','traffic.outbrain.com',
  'scorecardresearch.com','pixel.quantserve.com','quantserve.com',
  'adnxs.com','secure.adnxs.com','ib.adnxs.com',
  'casalemedia.com','scdn.casalemedia.com',
  'pubmatic.com','ads.pubmatic.com','simage2.pubmatic.com',
  'rubiconproject.com','fastlane.rubiconproject.com',
  'openx.net','us-u.openx.net',
  'media.net','contextual.media.net',
  'spotxchange.com','spotx.tv',
  'adjust.com','app.adjust.com','s.adjust.com','t.adjust.com',
  'branch.io','api.branch.io','app.link',
  'appsflyer.com','impressions.appsflyer.com',
  'kochava.com','control.kochava.com',
  'singular.net','sdk.singular.net',
  'ads.twitter.com','static.ads-twitter.com','analytics.twitter.com',
  'snap.licdn.com','platform.linkedin.com',
  'analytics.tiktok.com','ads.tiktok.com','business-api.tiktok.com',
  'bat.bing.com','clarity.ms','c.bing.com',
  'widgets.pinterest.com','log.pinterest.com','ct.pinterest.com',
  'adsymptotic.com','bidswitch.net','openrtb.net',
  'advertising.com','atwola.com','adtechlab.com',
  'gemius.pl','akstat.io',
  'nr-data.net','newrelic.com','bam.nr-data.net',
  'sentry.io','ingest.sentry.io',
  'mc.yandex.ru','mc.yandex.com',
  'omtrdc.net','demdex.net',
  'mookie1.com','bluekai.com','exelator.com',
  'turn.com','mathtag.com',
  'spotim.market','disqus.com',
  'sharethis.com','addthis.com',
];

let sievelActive = false;

self.addEventListener('message', (e) => {
  if (e.data === 'SIEVE_ON')  { sievelActive = true; }
  if (e.data === 'SIEVE_OFF') { sievelActive = false; }
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function isBlocked(hostname) {
  return TRACKER_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
}

self.addEventListener('fetch', (event) => {
  if (!sievelActive) return;
  let hostname;
  try { hostname = new URL(event.request.url).hostname; } catch { return; }
  const selfHost = self.location.hostname;
  if (hostname === selfHost || hostname === 'localhost' || hostname === '127.0.0.1') return;

  if (isBlocked(hostname)) {
    const riskLabel = ['doubleclick','facebook','googlesyndication','adnxs','criteo'].some(t => hostname.includes(t))
      ? 'HIGH' : hostname.includes('analytics') || hostname.includes('segment') || hostname.includes('amplitude')
      ? 'MEDIUM' : 'LOW';

    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({
        type: 'SENTINEL_BLOCKED', domain: hostname, riskLabel, ts: Date.now(),
      }))
    );
    event.respondWith(new Response('', { status: 200, headers: { 'X-Sentinel': 'blocked' } }));
  }
});
