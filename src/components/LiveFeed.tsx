/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TelemetryEvent } from "../types";
import { Clock, Globe, Laptop, Terminal, ChevronDown, ChevronUp, Radio } from "lucide-react";

interface LiveFeedProps {
  events: TelemetryEvent[];
}

export default function LiveFeed({ events }: LiveFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div
      id="live-event-feed-container"
      className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[520px]"
    >
      {/* Feed Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-sans">
            Continuous Event Pipeline Stream
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Events Stream List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 py-20">
              <Terminal className="w-8 h-8 opacity-20 text-zinc-400 animate-pulse" />
              <p className="text-sm">Awaiting incoming telemetry signals...</p>
              <p className="text-xs text-zinc-600">
                Trigger simulated actions or copy snippet to send events
              </p>
            </div>
          ) : (
            events.map((evt) => {
              const date = new Date(evt.timestamp);
              const isPageview = evt.type === "pageview";
              const isExpanded = expandedId === evt.id;

              return (
                <motion.div
                  key={evt.id}
                  layoutId={evt.id}
                  initial={{ opacity: 0, y: -15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Action Event Badge */}
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono shrink-0 h-5 mt-0.5 ${
                          isPageview
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isPageview ? "PAGEVIEW" : evt.name}
                      </span>

                      {/* Path & Timestamp */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold font-mono text-zinc-200 truncate leading-snug">
                          {evt.path}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {date.toLocaleTimeString([], { hour12: false })}
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            {evt.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                            {evt.browser} / {evt.device}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Details Trigger */}
                    <button
                      onClick={() => toggleExpand(evt.id)}
                      className="p-1 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-zinc-200"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Schema Expansion panel */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3 pt-3 border-t border-zinc-800/80"
                    >
                      <pre className="text-[10px] font-mono p-3 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 overflow-x-auto leading-relaxed max-h-48">
                        {JSON.stringify(evt, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Feed Bottom indicator */}
      <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-[11px] font-mono text-center text-zinc-500">
        Pipeline Active: Streaming payload structures on live sockets
      </div>
    </div>
  );
}
