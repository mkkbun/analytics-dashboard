/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Define TypeScript interfaces inline for the server context
interface TelemetryEvent {
  id: string;
  type: 'pageview' | 'custom';
  name: string;
  url: string;
  path: string;
  referrer: string;
  userId: string;
  sessionId: string;
  screen: string;
  lang: string;
  utm: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  browser: string;
  device: string;
  country: string;
  timestamp: number;
  data?: Record<string, any>;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Advanced Telemetry Store & Indices
// Mimicking TimescaleDB (Time-series) and Redis (Cache pre-aggregates)
let dbEvents: TelemetryEvent[] = [];
let ingestQueue: TelemetryEvent[] = [];

// Redis Simulation Cache
const redisCache: Record<string, { data: any; expiry: number }> = {};
function getCached(key: string): any | null {
  const cached = redisCache[key];
  if (cached && cached.expiry > Date.now()) {
    console.log(`[Redis Cache HIT] Key: ${key}`);
    return cached.data;
  }
  return null;
}
function setCached(key: string, data: any, ttlMin = 5) {
  console.log(`[Redis Cache WRITE] Key: ${key}, TTL: ${ttlMin}m`);
  redisCache[key] = {
    data,
    expiry: Date.now() + ttlMin * 60 * 1000,
  };
}
function flushCache() {
  console.log(`[Redis Cache FLUSH] Clearing all cached analytics queries`);
  for (const key in redisCache) {
    delete redisCache[key];
  }
}

// SSE Connection Register
// Holds active Server-Sent Events write handles for real-time clients
let sseClients: any[] = [];

// Prepopulated static definitions
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Mobile Safari"];
const DEVICES = ["Desktop", "Mobile", "Tablet"];
const COUNTRIES = ["United States", "United Kingdom", "Germany", "Japan", "Singapore", "Canada", "Australia", "France"];
const REFERRERS = ["https://google.com", "https://github.com", "https://t.co/twitter", "https://news.ycombinator.com", "Direct"];
const REFERRER_UTMS: Record<string, any> = {
  "https://google.com": { utm_source: "google", utm_medium: "organic" },
  "https://github.com": { utm_source: "github", utm_medium: "social" },
  "https://t.co/twitter": { utm_source: "twitter", utm_medium: "social", utm_campaign: "launch_promo" },
  "https://news.ycombinator.com": { utm_source: "hn", utm_medium: "social" },
  "Direct": {}
};

// Seed 30 days of high-fidelity historical time-series analytics
console.log("Initializing historical database seed (TimescaleDB simulation)...");
const seedStartDate = Date.now() - 30 * 24 * 60 * 60 * 1000;

function generateUserId() {
  return "usr_" + Math.random().toString(36).substring(2, 10);
}

// Create 150 unique historical users
const seededUsers = Array.from({ length: 150 }).map(() => {
  const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
  const device = browser === "Mobile Safari" ? "Mobile" : DEVICES[Math.floor(Math.random() * DEVICES.length)];
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const ref = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
  return {
    userId: generateUserId(),
    browser,
    device,
    country,
    ref,
    utm: REFERRER_UTMS[ref] || {},
    lang: Math.random() > 0.4 ? "en-US" : "en-GB",
    screen: device === "Desktop" ? "1920x1080" : device === "Tablet" ? "1024x768" : "390x844",
  };
});

// Seed data loop
// Generate realistic sessions spreading across the last 30 days
let eventIdCounter = 1;
for (let i = 0; i < 30; i++) {
  const dayOffset = i * 24 * 60 * 60 * 1000;
  const currentDayTimestamp = seedStartDate + dayOffset;
  
  // High traffic on weekdays, lower on weekends
  const dayOfWeek = new Date(currentDayTimestamp).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const sessionCount = isWeekend ? 10 + Math.floor(Math.random() * 8) : 25 + Math.floor(Math.random() * 15);

  for (let s = 0; s < sessionCount; s++) {
    const user = seededUsers[Math.floor(Math.random() * seededUsers.length)];
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
    
    // Choose random starting time within the day
    const sessionStartTime = currentDayTimestamp + Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    
    // Simulating user flows
    const flowProb = Math.random();
    let steps: { path: string; name: string; delaySec: number; type: 'pageview' | 'custom'; customName?: string }[] = [];

    if (flowProb < 0.4) {
      // Flow A: Conversion Funnel (Home -> Products -> Product Detail -> Cart -> Checkout -> Success)
      steps = [
        { path: "/", name: "Home Page", delaySec: 0, type: 'pageview' },
        { path: "/products", name: "Products List", delaySec: 15 + Math.floor(Math.random() * 20), type: 'pageview' }
      ];
      if (Math.random() > 0.3) {
        steps.push({ path: "/products/product-cyber-slate", name: "Cyber Slate Details", delaySec: 30 + Math.floor(Math.random() * 60), type: 'pageview' });
        if (Math.random() > 0.4) {
          steps.push({ path: "/products/product-cyber-slate", name: "Add to Cart", delaySec: 10, type: 'custom', customName: 'add_to_cart' });
          steps.push({ path: "/cart", name: "Shopping Cart", delaySec: 5, type: 'pageview' });
          if (Math.random() > 0.5) {
            steps.push({ path: "/checkout", name: "Checkout Form", delaySec: 40 + Math.floor(Math.random() * 50), type: 'pageview' });
            if (Math.random() > 0.3) {
              steps.push({ path: "/checkout", name: "Order Placed", delaySec: 12, type: 'custom', customName: 'payment_success' });
              steps.push({ path: "/success", name: "Order Successful Confirmation", delaySec: 2, type: 'pageview' });
            } else {
              steps.push({ path: "/checkout", name: "Payment Failed Counter", delaySec: 5, type: 'custom', customName: 'payment_failed' });
            }
          }
        }
      }
    } else if (flowProb < 0.7) {
      // Flow B: Content reader (Home -> Blog Info)
      steps = [
        { path: "/", name: "Home Page", delaySec: 0, type: 'pageview' },
        { path: "/blog/scale-your-telemetry", name: "Scale Your Telemetry Blog", delaySec: 40 + Math.floor(Math.random() * 120), type: 'pageview' }
      ];
      if (Math.random() > 0.5) {
        steps.push({ path: "/docs/introduction", name: "Docs Quick Start Guide", delaySec: 60 + Math.floor(Math.random() * 50), type: 'pageview' });
      }
    } else {
      // Flow C: Bounce (Single Landing Page hit)
      steps = [
        { path: Math.random() > 0.5 ? "/" : "/pricing", name: "Direct Visit Landing", delaySec: 0, type: 'pageview' }
      ];
    }

    let runningTime = sessionStartTime;
    steps.forEach((step) => {
      runningTime += step.delaySec * 1000;
      dbEvents.push({
        id: "evt_" + eventIdCounter++,
        type: step.type,
        name: step.type === 'pageview' ? 'Page View' : (step.customName || 'Custom Event'),
        url: `https://nexusanalytics.io${step.path}`,
        path: step.path,
        referrer: step.delaySec === 0 ? user.ref : "https://nexusanalytics.io/",
        userId: user.userId,
        sessionId: sessionId,
        screen: user.screen,
        lang: user.lang,
        utm: step.delaySec === 0 ? user.utm : {},
        browser: user.browser,
        device: user.device,
        country: user.country,
        timestamp: runningTime,
        data: step.type === 'custom' ? { value: step.customName === 'payment_success' ? 149.00 : 0 } : undefined
      });
    });
  }
}

// Sort prefilled database sequentially by timestamp
dbEvents.sort((a, b) => a.timestamp - b.timestamp);
console.log(`Database seeded with ${dbEvents.length} events! Processing pipeline ready.`);


// ------------------ INGEST PIPELINE LOGIC ------------------

// Process write-queue batch insertion (Simulated BullMQ process with batch sizes)
function flushQueueBatch() {
  if (ingestQueue.length === 0) return;

  const currentBatch = [...ingestQueue];
  ingestQueue = [];

  console.log(`[Batch Ingester] BullMQ running. Writing ${currentBatch.length} events batch to memory indexes...`);
  
  // Write to DB
  dbEvents = [...dbEvents, ...currentBatch];
  dbEvents.sort((a, b) => a.timestamp - b.timestamp);

  // Bust cache
  flushCache();

  // Stream new events to SSE subscribers (limit to 30 events)
  currentBatch.forEach((evt) => {
    broadcastSSE({
      type: "event",
      event: evt,
    });
  });

  // Also broadcast refreshed aggregated stats
  broadcastSSE({
    type: "stats",
    activeCount: getActiveVisitorCount(),
  });
}

// Set continuous aggregate flushing every 2.5 seconds
setInterval(flushQueueBatch, 2500);

// Helper to find Active visitors (distinct sessions with events in the last 3 minutes)
function getActiveVisitorCount() {
  const threeMinAgo = Date.now() - 3 * 60 * 1000;
  const activeSessions = new Set(
    dbEvents
      .filter((e) => e.timestamp >= threeMinAgo)
      .map((e) => e.sessionId)
  );
  return activeSessions.size;
}

// SSE Broadcaster
function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    client.res.write(payload);
  });
}


