/**
 * MarketSignalsPage - Market Analytics Dashboard
 * 
 * Unified view of all market signals:
 * - Exchange Pressure
 * - Accumulation/Distribution Zones
 * - Relations Statistics
 * 
 * Style: FomoAI Design System
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw, 
  Building2,
  Target,
  Network,
  Activity,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';
import { api } from '../api/client';
import { NetworkBadge } from '../components/NetworkSelector';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations (FomoAI style)
═══════════════════════════════════════════════════════════════ */
const fadeInStyle = {
  animation: 'fadeIn 0.4s ease-out forwards',
};

const slideUpStyle = {
  animation: 'slideUp 0.5s ease-out forwards',
};

if (typeof document !== 'undefined' && !document.getElementById('signals-animations')) {
  const style = document.createElement('style');
  style.id = 'signals-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
  `;
  document.head.appendChild(style);
}

// Signal colors (Light theme)
const SIGNAL_COLORS = {
  STRONG_BUY: 'text-green-600 bg-green-50',
  BUY: 'text-green-600 bg-green-50',
  NEUTRAL: 'text-gray-500 bg-gray-50',
  SELL: 'text-red-600 bg-red-50',
  STRONG_SELL: 'text-red-600 bg-red-50',
  STRONG_ACCUMULATION: 'text-green-600 bg-green-50',
  ACCUMULATION: 'text-green-600 bg-green-50',
  DISTRIBUTION: 'text-red-600 bg-red-50',
  STRONG_DISTRIBUTION: 'text-red-600 bg-red-50',
};

// Format number
function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

// Signal Card Component (FomoAI Style)
function SignalCard({ title, signal, strength, icon: Icon, details, interpretation, delay = '0ms' }) {
  const colorClass = SIGNAL_COLORS[signal] || SIGNAL_COLORS.NEUTRAL;
  const [textColor, bgColor] = colorClass.split(' ');
  
  const getSignalIcon = () => {
    if (signal?.includes('BUY') || signal?.includes('ACCUMULATION')) {
      return <TrendingUp className={`w-6 h-6 ${textColor}`} />;
    }
    if (signal?.includes('SELL') || signal?.includes('DISTRIBUTION')) {
      return <TrendingDown className={`w-6 h-6 ${textColor}`} />;
    }
    return <Minus className="w-6 h-6 text-gray-400" />;
  };
  
  return (
    <div 
      className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm card-hover"
      style={{ ...slideUpStyle, animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      
      <div className={`p-4 rounded-xl ${bgColor} border ${
        signal?.includes('BUY') || signal?.includes('ACCUMULATION') ? 'border-green-200' :
        signal?.includes('SELL') || signal?.includes('DISTRIBUTION') ? 'border-red-200' :
        'border-gray-200'
      } mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSignalIcon()}
            <div>
              <div className={`text-xl font-bold ${textColor}`}>
                {signal?.replace(/_/g, ' ') || 'LOADING'}
              </div>
              <div className="text-sm text-gray-500">
                Strength: {strength?.toFixed(0) || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {details && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="text-sm p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500 capitalize text-xs">{key.replace(/([A-Z])/g, ' $1')}</div>
              <div className="text-gray-900 font-medium">{typeof value === 'number' ? formatNumber(value) : value || '-'}</div>
            </div>
          ))}
        </div>
      )}
      
      {interpretation && (
        <div className="text-sm text-gray-500 italic border-t border-gray-100 pt-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          {interpretation}
        </div>
      )}
    </div>
  );
}

