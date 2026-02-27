/**
 * Token Rankings Dashboard (Stage E)
 * 
 * Main dashboard showing BUY / WATCH / SELL token buckets
 * 
 * UX Goal:
 * "Пользователь открывает сайт → видит 3 таблицы → сразу понимает, куда смотреть"
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Eye, RefreshCw, Loader2,
  ShoppingCart, AlertCircle, XCircle, ArrowUpRight,
  Clock, BarChart3, Zap, Settings
} from 'lucide-react';

// ============================================================================
// API Functions
// ============================================================================

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

async function fetchDashboardData(limit = 20) {
  const response = await fetch(`${API_URL}/api/rankings/dashboard?limit=${limit}`);
  return response.json();
}

async function computeRankings() {
  const response = await fetch(`${API_URL}/api/rankings/compute`, {
    method: 'POST',
  });
  return response.json();
}

async function syncTokens() {
  const response = await fetch(`${API_URL}/api/tokens/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxTokens: 200 }),
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

function getBucketIcon(bucket) {
  switch (bucket) {
    case 'BUY': return <ShoppingCart className="w-5 h-5" />;
    case 'WATCH': return <Eye className="w-5 h-5" />;
    case 'SELL': return <XCircle className="w-5 h-5" />;
    default: return <BarChart3 className="w-5 h-5" />;
  }
}

function getBucketStyle(bucket) {
  switch (bucket) {
    case 'BUY': 
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'text-green-700',
        badge: 'bg-green-100 text-green-700',
      };
    case 'WATCH': 
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        title: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-700',
      };
    case 'SELL': 
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        title: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        title: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700',
      };
  }
}

// ============================================================================
// Token Row Component
// ============================================================================

function TokenRow({ token, rank }) {
  const priceChangeColor = (token.priceChange24h || 0) >= 0 
    ? 'text-green-600' 
    : 'text-red-600';
  
  const PriceIcon = (token.priceChange24h || 0) >= 0 
    ? TrendingUp 
    : TrendingDown;
  
  return (
    <tr 
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      data-testid={`token-row-${token.symbol}`}
    >
      <td className="px-4 py-3">
        <span className="text-sm text-gray-400 font-mono">#{rank}</span>
      </td>
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
            <span className="font-semibold text-gray-900">{token.symbol}</span>
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{token.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-medium text-gray-900">{formatPrice(token.priceUsd)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className={`flex items-center justify-end gap-1 ${priceChangeColor}`}>
          <PriceIcon className="w-3 h-3" />
          <span className="font-medium">{formatPercentage(token.priceChange24h)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-gray-600">{formatNumber(token.marketCap)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-gray-600">{formatNumber(token.volume24h)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                token.compositeScore >= 70 ? 'bg-green-500' :
                token.compositeScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, token.compositeScore)}%` }}
            />
          </div>
          <span className="text-sm font-mono text-gray-700 w-10 text-right">
            {token.compositeScore?.toFixed(0)}
          </span>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// Bucket Table Component
// ============================================================================

function BucketTable({ bucket, tokens, totalCount }) {
  const style = getBucketStyle(bucket);
  const icon = getBucketIcon(bucket);
  
  const bucketLabels = {
    BUY: { label: 'BUY', desc: 'High score (≥70) — strong fundamentals' },
    WATCH: { label: 'WATCH', desc: 'Medium score (40-69) — monitor closely' },
    SELL: { label: 'SELL', desc: 'Low score (<40) — proceed with caution' },
  };
  
  const { label, desc } = bucketLabels[bucket] || { label: bucket, desc: '' };
  
  return (
    <div 
      className={`rounded-xl border ${style.border} overflow-hidden`}
      data-testid={`bucket-${bucket.toLowerCase()}`}
    >
      {/* Header */}
      <div className={`${style.bg} px-5 py-4 border-b ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style.badge}`}>
              {icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${style.title}`}>{label}</h3>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${style.badge}`}>
            {totalCount} токенов
          </span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">24h</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Market Cap</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No tokens in this bucket
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
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboardData(20);
      
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
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
  }, [loadData]);
  
  const handleCompute = async () => {
    setComputing(true);
    try {
      const result = await computeRankings();
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
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncTokens();
      await handleCompute();
    } catch (err) {
      setError('Sync error');
    } finally {
      setSyncing(false);
    }
  };
  
  const formatLastComputed = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-title">
              Token Rankings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Rules-based analysis • BUY / WATCH / SELL buckets
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Last computed */}
            {data?.summary?.lastComputed && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Updated: {formatLastComputed(data.summary.lastComputed)}</span>
              </div>
            )}
            
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing || computing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              data-testid="sync-tokens-btn"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Tokens
            </button>
            
            {/* Compute button */}
            <button
              onClick={handleCompute}
              disabled={computing || syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              data-testid="compute-rankings-btn"
            >
              {computing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Compute Rankings
            </button>
            
            {/* Settings link */}
            <Link
              to="/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              data-testid="settings-link"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* Summary Stats */}
        {data?.summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Tokens</div>
              <div className="text-2xl font-bold text-gray-900">{data.summary.total}</div>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="text-sm text-green-600">BUY Bucket</div>
              <div className="text-2xl font-bold text-green-700">{data.summary.BUY}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <div className="text-sm text-yellow-600">WATCH Bucket</div>
              <div className="text-2xl font-bold text-yellow-700">{data.summary.WATCH}</div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="text-sm text-red-600">SELL Bucket</div>
              <div className="text-2xl font-bold text-red-700">{data.summary.SELL}</div>
            </div>
          </div>
        )}
        
        {/* Error state */}
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading rankings...</span>
          </div>
        )}
        
        {/* Bucket Tables */}
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
        
        {/* Empty state */}
        {!loading && (!data?.summary?.total || data.summary.total === 0) && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-500 mb-6">
              Sync tokens from CoinGecko and compute rankings to get started.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              {syncing ? 'Syncing...' : 'Sync & Compute'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
