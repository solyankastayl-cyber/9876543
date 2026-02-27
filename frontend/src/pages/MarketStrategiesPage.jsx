/**
 * S1.4 - User Strategies Page
 * 
 * Shows strategy recommendations based on current signals.
 * Read-only, no trading actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Target, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Info
} from 'lucide-react';
import { api } from '../api/client';

const NETWORKS = ['ethereum', 'bnb'];

const VERDICT_CONFIG = {
  PRODUCTION_READY: { 
    icon: CheckCircle, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Ready'
  },
  EXPERIMENT_ONLY: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Experimental'
  },
  REJECTED: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Not Recommended'
  },
  DISABLED: { 
    icon: AlertCircle, 
    color: 'text-slate-500', 
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    label: 'Disabled'
  },
};

const RISK_COLORS = {
  LOW: 'text-emerald-600 bg-emerald-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  HIGH: 'text-red-600 bg-red-50',
};

const VERDICT_ICONS = {
  ACCUMULATE: TrendingUp,
  EXIT: TrendingDown,
  WAIT: Clock,
  AVOID: XCircle,
  HIGH_RISK: AlertTriangle,
};

export default function MarketStrategiesPage() {
  const { network: paramNetwork } = useParams();
  const navigate = useNavigate();
  const [network, setNetwork] = useState(paramNetwork || 'ethereum');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v3/strategy/full/${network}`);
      if (res.data?.ok) {
        setData(res.data.data);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch strategies');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    navigate(`/market/strategies/${newNetwork}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-slate-700" />
            <h1 className="text-xl font-semibold text-slate-900">Strategy Recommendations</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Network selector */}
            <div className="flex gap-1">
              {NETWORKS.map((n) => (
                <button
                  key={n}
                  onClick={() => handleNetworkChange(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    n === network
                      ? 'bg-white text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Strategy Recommendations</p>
              <p className="text-blue-700">
                Strategies are automatically evaluated based on current market signals, 
                historical performance, and system health. This is for informational purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Signal Overview */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">Current Signal:</div>
                  <span className={`px-3 py-1 rounded-lg font-medium ${
                    data.signalDecision === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                    data.signalDecision === 'SELL' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {data.signalDecision}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    data.signalQuality === 'HIGH' ? 'bg-emerald-50 text-emerald-700' :
                    data.signalQuality === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    Quality: {data.signalQuality}
                  </span>
                </div>
                
                {data.guardrails?.blocked && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">Guardrails Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Strategies Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {data.strategies
                .filter(s => s.uiConfig?.showToUser !== false)
                .map((strategy) => (
                  <StrategyCard key={strategy.strategyId} strategy={strategy} />
                ))}
            </div>

            {/* Hidden strategies notice */}
            {data.strategies.filter(s => s.uiConfig?.showToUser === false).length > 0 && (
              <div className="mt-6 text-center text-sm text-slate-500">
                {data.strategies.filter(s => s.uiConfig?.showToUser === false).length} strategies 
                are currently disabled due to market conditions
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <p className="text-xs text-slate-500 text-center">
                Strategy recommendations are based on algorithmic analysis of market signals. 
                This is not financial advice. Past performance does not guarantee future results.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ strategy }) {
  const finalVerdict = strategy.finalVerdict || 'EXPERIMENT_ONLY';
  const config = VERDICT_CONFIG[finalVerdict] || VERDICT_CONFIG.EXPERIMENT_ONLY;
  const VerdictIcon = config.icon;
  
  const StrategyIcon = VERDICT_ICONS[strategy.verdict] || Clock;
  const riskStyle = RISK_COLORS[strategy.risk] || RISK_COLORS.MEDIUM;

  return (
    <div className={`rounded-lg border p-5 ${config.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{strategy.strategyName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
              {config.label}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskStyle}`}>
              {strategy.risk} Risk
            </span>
          </div>
        </div>
        <VerdictIcon className={`w-6 h-6 ${config.color}`} />
      </div>

      {/* Current verdict */}
      <div className="flex items-center gap-2 mb-3 p-3 bg-white rounded-lg">
        <StrategyIcon className="w-5 h-5 text-slate-600" />
        <span className="font-medium text-slate-800">{strategy.verdict}</span>
        <span className="text-sm text-slate-500">· {strategy.horizon} term</span>
      </div>

      {/* Reasons */}
      <div className="space-y-1.5 mb-4">
        {strategy.reasons?.slice(0, 3).map((reason, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="text-slate-400">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* Backtest metrics */}
      {strategy.backtest && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {Math.round(strategy.backtest.metrics.hitRate * 100)}%
            </div>
            <div className="text-xs text-slate-500">Hit Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {strategy.backtest.metrics.maxDrawdown.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Max DD</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {strategy.backtest.metrics.actionableSignals}
            </div>
            <div className="text-xs text-slate-500">Signals</div>
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-3 text-xs text-slate-500 text-right">
        Confidence: {strategy.confidence}
      </div>
    </div>
  );
}
