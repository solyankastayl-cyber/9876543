/**
 * PHASE 1.2 + 1.4 — Market Asset Page
 * =====================================
 * 
 * THE product page: one asset → full market diagnosis
 * 
 * Shows:
 * - Exchange Verdict (BULLISH/BEARISH/NEUTRAL)
 * - Confidence meter
 * - Whale Risk
 * - Market Stress
 * - Explainability (drivers, risks, summary)
 * - Historical Truth Layer (Phase 1.4)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Activity,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Target,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import MarketChart from '../../components/market/chart/MarketChart';
import MarketSearchBar from '../../components/market/MarketSearchBar';
import BackfillPanel from '../../components/market/BackfillPanel';
import api from '../../lib/api';

// ═══════════════════════════════════════════════════════════════
// VERDICT BADGE
// ═══════════════════════════════════════════════════════════════

function VerdictBadge({ verdict, confidence, strength }) {
  const config = {
    BULLISH: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: TrendingUp,
      label: 'BULLISH',
    },
    BEARISH: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: TrendingDown,
      label: 'BEARISH',
    },
    NEUTRAL: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      icon: Minus,
      label: 'NEUTRAL',
    },
    NO_DATA: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: AlertTriangle,
      label: 'NO DATA',
    },
  }[verdict] || {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    icon: Info,
    label: verdict,
  };
  
  const Icon = config.icon;
  
  return (
    <div className={`p-6 rounded-xl ${config.bg} border ${config.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${config.bg}`}>
            <Icon className={`w-8 h-8 ${config.text}`} />
          </div>
          <div>
            <p className={`text-3xl font-bold ${config.text}`}>{config.label}</p>
            <p className="text-sm text-slate-400">{strength} signal</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-slate-100">{Math.round(confidence * 100)}%</p>
          <p className="text-sm text-slate-400">Confidence</p>
        </div>
      </div>
      
      <Progress 
        value={confidence * 100} 
        className="h-2 bg-slate-700"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// METRIC CARDS
// ═══════════════════════════════════════════════════════════════

function WhaleRiskCard({ whale }) {
  const config = {
    HIGH: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    UNKNOWN: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  }[whale.riskLevel] || { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  
  return (
    <div className={`p-4 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className={`w-5 h-5 ${config.color}`} />
        <span className="text-sm text-slate-400">Whale Risk</span>
      </div>
      <p className={`text-xl font-bold ${config.color}`}>{whale.riskLevel}</p>
      <p className="text-xs text-slate-500 mt-1">{whale.impact}</p>
      {whale.patterns?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {whale.patterns.map(p => (
            <Badge key={p} variant="outline" className="text-xs bg-slate-800/50">
              {p}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function StressCard({ stress }) {
  const config = {
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    HIGH: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    ELEVATED: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    NORMAL: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  }[stress.status] || { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  
  return (
    <div className={`p-4 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Activity className={`w-5 h-5 ${config.color}`} />
        <span className="text-sm text-slate-400">Market Stress</span>
      </div>
      <p className={`text-xl font-bold ${config.color}`}>{stress.status}</p>
      <p className="text-xs text-slate-500 mt-1">{Math.round(stress.level * 100)}% stress level</p>
      {stress.factors?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {stress.factors.slice(0, 2).map(f => (
            <Badge key={f} variant="outline" className="text-xs bg-slate-800/50">
              {f}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function AvailabilityCard({ availability }) {
  const modeConfig = {
    LIVE: { color: 'text-emerald-400', label: 'LIVE DATA' },
    MOCK: { color: 'text-amber-400', label: 'MOCK DATA' },
    MIXED: { color: 'text-blue-400', label: 'MIXED' },
  }[availability.dataMode] || { color: 'text-slate-400', label: availability.dataMode };
  
  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-blue-400" />
        <span className="text-sm text-slate-400">Data Source</span>
      </div>
      <p className={`text-lg font-semibold ${modeConfig.color}`}>{modeConfig.label}</p>
      <p className="text-xs text-slate-500 mt-1">Provider: {availability.providerUsed}</p>
      {!availability.inUniverse && (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20 mt-2">
          Not in tracked universe
        </Badge>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPLAINABILITY SECTION
// ═══════════════════════════════════════════════════════════════

function ExplainabilitySection({ explainability }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-slate-200">Why this verdict?</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700">
          {/* Summary */}
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <p className="text-slate-300">{explainability.summary}</p>
          </div>
          
          {/* Drivers */}
          {explainability.drivers?.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Supporting Factors
              </p>
              <ul className="space-y-1">
                {explainability.drivers.map((d, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Risks */}
          {explainability.risks?.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Risk Factors
              </p>
              <ul className="space-y-1">
                {explainability.risks.map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function MarketAssetPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get(`/v10/market/asset/${symbol}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load asset data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading market data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-100">{data.symbol}</h1>
                  <Badge variant="outline" className="bg-slate-700/50">
                    {data.base}/{data.quote}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Updated: {new Date(data.meta.t0).toLocaleString()} • 
                  Processing: {data.meta.processingMs}ms
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MarketSearchBar className="w-64" />
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchData}
                className="bg-slate-800 border-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Verdict */}
        <VerdictBadge 
          verdict={data.exchange.verdict}
          confidence={data.exchange.confidence}
          strength={data.exchange.strength}
        />
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WhaleRiskCard whale={data.whale} />
          <StressCard stress={data.stress} />
          <AvailabilityCard availability={data.availability} />
        </div>
        
        {/* Explainability */}
        <ExplainabilitySection explainability={data.explainability} />
        
        {/* Historical Truth Layer (Phase 1.4) */}
        <BackfillPanel symbol={data.symbol} />
        
        {/* Chart (Phase 1.3 + 1.4) */}
        <MarketChart symbol={data.symbol} timeframe="1h" />
      </div>
    </div>
  );
}
