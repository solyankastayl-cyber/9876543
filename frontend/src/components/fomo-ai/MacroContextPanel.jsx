/**
 * Macro Context Panel
 * 
 * Displays Market State Anchor:
 * - Fear & Greed Index
 * - BTC Dominance
 * - Stablecoin Dominance
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Info,
  RefreshCw,
  Gauge,
  PieChart,
  Coins,
  History
} from 'lucide-react';
import { FearGreedHistoryChart } from './FearGreedHistoryChart';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Fear & Greed color mapping
const FG_COLORS = {
  EXTREME_FEAR: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' },
  FEAR: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', bar: 'bg-orange-500' },
  NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', bar: 'bg-gray-500' },
  GREED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', bar: 'bg-green-500' },
  EXTREME_GREED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
};

// Macro flag icons
const FLAG_ICONS = {
  MACRO_PANIC: { icon: AlertTriangle, color: 'text-red-600' },
  MACRO_EUPHORIA: { icon: AlertTriangle, color: 'text-amber-600' },
  MACRO_RISK_OFF: { icon: TrendingDown, color: 'text-red-500' },
  MACRO_RISK_ON: { icon: TrendingUp, color: 'text-green-500' },
  BTC_DOM_UP: { icon: TrendingUp, color: 'text-blue-500' },
  BTC_DOM_DOWN: { icon: TrendingDown, color: 'text-blue-500' },
  STABLE_INFLOW: { icon: Coins, color: 'text-emerald-500' },
  STABLE_OUTFLOW: { icon: Coins, color: 'text-orange-500' },
  RISK_REVERSAL: { icon: AlertTriangle, color: 'text-purple-500' },
};

export function MacroContextPanel({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v10/macro/impact`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to load macro data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Macro data unavailable</span>
        </div>
      </div>
    );
  }

  const { signal, impact } = data || {};
  const snapshot = signal ? {
    fearGreed: { value: 50, label: 'NEUTRAL' },
    dominance: { btcPct: 0, stablePct: 0 }
  } : null;

  // Extract data from signal explanation
  const fgMatch = signal?.explain?.bullets?.[0]?.match(/Fear & Greed: (\d+) \((.+)\)/);
  const fearGreedValue = fgMatch ? parseInt(fgMatch[1]) : 50;
  const fearGreedLabel = fgMatch ? fgMatch[2].replace(' ', '_').toUpperCase() : 'NEUTRAL';
  
  const btcMatch = signal?.explain?.bullets?.[1]?.match(/BTC Dominance: ([\d.]+)%/);
  const btcPct = btcMatch ? parseFloat(btcMatch[1]) : 0;
  
  const stableMatch = signal?.explain?.bullets?.[2]?.match(/Stablecoin Dominance: ([\d.]+)%/);
  const stablePct = stableMatch ? parseFloat(stableMatch[1]) : 0;

  const fgColor = FG_COLORS[fearGreedLabel] || FG_COLORS.NEUTRAL;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${fgColor.bg} ${fgColor.border}`}>
        <Gauge className={`w-4 h-4 ${fgColor.text}`} />
        <span className={`text-sm font-medium ${fgColor.text}`}>
          F&G: {fearGreedValue}
        </span>
        {impact?.blockedStrong && (
          <span className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded">
            BLOCKED
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Market Context</h3>
        </div>
        <button 
          onClick={fetchData}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Fear & Greed */}
        <div className={`rounded-lg border p-3 ${fgColor.bg} ${fgColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Fear & Greed Index</span>
            <span className={`text-lg font-bold ${fgColor.text}`}>{fearGreedValue}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${fgColor.bar} transition-all duration-500`}
              style={{ width: `${fearGreedValue}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className={`text-sm font-medium ${fgColor.text}`}>
              {fearGreedLabel?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Dominance Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* BTC Dominance */}
          <div className="bg-blue-50 rounded-lg border border-blue-100 p-3">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">BTC Dom</span>
            </div>
            <span className="text-lg font-bold text-blue-700">{btcPct.toFixed(1)}%</span>
          </div>

          {/* Stablecoin Dominance */}
          <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-gray-600">Stable</span>
            </div>
            <span className="text-lg font-bold text-emerald-700">{stablePct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Active Flags */}
        {signal?.flags?.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-gray-500 font-medium">Active Signals</span>
            <div className="flex flex-wrap gap-1.5">
              {signal.flags.map((flag) => {
                const flagInfo = FLAG_ICONS[flag];
                const IconComponent = flagInfo?.icon || Info;
                return (
                  <span 
                    key={flag}
                    className={`flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded ${flagInfo?.color || 'text-gray-600'}`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {flag.replace(/_/g, ' ')}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Impact Summary */}
        {impact?.applied && (
          <div className={`rounded-lg p-3 ${impact.blockedStrong ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${impact.blockedStrong ? 'text-red-600' : 'text-amber-600'}`} />
              <span className={`text-sm font-medium ${impact.blockedStrong ? 'text-red-700' : 'text-amber-700'}`}>
                {impact.blockedStrong ? 'STRONG Actions Blocked' : 'Confidence Adjusted'}
              </span>
            </div>
            <p className="text-xs text-gray-600">{impact.reason}</p>
            <div className="mt-2 text-xs text-gray-500">
              Confidence multiplier: <span className="font-mono font-medium">{(impact.confidenceMultiplier * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Explanation */}
        {signal?.explain?.summary && (
          <div className="text-sm text-gray-600 italic">
            {signal.explain.summary}
          </div>
        )}
        
        {/* Fear & Greed History Chart */}
        <FearGreedHistoryChart days={7} compact={false} />
      </div>
    </div>
  );
}
