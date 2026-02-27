/**
 * Active Regime Card
 * 
 * Shows the current market regime with full details and impact
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  Lock,
  Unlock,
  Activity
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Risk level styles
const RISK_STYLES = {
  LOW: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  EXTREME: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

// Bias labels
const BIAS_LABELS = {
  BTC_ONLY: { label: 'Bitcoin Only', color: 'text-orange-600' },
  ALTS: { label: 'Altcoins', color: 'text-blue-600' },
  DEFENSIVE: { label: 'Defensive', color: 'text-gray-600' },
  NEUTRAL: { label: 'Neutral', color: 'text-gray-500' },
};

function TrendIndicator({ label, trend, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {trend === 'UP' && <TrendingUp className="w-4 h-4 text-green-500" />}
        {trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-500" />}
        {trend === 'FLAT' && <Minus className="w-4 h-4 text-gray-400" />}
        {value !== undefined && (
          <span className="text-sm font-mono text-gray-700">
            {typeof value === 'number' ? value.toFixed(1) + '%' : value}
          </span>
        )}
      </div>
    </div>
  );
}

export function ActiveRegimeCard({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v10/macro-intel/active`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Regime unavailable</span>
        </div>
      </div>
    );
  }

  const riskStyle = RISK_STYLES[data.riskLevel] || RISK_STYLES.MEDIUM;
  const biasInfo = BIAS_LABELS[data.marketBias] || BIAS_LABELS.NEUTRAL;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${riskStyle.bg} ${riskStyle.border}`}>
        <Activity className={`w-4 h-4 ${riskStyle.text}`} />
        <span className={`text-sm font-medium ${riskStyle.text}`}>
          {data.title}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${riskStyle.bg} ${riskStyle.text}`}>
          {data.riskLevel}
        </span>
        {data.blocks.strongActions && (
          <Lock className="w-3.5 h-3.5 text-red-500" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 ${riskStyle.bg} ${riskStyle.border} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`w-6 h-6 ${riskStyle.text}`} />
            <div>
              <h3 className={`text-lg font-bold ${riskStyle.text}`}>{data.title}</h3>
              <p className="text-sm text-gray-600">{data.description}</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${riskStyle.text} ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Regime Signature */}
        <div className="flex items-center justify-center gap-6 py-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">BTC.D</span>
            {data.raw?.btcDominance > 50 ? (
              <TrendingUp className="w-6 h-6 text-orange-500 mx-auto" />
            ) : (
              <TrendingDown className="w-6 h-6 text-blue-500 mx-auto" />
            )}
          </div>
          <div className="text-2xl text-gray-300">|</div>
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">BTC</span>
            {data.raw?.btcPriceChange24h >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500 mx-auto" />
            )}
          </div>
        </div>

        {/* Interpretation */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {data.interpretation}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Market Bias</span>
            <span className={`font-semibold ${biasInfo.color}`}>{biasInfo.label}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Risk Level</span>
            <span className={`font-semibold ${riskStyle.text}`}>{data.riskLevel}</span>
          </div>
        </div>

        {/* Raw values */}
        <div className="space-y-2">
          <TrendIndicator 
            label="Fear & Greed" 
            trend={data.raw?.fearGreed < 35 ? 'DOWN' : data.raw?.fearGreed > 65 ? 'UP' : 'FLAT'}
            value={data.raw?.fearGreed}
          />
          <TrendIndicator 
            label="BTC Dominance" 
            trend={data.raw?.btcDominance > 55 ? 'UP' : data.raw?.btcDominance < 45 ? 'DOWN' : 'FLAT'}
            value={data.raw?.btcDominance}
          />
          <TrendIndicator 
            label="BTC Price 24h" 
            trend={data.raw?.btcPriceChange24h > 0.5 ? 'UP' : data.raw?.btcPriceChange24h < -0.5 ? 'DOWN' : 'FLAT'}
            value={data.raw?.btcPriceChange24h}
          />
        </div>

        {/* Impact section */}
        <div className={`p-4 rounded-lg border ${
          data.blocks.strongActions ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            {data.blocks.strongActions ? (
              <Lock className="w-4 h-4 text-red-500" />
            ) : (
              <Unlock className="w-4 h-4 text-blue-500" />
            )}
            Impact on Decisions
          </h4>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className={data.blocks.strongActions ? 'text-red-600' : 'text-green-600'}>
                {data.blocks.strongActions ? '✗' : '✓'}
              </span>
              Strong actions {data.blocks.strongActions ? 'BLOCKED' : 'allowed'}
            </li>
            <li className="flex items-center gap-2">
              <span className={data.blocks.altExposure ? 'text-red-600' : 'text-green-600'}>
                {data.blocks.altExposure ? '✗' : '✓'}
              </span>
              ALT exposure {data.blocks.altExposure ? 'reduced' : 'normal'}
            </li>
            <li className="flex items-center gap-2">
              <span className={data.blocks.btcExposure ? 'text-red-600' : 'text-green-600'}>
                {data.blocks.btcExposure ? '✗' : '✓'}
              </span>
              BTC exposure {data.blocks.btcExposure ? 'reduced' : 'normal'}
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">Confidence Modifier</span>
            <span className={`ml-2 font-mono font-bold ${
              data.confidenceMultiplier < 0.7 ? 'text-red-600' : 
              data.confidenceMultiplier < 0.9 ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              ×{data.confidenceMultiplier.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
