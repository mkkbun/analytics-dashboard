/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { Users, Info, ArrowRight, Laptop, Globe, Laptop2, Terminal, ChevronRight, Clock, ShieldCheck, Database } from "lucide-react";

interface UserExplorerProps {
  users: UserProfile[];
}

export default function UserExplorer({ users }: UserExplorerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedUser = useMemo(() => {
    return users.find((u) => u.userId === selectedUserId) || null;
  }, [users, selectedUserId]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(
      (u) =>
        u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.browser.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Format historical timestamp
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getRelativeDelay = (cur: number, idx: number, events: any[]) => {
    if (idx === 0) return "Start of session";
    const prev = events[idx - 1].timestamp;
    const diffSec = Math.round((cur - prev) / 1000);
    if (diffSec < 60) return `+${diffSec}s later`;
    const diffMin = Math.floor(diffSec / 60);
    const offsetSec = diffSec % 60;
    return `+${diffMin}m ${offsetSec}s later`;
  };

  return (
    <div id="user-explorer-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Dynamic Left Column - User profiles directory list (Column span 5) */}
      <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col h-[550px]">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Visitor Registry
            </h3>
            <p className="text-xs text-zinc-500">
              Queried persistent profile traces index.
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by profile, geography, platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-90 w-full p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-zinc-505 text-zinc-500 text-xs">
              No matching profiles indexed
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isActive = u.userId === selectedUserId;
              return (
                <button
                  key={u.userId}
                  onClick={() => setSelectedUserId(u.userId)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                      : "bg-transparent border-transparent hover:bg-zinc-900/40 text-zinc-300 hover:text-zinc-200"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-mono text-xs font-bold leading-none truncate flex items-center gap-1.5">
                      <ShieldCheck className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      {u.userId}
                    </p>
                    <div className="flex gap-x-2 text-[10px] text-zinc-500 font-mono truncate">
                      <span>{u.country}</span>
                      <span>•</span>
                      <span>{u.browser} ({u.device})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-900 rounded-md text-zinc-400 border border-zinc-800">
                        {u.totalEvents} ev
                      </span>
                      <span className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider">
                        {new Date(u.lastSeen).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 ${isActive ? 'text-indigo-400 translate-x-1' : ''}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Right Column - Deep interaction timeline trace (Column span 7) */}
      <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col h-[550px] overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center space-y-3">
              <Users className="w-12 h-12 text-zinc-650 opacity-20 pointer-events-none" />
              <p className="text-sm font-medium">No profile selected</p>
              <p className="text-xs text-zinc-600 max-w-sm">
                Pick a persistent visitor token on the left panel to drill down into their session sequence, custom payload logs, and trace parameters.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Profile Details Header */}
              <div className="p-4 bg-zinc-900 border-b border-zinc-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Profile ID</span>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-100">
                    {selectedUser.userId}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Demographics</span>
                  <div className="text-zinc-200 font-medium">
                    {selectedUser.country} ({selectedUser.browser} on {selectedUser.device})
                  </div>
                </div>
              </div>

              {/* Interactive Timeline events */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="relative border-l-2 border-zinc-800 pl-6 ml-2 space-y-6">
                  {selectedUser.events.map((evt, idx) => {
                    const isPage = evt.type === "pageview";
                    const hasUtm = evt.utm && Object.keys(evt.utm).length > 0;
                    
                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline chronological bullet node */}
                        <span className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                          isPage
                            ? "bg-zinc-950 border-indigo-500 group-hover:bg-indigo-500"
                            : "bg-zinc-950 border-amber-500 group-hover:bg-amber-500"
                        } transition-colors duration-200`} />

                        <div className="space-y-1.5">
                          {/* Relative delay indicator offset */}
                          <div className="flex justify-between items-baseline gap-4">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                              {getRelativeDelay(evt.timestamp, idx, selectedUser.events)}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {formatTime(evt.timestamp)}
                            </span>
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3 group-hover:border-zinc-700 transition-colors duration-200">
                            {/* Head metadata row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                isPage
                                  ? "bg-indigo-500/10 text-indigo-400"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {isPage ? "PAGEVIEW" : "CUSTOM ACTION"}
                              </span>
                              {!isPage && (
                                <span className="text-xs font-bold text-amber-400 font-mono">
                                  {evt.name}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-zinc-100 font-mono break-all grow">
                                {evt.path}
                              </span>
                            </div>

                            {/* Additional detail parameters (e.g. referrers, screens, UTM data) */}
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                              <div>
                                <span className="text-zinc-630 block text-zinc-600">Referrer:</span>
                                <span className="text-zinc-400 truncate block font-light">{evt.referrer}</span>
                              </div>
                              <div>
                                <span className="text-zinc-630 block text-zinc-600">Screen Resolution:</span>
                                <span className="text-zinc-400 block font-light">{evt.screen}</span>
                              </div>
                            </div>

                            {/* UTM Parameters alert box */}
                            {hasUtm && (
                              <div className="mt-2 text-[10px] bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 rounded p-2 font-mono">
                                <span className="font-semibold block text-indigo-400 mb-0.5">UTM Tracking Parameters Resolved:</span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-light">
                                  {Object.entries(evt.utm).map(([k, v]) => (
                                    <span key={k}>{k}: <strong className="font-bold">{v as string}</strong></span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Value custom events parameters */}
                            {evt.data && Object.keys(evt.data).length > 0 && (
                              <div className="mt-2 text-[10px] bg-zinc-950/80 border border-zinc-800 rounded p-2 font-mono">
                                <span className="text-zinc-500 font-semibold block mb-0.5">Event Metadata Payloads:</span>
                                <pre className="text-amber-400">{JSON.stringify(evt.data, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
