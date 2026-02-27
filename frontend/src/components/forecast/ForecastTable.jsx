/**
 * Forecast Performance Table
 * ==========================
 * 
 * Displays historical forecast data: snapshots vs outcomes
 * Shows entry, target, actual prices with win/loss status
 * 
 * Columns:
 * # | Date | Horizon | Entry | Target | Actual | Δ% | Status | Conf | Size
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, BarChart3, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ForecastTable({ symbol = 'BTC', horizon = '30D' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(7);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `${API_URL}/api/market/forecast-table?symbol=${symbol}&horizon=${horizon}&limit=${limit}&page=${page}`
      );
      const json = await res.json();
      
      if (!json.ok) {
        throw new Error(json.error || 'Failed to load data');
      }
      
      setData(json);
    } catch (err) {
      console.error('[ForecastTable] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, horizon, limit, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when symbol/horizon changes
  useEffect(() => {
    setPage(1);
  }, [symbol, horizon]);

  if (error) {
    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl text-red-600 text-sm" data-testid="forecast-table-error">
        {error}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="mt-6 flex items-center justify-center py-10 bg-white rounded-xl border border-gray-100" data-testid="forecast-table-loading">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-xs text-gray-400">Loading forecast data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="mt-6 p-6 bg-white border border-gray-100 rounded-xl text-center" data-testid="forecast-table-empty">
        <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-3" />
        <div className="text-sm text-gray-500">No forecast data for {symbol} {horizon}</div>
      </div>
    );
  }

  const { summary, rows, pagination } = data;

  // Format price with appropriate decimals
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '—';
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format deviation percentage
  const formatDeviation = (deviation) => {
    if (deviation === null || deviation === undefined) return '—';
    const pct = (deviation * 100).toFixed(2);
    return `${deviation >= 0 ? '+' : ''}${pct}%`;
  };

  // Get deviation color class
  const getDeviationColor = (deviation, status) => {
    if (deviation === null || status === 'PENDING') return 'text-gray-400';
    if (status === 'WIN' || status === 'DRAW') return 'text-green-600';
    return 'text-red-600';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'WIN':
      case 'DRAW':
        return <span className="text-emerald-600 font-bold">✔</span>;
      case 'LOSS':
        return <span className="text-red-500 font-bold">✖</span>;
      default:
        return <span className="text-gray-300">…</span>;
    }
  };

  // Format confidence
  const formatConfidence = (conf) => {
    if (!conf && conf !== 0) return '—';
    return `${(conf * 100).toFixed(1)}%`;
  };

  // Format position size
  const formatSize = (size) => {
    if (!size && size !== 0) return '—';
    return `${(size * 100).toFixed(2)}%`;
  };

  return (
    <div className="mt-6 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm" data-testid="forecast-table">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">
            Forecast Performance — {symbol} — {horizon}
          </span>
          {/* Limit selector */}
          <div className="flex gap-1.5">
            {[7, 14, 30].map(n => (
              <button
                key={n}
                onClick={() => { setLimit(n); setPage(1); }}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all duration-200 ${
                  limit === n 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                data-testid={`limit-${n}`}
              >
                Last {n}
              </button>
            ))}
          </div>
        </div>
        {/* Summary stats */}
        <div className="text-[11px] text-gray-500 flex items-center gap-3">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <span className="flex items-center gap-1">
                  Win Rate: <span className={`font-semibold ${summary.winRate >= 0.5 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {(summary.winRate * 100).toFixed(1)}%
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0 text-xs">
                Percentage of correct predictions
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-gray-300">·</span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <span className="flex items-center gap-1">
                  Avg Δ: <span className="font-semibold text-gray-700">{(summary.avgDeviation * 100).toFixed(2)}%</span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0 text-xs">
                Average deviation from target price
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">Samples: <span className="font-medium text-gray-700">{summary.samples}</span></span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
            <tr className="text-gray-400 text-left text-[10px] uppercase tracking-wider">
              <th className="px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">Date</th>
              <th className="px-3 py-2.5 font-semibold">Hor</th>
              <th className="px-3 py-2.5 font-semibold">Entry</th>
              <th className="px-3 py-2.5 font-semibold">Target</th>
              <th className="px-3 py-2.5 font-semibold">Actual</th>
              <th className="px-3 py-2.5 font-semibold">Δ%</th>
              <th className="px-3 py-2.5 font-semibold text-center">Status</th>
              <th className="px-3 py-2.5 font-semibold">Conf</th>
              <th className="px-3 py-2.5 font-semibold">Size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr 
                key={row.id} 
                className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150"
                data-testid={`forecast-row-${idx}`}
              >
                <td className="px-3 py-2.5 text-gray-300 text-xs">
                  {(page - 1) * limit + idx + 1}
                </td>
                <td className="px-3 py-2.5 text-gray-700 font-medium text-xs">
                  {formatDate(row.date)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {row.horizon}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">
                  {formatPrice(row.entry)}
                </td>
                <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">
                  {formatPrice(row.target)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {row.status === 'PENDING' 
                    ? <span className="text-gray-300 italic text-[10px]">pending</span>
                    : <span className="text-gray-700">{formatPrice(row.actual)}</span>
                  }
                </td>
                <td className={`px-3 py-2.5 font-mono text-xs font-medium ${getDeviationColor(row.deviation, row.status)}`}>
                  {formatDeviation(row.deviation)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {getStatusIcon(row.status)}
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  {formatConfidence(row.confidence)}
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  {formatSize(row.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-xs font-medium"
            data-testid="prev-page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page <span className="font-medium text-gray-700">{pagination.page}</span> / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-xs font-medium"
            data-testid="next-page"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading overlay for refetch */}
      {loading && data && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
