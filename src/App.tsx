/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Terminal,
  Users,
  Layers,
  Settings as SettingsIcon,
  Download,
  Calendar,
  Activity,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Globe,
} from "lucide-react";
import { AnalyticsOverview, PageStat, UserProfile, FunnelStep, TelemetryEvent } from "./types";
import MetricCard from "./components/MetricCard";
import ActiveVisitors from "./components/ActiveVisitors";
import LiveFeed from "./components/LiveFeed";
import Charts from "./components/Charts";
import TopPagesTable from "./components/TopPagesTable";
import UserExplorer from "./components/UserExplorer";
import FunnelAnalysis from "./components/FunnelAnalysis";
import Settings from "./components/Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "feed" | "users" | "funnels" | "settings">("overview");
  const [rangeDays, setRangeDays] = useState<number>(7); // 1, 7, 30 days
  
  // Storage for loaded analytics state
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pages, setPages] = useState<PageStat[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Live real-time variables from SSE stream
  const [liveCount, setLiveCount] = useState<number>(0);
  const [liveEvents, setLiveEvents] = useState<TelemetryEvent[]>([]);

  // Persistent Client IDs for simulator and Sandbox trigger
  const clientUserId = useMemo(() => {
    const key = "_nexus_dashboard_uid";
    let uid = localStorage.getItem(key);
    if (!uid) {
      uid = "usr_dash_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(key, uid);
    }
    return uid;
  }, []);

  const clientSessionId = useMemo(() => {
    const key = "_nexus_dashboard_sess";
    let sess = sessionStorage.getItem(key);
    if (!sess) {
      sess = "sess_dash_" + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem(key, sess);
    }
    return sess;
  }, []);

  // Compute start / end millisecond timestamps based on requested range days
  const dateRangeRange = useMemo(() => {
    const end = Date.now();
    const start = end - rangeDays * 24 * 60 * 60 * 1000;
    return { start, end };
  }, [rangeDays]);

  // Load analytical database tables with current date boundaries
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { start, end } = dateRangeRange;

      const [resOverview, resPages, resUsers] = await Promise.all([
        fetch(`/api/analytics/overview?start=${start}&end=${end}`),
        fetch(`/api/analytics/pages?start=${start}&end=${end}`),
        fetch(`/api/analytics/users?start=${start}&end=${end}`),
      ]);

      const dataOverview = await resOverview.json();
      const dataPages = await resPages.json();
      const dataUsers = await resUsers.json();

      setOverview(dataOverview);
      setPages(dataPages);
      setUsers(dataUsers);
    } catch (err) {
      console.error("Error communicating with analytics API:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on range modification or manual reload
  useEffect(() => {
    fetchAnalyticsData();
  }, [rangeDays]);

  // Establish SSE EventSource channel for real-time traffic feed
  useEffect(() => {
    console.log("Connecting real-time socket channel (SSE EventSource)...");
    const source = new EventSource("/api/analytics/realtime");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "stats") {
          setLiveCount(payload.activeCount);
        } else if (payload.type === "event") {
          // Push to events list stack, keep max 30 entries
          setLiveEvents((prev) => [payload.event, ...prev].slice(0, 30));
          // Increment live metrics temporarily if in overview
          if (payload.event.type === "pageview" && overview) {
            setOverview((o) => {
              if (!o) return o;
              return {
                ...o,
                totalPageviews: o.totalPageviews + 1,
              };
            });
          }
        }
      } catch (err) {
        console.error("SSE parsing error", err);
      }
    };

    source.onerror = (err) => {
      console.warn("SSE connection experienced a reset. Retrying standard socket reconnection...", err);
    };

    return () => {
      source.close();
    };
  }, [overview]);

  // CSV Exporter using lightweight virtual anchor references
  const handleExportCSV = (exportType: "events" | "pages") => {
    const { start, end } = dateRangeRange;
    const link = document.createElement("a");
    link.href = `/api/analytics/export?type=${exportType}&start=${start}&end=${end}`;
    link.download = `nexus_analytics_${exportType}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funnel query evaluator proxy endpoint hook
  const handleQueryFunnel = async (funnelSteps: FunnelStep[]) => {
    const { start, end } = dateRangeRange;
    const res = await fetch("/api/analytics/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start,
        end,
        steps: funnelSteps,
      }),
    });
    return await res.json();
  };

  // Live Sandbox event trigger emitter
  const handleInteractiveTrigger = async (
    path: string,
    type: "pageview" | "custom",
    customName?: string,
    extraProperties?: any
  ) => {
    try {
      const payload = {
        type,
        name: type === "pageview" ? "Page View" : (customName || "Custom Sandbox Action"),
        url: `https://nexusanalytics.io${path}`,
        path,
        referrer: "https://nexusanalytics.io/sandbox",
        userId: clientUserId,
        sessionId: clientSessionId,
        screen: "1920x1080",
        lang: "en-US",
        utm: { utm_source: "sandbox_telemetry", utm_medium: "manual_click" },
        data: extraProperties || {},
        timestamp: Date.now(),
      };

      await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Optimistically reload database aggregates shortly after collection
      setTimeout(fetchAnalyticsData, 2800);
    } catch (err) {
      console.error("Manual sandbox trigger collection failed", err);
    }
  };

  // Convert average duration index to human microcopy text
  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${min}m ${remainder}s`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      
      {/* Header Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-zinc-100 font-extrabold shadow-lg shadow-indigo-500/10 hover:rotate-6 transition-transform">
              N
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-zinc-100 flex items-center gap-1.5 font-sans">
                NEXUS TELEMETRY
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-indigo-400">
                  V1.2
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium">
                Unified data pipelines & real-time monitoring suite
              </p>
            </div>
          </div>

          {/* Navigation Controls Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-zinc-90 w-full md:w-auto bg-zinc-900/60 border border-zinc-850 border-zinc-800 rounded-lg">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === "overview"
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all relative ${
                activeTab === "feed"
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Event Stream
              {liveCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === "users"
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users Directories
            </button>
            <button
              onClick={() => setActiveTab("funnels")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === "funnels"
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Conversion Funnels
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === "settings"
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Telemetry Snippet
            </button>
          </nav>

        </div>
      </header>

      {/* Hero SSE Active Stream Indicator */}
      <section className="bg-zinc-950 border-b border-zinc-900 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <ActiveVisitors count={liveCount} />
        </div>
      </section>

      {/* Main Dynamic Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Date Filter & Export Row (Only displayed inside Overview and Users screens) */}
        {(activeTab === "overview" || activeTab === "users") && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/20 border border-zinc-900 rounded-xl p-4">
            
            {/* Global Date Selectors */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-zinc-505 text-zinc-500" />
              <div className="flex gap-1.5">
                {[
                  { label: "Past 24 Hours", value: 1 },
                  { label: "Past 7 Days", value: 7 },
                  { label: "Past 30 Days", value: 30 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setRangeDays(preset.value)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded border font-mono transition-colors ${
                      rangeDays === preset.value
                        ? "bg-indigo-600 border-indigo-500 text-zinc-100 shadow shadow-indigo-600/15"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingestion status with reload trigger */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="p-2 bg-zinc-90 w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Reload Aggregates
              </button>
              
              <button
                onClick={() => handleExportCSV("events")}
                className="flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-lg px-4.5 py-2 transition-all w-full sm:w-auto shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Export Raw Events
              </button>
            </div>
          </div>
        )}

        {/* Tab views loading dispatcher */}
        {loading && !overview ? (
          <div className="py-24 text-center text-zinc-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-sm font-sans font-medium">Recompiling timeseries pre-aggregates...</p>
          </div>
        ) : (
          <div id="tab-content-renderer">
            
            {/* TAB: OVERVIEW METRIC SUMMARY */}
            {activeTab === "overview" && overview && (
              <div className="space-y-6">
                
                {/* 4-Column KPI Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Gross Pageviews"
                    value={overview.totalPageviews.toLocaleString()}
                    subtext="Aggregated page requests count"
                    trend={{ value: 12.4, positive: true }}
                    icon={<Activity className="w-5 h-5" />}
                    delay={0}
                  />
                  <MetricCard
                    title="Unique Visitors"
                    value={overview.uniqueVisitors.toLocaleString()}
                    subtext="Distinct telemetry user persistent signatures"
                    trend={{ value: 8.2, positive: true }}
                    icon={<Users className="w-5 h-5" />}
                    delay={0.1}
                  />
                  <MetricCard
                    title="Bounce Rate"
                    value={`${overview.bounceRate}%`}
                    subtext="Single hit sessions counts ratio"
                    trend={{ value: 3.1, positive: false }}
                    icon={<Globe className="w-5 h-5" />}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Residence Stay"
                    value={formatDuration(overview.avgSessionDuration)}
                    subtext="Average parsed session lifetime span"
                    trend={{ value: 4.8, positive: true }}
                    icon={<Terminal className="w-5 h-5" />}
                    delay={0.3}
                  />
                </div>

                {/* Analytical charts matrices */}
                <Charts
                  timeSeries={overview.timeSeries}
                  deviceDistribution={overview.deviceDistribution}
                  browserDistribution={overview.browserDistribution}
                  countryDistribution={overview.countryDistribution}
                />

                {/* Top pathname performance grid list */}
                <TopPagesTable
                  pages={pages}
                  onExportCSV={handleExportCSV}
                />
              </div>
            )}

            {/* TAB: LIVE PIPELINE LOG FEED */}
            {activeTab === "feed" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <LiveFeed events={liveEvents} />
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      Event Pipeline Diagnostics
                    </h3>
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      This log view streams real-time telemetry payloads as our tracker detects user navigations and trigger calls.
                    </p>
                  </div>

                  <div className="divide-y divide-zinc-900 text-xs font-mono">
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-zinc-500">Pipeline Protocol</span>
                      <span className="text-zinc-300 font-semibold">SSE (EventStream)</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-zinc-500">Ingress Endpoint</span>
                      <span className="text-zinc-350 bg-zinc-90 w-full sm:w-auto bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] text-indigo-400">POST /api/collect</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-zinc-500">Queue Status</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Awaiting Ingest
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-zinc-500">TimescaleDB Aggregation</span>
                      <span className="text-zinc-300">Continuous scheduler (2.5s flush)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VISITOR EXPLORER TIMELINES */}
            {activeTab === "users" && (
              <UserExplorer users={users} />
            )}

            {/* TAB: CUSTOM FUNNELS CONVERSIONS */}
            {activeTab === "funnels" && (
              <FunnelAnalysis onQueryFunnel={handleQueryFunnel} />
            )}

            {/* TAB: EMBED SETUP CODES & SANDBOX TESTING */}
            {activeTab === "settings" && (
              <Settings appUrl={window.location.origin} triggerCollect={handleInteractiveTrigger} />
            )}

          </div>
        )}
      </main>

      {/* Visual background elements */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 p-6 text-center text-[10px] font-mono text-zinc-600">
        Nexus Telemetry Analytics Platform • Seeded with continuous aggregators & timeseries aggregates
      </footer>
    </div>
  );
}
