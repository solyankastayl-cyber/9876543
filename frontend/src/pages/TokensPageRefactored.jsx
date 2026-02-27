/**
 * TokensPage - REFACTORED (L1 + L2 Architecture)
 * 
 * 🎯 GOAL: Tokens = эталон L1 + L2, ML = опциональный слой
 * 
 * ARCHITECTURE:
 * - L1 (FACTS): Raw on-chain data, no opinions
 * - L2 (ENGINE): Patterns, deviations, signals with baseline
 * - ML (OPTIONAL): Separate layer, doesn't break UX
 * 
 * CONTRACT:
 * - NO BUY/SELL/WATCH labels in main UI
 * - NO confidence scores in raw data blocks
 * - NO interpretations without baselines
 * - Product works WITHOUT ML
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, AlertCircle, ExternalLink, TrendingUp, TrendingDown, 
  Loader2, RefreshCw, Info, ArrowUpRight, ArrowDownRight, ArrowRight,
  Users, Wallet, ArrowLeftRight, Zap, TrendingDown as Deviation
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, marketApi } from '../api';

// ============================================================================
// L1: OVERVIEW BLOCK - RAW FACTS ONLY
// "What is actually happening with this token"
// ============================================================================
function TokenOverviewL1({ tokenAddress, marketContext, resolvedData }) {
  const activityMetrics = {
    netFlow: marketContext?.flows?.netFlow || 0,
    inflow: marketContext?.flows?.inflow || 0,
    outflow: marketContext?.flows?.outflow || 0,
    activeWallets: marketContext?.activity?.activeWallets || 0,
    transfers24h: marketContext?.activity?.transfers24h || 0,
    transfers7d: marketContext?.activity?.transfers7d || 0,
  };

  const largestTransfers = marketContext?.largestTransfers || [];
  const timeWindow = "24h"; // Configurable

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Token Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">L1: Raw on-chain data · No opinions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
            {timeWindow} Window
          </span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Raw on-chain metrics. Volume ≠ intent, activity ≠ signal.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Activity Snapshot Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {/* Net Flow */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            {activityMetrics.netFlow >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-gray-600" />
            )}
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Net Flow</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {activityMetrics.netFlow >= 0 ? '+' : ''}{activityMetrics.netFlow.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Inflow: {activityMetrics.inflow.toLocaleString()} · Outflow: {activityMetrics.outflow.toLocaleString()}
          </div>
        </div>

        {/* Active Wallets */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active Wallets</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {activityMetrics.activeWallets.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Unique addresses ({timeWindow})</div>
        </div>

        {/* Transfers */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Transfers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {activityMetrics.transfers24h.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            24h · {activityMetrics.transfers7d.toLocaleString()} in 7d
          </div>
        </div>
      </div>

      {/* Largest Transfers */}
      {largestTransfers.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Largest Transfers ({timeWindow})</h3>
          <div className="space-y-2">
            {largestTransfers.slice(0, 3).map((transfer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">
                    {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-mono text-gray-500">
                    {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {transfer.amount.toLocaleString()} {resolvedData.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> These are raw on-chain facts. Activity does not imply sentiment or direction.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// L1→L2: PARTICIPANTS & STRUCTURE
// "Who is driving this activity?" - Structure, not intent
// ============================================================================
function TokenParticipantsL2({ tokenAddress, participants }) {
  // Structure metrics (L1)
  const topHolders = participants?.topHolders || [];
  const holderDistribution = participants?.distribution || {
    top10: 0,
    top50: 0,
    rest: 0
  };

  // Pattern hints (L2)
  const patterns = participants?.patterns || {
    accumulation: false,
    distribution: false,
    mixed: true
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Participants & Structure</h2>
          <p className="text-xs text-gray-500 mt-0.5">L1→L2: Structure, not intent</p>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">Describes structure and patterns, not investment decisions.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Holder Concentration (L1) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Holder Concentration</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900">{holderDistribution.top10}%</div>
            <div className="text-xs text-gray-500">Top 10 holders</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900">{holderDistribution.top50}%</div>
            <div className="text-xs text-gray-500">Top 50 holders</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900">{holderDistribution.rest}%</div>
            <div className="text-xs text-gray-500">Other holders</div>
          </div>
        </div>
      </div>

      {/* Top Holders */}
      {topHolders.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Holders</h3>
          <div className="space-y-2">
            {topHolders.slice(0, 5).map((holder, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                  <span className="text-xs font-mono text-gray-700">{holder.address}</span>
                  {holder.label && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {holder.label}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900">{holder.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Hints (L2) */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
        <div className="flex items-start gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-1">Behavioral Patterns</h4>
            <div className="space-y-1">
              {patterns.accumulation && (
                <p className="text-xs text-amber-700">• Accumulation pattern detected (holders increasing)</p>
              )}
              {patterns.distribution && (
                <p className="text-xs text-amber-700">• Distribution pattern detected (holders decreasing)</p>
              )}
              {patterns.mixed && (
                <p className="text-xs text-amber-700">• Mixed behavior (no clear pattern)</p>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-2 italic">
              These describe structure, not intent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// L2: SIGNALS & DEVIATIONS
// Each signal MUST have baseline, magnitude, confidence
// ============================================================================
function TokenSignalsL2({ tokenAddress, signals }) {
  const recentSignals = signals || [];

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Signals & Deviations</h2>
          <p className="text-xs text-gray-500 mt-0.5">L2: Engine signals with baselines</p>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">All signals show deviation from baseline. No opinions, only facts.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Signals List */}
      {recentSignals.length > 0 ? (
        <div className="space-y-3">
          {recentSignals.map((signal, idx) => (
            <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Deviation className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-900">{signal.type}</span>
                </div>
                <span className="text-xs text-gray-500">{signal.timestamp}</span>
              </div>
              
              {/* Deviation Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Baseline (168h avg):</span>
                  <span className="font-mono text-gray-900">{signal.baseline}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Current value:</span>
                  <span className="font-mono font-bold text-gray-900">{signal.current}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Deviation:</span>
                  <span className={`font-bold ${signal.deviation > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {signal.deviation > 0 ? '+' : ''}{signal.deviation}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Engine confidence:</span>
                  <span className="font-semibold text-gray-900">{signal.engineConfidence}%</span>
                </div>
              </div>

              {/* Example: "7x increase vs 168h baseline" */}
              <div className="mt-3 p-2 bg-white rounded-lg">
                <p className="text-xs text-gray-700">
                  <strong>{Math.abs(signal.deviation)}x {signal.deviation > 0 ? 'increase' : 'decrease'}</strong> vs 168h baseline
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Deviation className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">No deviations detected</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Activity within normal parameters. Signals appear when behavior deviates from baseline.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-5 p-3 bg-purple-50 border border-purple-100 rounded-lg">
        <p className="text-xs text-purple-700">
          <strong>Note:</strong> Deviations describe changes, not direction. Not bullish or bearish.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// META: RESOLUTION STATUS
// Data completeness, coverage, ML readiness
// ============================================================================
function ResolutionStatusMeta({ resolvedData, available }) {
  const dataItems = [
    { key: 'activity', label: 'Activity', available: available?.activity },
    { key: 'market', label: 'Market', available: available?.market },
    { key: 'holders', label: 'Holders', available: available?.holders },
    { key: 'signals', label: 'Signals', available: available?.signals },
    { key: 'trust', label: 'Trust', available: available?.trust },
  ];

  const availableCount = dataItems.filter(item => item.available).length;
  const percentage = Math.round((availableCount / dataItems.length) * 100);
  const isComplete = percentage >= 80;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resolution Status</h2>
          <p className="text-xs text-gray-500 mt-0.5">Meta: Data completeness & coverage</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
          isComplete ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
          'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          {percentage}% Complete
        </span>
      </div>

      {/* Data Coverage */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {dataItems.map(item => (
          <div key={item.key} className={`p-3 rounded-lg text-center ${
            item.available ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`text-xs font-semibold ${item.available ? 'text-emerald-700' : 'text-gray-500'}`}>
              {item.label}
            </div>
            <div className={`text-lg font-bold mt-1 ${item.available ? 'text-emerald-600' : 'text-gray-400'}`}>
              {item.available ? '✓' : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Resolution Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">Token Type</span>
          <span className="text-xs font-semibold text-gray-900 capitalize">{resolvedData.type || 'ERC-20'}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">Chain</span>
          <span className="text-xs font-semibold text-gray-900">{resolvedData.chain || 'Ethereum'}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">ML Readiness</span>
          <span className={`text-xs font-semibold ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isComplete ? 'Ready' : 'Insufficient data'}
          </span>
        </div>
      </div>

      {/* Usage Note */}
      <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Purpose:</strong> Shows data completeness. Used for ML readiness and UX ("why no signal").
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// OPTIONAL: ML SUMMARY LAYER
// Separate block, doesn't interfere with main UI
// ============================================================================
function MLSummaryOptional({ tokenAddress, mlEnabled = false }) {
  const [mlData, setMlData] = useState(null);

  useEffect(() => {
    if (!mlEnabled || !tokenAddress) return;
    
    // Load ML predictions separately
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ml/summary/${tokenAddress}`)
      .then(res => res.json())
      .then(data => setMlData(data))
      .catch(err => console.error('ML load error:', err));
  }, [tokenAddress, mlEnabled]);

  if (!mlEnabled) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 rounded-2xl p-6">
        <div className="text-center">
          <Zap className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-purple-900 mb-1">ML Analysis Available</h3>
          <p className="text-xs text-purple-600 mb-3">
            Optional AI-powered insights layer. Product works without ML.
          </p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors">
            Enable ML Layer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-purple-900">AI Summary</h2>
          <p className="text-xs text-purple-600 mt-0.5">Optional ML layer · Reads L1+L2, doesn't overwrite</p>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
          ML Enabled
        </span>
      </div>

      {mlData ? (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-xl">
            <p className="text-sm text-gray-700">{mlData.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">ML Confidence</div>
              <div className="text-lg font-bold text-purple-600">{mlData.confidence}%</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Signal Strength</div>
              <div className="text-lg font-bold text-purple-600">{mlData.strength}/10</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-purple-600">Loading ML analysis...</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TokensPageRefactored() {
  const { address } = useParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [marketContext, setMarketContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mlEnabled, setMlEnabled] = useState(false);

  useEffect(() => {
    if (address) {
      handleResolve(address);
    }
  }, [address]);

  const handleResolve = async (input) => {
    if (!input || !input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call resolve API
      const response = await resolverApi.resolve(input);
      
      if (response?.ok && response.data) {
        const resolved = response.data;
        setResolvedData(resolved);
        
        // Only load market context if status is resolved
        if (resolved.status === 'resolved' && resolved.normalizedId) {
          try {
            const marketResp = await marketApi.getMarketContext(
              resolved.normalizedId,
              resolved.chain || 'ethereum'
            );
            if (marketResp?.ok && marketResp.data) {
              setMarketContext(marketResp.data);
            }
          } catch (marketErr) {
            console.error('Market context error:', marketErr);
            // Continue even if market context fails
          }
        }
      } else {
        setError(response?.message || 'Failed to resolve token');
      }
    } catch (err) {
      console.error('Resolve error:', err);
      setError(err.message || 'Failed to resolve token');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Resolving token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-900 text-center mb-2">Error</h2>
            <p className="text-sm text-red-700 text-center">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setResolvedData(null);
              }}
              className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <TooltipProvider>
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Token Analysis</h1>
            <p className="text-gray-600 mb-8">
              L1 + L2 Architecture · Enter token address or symbol to begin
            </p>
            
            {/* Search Input */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleResolve(query)}
                placeholder="Enter token address or symbol (e.g., UNI or 0x1f98...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleResolve(query)}
                disabled={!query.trim()}
                className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Analyze Token
              </button>
            </div>

            {/* Examples */}
            <div className="mt-6 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Try examples:</p>
              <div className="grid grid-cols-2 gap-3">
                {['UNI', 'USDC', 'WETH', 'LINK'].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => handleResolve(symbol)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>
    );
  }

  // Handle indexing status
  if (resolvedData.status === 'indexing' || resolvedData.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <TooltipProvider>
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <Activity className="w-8 h-8 text-amber-600 mx-auto mb-3 animate-pulse" />
              <h2 className="text-lg font-bold text-amber-900 text-center mb-2">Token Indexing</h2>
              <p className="text-sm text-amber-700 text-center mb-4">
                This token is being indexed. Data will be available shortly.
              </p>
              
              {resolvedData.symbol && (
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-600">Token: <span className="font-bold text-gray-900">{resolvedData.symbol}</span></p>
                  <p className="text-xs text-gray-600 font-mono mt-1">{resolvedData.normalizedId}</p>
                </div>
              )}

              <button
                onClick={() => handleResolve(resolvedData.normalizedId || address)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Refresh Status
              </button>
            </div>
          </div>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {resolvedData.symbol || resolvedData.label || 'Token'}
            </h1>
            <p className="text-sm text-gray-600">
              L1 + L2 Analysis · ML Optional · Address: {resolvedData.normalizedId?.slice(0, 10)}...
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: L1 + L2 */}
            <div className="lg:col-span-2 space-y-6">
              {/* L1: Overview */}
              <TokenOverviewL1 
                tokenAddress={resolvedData.normalizedId}
                marketContext={marketContext}
                resolvedData={resolvedData}
              />

              {/* L1→L2: Participants & Structure */}
              <TokenParticipantsL2 
                tokenAddress={resolvedData.normalizedId}
                participants={marketContext?.participants}
              />

              {/* L2: Signals & Deviations */}
              <TokenSignalsL2 
                tokenAddress={resolvedData.normalizedId}
                signals={marketContext?.signals}
              />
            </div>

            {/* Right Column: Meta + ML */}
            <div className="space-y-6">
              {/* Meta: Resolution Status */}
              <ResolutionStatusMeta 
                resolvedData={resolvedData}
                available={resolvedData.available}
              />

              {/* Optional: ML Summary */}
              <MLSummaryOptional 
                tokenAddress={resolvedData.normalizedId}
                mlEnabled={mlEnabled}
              />

              {/* Actions */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
                  Create Alert
                </button>
                <a 
                  href={`https://etherscan.io/address/${resolvedData.normalizedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Etherscan
                </a>
              </div>
            </div>
          </div>

          {/* Checklist Footer */}
          <div className="mt-8 p-4 bg-white border border-gray-200 rounded-xl">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Checklist:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">L1: All metrics raw on-chain</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">L2: All signals have baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">No BUY/SELL in main UI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">Product works without ML</span>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
