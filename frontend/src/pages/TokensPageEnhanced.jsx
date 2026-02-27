/**
 * TokensPage - L1+L2 Enhanced (Preserving ALL working logic)
 * 
 * 🎯 APPROACH: Keep ALL working components, just add L1/L2 labels & disclaimers
 * 
 * PRESERVED COMPONENTS:
 * ✅ ActivitySnapshot - working correctly
 * ✅ TokenActivityDrivers - top participants logic
 * ✅ Recent Signals - correct logic
 * ✅ TokenSmartMoney - long-developed, working
 * ✅ TokenClusters - needed
 * ✅ Create Alert - functional
 * ✅ All tooltips - informative
 * 
 * ADDITIONS:
 * ✅ L1/L2/Meta labels on sections
 * ✅ Disclaimers where appropriate
 * ✅ Recent Searches on main page
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, Bell, AlertCircle, ExternalLink, TrendingUp, TrendingDown, 
  Loader2, RefreshCw, Star, Check, Clock, Info,
  ArrowUpRight, ArrowDownRight, Users, Zap, Wallet, ArrowLeftRight, X
} from 'lucide-react';
import StatusBanner from '../components/StatusBanner';
import DataAvailability, { ResolutionInfo, CONFIDENCE_THRESHOLDS } from '../components/DataAvailability';
import CreateAlertModal from '../components/CreateAlertModal';

// ✅ KEEP ALL WORKING COMPONENTS
import ActivitySnapshot from '../components/ActivitySnapshot';
import ConfidenceTooltip, { ConfidenceIndicator } from '../components/ConfidenceTooltip';
import TokenActivityDrivers from '../components/TokenActivityDrivers';
import TrackTokenButton from '../components/TrackTokenButton';
import TokenClusters from '../components/TokenClusters';
import TokenSmartMoney from '../components/TokenSmartMoney';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, marketApi } from '../api';

// ============================================================================
// Recent Searches Component - Uses Canonical URLs
// ============================================================================
function RecentSearches({ onSelectToken }) {
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('recentTokenSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  if (recentSearches.length === 0) return null;

  // Chain color mapping
  const getChainColor = (chainId) => {
    const colors = {
      1: 'bg-blue-500',
      42161: 'bg-blue-600',
      137: 'bg-purple-500',
      10: 'bg-red-500',
      8453: 'bg-blue-400',
      56: 'bg-yellow-500',
    };
    return colors[chainId] || 'bg-gray-500';
  };

  const getChainName = (chainId) => {
    const names = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      137: 'Polygon',
      10: 'Optimism',
      8453: 'Base',
      56: 'BSC',
    };
    return names[chainId] || 'Unknown';
  };

  const handleCardClick = (token) => {
    // Use canonical URL if available, fallback to address
    if (token.canonicalUrl) {
      navigate(token.canonicalUrl);
    } else if (token.chainId && token.address) {
      navigate(`/token/${token.chainId}/${token.address}`);
    } else if (token.address) {
      // Legacy: fallback to alias route
      navigate(`/token/${token.address}`);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Recently analyzed tokens</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold">
            {recentSearches.length} tokens
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('recentTokenSearches');
              setRecentSearches([]);
            }}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition-colors"
            data-testid="clear-all-recent"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentSearches.slice(0, 8).map((token, idx) => (
          <div key={`${token.chainId || 1}-${token.address}-${idx}`} className="relative group">
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const updated = recentSearches.filter((_, i) => i !== idx);
                setRecentSearches(updated);
                localStorage.setItem('recentTokenSearches', JSON.stringify(updated));
              }}
              className="absolute top-2 right-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Remove from history"
              data-testid={`remove-recent-${idx}`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Token Card */}
            <button
              onClick={() => handleCardClick(token)}
              className="w-full bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 hover:from-blue-50 hover:via-purple-50 hover:to-pink-50 border-2 border-gray-200/60 hover:border-blue-400 hover:shadow-xl rounded-xl p-4 text-left transition-all duration-300"
              data-testid={`recent-token-${token.symbol || 'unknown'}`}
            >
            {/* Header - Symbol, Verified Badge, Chain Badge, Change Badge */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">{token.symbol || 'N/A'}</span>
                {token.verified && (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              {token.change24h != null && (
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  token.change24h >= 0 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {token.change24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(token.change24h).toFixed(1)}%
                </div>
              )}
            </div>
            
            {/* Name/Label */}
            <div className="text-sm text-gray-500 mb-3 truncate">
              {token.name || token.label || 'Unknown'}
            </div>

            {/* Price */}
            {token.price != null ? (
              <div className="text-2xl font-bold text-gray-900 mb-3">
                ${typeof token.price === 'number' ? token.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: token.price < 1 ? 4 : 2
                }) : token.price}
              </div>
            ) : (
              <div className="text-lg text-gray-400 mb-3">N/A</div>
            )}

            {/* Metrics Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Vol:</span>
                <span className="font-bold text-gray-900">
                  {token.volume24h != null ? `$${(token.volume24h / 1e6).toFixed(0)}M` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Active:</span>
                <span className="font-bold text-gray-900">
                  {token.activeWallets != null ? token.activeWallets.toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Signals:</span>
                <span className="font-bold text-gray-900">
                  {token.signals != null ? token.signals : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Flow:</span>
                <span className={`font-bold ${
                  token.netFlow != null
                    ? token.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
                    : 'text-gray-400'
                }`}>
                  {token.netFlow != null 
                    ? `${token.netFlow >= 0 ? '+' : ''}${Math.abs(token.netFlow) >= 1000 ? (token.netFlow / 1000).toFixed(0) + 'k' : token.netFlow}`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Data Availability Icons - 5 in row */}
            <div className="flex items-center gap-1 mb-3 pb-3 border-t border-gray-200 pt-3">
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  token.dataAvailability?.activity ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
                title="Activity"
              >
                <Activity className={`w-3.5 h-3.5 ${
                  token.dataAvailability?.activity ? 'text-emerald-600' : 'text-gray-400'
                }`} />
              </div>
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  token.dataAvailability?.market ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
                title="Market"
              >
                <TrendingUp className={`w-3.5 h-3.5 ${
                  token.dataAvailability?.market ? 'text-emerald-600' : 'text-gray-400'
                }`} />
              </div>
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  token.dataAvailability?.signals ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
                title="Signals"
              >
                <Zap className={`w-3.5 h-3.5 ${
                  token.dataAvailability?.signals ? 'text-emerald-600' : 'text-gray-400'
                }`} />
              </div>
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  token.dataAvailability?.trust ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
                title="Trust"
              >
                <Check className={`w-3.5 h-3.5 ${
                  token.dataAvailability?.trust ? 'text-emerald-600' : 'text-gray-400'
                }`} />
              </div>
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  token.dataAvailability?.transfers ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
                title="Transfers"
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 ${
                  token.dataAvailability?.transfers ? 'text-emerald-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {/* Footer - Address */}
            <div className="text-xs font-mono text-gray-400">
              {token.address?.slice(0, 6)}...{token.address?.slice(-4)}
            </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Save to Recent Searches - Enhanced with more metrics
// ============================================================================
function saveToRecentSearches(tokenData) {
  try {
    const saved = localStorage.getItem('recentTokenSearches');
    let searches = saved ? JSON.parse(saved) : [];
    
    // Remove if already exists
    searches = searches.filter(t => t.address !== tokenData.address);
    
    // Add to front with enhanced metrics
    searches.unshift({
      address: tokenData.address,
      symbol: tokenData.symbol,
      label: tokenData.label,
      price: tokenData.price,
      change24h: tokenData.change24h,
      volume24h: tokenData.volume24h,
      activeWallets: tokenData.activeWallets,
      signals: tokenData.signals,
      netFlow: tokenData.netFlow,
      largestTransfer: tokenData.largestTransfer,
      verified: tokenData.verified,
      dataAvailability: tokenData.dataAvailability,
      timestamp: Date.now()
    });
    
    // Keep only last 10
    searches = searches.slice(0, 10);
    
    localStorage.setItem('recentTokenSearches', JSON.stringify(searches));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
}

// ============================================================================
// Token Search Component with NEW API Autocomplete
// ============================================================================
function TokenSearch({ onResolve, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced search for suggestions using NEW /api/tokens/suggest endpoint
  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/tokens/suggest?q=${encodeURIComponent(query)}&limit=7`
        );
        const data = await response.json();
        if (data.ok && data.data) {
          setSuggestions(data.data);
          setShowSuggestions(data.data.length > 0);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setSuggestLoading(false);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to alias route - let TokenAliasResolver handle resolution
      navigate(`/token/${query.trim()}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (token) => {
    // Navigate directly to canonical URL
    navigate(token.canonicalUrl);
    setShowSuggestions(false);
  };

  // Chain color mapping
  const getChainColor = (chainId) => {
    const colors = {
      1: 'bg-blue-500',
      42161: 'bg-blue-600',
      137: 'bg-purple-500',
      10: 'bg-red-500',
      8453: 'bg-blue-400',
      56: 'bg-yellow-500',
    };
    return colors[chainId] || 'bg-gray-500';
  };

  const getChainName = (chainId) => {
    const names = {
      1: 'ETH',
      42161: 'ARB',
      137: 'POLY',
      10: 'OP',
      8453: 'BASE',
      56: 'BSC',
    };
    return names[chainId] || 'N/A';
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Enter token symbol or address (e.g., UNI, USDT, 0x1f98...)"
          disabled={loading}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-2xl focus:outline-none disabled:bg-gray-100"
          data-testid="token-search-input"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
          data-testid="token-search-submit"
        >
          {loading || suggestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Autocomplete Suggestions from TokenRegistry */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((token, idx) => (
            <button
              key={`${token.chainId}-${token.address}`}
              onClick={() => handleSelectSuggestion(token)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
              data-testid={`suggestion-${token.symbol}`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">
                  {token.symbol?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">{token.symbol}</span>
                  {token.verified && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className={`px-1.5 py-0.5 ${getChainColor(token.chainId)} text-white text-xs font-bold rounded`}>
                    {getChainName(token.chainId)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 truncate">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Token Actions Block - ✅ KEEP CREATE ALERT
// ============================================================================
function TokenActionsBlock({ resolvedData, actionsEnabled, onCreateAlert }) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onCreateAlert}
            disabled={!actionsEnabled}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Bell className="w-4 h-4" />
            Create Alert
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Set price alerts for this token</p>
        </TooltipContent>
      </Tooltip>

      <TrackTokenButton
        tokenAddress={resolvedData.normalizedId}
        tokenSymbol={resolvedData.symbol || resolvedData.label}
      />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <Star className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Add to watchlist</p>
        </TooltipContent>
      </Tooltip>
      
      <a 
        href={`https://etherscan.io/address/${resolvedData.normalizedId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Etherscan
      </a>
    </div>
  );
}

// ============================================================================
// Data Availability Enhanced - ✅ KEEP TOOLTIPS
// ============================================================================
function DataAvailabilityEnhanced({ available, confidence }) {
  const items = [
    { 
      key: 'profile', 
      label: 'Profile', 
      tooltip: 'Token metadata and basic information',
      icon: Info
    },
    { 
      key: 'market', 
      label: 'Market', 
      tooltip: 'Price, volume, and market cap data',
      icon: Activity
    },
    { 
      key: 'signals', 
      label: 'Signals', 
      tooltip: 'Actor signals and behavioral patterns',
      icon: Zap
    },
    { 
      key: 'trust', 
      label: 'Trust', 
      tooltip: 'Attribution score and risk assessment',
      icon: Check
    },
    { 
      key: 'transfers', 
      label: 'Transfers', 
      tooltip: 'On-chain transfer history and wallet activity',
      icon: ArrowLeftRight
    },
  ];

  const availableCount = items.filter(item => available?.[item.key]).length;
  const percentage = Math.round((availableCount / items.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Data Availability</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
          percentage >= 40 ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {availableCount}/{items.length} ({percentage}%)
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {items.map(({ key, label, tooltip, icon: Icon }) => {
          const isAvailable = available?.[key];
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-help transition-colors ${
                  isAvailable ? 'bg-emerald-50' : 'bg-gray-50'
                }`}>
                  <Icon className={`w-4 h-4 ${isAvailable ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {isAvailable ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-gray-900 max-w-xs border border-gray-200">
                <p className="text-xs">{tooltip}</p>
                {!isAvailable && (
                  <p className="text-xs text-gray-500 mt-1">
                    Data appears as on-chain history is indexed
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Token Signals Block - ✅ KEEP RECENT SIGNALS LOGIC
// ============================================================================
function TokenSignalsBlock({ tokenAddress }) {
  const [signalData, setSignalData] = useState({ signals: [], interpretation: null });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadSignals() {
      if (!tokenAddress) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/market/token-signals/${tokenAddress}`
        );
        const data = await response.json();
        
        if (data.ok) {
          setSignalData(data.data || { signals: [], interpretation: null });
        }
      } catch (err) {
        console.error('Load signals error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadSignals();
  }, [tokenAddress]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          Recent Signals
          <span className="text-xs font-normal text-gray-500">(L2: Engine)</span>
        </h3>
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const signals = signalData.signals || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          Recent Signals
          <span className="text-xs font-normal text-gray-500">(L2: Engine)</span>
        </h3>
        {signals.length > 0 && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {signals.length} active
          </span>
        )}
      </div>

      {signals.length > 0 ? (
        <div className="space-y-2">
          {signals.slice(0, 5).map((signal, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{signal.type}</span>
                <span className="text-xs text-gray-500">{signal.timestamp}</span>
              </div>
              {signal.confidence && (
                <div className="text-xs text-gray-600">
                  Engine confidence: {Math.round(signal.confidence * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <Zap className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">No signals detected</p>
          <p className="text-xs text-gray-500 mt-1">Activity within normal parameters</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Resolved State Component - ✅ KEEP ALL SECTIONS
// ============================================================================
function ResolvedState({ resolvedData, marketContext, onRefresh, onCreateAlert, onWalletClick }) {
  const price = marketContext?.price?.current;
  const change24h = marketContext?.price?.change24h;
  
  return (
    <div className="space-y-4">
      {/* Section 1: Token Header - LIGHT THEME */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {resolvedData.symbol || resolvedData.label || 'Token'}
              </span>
              {resolvedData.verified && (
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  VERIFIED
                </span>
              )}
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                L1+L2 Analysis
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {price ? (
                <>
                  <span className="text-2xl font-bold text-gray-900">${price.toLocaleString()}</span>
                  {change24h !== null && change24h !== undefined && (
                    <span className={`flex items-center gap-1 ${change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(change24h).toFixed(2)}% (24h)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">Price data unavailable</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Chain: {resolvedData.chain || 'ethereum'}</div>
            <div className="text-xs font-mono text-gray-600">
              {resolvedData.normalizedId?.slice(0, 10)}...{resolvedData.normalizedId?.slice(-8)}
            </div>
          </div>
        </div>

        {/* Actions - ✅ KEEP CREATE ALERT */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <TokenActionsBlock 
            resolvedData={resolvedData} 
            actionsEnabled={true}
            onCreateAlert={onCreateAlert}
          />
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section 2: ✅ KEEP ACTIVITY SNAPSHOT - критически важный блок */}
      <div className="relative">
        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
          L1: Facts
        </div>
        <ActivitySnapshot 
          tokenAddress={resolvedData.normalizedId}
          marketContext={marketContext}
          resolvedData={resolvedData}
          timeWindow="24h"
        />
      </div>

      {/* Two Column Layout - BALANCED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Section 3: ✅ KEEP Token Activity Drivers */}
          <div className="relative">
            <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
              L1→L2: Structure
            </div>
            <TokenActivityDrivers 
              tokenAddress={resolvedData.normalizedId}
              chain={resolvedData.chain || 'Ethereum'}
              onWalletClick={onWalletClick}
            />
          </div>
          
          {/* Section 4: ✅ KEEP Smart Money Activity - MOVED UP */}
          <div className="relative">
            <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
              L2: Smart Money
            </div>
            <TokenSmartMoney 
              tokenAddress={resolvedData.normalizedId}
              smartMoneyData={marketContext?.smartMoney}
            />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Section 5: ✅ MOVED - Recent Signals */}
          <TokenSignalsBlock tokenAddress={resolvedData.normalizedId} />
          
          {/* Section 6: ✅ MOVED - Token Clusters */}
          <div className="relative">
            <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
              L2: Patterns
            </div>
            <TokenClusters 
              tokenAddress={resolvedData.normalizedId}
              clusters={marketContext?.clusters}
            />
          </div>
          
          {/* Section 7: ✅ KEEP Resolution Status with tooltips */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Resolution Status</h3>
              <span className="text-xs text-gray-500">(Meta)</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Shows data completeness and coverage. Used for ML readiness and UX feedback.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Type</span>
                <span className="text-xs font-medium text-gray-900 capitalize">{resolvedData.type || 'token'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Chain</span>
                <span className="text-xs font-medium text-gray-900">{resolvedData.chain || 'Ethereum'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <span className="text-xs font-medium text-emerald-600">Analysis Complete</span>
              </div>
            </div>
          </div>
          
          {/* Section 8: ✅ KEEP Data Availability with tooltips */}
          <DataAvailabilityEnhanced 
            available={resolvedData.available} 
            confidence={resolvedData.confidence}
          />
        </div>
      </div>

      {/* L1+L2 Disclaimer */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>L1+L2 Architecture:</strong> Facts (L1) and Patterns (L2) presented separately. 
            ML predictions available separately. Volume ≠ intent, activity ≠ signal.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function TokensPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [marketContext, setMarketContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

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
      const response = await resolverApi.resolve(input);
      
      if (response?.ok && response.data) {
        const resolved = response.data;
        setResolvedData(resolved);
        
        // Always try to save to recent searches (even if insufficient_data)
        if (resolved.status === 'resolved') {
          const marketResp = await marketApi.getMarketContext(
            resolved.normalizedId,
            resolved.chain || 'ethereum'
          );
          
          if (marketResp?.ok && marketResp.data) {
            setMarketContext(marketResp.data);
            
            // Save to recent with enhanced metrics
            console.log('💾 Saving to recent searches:', {
              symbol: resolved.symbol,
              address: resolved.normalizedId,
              status: resolved.status
            });
            
            saveToRecentSearches({
              address: resolved.normalizedId,
              symbol: resolved.symbol,
              label: resolved.label,
              price: marketResp.data.price?.current,
              change24h: marketResp.data.price?.change24h,
              volume24h: marketResp.data.activity?.volume24h,
              activeWallets: marketResp.data.activity?.activeWallets,
              signals: marketResp.data.recentSignals?.length || 0,
              netFlow: marketResp.data.flows?.netFlow,
              largestTransfer: marketResp.data.largestTransfers?.[0]?.amount,
              verified: resolved.verified,
              dataAvailability: {
                activity: resolved.available?.activity || false,
                market: resolved.available?.market || false,
                signals: resolved.available?.signals || false,
                trust: resolved.available?.trust || false,
                transfers: resolved.available?.transfers || false
              }
            });
            
            console.log('✅ Saved to recent searches');
          }
        } else if (resolved.status === 'insufficient_data') {
          // Save even if insufficient data (user searched for it)
          console.log('💾 Saving insufficient_data token:', resolved.symbol);
          saveToRecentSearches({
            address: resolved.normalizedId || input,
            symbol: resolved.symbol || input.toUpperCase(),
            label: resolved.label || `Token not found`,
            price: null,
            change24h: null,
            volume24h: null,
            activeWallets: null,
            signals: 0,
            netFlow: null,
            largestTransfer: null,
            verified: false,
            dataAvailability: {
              activity: false,
              market: false,
              signals: false,
              trust: false,
              transfers: false
            }
          });
          console.log('✅ Saved insufficient_data token');
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

  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  // Loading state
  if (loading && !resolvedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Resolving token...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  // Indexing state
  if (resolvedData?.status === 'indexing' || resolvedData?.status === 'pending') {
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

  // Empty state - with Recent Searches
  if (!resolvedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <TooltipProvider>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Token Analysis</h1>
              <p className="text-lg text-gray-600">
                L1 + L2 Architecture · Facts & Patterns · ML Optional
              </p>
            </div>
            
            {/* Search */}
            <div className="mb-8">
              <TokenSearch onResolve={handleResolve} loading={loading} />
            </div>

            {/* Recent Searches - NEW */}
            <RecentSearches onSelectToken={handleResolve} />
          </div>
        </TooltipProvider>
      </div>
    );
  }

  // Resolved state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto">
          <StatusBanner />
          
          <ResolvedState
            resolvedData={resolvedData}
            marketContext={marketContext}
            onRefresh={() => handleResolve(resolvedData.normalizedId)}
            onCreateAlert={() => setShowAlertModal(true)}
            onWalletClick={handleWalletClick}
          />

          {/* Create Alert Modal */}
          {showAlertModal && (
            <CreateAlertModal
              tokenAddress={resolvedData.normalizedId}
              tokenSymbol={resolvedData.symbol}
              onClose={() => setShowAlertModal(false)}
            />
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