// ------------------ EXPOSE SERVING ENDPOINTS ------------------

// Tracking snippet serving
app.get("/tracker.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
(function() {
  var d = document;
  var w = window;
  var l = d.location;

  function getUuid() {
    return 'usr_' + Math.random().toString(36).substring(2, 12);
  }
  function getSessionId() {
    var key = '_nexus_sess';
    var sess = sessionStorage.getItem(key);
    if (!sess) {
      sess = 'sess_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem(key, sess);
    }
    return sess;
  }
  function getUserId() {
    var key = '_nexus_uid';
    var uid = localStorage.getItem(key);
    if (!uid) {
      uid = getUuid();
      localStorage.setItem(key, uid);
    }
    return uid;
  }

  var userId = getUserId();
  var sessionId = getSessionId();

  var search = w.location.search;
  var utm = {};
  if (search) {
    var params = new URLSearchParams(search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(p) {
      var val = params.get(p);
      if (val) utm[p] = val;
    });
  }

  function send(type, name, data) {
    var payload = {
      type: type,
      name: name || 'Page View',
      url: l.href,
      path: l.pathname,
      referrer: d.referrer,
      userId: userId,
      sessionId: sessionId,
      screen: w.screen.width + 'x' + w.screen.height,
      lang: navigator.language || 'en-US',
      utm: utm,
      data: data || {},
      timestamp: Date.now()
    };
    
    var endpoint = '/api/collect';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    }
  }

  // Auto page view
  send('pageview', 'Page View');

  // Listen to router changes (SPA safety)
  var lastHref = l.href;
  var observer = new MutationObserver(function() {
    if (lastHref !== l.href) {
      lastHref = l.href;
      send('pageview', 'Page View');
    }
  });
  observer.observe(d.body, { childList: true, subtree: true });

  // Expose Global Object
  w.nexus = {
    track: function(eventName, properties) {
      send('custom', eventName, properties);
    }
  };
})();
  `);
});

// Receive tracking events payload
app.post("/api/collect", (req, res) => {
  const body = req.body;
  if (!body || !body.type || !body.userId || !body.sessionId) {
    return res.status(400).json({ error: "Invalid event tracking schema" });
  }

  // Parse server metadata
  const userAgent = req.headers["user-agent"] || "Mozilla/5.0";
  
  // Extract browser
  let browser = "Other";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome") && !userAgent.includes("Chromium") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Mobile Safari")) browser = "Mobile Safari";

  // Extract device
  let device = "Desktop";
  if (/mobile/i.test(userAgent)) device = "Mobile";
  else if (/tablet/i.test(userAgent)) device = "Tablet";

  // Assign a random country for simulation richness if not provided
  const country = body.country || COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  const newEvent: TelemetryEvent = {
    id: "evt_" + Math.random().toString(36).substring(2, 10),
    type: body.type,
    name: body.name || "Event",
    url: body.url || "https://nexusanalytics.io/",
    path: body.path || "/",
    referrer: body.referrer || "Direct",
    userId: body.userId,
    sessionId: body.sessionId,
    screen: body.screen || "1920x1080",
    lang: body.lang || "en-US",
    utm: body.utm || {},
    browser,
    device,
    country,
    timestamp: body.timestamp || Date.now(),
    data: body.data,
  };

  // Push to BullMQ queue simulation
  ingestQueue.push(newEvent);

  res.status(202).json({ status: "queued", eventId: newEvent.id });
});


// ------------------ AGGREGATED ANALYTICS REST ENDPOINTS ------------------

// Date Range helper: filters events between start and end timestamps
function filterEventsByRange(start: number, end: number) {
  return dbEvents.filter((e) => e.timestamp >= start && e.timestamp <= end);
}

// 1. Overview API
app.get("/api/analytics/overview", (req, res) => {
  const start = parseInt(req.query.start as string) || (Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = parseInt(req.query.end as string) || Date.now();

  const cacheKey = `overview_${start}_${end}`;
  const cachedVal = getCached(cacheKey);
  if (cachedVal) {
    return res.json(cachedVal);
  }

  const events = filterEventsByRange(start, end);

  // Group events by session, list pageviews & custom counts
  const sessionActions: Record<string, TelemetryEvent[]> = {};
  events.forEach((e) => {
    if (!sessionActions[e.sessionId]) {
      sessionActions[e.sessionId] = [];
    }
    sessionActions[e.sessionId].push(e);
  });

  const totalPageviews = events.filter((e) => e.type === "pageview").length;
  const uniqueVisitors = new Set(events.map((e) => e.userId)).size;

  // Bounce rate count (Sessions with exactly 1 events)
  let bounces = 0;
  let totalSessionLengthSec = 0;
  let finishedSessionsCount = 0;

  Object.values(sessionActions).forEach((actions) => {
    if (actions.length === 1) {
      bounces++;
    }
    const timestamps = actions.map((a) => a.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationSec = (maxTime - minTime) / 1000;
    
    totalSessionLengthSec += durationSec;
    finishedSessionsCount++;
  });

  const bounceRate = finishedSessionsCount ? Math.round((bounces / finishedSessionsCount) * 100) : 0;
  const avgSessionDuration = finishedSessionsCount ? Math.round(totalSessionLengthSec / finishedSessionsCount) : 0;

  // Pie chart distributions
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const countries: Record<string, number> = {};

  // For unique users, we look up their demographics
  const seenUsers = new Set<string>();
  events.forEach((e) => {
    if (!seenUsers.has(e.userId)) {
      seenUsers.add(e.userId);
      devices[e.device] = (devices[e.device] || 0) + 1;
      browsers[e.browser] = (browsers[e.browser] || 0) + 1;
      countries[e.country] = (countries[e.country] || 0) + 1;
    }
  });

  const deviceDistribution = Object.entries(devices).map(([name, value]) => ({ name, value }));
  const browserDistribution = Object.entries(browsers).map(([name, value]) => ({ name, value }));
  const countryDistribution = Object.entries(countries)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  // Generate Daily Time Series
  const daysMap: Record<string, { views: number; uniques: Set<string>; bounces: number; sessions: Set<string>; sessionActions: Record<string, TelemetryEvent[]> }> = {};
  
  // Initialize range days
  let step = start;
  while (step <= end) {
    const dStr = new Date(step).toISOString().split("T")[0];
    daysMap[dStr] = { views: 0, uniques: new Set(), bounces: 0, sessions: new Set(), sessionActions: {} };
    step += 24 * 60 * 60 * 1000;
  }

  // Populate days
  events.forEach((e) => {
    const dStr = new Date(e.timestamp).toISOString().split("T")[0];
    if (daysMap[dStr]) {
      if (e.type === "pageview") {
        daysMap[dStr].views++;
      }
      daysMap[dStr].uniques.add(e.userId);
      daysMap[dStr].sessions.add(e.sessionId);
      
      const daySessions = daysMap[dStr].sessionActions;
      if (!daySessions[e.sessionId]) daySessions[e.sessionId] = [];
      daySessions[e.sessionId].push(e);
    }
  });

  const timeSeries = Object.entries(daysMap).map(([date, dObj]) => {
    let dayBounces = 0;
    const daySessionsList = Object.values(dObj.sessionActions);
    daySessionsList.forEach((acts) => {
      if (acts.length === 1) dayBounces++;
    });
    
    return {
      date,
      views: dObj.views,
      uniques: dObj.uniques.size,
      bounceRate: daySessionsList.length ? Math.round((dayBounces / daySessionsList.length) * 100) : 0,
    };
  });

  const result = {
    totalPageviews,
    uniqueVisitors,
    bounceRate,
    avgSessionDuration,
    deviceDistribution,
    browserDistribution,
    countryDistribution,
    timeSeries,
  };

  setCached(cacheKey, result);
  res.json(result);
});

// 2. Top Pages API
app.get("/api/analytics/pages", (req, res) => {
  const start = parseInt(req.query.start as string) || (Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = parseInt(req.query.end as string) || Date.now();

  const cacheKey = `pages_${start}_${end}`;
  const cachedVal = getCached(cacheKey);
  if (cachedVal) return res.json(cachedVal);

  const events = filterEventsByRange(start, end);
  const pageviewsObj = events.filter((e) => e.type === "pageview");

  const pageGroup: Record<string, { views: number; uniques: Set<string>; sessionDurations: Record<string, number[]>; endings: number }> = {};

  pageviewsObj.forEach((e) => {
    if (!pageGroup[e.path]) {
      pageGroup[e.path] = { views: 0, uniques: new Set(), sessionDurations: {}, endings: 0 };
    }
    const page = pageGroup[e.path];
    page.views++;
    page.uniques.add(e.userId);
  });

  // Calculate session exits & timelines to find avgTime spent on pages
  const sessionTimelines: Record<string, TelemetryEvent[]> = {};
  events.sort((a,b) => a.timestamp - b.timestamp).forEach((e) => {
    if (!sessionTimelines[e.sessionId]) sessionTimelines[e.sessionId] = [];
    sessionTimelines[e.sessionId].push(e);
  });

  Object.values(sessionTimelines).forEach((evtList) => {
    for (let index = 0; index < evtList.length; index++) {
      const e = evtList[index];
      if (e.type !== "pageview") continue;

      const group = pageGroup[e.path];
      if (!group) continue;

      if (index === evtList.length - 1) {
        // Last event in session: counts as an exit
        group.endings++;
      } else {
        // Look ahead to next event timestamp to calculate duration in seconds
        const next = evtList[index + 1];
        const staySec = Math.min((next.timestamp - e.timestamp) / 1000, 1800); // capped at 30 min max session decay
        if (!group.sessionDurations[e.sessionId]) group.sessionDurations[e.sessionId] = [];
        group.sessionDurations[e.sessionId].push(staySec);
      }
    }
  });

  const pageStats = Object.entries(pageGroup).map(([path, data]) => {
    const allStays: number[] = [];
    Object.values(data.sessionDurations).forEach((list) => allStays.push(...list));
    const avgTime = allStays.length ? Math.round(allStays.reduce((sum, v) => sum + v, 0) / allStays.length) : 12;
    const exitRate = data.views ? Math.round((data.endings / data.views) * 100) : 0;

    return {
      path,
      views: data.views,
      uniques: data.uniques.size,
      avgTime,
      exitRate,
    };
  }).sort((a, b) => b.views - a.views);

  setCached(cacheKey, pageStats);
  res.json(pageStats);
});

// 3. User Explorer List API
app.get("/api/analytics/users", (req, res) => {
  const start = parseInt(req.query.start as string) || (Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = parseInt(req.query.end as string) || Date.now();

  const cacheKey = `users_${start}_${end}`;
  const cachedVal = getCached(cacheKey);
  if (cachedVal) return res.json(cachedVal);

  const events = filterEventsByRange(start, end);
  
  // Group by userId
  const usersMap: Record<string, { userId: string; events: TelemetryEvent[] }> = {};
  events.forEach((e) => {
    if (!usersMap[e.userId]) {
      usersMap[e.userId] = { userId: e.userId, events: [] };
    }
    usersMap[e.userId].events.push(e);
  });

  const userProfiles = Object.entries(usersMap).map(([uid, uData]) => {
    const rawEvts = uData.events.sort((a,b) => a.timestamp - b.timestamp);
    const firstSeen = rawEvts[0].timestamp;
    const lastSeen = rawEvts[rawEvts.length - 1].timestamp;

    const pageviewsObj = rawEvts.filter((e) => e.type === "pageview");
    const sessions = new Set(rawEvts.map((e) => e.sessionId));
    const lastPath = pageviewsObj.length ? pageviewsObj[pageviewsObj.length - 1].path : "/";

    return {
      userId: uid,
      firstSeen,
      lastSeen,
      totalPageviews: pageviewsObj.length,
      totalEvents: rawEvts.length,
      browser: rawEvts[0].browser,
      device: rawEvts[0].device,
      country: rawEvts[0].country,
      sessionsCount: sessions.size,
      lastPath,
      events: rawEvts,
    };
  }).sort((a, b) => b.lastSeen - a.lastSeen);

  setCached(cacheKey, userProfiles);
  res.json(userProfiles);
});

// 4. Custom Funnels Evaluator API
app.post("/api/analytics/funnels", (req, res) => {
  const { start, end, steps } = req.body as { start: number; end: number; steps: { name: string; target: string; type: 'path' | 'event' }[] };
  
  if (!steps || steps.length === 0) {
    return res.status(400).json({ error: "No funnel steps specified" });
  }

  const events = filterEventsByRange(start || (Date.now() - 30 * 24 * 60 * 60 * 1000), end || Date.now());

  // Group events by session, ordered by timestamp
  const sessions: Record<string, TelemetryEvent[]> = {};
  events.forEach((e) => {
    if (!sessions[e.sessionId]) {
      sessions[e.sessionId] = [];
    }
    sessions[e.sessionId].push(e);
  });

  // For each session, compute if they complete sequential steps
  const completedCounts = Array(steps.length).fill(0);

  Object.values(sessions).forEach((sessionEvents) => {
    const sorted = sessionEvents.sort((a,b) => a.timestamp - b.timestamp);
    
    let currentStepIndex = 0;
    let lastMatchedTimestamp = 0;

    for (let index = 0; index < sorted.length; index++) {
      const e = sorted[index];
      const targetStep = steps[currentStepIndex];
      if (!targetStep) break;

      let isMatch = false;
      if (targetStep.type === "path") {
        isMatch = e.type === "pageview" && e.path === targetStep.target;
      } else {
        isMatch = e.type === "custom" && e.name === targetStep.target;
      }

      if (isMatch && e.timestamp >= lastMatchedTimestamp) {
        completedCounts[currentStepIndex]++;
        lastMatchedTimestamp = e.timestamp;
        currentStepIndex++;
      }
    }
  });

  const funnelResult = steps.map((step, idx) => {
    const count = completedCounts[idx];
    const prevCount = idx === 0 ? count : completedCounts[idx - 1];
    const baseCount = completedCounts[0];

    const conversionRate = prevCount ? Math.round((count / prevCount) * 100) : 0;
    const overallConversionRate = baseCount ? Math.round((count / baseCount) * 100) : 0;
    const dropCount = idx === 0 ? 0 : prevCount - count;
    const dropRate = prevCount ? Math.round((dropCount / prevCount) * 100) : 0;

    return {
      stepIndex: idx,
      name: step.name,
      target: step.target,
      count,
      conversionRate,
      overallConversionRate,
      dropCount,
      dropRate,
    };
  });

  res.json(funnelResult);
});

// 5. CSV download exporter API
app.get("/api/analytics/export", (req, res) => {
  const type = req.query.type as string || "events";
  const start = parseInt(req.query.start as string) || (Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = parseInt(req.query.end as string) || Date.now();

  const events = filterEventsByRange(start, end).sort((a,b) => b.timestamp - a.timestamp);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="analytics_export_${type}_${Date.now()}.csv"`);

  if (type === "events") {
    let csv = "ID,Timestamp,Type,Event Name,Path,User ID,Session ID,Browser,Device,Country,Language,Referrer\n";
    events.forEach((e) => {
      const dateStr = new Date(e.timestamp).toISOString();
      const sanitizedName = e.name.replace(/"/g, '""');
      const sanitizedPath = e.path.replace(/"/g, '""');
      csv += `"${e.id}","${dateStr}","${e.type}","${sanitizedName}","${sanitizedPath}","${e.userId}","${e.sessionId}","${e.browser}","${e.device}","${e.country}","${e.lang}","${e.referrer}"\n`;
    });
    return res.send(csv);
  }

  if (type === "pages") {
    let csv = "Path,PageView Count\n";
    const group: Record<string, number> = {};
    events.forEach((e) => {
      if (e.type === "pageview") group[e.path] = (group[e.path] || 0) + 1;
    });
    Object.entries(group)
      .sort((a,b) => b[1] - a[1])
      .forEach(([path, val]) => {
        csv += `"${path.replace(/"/g, '""')}",${val}\n`;
      });
    return res.send(csv);
  }

  res.status(400).send("Unknown Export Type requested.");
});


