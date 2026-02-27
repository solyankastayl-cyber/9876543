/**
 * SentimentTop20Table — BLOCK 5 UI
 * =================================
 * 
 * Displays the TOP 20 crypto symbols with sentiment scores.
 * Allows user to select a symbol for the forecast chart.
 * 
 * API: GET /api/sentiment/aggregate/all?window=<window>
 */

import React, { useEffect, useState } from 'react';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, RefreshCwIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function SentimentTop20Table({
  windowKey,
  onPick,
  selectedSymbol,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/sentiment/aggregate/all?window=${windowKey}`)
      .then(r => r.json())
      .then(res => {
        if (!alive) return;
        if (res.ok && res.data) {
          setRows(res.data);
        } else {
          setError(res.error || 'Failed to load data');
        }
        setLoading(false);
      })
      .catch(err => {
        if (!alive) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [windowKey]);

  const getDirectionIcon = (dir) => {
    if (dir === 'LONG') return <TrendingUpIcon className="w-3.5 h-3.5 text-emerald-500" />;
    if (dir === 'SHORT') return <TrendingDownIcon className="w-3.5 h-3.5 text-red-500" />;
    return <MinusIcon className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getDirectionColor = (dir) => {
    if (dir === 'LONG') return 'text-emerald-600';
    if (dir === 'SHORT') return 'text-red-600';
    return 'text-gray-500';
  };

  const getBiasColor = (bias) => {
    if (bias > 0.3) return 'text-emerald-600 bg-emerald-50';
    if (bias < -0.3) return 'text-red-600 bg-red-50';
    if (bias > 0) return 'text-emerald-500';
    if (bias < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div 
        className="bg-white rounded-xl border border-gray-200 p-4"
        data-testid="sentiment-top20-loading"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            TOP 20 Sentiment
          </div>
          <span className="text-[10px] text-gray-400">{windowKey}</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCwIcon className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="bg-white rounded-xl border border-gray-200 p-4"
        data-testid="sentiment-top20-error"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            TOP 20 Sentiment
          </div>
        </div>
        <div className="text-center py-4 text-sm text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      data-testid="sentiment-top20-table"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            TOP 20 • {windowKey}
          </div>
          <div className="text-[10px] text-gray-400">
            {rows.filter(r => r.eventsCount > 0).length} active
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-gray-50/30 border-b border-gray-100 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
        <span>Symbol</span>
        <span className="text-center">Score</span>
        <span className="text-center">Bias</span>
        <span className="text-center">Dir</span>
        <span className="text-center">ML</span>
        <span className="text-right">Exp %</span>
      </div>

      {/* Table Rows */}
      <div className="max-h-[400px] overflow-y-auto">
        {rows.map(row => {
          const isSelected = selectedSymbol === row.symbol;
          const hasData = row.eventsCount > 0;
          
          return (
            <button
              key={row.symbol}
              onClick={() => onPick(row.symbol)}
              className={`w-full grid grid-cols-6 gap-2 px-4 py-2.5 text-left transition-all hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
              } ${!hasData ? 'opacity-50' : ''}`}
              data-testid={`sentiment-row-${row.symbol}`}
            >
              {/* Symbol */}
              <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                {row.symbol}
              </span>

              {/* Score */}
              <span className="text-center text-sm text-gray-600">
                {hasData ? `${Math.round(row.score * 100)}%` : '—'}
              </span>

              {/* Bias */}
              <span className={`text-center text-sm font-medium ${getBiasColor(row.bias)}`}>
                {hasData ? (
                  <span className="px-1.5 py-0.5 rounded">
                    {row.bias > 0 ? '+' : ''}{row.bias.toFixed(2)}
                  </span>
                ) : '—'}
              </span>

              {/* Direction */}
              <span className="flex items-center justify-center gap-1">
                {hasData ? (
                  <>
                    {getDirectionIcon(row.direction)}
                    <span className={`text-xs ${getDirectionColor(row.direction)}`}>
                      {row.direction}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </span>

              {/* ML Decision */}
              <span className="flex flex-col items-center justify-center">
                {row.mlDecision ? (
                  <>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      row.mlDecision.action === 'LONG' ? 'bg-emerald-100 text-emerald-700' :
                      row.mlDecision.action === 'SHORT' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {row.mlDecision.action}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {Math.round(row.mlDecision.pUp * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-gray-400">—</span>
                )}
              </span>

              {/* Expected Return */}
              <span className={`text-right text-sm font-medium ${
                row.expectedReturnPct > 0 ? 'text-emerald-600' : 
                row.expectedReturnPct < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {hasData && row.expectedReturnPct !== 0 ? (
                  `${row.expectedReturnPct > 0 ? '+' : ''}${(row.expectedReturnPct * 100).toFixed(2)}%`
                ) : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100">
        <div className="text-[10px] text-gray-400 text-center">
          Click a row to view forecast chart
        </div>
      </div>
    </div>
  );
}
