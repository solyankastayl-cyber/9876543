/**
 * UNIFIED CONTROL ROW v3 — Clean Single-Row Design
 * 
 * Structure:
 * [ PRIMARY Signal ] [ Secondary Icons: Confidence | Phase | Risk ] | [ Mode Tabs ] | [ Horizon Tabs ]
 * 
 * One main status, three compact secondary indicators
 */

import React, { useState } from 'react';
import { getTierColor } from '../../hooks/useFocusPack';
import { 
  Pause, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  Target,
  Shield,
  CircleDot
} from 'lucide-react';

// Horizons config
const HORIZONS = ['7d', '14d', '30d', '90d', '180d', '365d'];

// Mode config - base modes
const BASE_MODES = [
  { key: 'price', label: 'Synthetic', description: 'AI model projection based on current structure' },
  { key: 'replay', label: 'Replay', description: 'Historical fractal pattern matching' },
  { key: 'hybrid', label: 'Hybrid', description: 'Combined synthetic + replay analysis' },
];

// Asset-specific 4th mode
const FOURTH_MODE = {
  BTC: { key: 'spx', label: 'SPX Overlay', description: 'S&P 500 correlation analysis' },
  SPX: { key: 'dxy', label: 'DXY Overlay', description: 'Dollar index correlation analysis' },
  DXY: { key: 'macro', label: 'Macro', description: 'Macro context with liquidity and regime analysis' },
};

// Get modes for specific asset
const getModesForAsset = (asset) => {
  const fourthMode = FOURTH_MODE[asset] || FOURTH_MODE.BTC;
  return [...BASE_MODES, fourthMode];
};

/**
 * Primary Signal — Main status badge (BUY/SELL/HOLD)
 * Signal = "что делать" (действие)
 * Risk НЕ заменяет Signal, а ограничивает торговлю
 */
function PrimarySignal({ signal }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const configs = {
    BUY: { 
      icon: TrendingUp, 
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
      label: 'BUY',
      description: 'Bullish signal — favorable conditions for entry',
      hint: 'Consider opening or adding to long positions'
    },
    SELL: { 
      icon: TrendingDown, 
      bg: 'bg-red-500',
      text: 'text-red-700',
      label: 'SELL',
      description: 'Bearish signal — consider reducing exposure',
      hint: 'Risk reduction advised, consider taking profits'
    },
    HOLD: { 
      icon: Pause, 
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      label: 'HOLD',
      description: 'Neutral signal — wait for clarity',
      hint: 'No clear direction, maintain current positions'
    }
  };
  
  const config = configs[signal] || configs.HOLD;
  const Icon = config.icon;
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2.5 cursor-help">
        <div className={`
          w-9 h-9 rounded-lg ${config.bg}
          flex items-center justify-center
        `}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className={`text-base font-bold ${config.text}`}>
          {config.label}
        </span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute top-full left-0 mt-2 z-50
          w-64 p-3 bg-slate-800 rounded-lg shadow-xl
          text-white text-xs
        ">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="w-4 h-4" />
            <span className="font-semibold">{config.label} Signal</span>
          </div>
          <p className="text-slate-300 mb-2">{config.description}</p>
          <p className="text-slate-400 text-[10px] italic">{config.hint}</p>
          <p className="text-slate-500 text-[10px] mt-2 pt-2 border-t border-slate-700">
            Aggregated across all time horizons
          </p>
          <div className="absolute -top-1 left-6 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      )}
    </div>
  );
}

/**
 * Secondary Indicator — Compact icon with tooltip
 * Strict color rules:
 * - Risk: colored only at ELEVATED/CRISIS
 * - Confidence: gray, slight amber at LOW
 * - MarketMode: always neutral gray
 */