// ------------------ SSE (SERVER SENT EVENTS) REALTIME STREAM ------------------

app.get("/api/analytics/realtime", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  console.log(`[Realtime SSE] Client connected (${sseClients.length + 1} total clients open)`);
  
  const clientObj = { id: Date.now(), res };
  sseClients.push(clientObj);

  // Send initial count right away
  const statsPayload = {
    type: "stats",
    activeCount: getActiveVisitorCount(),
  };
  res.write(`data: ${JSON.stringify(statsPayload)}\n\n`);

  // Force tick ping every 10 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  }, 10000);

  req.on("close", () => {
    clearInterval(pingInterval);
    sseClients = sseClients.filter((c) => c.id !== clientObj.id);
    console.log(`[Realtime SSE] Client closed. Remaining: ${sseClients.length}`);
  });
});


// ------------------ INTERACTIVE DEMO SIMULATOR ------------------
// This will trigger a continuous background simulator that simulates user actions
// to make the real-time feed incredibly visual and interactive on request.
let simulatorIntervalId: NodeJS.Timeout | null = null;
let currentMockSessions: { userId: string; sessionId: string; stepsRemaining: string[]; deviceRef: string; browserRef: string; countryRef: string; referrerRef: string }[] = [];

function startTrafficSimulator() {
  if (simulatorIntervalId) return;

  console.log("Starting Traffic Simulator (continuous synthetic traffic generator)...");
  simulatorIntervalId = setInterval(() => {
    // 30% chance to start a new user session
    if (Math.random() > 0.7 && currentMockSessions.length < 15) {
      const uId = generateUserId();
      const sId = "sess_" + Math.random().toString(36).substring(2, 10);
      const bOption = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
      const dOption = bOption === "Mobile Safari" ? "Mobile" : DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const cOption = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const rOption = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
      
      const flow = Math.random() > 0.5 
        ? ["/", "/products", "/products/product-cyber-slate", "/cart", "/checkout", "purchaseEvent", "/success"] 
        : ["/", "/pricing", "/blog/scale-your-telemetry"];

      currentMockSessions.push({
        userId: uId,
        sessionId: sId,
        deviceRef: dOption,
        browserRef: bOption,
        countryRef: cOption,
        referrerRef: rOption,
        stepsRemaining: flow,
      });
    }

    // Process a random step for an active mock session
    if (currentMockSessions.length > 0) {
      const idx = Math.floor(Math.random() * currentMockSessions.length);
      const sess = currentMockSessions[idx];
      const nextStep = sess.stepsRemaining.shift();

      if (nextStep) {
        const isEvent = nextStep === "purchaseEvent";
        const payload: TelemetryEvent = {
          id: "evt_" + Math.random().toString(36).substring(2, 10),
          type: isEvent ? "custom" : "pageview",
          name: isEvent ? "payment_success" : "Page View",
          url: `https://nexusanalytics.io${isEvent ? "/checkout" : nextStep}`,
          path: isEvent ? "/checkout" : nextStep,
          referrer: sess.referrerRef,
          userId: sess.userId,
          sessionId: sess.sessionId,
          screen: sess.deviceRef === "Desktop" ? "1920x1080" : "390x844",
          lang: "en-US",
          utm: sess.stepsRemaining.length === 6 ? (REFERRER_UTMS[sess.referrerRef] || {}) : {},
          browser: sess.browserRef,
          device: sess.deviceRef,
          country: sess.countryRef,
          timestamp: Date.now(),
          data: isEvent ? { value: 149.00 } : undefined,
        };

        // Queue it for processing
        ingestQueue.push(payload);
        console.log(`[Simulator Traffic] Simulated ${payload.type}:${payload.path} for ${sess.userId}`);
      } else {
        // Session ended
        currentMockSessions.splice(idx, 1);
      }
    }
  }, 1200);
}

function stopTrafficSimulator() {
  if (simulatorIntervalId) {
    clearInterval(simulatorIntervalId);
    simulatorIntervalId = null;
    currentMockSessions = [];
    console.log("Traffic Simulator stopped.");
  }
}

// REST simulator toggle
app.post("/api/simulator/toggle", (req, res) => {
  const { enabled } = req.body;
  if (enabled) {
    startTrafficSimulator();
    res.json({ enabled: true, message: "Simulator activated" });
  } else {
    stopTrafficSimulator();
    res.json({ enabled: false, message: "Simulator deactivated" });
  }
});

app.get("/api/simulator/status", (req, res) => {
  res.json({ enabled: simulatorIntervalId !== null });
});


// ------------------ INTEGRATE VITE FOR MIDDLEWARE ------------------

async function runServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=== Analytics Platform running on http://localhost:${PORT} ===`);
  });
}

runServer();
