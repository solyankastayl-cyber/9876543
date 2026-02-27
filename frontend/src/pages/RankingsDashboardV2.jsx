/**
 * Rankings Dashboard V2 - PHASE 4.1
 * 
 * Source: GET /api/rankings/v2/latest
 * 
 * Table columns (строго):
 * 1. Rank
 * 2. Token  
 * 3. Bucket (BUY/WATCH/SELL)
 * 4. Rank Score
 * 5. Coverage
 * 6. Risk
 * 7. Freshness
 * 8. Top Signals
 * 9. Explain
 * 
 * NO:
 * - "Rules-only"
 * - "Engine OFFLINE"
 * - V1 badges
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Eye, RefreshCw, Loader2,
  ShoppingCart, AlertCircle, XCircle, Zap, Settings,
  ChevronRight, Signal, AlertTriangle, Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

// ============ BUCKET BADGE ============
function BucketBadge({ bucket }) {
  const config = {
    BUY: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
    WATCH: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    SELL: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
    NEUTRAL: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-500' },
  };
  
  const c = config[bucket] || config.NEUTRAL;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${c.bg} ${c.text} border ${c.border} cursor-help`}>
            {bucket}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-gray-200">
          <p className="text-sm">Final bucket after evidence, risk and coverage gates.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ RANK SCORE CELL ============
function RankScoreCell({ score }) {
  const getColor = () => {
    if (score >= 70) return '#2ECC71';
    if (score >= 40) return '#F39C12';
    return '#E74C3C';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center cursor-help">
            <span className="text-lg font-bold text-gray-900">{score?.toFixed(0) || 0}</span>
            <div className="w-12 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(100, score || 0)}%`,
                  backgroundColor: getColor()
                }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-gray-200">
          <p className="text-sm">Evidence × lifecycle × freshness × cluster × penalty.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ TOP SIGNALS CELL ============
function TopSignalsCell({ signals }) {
  if (!signals || signals.length === 0) {
    return <span className="text-xs text-gray-600">No signals</span>;
  }
  
  const severityColors = {
    HIGH: 'bg-red-500/20 text-red-400',
    MEDIUM: 'bg-amber-500/20 text-amber-400',
    MED: 'bg-amber-500/20 text-amber-400',
    LOW: 'bg-gray-500/20 text-gray-500',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap gap-1 cursor-help">
            {signals.slice(0, 2).map((sig, idx) => (
              <span 
                key={idx}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  severityColors[sig.severity] || severityColors.LOW
                }`}
              >
                {sig.type?.replace(/_/g, ' ').substring(0, 12)}
              </span>
            ))}
            {signals.length > 2 && (
              <span className="text-[10px] text-gray-500">+{signals.length - 2}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-gray-200">
          <p className="text-sm">Primary signals contributing to rank.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ TOKEN ROW ============
function TokenRow({ token, rank }) {
  const getFreshnessColor = (freshness) => {
    if (freshness >= 0.8) return 'text-green-400';
    if (freshness >= 0.5) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Rank */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500 font-mono">#{rank}</span>
      </td>
      
      {/* Token */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500">
              {token.symbol?.substring(0, 2) || '?'}
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{token.symbol || 'Unknown'}</div>
            <div className="text-xs text-gray-500 truncate max-w-[120px]">
              {token.name || token.entityId?.substring(0, 10)}
            </div>
          </div>
        </div>
      </td>
      
      {/* Bucket */}
      <td className="px-4 py-3 text-center">
        <BucketBadge bucket={token.bucket} />
      </td>
      
      {/* Rank Score */}
      <td className="px-4 py-3 text-center">
        <RankScoreCell score={token.rankScore} />
      </td>
      
      {/* Coverage */}
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-medium ${
          (token.coverage || 0) >= 60 ? 'text-green-400' : 
          (token.coverage || 0) >= 40 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {(token.coverage || 0).toFixed(0)}%
        </span>
      </td>
      
      {/* Risk */}
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-medium ${
          (token.risk || 0) >= 70 ? 'text-red-400' : 
          (token.risk || 0) >= 40 ? 'text-amber-400' : 'text-green-400'
        }`}>
          {(token.risk || 0).toFixed(0)}
        </span>
      </td>
      
      {/* Freshness */}
      <td className="px-4 py-3 text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1 cursor-help">
                <Signal className={`w-3 h-3 ${getFreshnessColor(token.freshness || 0)}`} />
                <span className={`text-xs font-medium ${getFreshnessColor(token.freshness || 0)}`}>
                  {(token.freshness || 0).toFixed(2)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white border-gray-200">
              <p className="text-sm">Signal recency and decay factor.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Top Signals */}
      <td className="px-4 py-3">
        <TopSignalsCell signals={token.topSignals} />
      </td>
      
      {/* Explain */}
      <td className="px-4 py-3 text-center">
        <Link
          to={`/rankings/v2/token/${token.entityId}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 border border-gray-300 rounded hover:border-gray-600 transition-colors"
        >
          Explain
          <ChevronRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

// ============ HEADER BADGES ============
function HeaderBadges() {
  return (
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded border border-green-500/30">
        Engine v2 ONLINE
      </span>
      <span className="px-2.5 py-1 bg-gray-500/20 text-gray-500 text-xs font-medium rounded border border-gray-500/30">
        Shadow Mode ACTIVE
      </span>
    </div>
  );
}

// ============ SUMMARY CARDS ============
function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Total Tokens</div>
        <div className="text-2xl font-bold text-gray-900">{summary?.total || 0}</div>
      </div>
      <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
        <div className="text-xs text-green-400 mb-1">🟢 BUY</div>
        <div className="text-2xl font-bold text-green-400">{summary?.BUY || 0}</div>
      </div>
      <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <div className="text-xs text-amber-400 mb-1">🟡 WATCH</div>
        <div className="text-2xl font-bold text-amber-400">{summary?.WATCH || 0}</div>
      </div>
      <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
        <div className="text-xs text-red-400 mb-1">🔴 SELL</div>
        <div className="text-2xl font-bold text-red-400">{summary?.SELL || 0}</div>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function RankingsDashboardV2() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/rankings/v2/latest');
      
      if (response.data.ok) {
        setData(response.data);
      } else {
        setError(response.data.error || 'Failed to load rankings');
      }
    } catch (err) {
      setError('Network error');
      console.error('Rankings load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCompute = async () => {
    setComputing(true);
    try {
      const response = await api.post('/api/rankings/v2/compute');
      if (response.data.ok) {
        await loadData();
      } else {
        setError(response.data.error || 'Computation failed');
      }
    } catch (err) {
      setError('Computation error');
    } finally {
      setComputing(false);
    }
  };

  // Build tokens list
  const tokens = data?.tokens || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Token Rankings</h1>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                v2
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Anti-manipulation scoring with full explainability
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <HeaderBadges />
            
            <button
              onClick={handleCompute}
              disabled={computing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {computing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Compute
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <Link
              to="/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <button 
              onClick={loadData}
              className="ml-auto text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && data?.summary && (
          <SummaryCards summary={data.summary} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-3" />
            <span className="text-gray-500">Loading rankings...</span>
          </div>
        )}

        {/* Table */}
        {!loading && tokens.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Bucket</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rank Score</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Coverage</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Risk</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Freshness</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Top Signals</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Explain</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, idx) => (
                    <TokenRow key={token.entityId || idx} token={token} rank={idx + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tokens.length === 0 && (
          <div className="text-center py-32 bg-gray-50 rounded-xl border border-gray-200">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rankings Available</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Engine is in data collection mode. Rankings will appear after token analysis completes.
            </p>
            <button
              onClick={handleCompute}
              disabled={computing}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {computing ? 'Computing...' : 'Compute Rankings Now'}
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
            <Info className="w-3 h-3" />
            Rankings V2 with anti-manipulation formula. All buckets are rule-determined.
            Last computed: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'Never'}
          </p>
        </div>
      </main>
    </div>
  );
}
