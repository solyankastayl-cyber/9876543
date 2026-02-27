/**
 * Actor Profile Drawer (P1.2)
 * 
 * Read-only drawer showing:
 * - Actor summary (confidence, patterns, chains)
 * - Cross-chain migration routes
 * - Recent events timeline
 * - Related alerts
 * 
 * Observation-only mode - no management controls.
 */
import { useState, useEffect } from 'react';
import { 
  X, Users, AlertTriangle, Activity, ArrowRight, 
  ExternalLink, Clock, TrendingUp, Shield, Loader2,
  ChevronRight, Bell, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import * as watchlistApi from '../api/watchlist.api';
import { useWalletCluster } from '../hooks/useActorClusters';
import ChainBadge from './ChainBadge';
import ClusterBadge from './ClusterBadge';
import { CrossChainJourney } from './CrossChainFlow';


// Chain colors
const CHAIN_CONFIG = {
  ETH: { label: 'Ethereum', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
  ARB: { label: 'Arbitrum', color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' },
  BASE: { label: 'Base', color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-200' },
  OP: { label: 'Optimism', color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
  POLYGON: { label: 'Polygon', color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
  BNB: { label: 'BNB', color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-yellow-300' },
};

// Pattern display config
const PATTERN_CONFIG = {
  REPEAT_BRIDGE_PATTERN: { 
    label: 'Repeat Bridge', 
    color: 'bg-purple-100 text-purple-700',
    description: 'Repeated migrations on same route'
  },
  ROUTE_DOMINANCE: { 
    label: 'Route Dominance', 
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Concentration on specific route'
  },
  LIQUIDITY_ESCALATION: { 
    label: 'Escalation', 
    color: 'bg-amber-100 text-amber-700',
    description: 'Increasing migration sizes'
  },
  MULTI_CHAIN_PRESENCE: { 
    label: 'Multi-Chain', 
    color: 'bg-teal-100 text-teal-700',
    description: 'Active across multiple chains'
  },
  STRATEGIC_TIMING: { 
    label: 'Strategic Timing', 
    color: 'bg-rose-100 text-rose-700',
    description: 'Activity near market events'
  },
};

// Confidence level badge
const CONFIDENCE_CONFIG = {
  HIGH: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'High Confidence' },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Medium Confidence' },
  LOW: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Low Confidence' },
  IGNORED: { color: 'bg-gray-50 text-gray-400 border-gray-100', label: 'Ignored' },
};

// Severity colors
const SEVERITY_CONFIG = {
  HIGH: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  LOW: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
};

// Format address
function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format USD
function formatUsd(amount) {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

// Time ago
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Get chain config
function getChainConfig(chain) {
  return CHAIN_CONFIG[chain] || CHAIN_CONFIG.ETH;
}

// =============================================================================
// ACTOR PROFILE DRAWER
// =============================================================================
export default function ActorProfileDrawer({ 
  actorIdOrAddress, 
  isOpen, 
  onClose,
  onRemove,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  
  // P2.2: Load cluster info for this wallet
  const { cluster: walletCluster } = useWalletCluster(
    actorIdOrAddress, 
    profile?.chain || 'ETH'
  );

  // Load profile
  useEffect(() => {
    if (!isOpen || !actorIdOrAddress) return;
    
    let cancelled = false;
    
    async function loadProfile() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await watchlistApi.getActorProfile(actorIdOrAddress);
        
        if (cancelled) return;
        
        if (response?.ok) {
          setProfile(response);
        } else {
          setError(response?.error || 'Failed to load profile');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    loadProfile();
    
    return () => { cancelled = true; };
  }, [isOpen, actorIdOrAddress]);

  // Handle remove from watchlist
  const handleRemove = () => {
    if (!profile?.watchlistId) {
      toast.error('Actor is not in your watchlist');
      return;
    }
    
    if (confirm('Remove this actor from your watchlist?')) {
      onRemove?.(profile.watchlistId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const actor = profile?.actor;
  const summary = profile?.summary;
  const confidenceConfig = CONFIDENCE_CONFIG[actor?.confidenceLevel] || CONFIDENCE_CONFIG.LOW;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        data-testid="actor-drawer-backdrop"
      />
      
      {/* Drawer */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
        data-testid="actor-profile-drawer"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {actor?.label || formatAddress(actor?.address)}
                </h2>
                <p className="text-sm text-gray-500">Cross-chain liquidity actor</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              data-testid="actor-drawer-close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Confidence badge & Cluster badge */}
          {actor && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${confidenceConfig.color}`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {confidenceConfig.label} ({Math.round((actor.confidence || 0) * 100)}%)
              </span>
              {walletCluster && (
                <ClusterBadge 
                  clusterId={walletCluster.clusterId}
                  walletCount={walletCluster.wallets?.length || 0}
                  confidence={walletCluster.confidenceScore}
                />
              )}
              <span className="text-xs text-gray-400 font-mono">
                {formatAddress(actor.address)}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : profile ? (
            <div className="p-4 space-y-6">
              {/* Section 1: Cross-chain Summary */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Cross-Chain Activity
                </h3>
                
                {/* P2.3.3 BLOCK 3: Cross-Chain Journey */}
                {summary?.dominantRoutes?.length > 0 || summary?.chains?.length > 0 ? (
                  <CrossChainJourney 
                    routes={summary?.dominantRoutes || []}
                    chains={summary?.chains || []}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 text-center">No cross-chain activity detected</p>
                  </div>
                )}
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {summary?.totalMigrations || 0}
                    </div>
                    <div className="text-xs text-gray-500">Migrations</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatUsd(summary?.totalVolumeUsd)}
                    </div>
                    <div className="text-xs text-gray-500">Volume</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {summary?.chains?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Chains</div>
                  </div>
                </div>
              </section>
              
              {/* P2.2: Section - Cluster Information */}
              {walletCluster && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Cluster Information
                  </h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    {/* Cluster Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {walletCluster.name || 'Actor Cluster'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {walletCluster.clusterId.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(walletCluster.confidenceScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </div>
                    </div>
                    
                    {/* Cluster Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <div className="text-base font-semibold text-gray-900">
                          {walletCluster.wallets?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Wallets</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <div className="text-base font-semibold text-gray-900">
                          {walletCluster.metrics?.chains?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Chains</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <div className="text-base font-semibold text-gray-900">
                          {walletCluster.metrics?.bridgeCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">Bridges</div>
                      </div>
                    </div>
                    
                    {/* Heuristics */}
                    {walletCluster.heuristics && walletCluster.heuristics.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 mb-2">Clustering Heuristics:</div>
                        {walletCluster.heuristics.map((h, idx) => {
                          const scorePercent = Math.round(h.score * 100);
                          const contribution = Math.round(h.weight * h.score * 100);
                          
                          let heuristicLabel = h.type;
                          if (h.type === 'funding') heuristicLabel = 'Shared Funding';
                          if (h.type === 'bridge_route') heuristicLabel = 'Bridge Routes';
                          if (h.type === 'time_correlation') heuristicLabel = 'Time Sync';
                          if (h.type === 'counterparty') heuristicLabel = 'Counterparties';
                          
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{heuristicLabel}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500"
                                    style={{ width: `${scorePercent}%` }}
                                  />
                                </div>
                                <span className="text-gray-600 font-medium w-12 text-right">
                                  +{contribution}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Wallet List */}
                    {walletCluster.wallets && walletCluster.wallets.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          Clustered Wallets ({walletCluster.wallets.length}):
                        </div>
                        <div className="space-y-1">
                          {walletCluster.wallets.slice(0, 5).map((wallet, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {wallet.role === 'primary' && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                    Primary
                                  </span>
                                )}
                                <span className="font-mono text-gray-600">
                                  {formatAddress(wallet.address)}
                                </span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                getChainConfig(wallet.chain).color
                              }`}>
                                {wallet.chain}
                              </span>
                            </div>
                          ))}
                          {walletCluster.wallets.length > 5 && (
                            <div className="text-xs text-gray-500 text-center pt-2">
                              +{walletCluster.wallets.length - 5} more wallets
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              
              {/* Section 2: Detected Patterns */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Detected Patterns
                </h3>
                {summary?.patterns?.length > 0 ? (
                  <div className="space-y-2">
                    {summary.patterns.map((pattern, idx) => {
                      const config = PATTERN_CONFIG[pattern.type] || {
                        label: pattern.type,
                        color: 'bg-gray-100 text-gray-700',
                        description: '',
                      };
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">{config.description}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {Math.round(pattern.confidence * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    No patterns detected
                  </div>
                )}
              </section>
              
              {/* Section 3: Recent Events */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Events ({profile.recentEvents?.length || 0})
                </h3>
                {profile.recentEvents?.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {profile.recentEvents.slice(0, 10).map((event, idx) => {
                      const severityConfig = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.LOW;
                      const patternConfig = PATTERN_CONFIG[event.type] || {};
                      return (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg ${severityConfig.bg} border border-gray-100`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 mt-1.5 rounded-full ${severityConfig.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${patternConfig.color || 'bg-gray-100 text-gray-700'}`}>
                                  {patternConfig.label || event.type}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {timeAgo(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {event.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    No events recorded
                  </div>
                )}
              </section>
              
              {/* Section 4: Related Alerts */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Related Alerts ({profile.relatedAlerts?.length || 0})
                  </h3>
                  {profile.relatedAlerts?.length > 0 && (
                    <a 
                      href="/alerts"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      View All <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {profile.relatedAlerts?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {profile.relatedAlerts.slice(0, 5).map((alert, idx) => {
                      const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.LOW;
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${severityConfig.dot}`} />
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">
                              {alert.title?.replace(/[\ud800-\udfff]/g, '')}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            alert.status === 'OPEN' 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    No alerts
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        {profile?.watchlistId && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleRemove}
              className="w-full py-2.5 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              data-testid="actor-remove-btn"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Watchlist
            </button>
          </div>
        )}
      </div>
    </>
  );
}
