/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend: {
    value: number;
    positive: boolean;
  };
  icon: React.ReactNode;
  delay?: number;
}

export default function MetricCard({ title, value, subtext, trend, icon, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300"
    >
      {/* Decorative subtle pulse glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            {title}
          </span>
          <h3 className="text-3xl font-extrabold font-mono text-zinc-100 tracking-tight transition-transform duration-300 group-hover:translate-x-1">
            {value}
          </h3>
        </div>
        <div className="p-2 bg-zinc-800/80 border border-zinc-700/50 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:bg-zinc-800 transition-colors duration-300">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.positive
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
          }`}
        >
          {trend.positive ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {trend.value}%
        </span>
        <span className="text-xs text-zinc-500">{subtext}</span>
      </div>

      {/* Embedded tiny visual visualizer in base of card */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-800">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: delay + 0.3 }}
          className={`h-full bg-gradient-to-r ${
            trend.positive ? "from-indigo-500 to-emerald-400" : "from-indigo-500 to-rose-400"
          }`}
        />
      </div>
    </motion.div>
  );
}
