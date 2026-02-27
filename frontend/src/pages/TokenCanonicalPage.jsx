/**
 * TokenCanonicalPage - Handles /token/:chainId/:address canonical route
 * 
 * PURPOSE:
 * - Display token data for a specific chainId + address combination
 * - This is the "source of truth" URL for token pages
 * 
 * ARCHITECTURE:
 * - Fetches token from GET /api/tokens/by-canonical/:chainId/:address
 * - Falls back to resolver for market data
 * - Updates Recent Searches with canonical identifiers
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Activity, Bell, AlertCircle, ExternalLink, TrendingUp, TrendingDown, 
  Loader2, RefreshCw, Star, Check, Clock, Info, Copy, CheckCircle,
  ArrowUpRight, ArrowDownRight, Users, Zap, Wallet, ArrowLeftRight, X
} from 'lucide-react';
import StatusBanner from '../components/StatusBanner';
import CreateAlertModal from '../components/CreateAlertModal';
import ActivitySnapshot from '../components/ActivitySnapshot';
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

// Chain metadata
const CHAIN_INFO = {
  1: { name: 'Ethereum', color: 'bg-blue-500', explorer: 'https://etherscan.io' },
  42161: { name: 'Arbitrum', color: 'bg-blue-600', explorer: 'https://arbiscan.io' },
  137: { name: 'Polygon', color: 'bg-purple-500', explorer: 'https://polygonscan.com' },
  10: { name: 'Optimism', color: 'bg-red-500', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', color: 'bg-blue-400', explorer: 'https://basescan.org' },
  56: { name: 'BSC', color: 'bg-yellow-500', explorer: 'https://bscscan.com' },
  43114: { name: 'Avalanche', color: 'bg-red-600', explorer: 'https://snowtrace.io' },
};

const CHAIN_NAME_MAP = {
  1: 'ethereum',
  42161: 'arbitrum',
  137: 'polygon',
  10: 'optimism',
  8453: 'base',
  56: 'bsc',
  43114: 'avalanche',
};

// ============================================================================
// Save to Recent Searches with canonical identifiers
// ============================================================================
function saveToRecentSearches(tokenData) {
  try {
    const saved = localStorage.getItem('recentTokenSearches');
    let searches = saved ? JSON.parse(saved) : [];
    
    // Remove if already exists (by canonical key: chainId + address)
    searches = searches.filter(t => 
      !(t.chainId === tokenData.chainId && t.address === tokenData.address)
    );
    
    // Add to front with canonical identifiers
    searches.unshift({
      // Canonical identifiers
      chainId: tokenData.chainId,
      address: tokenData.address,
      // Display data
      symbol: tokenData.symbol,
      name: tokenData.name,
      chain: tokenData.chain,
      price: tokenData.price,
      change24h: tokenData.change24h,
      volume24h: tokenData.volume24h,
      activeWallets: tokenData.activeWallets,
      signals: tokenData.signals,
      netFlow: tokenData.netFlow,
      verified: tokenData.verified,
      dataAvailability: tokenData.dataAvailability,
      timestamp: Date.now(),
      // Canonical URL for navigation
      canonicalUrl: `/token/${tokenData.chainId}/${tokenData.address}`,
    });
    
    // Keep only last 10
    searches = searches.slice(0, 10);
    
    localStorage.setItem('recentTokenSearches', JSON.stringify(searches));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
}

// ============================================================================
// Data Availability Enhanced Component
// ============================================================================
function DataAvailabilityEnhanced({ available }) {
  const items = [
    { key: 'profile', label: 'Profile', icon: Info },
    { key: 'market', label: 'Market', icon: Activity },
    { key: 'signals', label: 'Signals', icon: Zap },
    { key: 'trust', label: 'Trust', icon: Check },
    { key: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
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
        {items.map(({ key, label, icon: Icon }) => {
          const isAvailable = available?.[key];
          return (
            <div key={key} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
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
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Key Wallets Block (Layer 0 - Research, NO ML)
// Rule-based roles: Accumulator, Distributor, Mixed, Passive
// ============================================================================
function KeyWalletsBlock({ chainId, tokenAddress, onWalletClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24h');
  
  useEffect(() => {
    async function loadKeyWallets() {
      if (!chainId || !tokenAddress) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/tokens/${chainId}/${tokenAddress}/key-wallets?window=${timeWindow}&limit=5`
        );
        const result = await response.json();
        
        if (result.ok) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Load key wallets error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadKeyWallets();
  }, [chainId, tokenAddress, timeWindow]);

  // Role badge colors
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Accumulator':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <ArrowDownRight className="w-3 h-3" /> };
      case 'Distributor':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: <ArrowUpRight className="w-3 h-3" /> };
      case 'Mixed':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <ArrowLeftRight className="w-3 h-3" /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Users className="w-3 h-3" /> };
    }
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Wallets</h3>
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const wallets = data?.wallets || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Key Wallets</h3>
          <p className="text-xs text-gray-500">Top wallets by volume share</p>
        </div>
        
        {/* Time window selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {['24h', '7d', '30d'].map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                timeWindow === w 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`key-wallets-window-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {wallets.length > 0 ? (
        <>
          {/* Wallets table */}
          <div className="space-y-2">
            {wallets.map((wallet, idx) => {
              const roleBadge = getRoleBadge(wallet.role);
              return (
                <button
                  key={wallet.address}
                  onClick={() => onWalletClick?.(wallet.address)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                  data-testid={`key-wallet-${idx}`}
                >
                  {/* Rank */}
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                    {idx + 1}
                  </div>
                  
                  {/* Address */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {wallet.shortAddress}
                      </span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${roleBadge.bg} ${roleBadge.text}`}>
                        {roleBadge.icon}
                        <span className="text-xs font-semibold">{wallet.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{wallet.txCount} txns</span>
                      <span className={wallet.netFlowPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {wallet.netFlowPercent >= 0 ? '+' : ''}{wallet.netFlowPercent.toFixed(1)}% flow
                      </span>
                    </div>
                  </div>
                  
                  {/* Volume share */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {wallet.shareOfVolume.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">of volume</div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Stats summary */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {data?.totalWallets || 0} active wallets
            </span>
            <span className="text-gray-500">
              {formatNumber(data?.totalVolume || 0)} total volume
            </span>
          </div>
        </>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">No wallet activity</p>
          <p className="text-xs text-gray-500 mt-1">No significant transfers in {timeWindow}</p>
        </div>
      )}
      
      {/* Disclaimer (Layer 0 requirement) */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 italic">
          {data?.disclaimer || 'This describes volume behavior, not intent.'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Token Signals Block
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
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Signals</h3>
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
        <h3 className="text-sm font-semibold text-gray-900">Recent Signals</h3>
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
                  Confidence: {Math.round(signal.confidence * 100)}%
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
// Main Component
// ============================================================================
export default function TokenCanonicalPage() {
  const { chainId, address } = useParams();
  const navigate = useNavigate();
  
  const [tokenInfo, setTokenInfo] = useState(null);
  const [resolvedData, setResolvedData] = useState(null);
  const [marketContext, setMarketContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const chainIdNum = parseInt(chainId);
  const chainInfo = CHAIN_INFO[chainIdNum] || { name: 'Unknown', color: 'bg-gray-500', explorer: 'https://etherscan.io' };
  const chainName = CHAIN_NAME_MAP[chainIdNum] || 'ethereum';

  useEffect(() => {
    if (chainId && address) {
      loadTokenData();
    }
  }, [chainId, address]);

  async function loadTokenData() {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Get token info from registry
      const tokenResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/tokens/by-canonical/${chainId}/${address}`
      );
      const tokenData = await tokenResponse.json();
      
      if (tokenData.ok && tokenData.status === 'found') {
        setTokenInfo(tokenData.token);
      } else {
        // Token not in registry - still try to resolve via universal resolver
        console.log('Token not in registry, trying universal resolver...');
      }
      
      // Step 2: Get full resolution data (for additional info)
      const resolveResponse = await resolverApi.resolve(address);
      if (resolveResponse?.ok && resolveResponse.data) {
        setResolvedData(resolveResponse.data);
      }
      
      // Step 3: Get market context
      const marketResponse = await marketApi.getMarketContext(address, chainName);
      if (marketResponse?.ok && marketResponse.data) {
        setMarketContext(marketResponse.data);
        
        // Save to recent searches with canonical identifiers
        saveToRecentSearches({
          chainId: chainIdNum,
          address: address.toLowerCase(),
          symbol: tokenData.token?.symbol || resolveResponse?.data?.symbol || 'Unknown',
          name: tokenData.token?.name || resolveResponse?.data?.label || 'Unknown Token',
          chain: chainName,
          price: marketResponse.data.price?.current,
          change24h: marketResponse.data.price?.change24h,
          volume24h: marketResponse.data.activity?.volume24h,
          activeWallets: marketResponse.data.activity?.activeWallets,
          signals: marketResponse.data.recentSignals?.length || 0,
          netFlow: marketResponse.data.flows?.netFlow,
          verified: tokenData.token?.verified || resolveResponse?.data?.verified || false,
          dataAvailability: {
            activity: resolveResponse?.data?.available?.activity || false,
            market: resolveResponse?.data?.available?.market || false,
            signals: resolveResponse?.data?.available?.signals || false,
            trust: resolveResponse?.data?.available?.trust || false,
            transfers: resolveResponse?.data?.available?.transfers || false,
          },
        });
      }
      
    } catch (err) {
      console.error('Failed to load token data:', err);
      setError(err.message || 'Failed to load token data');
    } finally {
      setLoading(false);
    }
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading token data...</p>
          <p className="text-sm text-gray-500 mt-1">{chainInfo.name} · {address.slice(0, 10)}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenInfo && !resolvedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-8 shadow-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Token</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/tokens"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Back to Tokens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  const price = marketContext?.price?.current;
  const change24h = marketContext?.price?.change24h;
  const symbol = tokenInfo?.symbol || resolvedData?.symbol || 'TOKEN';
  const name = tokenInfo?.name || resolvedData?.label || 'Unknown Token';
  const verified = tokenInfo?.verified || resolvedData?.verified || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto">
          <StatusBanner />
          
          {/* Token Header */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold">{symbol}</span>
                  {verified && (
                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      VERIFIED
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${chainInfo.color} text-white`}>
                    {chainInfo.name}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-3">{name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  {price ? (
                    <>
                      <span className="text-2xl font-bold text-white">${price.toLocaleString()}</span>
                      {change24h !== null && change24h !== undefined && (
                        <span className={`flex items-center gap-1 ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(change24h).toFixed(2)}% (24h)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Price data unavailable</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Chain ID: {chainId}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-700">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  data-testid="create-alert-btn"
                >
                  <Bell className="w-4 h-4" />
                  Create Alert
                </button>
                
                <TrackTokenButton
                  tokenAddress={address}
                  tokenSymbol={symbol}
                />
                
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                </button>
                
                <a 
                  href={`${chainInfo.explorer}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 text-white rounded-xl text-sm font-medium transition-colors"
                  data-testid="explorer-link"
                >
                  <ExternalLink className="w-4 h-4" />
                  Explorer
                </a>
              </div>
              
              <button
                onClick={loadTokenData}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activity Snapshot */}
          {resolvedData && (
            <div className="relative mb-4">
              <div className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded z-10">
                L1: Facts
              </div>
              <ActivitySnapshot 
                tokenAddress={address}
                marketContext={marketContext}
                resolvedData={resolvedData}
                timeWindow="24h"
              />
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* KEY WALLETS (Layer 0 - Research, Rule-based) */}
              <div className="relative">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded z-10">
                  L0: Research
                </div>
                <KeyWalletsBlock 
                  chainId={chainIdNum}
                  tokenAddress={address}
                  onWalletClick={handleWalletClick}
                />
              </div>
              
              {/* Token Activity Drivers */}
              <div className="relative">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
                  L1→L2: Structure
                </div>
                <TokenActivityDrivers 
                  tokenAddress={address}
                  chain={chainInfo.name}
                  onWalletClick={handleWalletClick}
                />
              </div>
              
              {/* Smart Money Activity */}
              <div className="relative">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
                  L2: Smart Money
                </div>
                <TokenSmartMoney 
                  tokenAddress={address}
                  smartMoneyData={marketContext?.smartMoney}
                />
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              {/* Recent Signals */}
              <TokenSignalsBlock tokenAddress={address} />
              
              {/* Token Clusters */}
              <div className="relative">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded z-10">
                  L2: Patterns
                </div>
                <TokenClusters 
                  tokenAddress={address}
                  clusters={marketContext?.clusters}
                />
              </div>
              
              {/* Resolution Status */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Resolution Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Type</span>
                    <span className="text-xs font-medium text-gray-900 capitalize">
                      {resolvedData?.type || 'token'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Chain</span>
                    <span className="text-xs font-medium text-gray-900">{chainInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Chain ID</span>
                    <span className="text-xs font-medium text-gray-900">{chainId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Status</span>
                    <span className="text-xs font-medium text-emerald-600">
                      {resolvedData?.status === 'resolved' ? 'Resolved' : 'Analysis Complete'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Data Availability */}
              <DataAvailabilityEnhanced available={resolvedData?.available} />
            </div>
          </div>

          {/* L1+L2 Disclaimer */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>L1+L2 Architecture:</strong> Facts (L1) and Patterns (L2) presented separately. 
                ML predictions available separately. Volume ≠ intent, activity ≠ signal.
              </div>
            </div>
          </div>

          {/* Create Alert Modal */}
          {showAlertModal && (
            <CreateAlertModal
              tokenAddress={address}
              tokenSymbol={symbol}
              onClose={() => setShowAlertModal(false)}
            />
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