function SecondaryIndicator({ icon: Icon, value, label, tooltip, type = 'default' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Color logic based on type and value
  let colorClass = 'text-slate-400 hover:text-slate-600';
  let bgHover = 'hover:bg-slate-100';
  
  if (type === 'risk') {
    if (value === 'CRISIS') {
      colorClass = 'text-red-600';
      bgHover = 'hover:bg-red-50';
    } else if (value === 'ELEVATED' || value === 'HIGH') {
      colorClass = 'text-amber-600';
      bgHover = 'hover:bg-amber-50';
    }
  } else if (type === 'confidence') {
    if (value === 'Low' || value === 'LOW') {
      colorClass = 'text-amber-500';
      bgHover = 'hover:bg-amber-50';
    }
  }
  // MarketMode always stays neutral gray
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-help
        transition-colors ${colorClass} ${bgHover}
      `}>
        <Icon className="w-4 h-4" strokeWidth={2} />
        <span className="text-xs font-medium">{value}</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
          px-3 py-2 bg-slate-800 rounded-lg shadow-xl
          text-white text-xs whitespace-nowrap
        ">
          <div className="font-semibold mb-0.5">{label}</div>
          <div className="text-slate-300">{tooltip}</div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      )}
    </div>
  );
}

/**
 * Status Block — Primary Signal + 3 Secondary indicators
 * 
 * Layout: [SIGNAL] | [RISK] [CONFIDENCE] [PHASE]
 */
function StatusBlock({ signal, confidence, marketMode, risk }) {
  // Tooltips
  const riskTooltip = {
    CRISIS: 'Extreme volatility — trading blocked, NO_TRADE',
    ELEVATED: 'Higher than normal risk — reduce position size',
    HIGH: 'Elevated risk environment',
    Normal: 'Standard market conditions',
    LOW: 'Low volatility — favorable for positions'
  };
  
  const confTooltip = {
    High: 'Strong conviction across indicators',
    HIGH: 'Strong conviction across indicators',
    Medium: 'Moderate certainty',
    MEDIUM: 'Moderate certainty',
    Low: 'High uncertainty — proceed with caution',
    LOW: 'High uncertainty — proceed with caution'
  };
  
  const phaseTooltip = {
    ACCUMULATION: 'Smart money building positions — potential bottom',
    DISTRIBUTION: 'Smart money reducing exposure — potential top',
    MARKUP: 'Bullish trend in progress',
    MARKDOWN: 'Bearish trend in progress',
    RECOVERY: 'Market recovering from lows'
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* Primary Signal */}
      <PrimarySignal signal={signal} />
      
      {/* Divider */}
      <div className="w-px h-7 bg-slate-200" />
      
      {/* Secondary Indicators: Risk, Confidence, Phase */}
      <div className="flex items-center gap-0.5">
        {/* Risk - always show, colored when elevated/crisis */}
        <SecondaryIndicator 
          icon={Shield}
          value={risk || 'Normal'}
          label="Risk"
          tooltip={riskTooltip[risk] || 'Current risk level'}
          type="risk"
        />
        
        {/* Confidence */}
        <SecondaryIndicator 
          icon={Target}
          value={confidence}
          label="Confidence"
          tooltip={confTooltip[confidence] || 'Model confidence level'}
          type="confidence"
        />
        
        {/* Market Phase - always neutral */}
        <SecondaryIndicator 
          icon={Activity}
          value={marketMode}
          label="Market Phase"
          tooltip={phaseTooltip[marketMode] || 'Current market cycle phase'}
          type="phase"
        />
      </div>
    </div>
  );
}

/**
 * Mode Tabs - Centered, larger, asset-aware
 */
function ModeTabs({ mode, onChange, loading, asset = 'BTC' }) {
  const modes = getModesForAsset(asset);
  
  return (
    <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl">
      {modes.map(m => {
        const isActive = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => {
              console.log('[MODE CLICK]', m.key);
              onChange && onChange(m.key);
            }}
            disabled={loading}
            title={m.description}
            className={`
              px-5 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${isActive 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              ${loading ? 'opacity-50' : ''}
            `}
            data-testid={`mode-${m.key}`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Horizon Tabs - Larger with tier colors
 */
function HorizonTabs({ focus, onChange, loading }) {
  return (
    <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl">
      {HORIZONS.map(h => {
        const isActive = focus === h;
        const tier = ['7d', '14d'].includes(h) ? 'TIMING' 
          : ['30d', '90d'].includes(h) ? 'TACTICAL' 
          : 'STRUCTURE';
        const tierColor = getTierColor(tier);
        
        return (
          <button
            key={h}
            onClick={() => onChange?.(h)}
            disabled={loading}
            className={`
              relative px-4 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${isActive 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              ${loading ? 'opacity-50' : ''}
            `}
            data-testid={`horizon-${h}`}
          >
            {h.toUpperCase()}
            {/* Tier indicator */}
            <div 
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full transition-opacity"
              style={{ backgroundColor: tierColor, opacity: isActive ? 1 : 0.3 }}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Main Unified Control Row v3
 */
/**
 * View Mode Toggle - PTS | % (only for SPX)
 * Switches between absolute values and percent change from current price
 */
function ViewModeToggle({ viewMode, onChange, asset }) {
  // Only show for SPX
  if (asset !== 'SPX') return null;
  
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => onChange?.('ABS')}
        className={`
          px-3 py-1.5 text-xs font-semibold rounded transition-all
          ${viewMode === 'ABS' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'}
        `}
        title="Show absolute values in points"
        data-testid="view-mode-abs"
      >
        PTS
      </button>
      <button
        onClick={() => onChange?.('PERCENT')}
        className={`
          px-3 py-1.5 text-xs font-semibold rounded transition-all
          ${viewMode === 'PERCENT' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'}
        `}
        title="Show percent change from current price"
        data-testid="view-mode-percent"
      >
        %
      </button>
    </div>
  );
}

export function UnifiedControlRow({
  signal = 'HOLD',
  confidence = 'Medium',
  marketMode = 'ACCUMULATION',
  risk = 'Normal',
  chartMode = 'price',
  onModeChange,
  focus = '30d',
  onFocusChange,
  loading = false,
  // View mode props (for SPX)
  viewMode = 'ABS',
  onViewModeChange,
  asset = 'BTC',
}) {
  return (
    <div 
      className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200"
      data-testid="unified-control-row"
    >
      {/* LEFT: Status Block (Primary + Secondary) */}
      <StatusBlock 
        signal={signal}
        confidence={confidence}
        marketMode={marketMode}
        risk={risk}
      />
      
      {/* CENTER: Mode Tabs + View Toggle */}
      <div className="flex items-center gap-4">
        <ModeTabs 
          mode={chartMode}
          onChange={onModeChange}
          loading={loading}
          asset={asset}
        />
        
        {/* View Mode Toggle (SPX only) */}
        <ViewModeToggle 
          viewMode={viewMode}
          onChange={onViewModeChange}
          asset={asset}
        />
      </div>
      
      {/* RIGHT: Horizon Tabs */}
      <HorizonTabs 
        focus={focus}
        onChange={onFocusChange}
        loading={loading}
      />
    </div>
  );
}

export default UnifiedControlRow;
