/**
 * Market Regime Grid Component
 * 
 * Displays the 8-regime matrix with current state highlighted
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
  Info
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Risk level colors
const RISK_COLORS = {
  LOW: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  HIGH: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  EXTREME: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
};

// Market bias icons
const BIAS_ICONS = {
  BTC_ONLY: { icon: '₿', color: 'text-orange-500' },
  ALTS: { icon: '🔷', color: 'text-blue-500' },
  DEFENSIVE: { icon: Shield, color: 'text-gray-500' },
  NEUTRAL: { icon: Minus, color: 'text-gray-400' },
};

function TrendArrow({ trend }) {
  if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function RegimeCell({ cell, isActive, onClick }) {
  const colors = RISK_COLORS[cell.riskLevel];
  const biasIconValue = BIAS_ICONS[cell.marketBias]?.icon;
  // Check if it's a React component (forwardRef or function)
  const isIconComponent = typeof biasIconValue === 'function' || (typeof biasIconValue === 'object' && biasIconValue?.$$typeof);
  const BiasIcon = isIconComponent ? biasIconValue : null;
  
  // P1.4: Regime interpretations for tooltips
  const interpretations = {
    'BTC_FLIGHT_TO_SAFETY': 'BTC dominance rising while BTC price falling usually indicates panic — capital fleeing to perceived safety.',
    'PANIC_SELL_OFF': 'Both BTC and alts dumping with rising BTC dominance. Extreme fear. Capital exiting crypto entirely.',
    'BTC_LEADS_ALT_FOLLOW': 'BTC leading a healthy bull run. Alts follow with a lag. Good conditions for BTC accumulation.',
    'BTC_MAX_PRESSURE': 'BTC at local highs with max dominance. Potential rotation into alts soon.',
    'ALT_ROTATION': 'Capital flowing from BTC to alts. BTC dominance falling. Alt season building.',
    'FULL_RISK_OFF': 'Everything down, stablecoins dominant. Wait for clearer signals.',
    'ALT_SEASON': 'Peak alt performance. BTC flat, alts pumping. High risk of reversal.',
    'CAPITAL_EXIT': 'BTC and alts both falling with falling BTC dominance. Capital leaving crypto.',
  };
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 group
        ${isActive 
          ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-blue-500` 
          : 'bg-white border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
        }
      `}
      data-testid={`regime-cell-${cell.regime}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
          CURRENT
        </div>
      )}
      
      {/* P1.4: Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-64 text-center shadow-lg">
        {interpretations[cell.regime] || cell.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
      
      {/* Title */}
      <h4 className={`font-semibold text-sm mb-1 ${isActive ? colors.text : 'text-gray-700'}`}>
        {cell.title}
      </h4>
      
      {/* Description */}
      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
        {cell.description}
      </p>
      
      {/* Bottom row: Risk + Bias */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded ${colors.badge} ${colors.text}`}>
          {cell.riskLevel}
        </span>
        <span className={`text-sm ${BIAS_ICONS[cell.marketBias]?.color}`}>
          {BiasIcon 
            ? <BiasIcon className="w-4 h-4" /> 
            : biasIconValue
          }
        </span>
      </div>
    </div>
  );
}

export function MarketRegimeGrid() {
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v10/macro-intel/grid`);
      const json = await res.json();
      if (json.ok) {
        setGridData(json.data);
        setSelectedRegime(json.data.activeRegime);
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

  if (loading && !gridData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !gridData) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load market regime: {error}</span>
        </div>
      </div>
    );
  }

  const { grid, activeRegime, activeCell } = gridData;
  const selectedCell = selectedRegime 
    ? grid.find(c => c.regime === selectedRegime) 
    : activeCell;

  // Split grid into two groups
  const btcDomUp = grid.filter(c => 
    ['BTC_FLIGHT_TO_SAFETY', 'PANIC_SELL_OFF', 'BTC_LEADS_ALT_FOLLOW', 'BTC_MAX_PRESSURE'].includes(c.regime)
  );
  const btcDomDown = grid.filter(c => 
    ['ALT_ROTATION', 'FULL_RISK_OFF', 'ALT_SEASON', 'CAPITAL_EXIT'].includes(c.regime)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">Market Regime Engine</h2>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-6">
        {/* BTC.D UP section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">BTC Dominance Rising</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {btcDomUp.map(cell => (
              <RegimeCell 
                key={cell.regime}
                cell={cell}
                isActive={cell.regime === activeRegime}
                onClick={() => setSelectedRegime(cell.regime)}
              />
            ))}
          </div>
        </div>

        {/* BTC.D DOWN section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">BTC Dominance Falling</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {btcDomDown.map(cell => (
              <RegimeCell 
                key={cell.regime}
                cell={cell}
                isActive={cell.regime === activeRegime}
                onClick={() => setSelectedRegime(cell.regime)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected regime details */}
      {selectedCell && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{selectedCell.title}</h3>
              <p className="text-sm text-gray-600">{selectedCell.interpretation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
