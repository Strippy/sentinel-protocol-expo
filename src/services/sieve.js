// Real tracker domains for sieve probe scanning
export const SIEVE_DOMAINS = [
  { domain: 'doubleclick.net',          riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'googletagmanager.com',     riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'googlesyndication.com',    riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'google-analytics.com',     riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'connect.facebook.net',     riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'graph.facebook.com',       riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'pixel.facebook.com',       riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'cdn.amplitude.com',        riskLabel: 'MEDIUM', category: 'other',         blocked: true  },
  { domain: 'api.segment.io',           riskLabel: 'MEDIUM', category: 'other',         blocked: false },
  { domain: 'analytics.twitter.com',    riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'ads.tiktok.com',           riskLabel: 'HIGH',   category: 'social_media',  blocked: true  },
  { domain: 'mixpanel.com',             riskLabel: 'MEDIUM', category: 'other',         blocked: false },
  { domain: 'adnxs.com',               riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'criteo.com',               riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'taboola.com',             riskLabel: 'MEDIUM', category: 'news',          blocked: true  },
  { domain: 'outbrain.com',            riskLabel: 'MEDIUM', category: 'news',          blocked: false },
  { domain: 'scorecardresearch.com',   riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'bat.bing.com',            riskLabel: 'MEDIUM', category: 'other',         blocked: true  },
  { domain: 'clarity.ms',              riskLabel: 'MEDIUM', category: 'other',         blocked: false },
  { domain: 'hotjar.com',              riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'intercom.io',             riskLabel: 'LOW',    category: 'other',         blocked: false },
  { domain: 'heapanalytics.com',       riskLabel: 'MEDIUM', category: 'other',         blocked: true  },
  { domain: 'adjust.com',             riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'branch.io',              riskLabel: 'MEDIUM', category: 'other',         blocked: true  },
  { domain: 'appsflyer.com',          riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'moatads.com',            riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'pubmatic.com',           riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'rubiconproject.com',     riskLabel: 'HIGH',   category: 'other',         blocked: true  },
  { domain: 'cloudfront.net',         riskLabel: 'LOW',    category: 'streaming',     blocked: false },
  { domain: 'newrelic.com',           riskLabel: 'MEDIUM', category: 'other',         blocked: false },
];

export const BLOCKLIST_COUNT = 89; // total domains in SW blocklist

export function pickSieveDomain() {
  return SIEVE_DOMAINS[Math.floor(Math.random() * SIEVE_DOMAINS.length)];
}
