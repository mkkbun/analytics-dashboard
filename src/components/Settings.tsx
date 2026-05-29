/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, Radio, Play, Pause, Compass, Zap, HelpCircle } from "lucide-react";

interface SettingsProps {
  appUrl: string;
  triggerCollect: (path: string, type: "pageview" | "custom", name?: string, data?: any) => void;
}

export default function Settings({ appUrl, triggerCollect }: SettingsProps) {
  const [copied, setCopied] = useState(false);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [loadingSim, setLoadingSim] = useState(false);

  // Fetch current simulator status
  useEffect(() => {
    fetch("/api/simulator/status")
      .then((res) => res.json())
      .then((data) => {
        setSimulatorActive(data.enabled);
      })
      .catch((err) => console.error("Could not load simulator status", err));
  }, []);

  const trackingCode = `<script src="${appUrl || ""}/tracker.js" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSimulator = async () => {
    try {
      setLoadingSim(true);
      const targetState = !simulatorActive;
      const res = await fetch("/api/simulator/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: targetState }),
      });
      const data = await res.json();
      setSimulatorActive(data.enabled);
    } catch (err) {
      console.error("Failed toggling simulator state", err);
    } finally {
      setLoadingSim(false);
    }
  };

  return (
    <div id="settings-engineering-suite" className="space-y-6">
      {/* 2-Column top section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Embed code scripts (Column span 7) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Vanilla Embed Snippet
            </h3>
            <p className="text-xs text-zinc-500 font-sans">
              Copy and paste this compact async snippet (&lt; 2KB) inside your standard website's header tag.
            </p>
          </div>

          <div className="relative">
            <pre className="text-[11px] font-mono p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-indigo-300 overflow-x-auto leading-relaxed select-all">
              {trackingCode}
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute right-3.5 top-3.5 p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Integration instruction blocks */}
          <div className="bg-zinc-90 w-full bg-zinc-900/50 border border-zinc-900 rounded-lg p-4 space-y-3 font-sans text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200 block uppercase tracking-wider text-[10px] text-indigo-400">
              Technical Capabilities Embedded:
            </span>
            <ul className="list-disc pl-4 space-y-1.5 font-sans leading-relaxed">
              <li>
                <strong className="text-zinc-300">UTM Campaign Extraction</strong>: Capture organic google/github, referrers, and campaign sources on load.
              </li>
              <li>
                <strong className="text-zinc-300">Session Serialization</strong>: Encapsulates page hits into session ID buckets via browser sessionStorage.
              </li>
              <li>
                <strong className="text-zinc-300">Custom Events Global SDK</strong>: Invoke standard <code className="font-mono text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">window.nexus.track('event_name', &#123; keys &#125;)</code>.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Traffic Simulator control (Column span 5) */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              Ingress Traffic Simulator
            </h3>
            <p className="text-xs text-zinc-500 font-sans">
              Simulate bulk, continuous concurrent web requests to populate your charts and SSE terminals.
            </p>
          </div>

          <div className="bg-zinc-900/65 border border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${simulatorActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                {simulatorActive ? "ACTIVE SIMULATION" : "SIMULATOR IDLE"}
              </span>
              <p className="text-xs font-light text-zinc-400 pt-1">
                Spawns random concurrent users clicking funnels.
              </p>
            </div>

            <button
              onClick={toggleSimulator}
              disabled={loadingSim}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4.5 py-2 rounded-lg transition-all ${
                simulatorActive 
                  ? "bg-rose-600 hover:bg-rose-500 text-zinc-100 shadow-lg shadow-rose-600/10"
                  : "bg-emerald-600 hover:bg-emerald-500 text-zinc-100 shadow-lg shadow-emerald-400/10"
              }`}
            >
              {simulatorActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Activate
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono flex items-start gap-1 p-2 bg-zinc-900/25 rounded border border-zinc-900">
            <HelpCircle className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
            <span>Note: Simulator runs completely backgrounded, sending data points sequentially and flushing ingestion tables regularly.</span>
          </div>
        </div>

      </div>

      {/* Embedded Live Sandbox Testing Zone */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <div className="space-y-0.5 mb-5">
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            Live Ingestion Sandbox Terminal
          </h3>
          <p className="text-xs text-zinc-500">
            Send physical telemetry events from this client tab! Clicking these buttons issues payloads to the ingestion pipeline `/api/collect`.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => triggerCollect("/", "pageview")}
            className="flex flex-col items-start text-left p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 rounded-lg group transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-indigo-400">TRIGGER PAGEVIEW</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 font-mono">/ (Homepage)</span>
            <span className="text-[10px] text-zinc-500 mt-1 block">Simulate initial visit</span>
          </button>

          <button
            onClick={() => triggerCollect("/products", "pageview")}
            className="flex flex-col items-start text-left p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 rounded-lg group transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-indigo-400">TRIGGER PAGEVIEW</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 font-mono">/products</span>
            <span className="text-[10px] text-zinc-500 mt-1 block">Simulate browser products list</span>
          </button>

          <button
            onClick={() => triggerCollect("/cart", "custom", "add_to_cart", { item: "Cyber Slate A", value: 149.00 })}
            className="flex flex-col items-start text-left p-3.5 bg-zinc-900 border border-zinc-850 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 rounded-lg group transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-amber-400">TRIGGER CUSTOM EVENT</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 font-mono">add_to_cart</span>
            <span className="text-[10px] text-zinc-500 mt-1 block">Simulate add slate to cart</span>
          </button>

          <button
            onClick={() => triggerCollect("/success", "custom", "payment_success", { value: 149.00 })}
            className="flex flex-col items-start text-left p-3.5 bg-zinc-900 border border-zinc-830 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 rounded-lg group transition-all"
          >
            <span className="text-[10px] font-mono font-bold text-emerald-400">TRIGGER CONVERSION</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 font-mono">payment_success</span>
            <span className="text-[10px] text-zinc-500 mt-1 block">Simulate full success purchase</span>
          </button>
        </div>
      </div>
    </div>
  );
}
