/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { PageStat } from "../types";
import { ArrowUpDown, Download, Search, FileSpreadsheet, Sparkles } from "lucide-react";

interface TopPagesTableProps {
  pages: PageStat[];
  onExportCSV: (type: "pages") => void;
}

type SortField = "path" | "views" | "uniques" | "avgTime" | "exitRate";
type SortOrder = "asc" | "desc";

export default function TopPagesTable({ pages, onExportCSV }: TopPagesTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter & Sort core pages list
  const processedPages = useMemo(() => {
    let filtered = pages.filter((p) =>
      p.path.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (a[sortField] as number);
      }
    });

    return filtered;
  }, [pages, search, sortField, sortOrder]);

  // Paginated Slicing for fast React rendering
  const paginatedPages = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return processedPages.slice(startIdx, startIdx + rowsPerPage);
  }, [processedPages, currentPage]);

  const totalPages = Math.ceil(processedPages.length / rowsPerPage) || 1;

  // Render Sort Indicator UI helpers
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline text-zinc-500" />;
    return (
      <span className="ml-1 text-indigo-400 font-bold shrink-0">
        {sortOrder === "asc" ? " ▲" : " ▼"}
      </span>
    );
  };

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${min}m ${remainder}s`;
  };

  return (
    <div
      id="top-pages-table-wrapper"
      className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col"
    >
      {/* Table Action Controls */}
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="space-y-0.5 self-start">
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Top Path Performance
          </h3>
          <p className="text-xs text-zinc-500">
            Path click lists mapped to average session time and bounce-exits.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-505 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by subpath..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={() => onExportCSV("pages")}
            className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-650 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/30 text-[10px] uppercase font-semibold text-zinc-400 font-sans select-none">
              <th className="py-3 px-4 cursor-pointer hover:text-zinc-200" onClick={() => handleSort("path")}>
                Relative Target Path <SortIndicator field="path" />
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-zinc-200" onClick={() => handleSort("views")}>
                Pageviews <SortIndicator field="views" />
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-zinc-200" onClick={() => handleSort("uniques")}>
                Unique Visitors <SortIndicator field="uniques" />
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-zinc-200" onClick={() => handleSort("avgTime")}>
                Avg Residence <SortIndicator field="avgTime" />
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-zinc-200" onClick={() => handleSort("exitRate")}>
                Exit Rate <SortIndicator field="exitRate" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-mono text-xs text-zinc-300">
            {paginatedPages.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-505 text-zinc-500 font-sans">
                  No matching paths recorded in telemetry logs
                </td>
              </tr>
            ) : (
              paginatedPages.map((row) => (
                <tr key={row.path} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-200 max-w-[280px] truncate">
                    {row.path}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-100 font-bold">
                    {row.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {row.uniques.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400">
                    {formatDuration(row.avgTime)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block font-semibold ${row.exitRate > 50 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {row.exitRate}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 bg-zinc-900/20 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-[11px] text-zinc-500 font-mono">
            Showing Page {currentPage} of {totalPages} ({processedPages.length} indices)
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
