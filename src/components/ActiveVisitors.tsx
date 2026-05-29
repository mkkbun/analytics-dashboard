/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users2, Radio } from "lucide-react";

interface ActiveVisitorsProps {
  count: number;
}

export default function ActiveVisitors({ count }: ActiveVisitorsProps) {
  return (
    <div
      id="active-visitors-banner"
      className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-2xl overflow-hidden relative"
    >
      {/* Dynamic glowing core in background */}
      <div className="absolute top-1/2 left-12 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        <div className="relative flex items-center justify-center">
          {/* Pulsing indicator circle */}
          <span className="absolute inline-flex h-12 w-12 rounded-full bg-emerald-500/15 animate-ping" />
          <div className="relative p-3 bg-zinc-900 border border-zinc-800 rounded-full text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Realtime Feed
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Active telemetry connections tracking interactive click streams.
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-2 z-10 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-4xl font-extrabold font-mono text-zinc-100 tracking-tight"
          >
            {count}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          visitors
        </span>
      </div>
    </div>
  );
}
