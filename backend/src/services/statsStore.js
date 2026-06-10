'use strict';

const store = {
  totalBlocked:  0,
  totalAllowed:  0,
  sessions:      new Set(),
  domainCounts:  {},
  startedAt:     Date.now(),
};

module.exports = {
  record(events, sessionId) {
    if (sessionId) store.sessions.add(sessionId);
    for (const evt of (events || [])) {
      if (typeof evt?.domain !== 'string') continue;
      evt.blocked ? store.totalBlocked++ : store.totalAllowed++;
      const d = evt.domain.toLowerCase();
      store.domainCounts[d] = (store.domainCounts[d] || 0) + 1;
    }
  },

  snapshot() {
    const topDomains = Object.entries(store.domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));
    return {
      totalBlocked:  store.totalBlocked,
      totalAllowed:  store.totalAllowed,
      totalSessions: store.sessions.size,
      topDomains,
      uptimeSecs:    Math.floor((Date.now() - store.startedAt) / 1000),
    };
  },
};
