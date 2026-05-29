/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Globe, Laptop, Users } from "lucide-react";

interface ChartsProps {
  timeSeries: {
    date: string;
    views: number;
    uniques: number;
    bounceRate: number;
  }[];
  deviceDistribution: { name: string; value: number }[];
  browserDistribution: { name: string; value: number }[];
  countryDistribution: { name: string; value: number }[];
}

// Gorgeous colors matching slate-modern aesthetic
const D_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"];

export default function Charts({
  timeSeries,
  deviceDistribution,
  browserDistribution,
  countryDistribution,
}: ChartsProps) {
  
  // Format dates elegantly for chart axis display (e.g., "May 25")
  const formatXAxis = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl font-mono text-xs text-zinc-300">
          <p className="font-sans font-semibold text-zinc-100 mb-1.5">{formatXAxis(label)}</p>
          <p className="flex justify-between items-center gap-6">
            <span className="text-zinc-500">Pageviews:</span>
            <span className="font-bold text-indigo-400">{payload[0].value}</span>
          </p>
          {payload[1] && (
            <p className="flex justify-between items-center gap-6 mt-1">
              <span className="text-zinc-500">Uniques:</span>
              <span className="font-bold text-emerald-400">{payload[1].value}</span>
            </p>
          )}
          {payload[2] && (
            <p className="flex justify-between items-center gap-6 mt-1 border-t border-zinc-800/80 pt-1">
              <span className="text-zinc-500">Bounce Rate:</span>
              <span className="font-bold text-rose-400">{payload[2].value}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="analytics-charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Primary Timeseries Graph (Spans 2 columns) */}
      <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Traffic Over Date Range
            </h3>
            <p className="text-xs text-zinc-500">
              Aggregated timeseries displaying page requests and unique persistent visitor signatures.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold font-mono">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Pageviews
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Uniques
            </span>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="uniquesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={{ stroke: "#27272a" }}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={{ stroke: "#27272a" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#viewsGrad)"
              />
              <Area
                type="monotone"
                dataKey="uniques"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#uniquesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Device Breakdown Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col h-[400px]">
        <div className="space-y-0.5 mb-6">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-indigo-400" />
            Device Classification
          </h3>
          <p className="text-xs text-zinc-500">
            Hardware category distribution from parsed navigator payloads.
          </p>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center relative">
          <ResponsiveContainer width="105%" height="100%">
            <PieChart>
              <Pie
                data={deviceDistribution.length > 0 ? deviceDistribution : [{ name: "No Data", value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {deviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={D_COLORS[index % D_COLORS.length]} stroke="#18181b" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 p-2 rounded shadow font-mono text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-200">{payload[0].name}:</span>{" "}
                        {payload[0].value} visitors
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Absolute percentage labels list inside card bounds */}
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
            <Users className="w-5 h-5 text-indigo-400 opacity-60" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mt-1">
              Devices
            </span>
          </div>
        </div>

        {/* Legend block */}
        <div className="grid grid-cols-3 gap-2 text-center mt-2 border-t border-zinc-800/80 pt-4">
          {deviceDistribution.map((entry, index) => {
            const sum = deviceDistribution.reduce((a, b) => a + b.value, 0);
            const pct = sum ? Math.round((entry.value / sum) * 100) : 0;
            return (
              <div key={entry.name} className="flex flex-col items-center">
                <span className="text-[10px] font-mono font-bold text-zinc-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: D_COLORS[index % D_COLORS.length] }} />
                  {entry.name}
                </span>
                <span className="text-sm font-semibold text-zinc-100 mt-0.5">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Global Geos (Top Counties Bar Chart) or country distribution list */}
      <div className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-[320px] flex flex-col">
        <div className="space-y-0.5 mb-6">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-200 uppercase flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            Global Geo Distribution (Top Countries)
          </h3>
          <p className="text-xs text-zinc-500">
            Locations resolved from simulated network ingress headers.
          </p>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={countryDistribution.slice(0, 6)}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={28}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={{ stroke: "#27272a" }}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={{ stroke: "#27272a" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 p-2 rounded shadow font-mono text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-200">{payload[0].name}:</span>{" "}
                        {payload[0].value} requests
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {countryDistribution.slice(0, 6).map((entry, index) => (
                  <Cell
                    key={`country-cell-${index}`}
                    fill={index === 0 ? "#10b981" : "#6366f1"}
                    fillOpacity={1 - index * 0.12}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