// Zone Summary Component (FomoAI Style)
function ZoneSummary({ zones, type, delay = '0ms' }) {
  const isAccumulation = type === 'ACCUMULATION';
  
  return (
    <div 
      className={`rounded-xl p-4 border shadow-sm card-hover ${isAccumulation ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'}`}
      style={{ ...slideUpStyle, animationDelay: delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${isAccumulation ? 'bg-green-100' : 'bg-red-100'}`}>
          <Target className={`w-4 h-4 ${isAccumulation ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <span className={`font-semibold ${isAccumulation ? 'text-green-700' : 'text-red-700'}`}>
          {type} Zones
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="p-2 bg-white/60 rounded-lg">
          <div className="text-gray-500 text-xs">Total</div>
          <div className="text-gray-900 font-bold">{zones?.total || 0}</div>
        </div>
        <div className="p-2 bg-white/60 rounded-lg">
          <div className="text-gray-500 text-xs">Strong</div>
          <div className={`font-bold ${isAccumulation ? 'text-green-600' : 'text-red-600'}`}>{zones?.strong || 0}</div>
        </div>
        <div className="p-2 bg-white/60 rounded-lg">
          <div className="text-gray-500 text-xs">Moderate</div>
          <div className="text-gray-600 font-bold">{zones?.moderate || 0}</div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function MarketSignalsPage() {
  const [network, setNetwork] = useState('ethereum');
  const [window, setWindow] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [exchangePressure, setExchangePressure] = useState(null);
  const [zoneSignal, setZoneSignal] = useState(null);
  const [relationsStats, setRelationsStats] = useState(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [pressureRes, zonesRes, relationsRes] = await Promise.all([
        api.get(`/api/market/exchange-pressure?network=${network}&window=${window}`).catch(e => ({ data: null })),
        api.get(`/api/v2/zones/signal?network=${network}`).catch(e => ({ data: null })),
        api.get(`/api/v2/relations/stats?network=${network}`).catch(e => ({ data: null })),
      ]);
      
      if (pressureRes.data?.ok) setExchangePressure(pressureRes.data.data);
      if (zonesRes.data?.ok) setZoneSignal(zonesRes.data.data);
      if (relationsRes.data?.ok) setRelationsStats(relationsRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [network, window]);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // Calculate combined signal
  const getCombinedSignal = () => {
    if (!exchangePressure || !zoneSignal) return { signal: 'NEUTRAL', strength: 0 };
    
    const pressureSignal = exchangePressure.aggregate?.signal || 'NEUTRAL';
    const zonesSignal = zoneSignal.signal || 'NEUTRAL';
    
    // Map signals to scores (-2 to +2)
    const signalScores = {
      'STRONG_BUY': 2, 'STRONG_ACCUMULATION': 2,
      'BUY': 1, 'ACCUMULATION': 1,
      'NEUTRAL': 0,
      'SELL': -1, 'DISTRIBUTION': -1,
      'STRONG_SELL': -2, 'STRONG_DISTRIBUTION': -2,
    };
    
    const pressureScore = signalScores[pressureSignal] || 0;
    const zoneScore = signalScores[zonesSignal] || 0;
    const avgScore = (pressureScore + zoneScore) / 2;
    
    let signal;
    if (avgScore >= 1.5) signal = 'STRONG_BUY';
    else if (avgScore >= 0.5) signal = 'BUY';
    else if (avgScore <= -1.5) signal = 'STRONG_SELL';
    else if (avgScore <= -0.5) signal = 'SELL';
    else signal = 'NEUTRAL';
    
    return { signal, strength: Math.abs(avgScore) * 50 };
  };
  
  const combined = getCombinedSignal();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" style={fadeInStyle}>
      {/* Header - FomoAI Style */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <Activity className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Signals</span>
            </div>
            
            <NetworkBadge network={network} />
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-gray-400" />
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={window} onValueChange={setWindow}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3" style={slideUpStyle}>
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-600">{error}</span>
        </div>
      )}
      
      {/* Combined Signal - Hero */}
      <div className={`p-6 rounded-xl border shadow-sm card-hover ${
        combined.signal.includes('BUY') ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
        combined.signal.includes('SELL') ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' :
        'bg-white border-gray-200'
      }`} style={slideUpStyle}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              Combined Market Signal
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-gray-400 cursor-help" /></TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                    <p className="text-xs">Aggregated signal from exchange flows and on-chain activity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={`text-3xl font-bold flex items-center gap-3 ${
              combined.signal.includes('BUY') ? 'text-green-600' :
              combined.signal.includes('SELL') ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {combined.signal.includes('BUY') ? <TrendingUp className="w-8 h-8" /> :
               combined.signal.includes('SELL') ? <TrendingDown className="w-8 h-8" /> :
               <Minus className="w-8 h-8" />}
              {combined.signal.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Confidence</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(combined.strength)}%</div>
          </div>
        </div>
      </div>
      
      {/* Signal Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Exchange Pressure */}
        <SignalCard
          title="Exchange Pressure"
          signal={exchangePressure?.aggregate?.signal}
          strength={Math.abs(exchangePressure?.aggregate?.pressure || 0) * 100}
          icon={Building2}
          details={{
            'CEX Deposits': exchangePressure?.aggregate?.totalInflow,
            'CEX Withdrawals': exchangePressure?.aggregate?.totalOutflow,
            'Net Flow': exchangePressure?.aggregate?.netFlow,
          }}
          interpretation={
            exchangePressure?.aggregate?.pressure < 0 
              ? 'More withdrawals than deposits - buying pressure'
              : exchangePressure?.aggregate?.pressure > 0
              ? 'More deposits than withdrawals - selling pressure'
              : 'Balanced exchange flows'
          }
          delay="200ms"
        />
        
        {/* Zone Signal */}
        <SignalCard
          title="Accumulation/Distribution"
          signal={zoneSignal?.signal}
          strength={zoneSignal?.signalStrength || 0}
          icon={Target}
          details={{
            'Accumulation Zones': zoneSignal?.breakdown?.accumulation?.total,
            'Distribution Zones': zoneSignal?.breakdown?.distribution?.total,
            'Acc Score': zoneSignal?.breakdown?.accumulation?.score,
            'Dist Score': zoneSignal?.breakdown?.distribution?.score,
          }}
          interpretation={zoneSignal?.interpretation}
          delay="300ms"
        />
      </div>
      
      {/* Zone Breakdown */}
      {zoneSignal && (
        <div className="grid grid-cols-2 gap-4">
          <ZoneSummary zones={zoneSignal.breakdown?.accumulation} type="ACCUMULATION" delay="400ms" />
          <ZoneSummary zones={zoneSignal.breakdown?.distribution} type="DISTRIBUTION" delay="450ms" />
        </div>
      )}
      
      {/* Relations Stats */}
      {relationsStats && (
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '500ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Network className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Network Activity</h3>
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Total Relations</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(relationsStats.totalRelations)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Total Interactions</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(relationsStats.totalInteractions)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Unique Addresses</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(relationsStats.uniqueAddresses)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Avg Density</div>
              <div className="text-xl font-bold text-gray-900">{relationsStats.avgDensity?.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Max Density</div>
              <div className="text-xl font-bold text-gray-900">{relationsStats.maxDensity?.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Loading Overlay */}
      {loading && !exchangePressure && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-amber-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Loading market signals...</span>
          </div>
        </div>
      )}
    </div>
  );
}
