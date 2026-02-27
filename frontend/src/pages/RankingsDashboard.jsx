/**
 * Token Rankings Dashboard (Block E - Final UX)
 * 
 * Production-ready interface with:
 * - E1: Global Engine Status Bar
 * - E2: Enhanced BUY/WATCH/SELL Tables
 * - E3: Quick Reason tooltips
 * - E4: Visual Hints
 * - E5: Bucket Change History
 * - E7: Empty/Safe States
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Eye, RefreshCw, Loader2,
  ShoppingCart, AlertCircle, XCircle, Clock, BarChart3, 
  Zap, Settings, Activity, Shield, Signal, History,
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react';

// ============================================================================
// API Functions
// ============================================================================

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

async function fetchDashboardData(limit = 50) {
  const response = await fetch(`${API_URL}/api/rankings/dashboard?limit=${limit}`);
  return response.json();
}

async function fetchEngineStatus() {
  const response = await fetch(`${API_URL}/api/engine/ml/runtime`);
  return response.json();
}

async function fetchRecentChanges() {
  const response = await fetch(`${API_URL}/api/rankings/changes?limit=10`);
  return response.json();
}

async function computeRankingsV2() {
  const response = await fetch(`${API_URL}/api/rankings/v2/compute`, {
    method: 'POST',
  });
  return response.json();
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatNumber(num) {
  if (!num || isNaN(num)) return '-';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(price) {
  if (!price || isNaN(price)) return '-';
  if (price >= 1000) return `$${price.toFixed(0)}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatPercentage(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '-';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function getFreshnessColor(freshness) {
  if (!freshness) return 'text-gray-400';
  switch (freshness.toLowerCase()) {
    case 'fresh': return 'text-green-600';
    case 'recent': return 'text-yellow-600';
    case 'stale': return 'text-red-600';
    default: return 'text-gray-400';
  }
}

function getCoverageBadge(coverage, level) {
  const colors = {
    HIGH: 'bg-green-100 text-green-700 border-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LOW: 'bg-red-100 text-red-700 border-red-300',
  };
  return colors[level] || colors.LOW;
}

// ============================================================================
// E1: Global Engine Status Bar
// ============================================================================

function EngineStatusBar({ engineStatus, lastUpdate }) {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    if (engineStatus) {
      setStatus(engineStatus);
    }
  }, [engineStatus]);
  
  if (!status) return null;
  
  const isActive = status.mlEnabled !== false;
  const mode = status.mlMode || 'rules_only';
  
  const modeLabels = {
    off: 'Rules Only',
    advisor: 'ML Advisor',
    assist: 'ML Assist',
    rules_only: 'Rules Only',
  };
  
  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Engine Status */}
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <div className="text-xs text-gray-500">Engine</div>
              <div className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                {isActive ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>
          
          {/* Mode */}
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-500">Mode</div>
              <div className="text-sm font-semibold text-blue-700">
                {modeLabels[mode] || mode.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Last Update</div>
                <div className="text-sm font-semibold text-gray-700">
                  {lastUpdate}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Info className="w-4 h-4" />
          <span>Block D v2 • Actor Signals Active</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// E3: Reason Tooltip Component
// ============================================================================

function ReasonTooltip({ token }) {
  const [show, setShow] = useState(false);
  
  // Build reasons from token data
  const reasons = [];
  
  if (token.actorSignalScore > 5) {
    reasons.push(`✓ Positive actor signals (+${token.actorSignalScore.toFixed(1)})`);
  } else if (token.actorSignalScore < -5) {
    reasons.push(`✗ Negative actor signals (${token.actorSignalScore.toFixed(1)})`);
  }
  
  if (token.engineConfidence > 60) {
    reasons.push(`✓ High engine confidence (${Math.round(token.engineConfidence)}%)`);
  } else if (token.engineConfidence < 40) {
    reasons.push(`⚠ Low engine confidence (${Math.round(token.engineConfidence)}%)`);
  }
  
  if (token.signalFreshness?.engine?.freshness === 'fresh') {
    reasons.push('✓ Fresh signals');
  } else if (token.signalFreshness?.engine?.freshness === 'stale') {
    reasons.push('⚠ Stale signals');
  }
  
  if (token.isUnstable) {
    reasons.push('⚠ Unstable (frequent bucket changes)');
  }
  
  if (reasons.length === 0) {
    reasons.push('Standard market conditions');
  }
  
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
      >
        Why?
      </button>
      
      {show && (
        <div className="absolute z-50 bottom-full mb-2 right-0 w-64 bg-white text-white text-xs rounded-lg p-3 shadow-xl">
          <div className="font-semibold mb-2">Why in {token.bucket}:</div>
          <div className="space-y-1">
            {reasons.map((reason, idx) => (
              <div key={idx} className="text-gray-700">{reason}</div>
            ))}
          </div>
          {token.engineMode && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-gray-400">
              Mode: {token.engineMode.replace('_', ' ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// E2 & E4: Enhanced Token Row with Visual Hints
// ============================================================================

function TokenRow({ token, rank }) {
  const priceChangeColor = (token.priceChange24h || 0) >= 0 
    ? 'text-green-600' 
    : 'text-red-600';
  
  const PriceIcon = (token.priceChange24h || 0) >= 0 
    ? TrendingUp 
    : TrendingDown;
  
  // E4: Visual hints
  const showUnstableIcon = token.isUnstable;
  const freshness = token.signalFreshness?.engine?.freshness || 'unknown';
  const freshnessColor = getFreshnessColor(freshness);
  
  return (
    <tr 
      className="hover:bg-gray-50 transition-colors"
      data-testid={`token-row-${token.symbol}`}
    >
      <td className="px-4 py-3">
        <span className="text-sm text-gray-400 font-mono">#{rank}</span>
      </td>
      
      {/* Token */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {token.imageUrl ? (
            <img 
              src={token.imageUrl} 
              alt={token.symbol} 
              className="w-8 h-8 rounded-full"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">
                {token.symbol?.substring(0, 2)}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{token.symbol}</span>
              {showUnstableIcon && (
                <AlertTriangle className="w-3 h-3 text-yellow-600" title="Unstable" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{token.name}</p>
          </div>
        </div>
      </td>
      
      {/* Score */}
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-gray-900">
            {token.compositeScore?.toFixed(0)}
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                token.compositeScore >= 70 ? 'bg-green-500' :
                token.compositeScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, token.compositeScore)}%` }}
            />
          </div>
        </div>
      </td>
      
      {/* Confidence */}
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-semibold ${
          token.engineConfidence >= 70 ? 'text-green-600' :
          token.engineConfidence >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {Math.round(token.engineConfidence)}%
        </span>
      </td>
      
      {/* Risk */}
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-semibold ${
          token.engineRisk < 30 ? 'text-green-600' :
          token.engineRisk < 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {Math.round(token.engineRisk || 0)}
        </span>
      </td>
      
      {/* Coverage */}
      <td className="px-4 py-3 text-center">
        <span className={`text-xs px-2 py-1 rounded-full border ${
          getCoverageBadge(token.coverage, token.coverageLevel)
        }`}>
          {token.coverageLevel || 'LOW'}
        </span>
      </td>
      
      {/* Freshness */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Signal className={`w-3 h-3 ${freshnessColor}`} />
          <span className={`text-xs font-medium ${freshnessColor}`}>
            {token.signalFreshness?.engine?.age || 'N/A'}
          </span>
        </div>
      </td>
      
      {/* Engine Mode */}
      <td className="px-4 py-3 text-center">
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          {token.engineMode === 'rules_with_actors' ? 'Actors' : 
           token.engineMode === 'rules_with_ml' ? 'ML' : 'Rules'}
        </span>
      </td>
      
      {/* Reason (E3) */}
      <td className="px-4 py-3 text-center">
        <ReasonTooltip token={token} />
      </td>
    </tr>
  );
}

// ============================================================================
// Bucket Table Component
// ============================================================================

function BucketTable({ bucket, tokens, totalCount }) {
  const styles = {
    BUY: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-700',
      badge: 'bg-green-100 text-green-700',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    WATCH: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700',
      icon: <Eye className="w-5 h-5" />,
    },
    SELL: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
      icon: <XCircle className="w-5 h-5" />,
    },
  };
  
  const style = styles[bucket] || styles.WATCH;
  
  const descriptions = {
    BUY: 'Score ≥70 • Confidence ≥60 • Risk ≤40',
    WATCH: 'Score 40-69 • Monitoring recommended',
    SELL: 'Score <40 • High risk • Caution advised',
  };
  
  return (
    <div 
      className={`rounded-xl border ${style.border} overflow-hidden shadow-sm`}
      data-testid={`bucket-${bucket.toLowerCase()}`}
    >
      {/* Header */}
      <div className={`${style.bg} px-5 py-4 border-b ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style.badge}`}>
              {style.icon}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${style.title}`}>{bucket}</h3>
              <p className="text-xs text-gray-600">{descriptions[bucket]}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${style.badge}`}>
            {totalCount} tokens
          </span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Confidence</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Risk</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Coverage</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Freshness</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Engine</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">No tokens in {bucket}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {bucket === 'BUY' && 'Waiting for strong signals'}
                      {bucket === 'WATCH' && 'All tokens evaluated'}
                      {bucket === 'SELL' && 'No high-risk tokens detected'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              tokens.map((token, idx) => (
                <TokenRow 
                  key={token.contractAddress || idx} 
                  token={token} 
                  rank={token.bucketRank || idx + 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function RankingsDashboard() {
  const [data, setData] = useState(null);
  const [engineStatus, setEngineStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dashboardResult, engineResult] = await Promise.all([
        fetchDashboardData(50),
        fetchEngineStatus(),
      ]);
      
      if (dashboardResult.ok) {
        setData(dashboardResult.data);
      } else {
        setError(dashboardResult.error || 'Failed to load dashboard');
      }
      
      if (engineResult.ok) {
        setEngineStatus(engineResult.data);
      }
    } catch (err) {
      setError('Network error');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  const handleCompute = async () => {
    setComputing(true);
    try {
      const result = await computeRankingsV2();
      if (result.ok) {
        await loadData();
      } else {
        setError(result.error || 'Computation failed');
      }
    } catch (err) {
      setError('Computation error');
    } finally {
      setComputing(false);
    }
  };
  
  const formatLastComputed = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
              Token Rankings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Block D v2 • Actor Signals • Composite Scoring
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Compute button */}
            <button
              onClick={handleCompute}
              disabled={computing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              data-testid="compute-rankings-btn"
            >
              {computing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Compute Rankings
                </>
              )}
            </button>
            
            {/* Attribution Dashboard link */}
            <Link
              to="/attribution"
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
              data-testid="attribution-link"
            >
              <BarChart3 className="w-4 h-4" />
              Attribution
            </Link>
            
            {/* Settings link */}
            <Link
              to="/settings"
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              data-testid="settings-link"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* E1: Engine Status Bar */}
        <EngineStatusBar 
          engineStatus={engineStatus} 
          lastUpdate={data?.summary?.lastComputed ? formatLastComputed(data.summary.lastComputed) : null}
        />
        
        {/* Error state (E7) */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={loadData}
              className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <span className="text-gray-600 font-medium">Loading rankings...</span>
          </div>
        )}
        
        {/* Summary Stats */}
        {!loading && data?.summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Total Tokens</div>
              <div className="text-3xl font-bold text-gray-900">{data.summary.total}</div>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-5 shadow-sm">
              <div className="text-sm text-green-600 mb-1">🟢 BUY</div>
              <div className="text-3xl font-bold text-green-700">{data.summary.BUY}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5 shadow-sm">
              <div className="text-sm text-yellow-600 mb-1">🟡 WATCH</div>
              <div className="text-3xl font-bold text-yellow-700">{data.summary.WATCH}</div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm">
              <div className="text-sm text-red-600 mb-1">🔴 SELL</div>
              <div className="text-3xl font-bold text-red-700">{data.summary.SELL}</div>
            </div>
          </div>
        )}
        
        {/* E2: Bucket Tables */}
        {!loading && data?.buckets && (
          <div className="space-y-8">
            <BucketTable 
              bucket="BUY" 
              tokens={data.buckets.BUY || []} 
              totalCount={data.summary?.BUY || 0}
            />
            
            <BucketTable 
              bucket="WATCH" 
              tokens={data.buckets.WATCH || []} 
              totalCount={data.summary?.WATCH || 0}
            />
            
            <BucketTable 
              bucket="SELL" 
              tokens={data.buckets.SELL || []} 
              totalCount={data.summary?.SELL || 0}
            />
          </div>
        )}
        
        {/* Empty state (E7) */}
        {!loading && (!data?.summary?.total || data.summary.total === 0) && (
          <div className="text-center py-32 bg-white rounded-xl border border-gray-200 shadow-sm">
            <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rankings Available</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Engine is running in safe mode. Rankings will appear after token analysis completes.
            </p>
            <button
              onClick={handleCompute}
              disabled={computing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
            >
              {computing ? 'Computing...' : 'Compute Rankings Now'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
