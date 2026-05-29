/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FunnelStep, FunnelResultStep } from "../types";
import { Layers, Plus, Trash2, RefreshCw, ArrowRight, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

interface FunnelAnalysisProps {
  onQueryFunnel: (steps: FunnelStep[]) => Promise<FunnelResultStep[]>;
}

const DEFAULT_STEPS: FunnelStep[] = [
  { name: "Step 1: Homepage Visit", target: "/", type: "path" },
  { name: "Step 2: Products Browsed", target: "/products", type: "path" },
  { name: "Step 3: Cart Opened", target: "/cart", type: "path" },
  { name: "Step 4: Checkout Input", target: "/checkout", type: "path" },
  { name: "Step 5: Purchase Completed", target: "/success", type: "path" },
];

const PRESET_MOCK_TARGETS = [
  { value: "/", label: "Pageview: / (Home)" },
  { value: "/pricing", label: "Pageview: /pricing" },
  { value: "/products", label: "Pageview: /products" },
  { value: "/products/product-cyber-slate", label: "Pageview: /products/product-cyber-slate" },
  { value: "/cart", label: "Pageview: /cart" },
  { value: "/checkout", label: "Pageview: /checkout" },
  { value: "/success", label: "Pageview: /success" },
  { value: "/blog/scale-your-telemetry", label: "Pageview: /blog/scale-your-telemetry" },
  { value: "add_to_cart", label: "Custom Event: add_to_cart" },
  { value: "payment_success", label: "Custom Event: payment_success" },
  { value: "payment_failed", label: "Custom Event: payment_failed" },
];

export default function FunnelAnalysis({ onQueryFunnel }: FunnelAnalysisProps) {
  const [steps, setSteps] = useState<FunnelStep[]>(DEFAULT_STEPS);
  const [funnelResults, setFunnelResults] = useState<FunnelResultStep[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto query funnel on mount or when steps change
  const fetchFunnel = async (currentSteps = steps) => {
    try {
      setLoading(true);
      const results = await onQueryFunnel(currentSteps);
      setFunnelResults(results);
    } catch (err) {
      console.error("Funnel processing failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
  }, []);

  const handleStepChange = (idx: number, field: keyof FunnelStep, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      
      // Auto assign standard step name as label helper
      if (field === "target") {
        const selected = PRESET_MOCK_TARGETS.find((p) => p.value === value);
        if (selected) {
          next[idx].name = `Step ${idx + 1}: ${selected.label.split(": ")[1]}`;
        }
      }
      return next;
    });
  };

  const handleAddField = () => {
    if (steps.length >= 7) return; // limit to max 7
    setSteps((prev) => [
      ...prev,
      {
        name: `Step ${prev.length + 1}: Path`,
        target: "/",
        type: "path",
      },
    ]);
  };

  const handleRemoveField = (idx: number) => {
    if (steps.length <= 2) return; // keep minimum 2
    setSteps((prev) => {
      const remaining = prev.filter((_, i) => i !== idx);
      // Re-index step names
      return remaining.map((s, i) => {
        const matchingPreset = PRESET_MOCK_TARGETS.find((p) => p.value === s.target);
        return {
          ...s,
          name: `Step ${i + 1}: ${matchingPreset ? matchingPreset.label.split(": ")[1] : s.target}`,
        };
      });
    });
  };

  return (
    <div id="funnel-analysis-dashboard" className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Dynamic Funnel Structurer
            </h3>
            <p className="text-xs text-zinc-500">
              Arrange consecutive funnel milestones and monitor checkout dropouts down the pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto self-end">
            <button
              onClick={handleAddField}
              disabled={steps.length >= 7}
              className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Funnel Step
            </button>
            <button
              onClick={() => fetchFunnel()}
              disabled={loading}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Query Pipeline
            </button>
          </div>
        </div>

        {/* Input Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            return (
              <div
                key={idx}
                className="bg-zinc-90 w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2.5 relative group"
              >
                <div className="flex justify-between items-center bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                    Milestone {idx + 1}
                  </span>
                  {steps.length > 2 && (
                    <button
                      onClick={() => handleRemoveField(idx)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">
                    Evaluation Type
                  </label>
                  <select
                    value={step.type}
                    onChange={(e) => handleStepChange(idx, "type", e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="path">Page Path</option>
                    <option value="event">Custom Event Trigger</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">
                    Target Criteria
                  </label>
                  <select
                    value={step.target}
                    onChange={(e) => handleStepChange(idx, "target", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-zinc-700 font-mono"
                  >
                    {PRESET_MOCK_TARGETS.filter((p) => {
                      if (step.type === "path") return p.value.startsWith("/");
                      return !p.value.startsWith("/");
                    }).map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Funnel Drop-off Diagram */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Pipeline Dropoff Conversion Flow Visualizer
        </h4>

        {funnelResults.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            Configure steps and query funnel data results...
          </div>
        ) : (
          <div className="space-y-4">
            {funnelResults.map((step, idx) => {
              const conversionString = idx === 0 ? "Initial 100%" : `-${step.dropRate}% Dropoff`;
              const finalPct = step.overallConversionRate;
              
              return (
                <div key={idx} className="flex flex-col md:flex-row items-stretch gap-4 relative">
                  {/* Step Card Summary (Width 40%) */}
                  <div className="md:w-1/3 bg-zinc-905 bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between shrink-0 hover:border-zinc-700 transition-colors">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-400 font-mono">
                        Step {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-zinc-200 pt-1 font-mono leading-snug">
                        {step.name}
                      </p>
                      <span className="text-[10px] text-zinc-500 block font-mono truncate max-w-[200px]">
                        Target: {step.target}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800/60 font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-600 block">Session Count</span>
                        <span className="text-base font-bold text-zinc-100">{step.count.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-600 block">Overall Conversion</span>
                        <span className="text-sm font-bold text-indigo-400">{finalPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Representation and dropout percentage comparison (Width Remaining) */}
                  <div className="flex-1 flex flex-col justify-center relative bg-zinc-900/10 border border-zinc-900 rounded-lg p-3.5">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-500 mb-1.5">
                      <span>Conversion width index</span>
                      <span>Convert rate from previous: <strong className="font-bold text-zinc-300">{step.conversionRate}%</strong></span>
                    </div>

                    {/* Progress conversion bar */}
                    <div className="w-full bg-zinc-900 h-6.5 rounded-md overflow-hidden relative flex items-center p-1 border border-zinc-800">
                      <div
                        className="bg-indigo-600/20 h-full rounded border-r-2 border-indigo-500 relative transition-all duration-500"
                        style={{ width: `${finalPct}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-indigo-500/15 animate-pulse" />
                      </div>
                      <span className="absolute left-3 text-[10px] font-bold font-mono text-zinc-100 z-10">
                        {finalPct}% completed
                      </span>
                    </div>

                    {/* Dropout statistics if not first step */}
                    {idx > 0 && (
                      <div className="flex items-center gap-2 text-xs font-mono text-rose-400 mt-2 bg-rose-500/5 rounded px-2.5 py-1 border border-rose-500/10 self-start">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>
                          Dropped {step.dropCount.toLocaleString()} sessions ({step.dropRate}% loss this step)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
