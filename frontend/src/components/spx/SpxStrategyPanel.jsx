/**
 * SPX STRATEGY PANEL v1
 * 
 * Clean, investor-friendly strategy recommendations for SPX.
 * 
 * Layout:
 * - Header with preset selector
 * - Action card (BUY/HOLD/REDUCE) with confidence
 * - Recommended size
 * - Reasons list
 * - Risk notes
 * 
 * Uses GLOBAL preset selector that updates all data.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw 
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

const PRESETS = [
  { key: 'CONSERVATIVE', label: 'Conservative', description: 'Lower risk, smaller positions' },
  { key: 'BALANCED', label: 'Balanced', description: 'Standard risk/reward' },
  { key: 'AGGRESSIVE', label: 'Aggressive', description: 'Higher risk, larger positions' },
];

const HORIZONS = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

// ═══════════════════════════════════════════════════════════════
// ACTION BADGE
// ═══════════════════════════════════════════════════════════════

const ActionBadge = ({ action, confidence }) => {
  const getActionConfig = () => {
    switch (action) {
      case 'BUY':
        return {
          icon: TrendingUp,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          label: 'BUY',
        };
      case 'REDUCE':
        return {
          icon: TrendingDown,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          label: 'REDUCE',
        };
      default:
        return {
          icon: Minus,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
          label: 'HOLD',
        };
    }
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'HIGH': return 'text-emerald-600';
      case 'MEDIUM': return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={config.textColor} size={24} />
      </div>
      <div>
        <div className={`text-2xl font-bold ${config.textColor}`}>
          {config.label}
        </div>
        <div className={`text-sm ${getConfidenceColor()}`}>
          Confidence: {confidence}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SIZE INDICATOR
// ═══════════════════════════════════════════════════════════════

const SizeIndicator = ({ size, preset }) => {
  const sizePercent = (size * 100).toFixed(0);
  
  // Visual bar width
  const barWidth = Math.min(100, size * 100);
  
  // Color based on size
  const getBarColor = () => {
    if (size >= 0.6) return 'bg-emerald-500';
    if (size >= 0.3) return 'bg-amber-500';
    if (size > 0) return 'bg-slate-400';
    return 'bg-slate-200';
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">Recommended Size</span>
        <span className="text-lg font-bold text-slate-800">
          {size === 0 ? 'None' : `${sizePercent}%`}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor()} transition-all duration-300`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 mt-2">
        Preset: {preset}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// REASONS LIST
// ═══════════════════════════════════════════════════════════════

const ReasonsList = ({ reasons, title = 'Why', icon: Icon = CheckCircle, color = 'emerald' }) => {
  if (!reasons?.length) return null;

  const colorClasses = {
    emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    amber: { icon: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    red: { icon: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="space-y-2">
      <div className={`text-xs font-semibold text-slate-500 uppercase flex items-center gap-1`}>
        <Icon size={14} className={colors.icon} />
        {title}
      </div>
      <ul className="space-y-1">
        {reasons.map((reason, idx) => (
          <li key={idx} className={`text-sm ${colors.text} flex items-start gap-2`}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PRESET SELECTOR
// ═══════════════════════════════════════════════════════════════

const PresetSelector = ({ value, onChange, loading }) => {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          disabled={loading}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${value === p.key 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }
            ${loading ? 'opacity-50 cursor-wait' : ''}
          `}
          data-testid={`spx-strategy-preset-${p.key.toLowerCase()}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HORIZON SELECTOR
// ═══════════════════════════════════════════════════════════════

const HorizonSelector = ({ value, onChange, loading }) => {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
      {HORIZONS.map(h => (
        <button
          key={h.key}
          onClick={() => onChange(h.key)}
          disabled={loading}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${value === h.key 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }
            ${loading ? 'opacity-50 cursor-wait' : ''}
          `}
          data-testid={`spx-strategy-horizon-${h.key}`}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// META INFO
// ═══════════════════════════════════════════════════════════════

const MetaInfo = ({ meta, context }) => {
  if (!meta) return null;

  const forecastPct = (meta.forecastReturn * 100).toFixed(1);
  const probUpPct = (meta.probUp * 100).toFixed(0);

  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg text-sm">
      <div>
        <span className="text-slate-400">Forecast:</span>
        <span className={`ml-2 font-medium ${meta.forecastReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {meta.forecastReturn >= 0 ? '+' : ''}{forecastPct}%
        </span>
      </div>
      <div>
        <span className="text-slate-400">ProbUp:</span>
        <span className="ml-2 font-medium text-slate-700">{probUpPct}%</span>
      </div>
      <div>
        <span className="text-slate-400">Entropy:</span>
        <span className={`ml-2 font-medium ${meta.entropy > 0.7 ? 'text-amber-600' : 'text-slate-700'}`}>
          {meta.entropy.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-slate-400">Vol Regime:</span>
        <span className={`ml-2 font-medium ${
          meta.volRegime === 'CRISIS' ? 'text-red-600' :
          meta.volRegime === 'ELEVATED' ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {meta.volRegime}
        </span>
      </div>
      <div>
        <span className="text-slate-400">Phase:</span>
        <span className="ml-2 font-medium text-slate-700">{meta.phase}</span>
      </div>
      {context && (
        <div>
          <span className="text-slate-400">vs SMA200:</span>
          <span className={`ml-2 font-medium ${
            context.sma200Position === 'ABOVE' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {context.sma200Position}
          </span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpxStrategyPanel({ 
  // External state control (optional)
  externalHorizon = null,
  externalPreset = null,
  onHorizonChange = null,
  onPresetChange = null,
}) {
  // Internal state
  const [horizon, setHorizon] = useState(externalHorizon || '30d');
  const [preset, setPreset] = useState(externalPreset || 'BALANCED');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync external props
  useEffect(() => {
    if (externalHorizon && externalHorizon !== horizon) {
      setHorizon(externalHorizon);
    }
  }, [externalHorizon]);

  useEffect(() => {
    if (externalPreset && externalPreset !== preset) {
      setPreset(externalPreset);
    }
  }, [externalPreset]);

  // Handle horizon change
  const handleHorizonChange = useCallback((h) => {
    setHorizon(h);
    if (onHorizonChange) onHorizonChange(h);
  }, [onHorizonChange]);

  // Handle preset change
  const handlePresetChange = useCallback((p) => {
    setPreset(p);
    if (onPresetChange) onPresetChange(p);
  }, [onPresetChange]);

  // Fetch strategy data
  useEffect(() => {
    let cancelled = false;

    const fetchStrategy = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_URL}/api/fractal/spx/strategy?horizon=${horizon}&preset=${preset}`
        );
        
        if (cancelled) return;

        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.error || 'Failed to fetch strategy');
        }

        setData(json);
      } catch (err) {
        console.error('[SpxStrategyPanel] Fetch error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStrategy();

    return () => { cancelled = true; };
  }, [horizon, preset]);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    // Re-trigger fetch by creating a state change
    setPreset(p => p);
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="spx-strategy-panel">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-16 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6" data-testid="spx-strategy-panel">
        <div className="text-red-600 text-center">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <div className="font-medium">Failed to load strategy</div>
          <div className="text-sm mt-1">{error}</div>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="spx-strategy-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Strategy Engine</h2>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">SPX</span>
          {loading && <RefreshCw className="animate-spin text-slate-400" size={16} />}
        </div>
        
        <div className="flex items-center gap-4">
          <HorizonSelector 
            value={horizon} 
            onChange={handleHorizonChange}
            loading={loading}
          />
          <PresetSelector 
            value={preset} 
            onChange={handlePresetChange}
            loading={loading}
          />
        </div>
      </div>

      {/* Main Content */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Action & Size */}
          <div className="space-y-4">
            <ActionBadge 
              action={data.action} 
              confidence={data.confidence} 
            />
            <SizeIndicator 
              size={data.size} 
              preset={data.preset} 
            />
          </div>

          {/* Right: Reasons & Risks */}
          <div className="space-y-4">
            <ReasonsList 
              reasons={data.reasons} 
              title="Why" 
              icon={CheckCircle}
              color="emerald"
            />
            {data.riskNotes?.length > 0 && (
              <ReasonsList 
                reasons={data.riskNotes} 
                title="Risks" 
                icon={AlertTriangle}
                color="amber"
              />
            )}
          </div>
        </div>
      )}

      {/* Meta Info (collapsible) */}
      {data && (
        <details className="mt-6">
          <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 flex items-center gap-1">
            <Info size={14} />
            Show Details
          </summary>
          <div className="mt-3">
            <MetaInfo meta={data.meta} context={data.context} />
          </div>
        </details>
      )}
    </div>
  );
}

export default SpxStrategyPanel;
