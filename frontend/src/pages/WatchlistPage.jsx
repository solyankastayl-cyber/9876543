/**
 * WatchlistPage V2 - Active Monitoring Layer
 * 
 * Features:
 * - Track tokens, wallets, actors
 * - View events (accumulation, distribution, bridges, transfers)
 * - Multi-chain support
 * - Events tab with filtering
 * - P2.1: Real-time monitoring with polling
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Trash2, Bell, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Activity, Clock, 
  ChevronRight, Wallet, Users, Coins, X, 
  Loader2, RefreshCw, Search, ExternalLink,
  ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Zap
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import * as watchlistApi from '../api/watchlist.api';
import { resolverApi } from '../api';
import ContextPath from '../components/ContextPath';
import ChainBadge, { BridgeFlowBadge } from '../components/ChainBadge';
import { ChainPath } from '../components/CrossChainFlow';
import ChainFilterSelect from '../components/ChainFilterSelect';
import ActorProfileDrawer from '../components/ActorProfileDrawer';
import useRealtimeWatchlist from '../hooks/useRealtimeWatchlist';
import { useChainFilter, filterEventsByChains } from '../hooks/useChainFilter';

// Chain configuration
const CHAINS = [
  { value: 'ETH', label: 'Ethereum', color: 'bg-blue-100 text-blue-700' },
  { value: 'ARB', label: 'Arbitrum', color: 'bg-orange-100 text-orange-700' },
  { value: 'BASE', label: 'Base', color: 'bg-blue-100 text-blue-600' },
  { value: 'OP', label: 'Optimism', color: 'bg-red-100 text-red-700' },
  { value: 'POLYGON', label: 'Polygon', color: 'bg-purple-100 text-purple-700' },
  { value: 'BNB', label: 'BNB Chain', color: 'bg-yellow-100 text-yellow-700' },
];

// Type icons and labels
const TYPE_CONFIG = {
  token: { icon: Coins, label: 'Token', color: 'bg-purple-100 text-purple-700' },
  wallet: { icon: Wallet, label: 'Wallet', color: 'bg-blue-100 text-blue-700' },
  actor: { icon: Users, label: 'Actor', color: 'bg-amber-100 text-amber-700' },
};

// Event type configuration
const EVENT_TYPE_CONFIG = {
  ACCUMULATION: { icon: TrendingUp, label: 'Accumulation', color: 'text-emerald-600 bg-emerald-50' },
  DISTRIBUTION: { icon: TrendingDown, label: 'Distribution', color: 'text-red-600 bg-red-50' },
  LARGE_TRANSFER: { icon: ArrowRightLeft, label: 'Large Transfer', color: 'text-blue-600 bg-blue-50' },
  BRIDGE_IN: { icon: ArrowDownLeft, label: 'Bridge In', color: 'text-purple-600 bg-purple-50' },
  BRIDGE_OUT: { icon: ArrowUpRight, label: 'Bridge Out', color: 'text-orange-600 bg-orange-50' },
  ACTOR_ACTIVITY: { icon: Activity, label: 'Actor Activity', color: 'text-amber-600 bg-amber-50' },
};

// Severity configuration
const SEVERITY_CONFIG = {
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

// Format address for display
function formatAddress(address) {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Time ago helper
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
  return CHAINS.find(c => c.value === chain) || CHAINS[0];
}

// ============================================================================
// TRACK ACTIVITY MODAL (V2)
// ============================================================================
const TrackActivityModal = ({ isOpen, onClose, onAdd }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('token');
  const [chain, setChain] = useState('ETH');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedData, setResolvedData] = useState(null);
  const [error, setError] = useState(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setType('token');
      setChain('ETH');
      setAddress('');
      setLabel('');
      setResolvedData(null);
      setError(null);
    }
  }, [isOpen]);

  // Resolve address on input
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (address.length >= 3) {
        setResolving(true);
        setError(null);
        try {
          const response = await resolverApi.resolve(address);
          if (response?.data) {
            setResolvedData(response.data);
          }
        } catch (e) {
          // Silent fail for resolve
        } finally {
          setResolving(false);
        }
      } else {
        setResolvedData(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [address]);

  const handleSubmit = async () => {
    if (!address) return;
    
    setResolving(true);
    setError(null);
    
    try {
      const targetAddress = resolvedData?.normalizedId || address;
      
      const item = {
        type,
        target: {
          address: targetAddress,
          chain,
          symbol: resolvedData?.symbol || resolvedData?.label,
          name: label || resolvedData?.name,
        },
        note: label || undefined,
      };
      
      const response = await watchlistApi.addToWatchlist(item);
      
      if (response?.ok) {
        onAdd(response.data);
        onClose();
        toast.success('Added to watchlist');
      } else {
        setError(response?.error || 'Failed to add');
      }
    } catch (e) {
      console.error('Failed to add:', e);
      setError('Failed to add to watchlist');
    } finally {
      setResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Track Activity</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Monitor tokens, wallets, or actors across chains
          </p>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Step 1: Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              1. Select Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all ${
                      type === key 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`type-${key}-btn`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Chain Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Select Chain
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              data-testid="chain-select"
            >
              {CHAINS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Address Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              3. {type === 'token' ? 'Token Address' : type === 'actor' ? 'Actor ID' : 'Wallet Address'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={type === 'token' ? '0x... or USDT' : '0x... or ENS'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 pr-10"
                data-testid="watchlist-address-input"
              />
              {resolving && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Resolved Preview */}
            {resolvedData && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {resolvedData.label || resolvedData.symbol || formatAddress(resolvedData.normalizedId)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Label (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              4. Label <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., ARB whale wallet, Bridge LP"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              data-testid="watchlist-label-input"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!address || resolving}
            className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            data-testid="add-watchlist-btn"
          >
            {resolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Watchlist
              </>
            )}
          </button>
          
          {/* Supported chains note */}
          <p className="text-xs text-center text-gray-400">
            Supported: Ethereum, Arbitrum, Base, Optimism, Polygon, BNB
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// WATCHLIST ITEM ROW
// ============================================================================
const WatchlistItemRow = ({ item, onRemove }) => {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.token;
  const Icon = config.icon;
  const chainConfig = getChainConfig(item.target?.chain);
  
  const displayName = item.target?.symbol || item.target?.name || formatAddress(item.target?.address);
  const hasEvents = item.eventCount > 0;

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all ${
        hasEvents ? 'border-l-4 border-l-amber-400' : ''
      }`}
      data-testid={`watchlist-item-${item._id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Type Icon */}
          <div className={`p-2.5 rounded-xl ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {/* Type badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              {/* Chain badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${chainConfig.color}`}>
                {chainConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-mono">
                {formatAddress(item.target?.address)}
              </span>
              {item.lastEventAt && (
                <span className="text-xs text-gray-400">
                  • Last activity {timeAgo(item.lastEventAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Event indicator */}
          {hasEvents && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Bell className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{item.eventCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{item.eventCount} event{item.eventCount > 1 ? 's' : ''} in 24h</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.type === 'token' 
                  ? `/tokens/${item.target?.address}` 
                  : `/address/${item.target?.address}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">View details</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Remove */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onRemove(item)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Remove</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EVENT ROW
// ============================================================================
const EventRow = ({ event, onAcknowledge }) => {
  const eventConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.LARGE_TRANSFER;
  const severityConfig = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.LOW;
  const chainConfig = getChainConfig(event.chain);
  const Icon = eventConfig.icon;

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 ${
        event.acknowledged ? 'opacity-60' : ''
      }`}
      data-testid={`event-${event._id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Severity dot */}
          <div className={`w-2 h-2 mt-2 rounded-full ${severityConfig.dot}`} />
          
          {/* Event icon */}
          <div className={`p-2 rounded-lg ${eventConfig.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          
          {/* Content */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                {event.severity}
              </span>
              <span className="font-semibold text-gray-900">{event.title}</span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            
            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              {/* Item reference */}
              {event.item && (
                <span className="text-xs text-gray-500">
                  {event.item.target?.symbol || event.item.target?.name || formatAddress(event.item.target?.address)}
                </span>
              )}
              
              {/* Chain badge - P2.3.3: Multi-chain support */}
              {event.chain && !event.chainFrom && (
                <ChainBadge chain={event.chain} size="xs" />
              )}
              
              {/* Bridge direction - P2.3.3 BLOCK 3: Enhanced flow with confidence */}
              {event.chainFrom && event.chainTo && (
                <ChainPath 
                  chains={[event.chainFrom, event.chainTo]} 
                  confidence={event.confidence}
                />
              )}
              
              {/* Timestamp */}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(event.timestamp)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        {!event.acknowledged && (
          <button
            onClick={() => onAcknowledge(event._id)}
            className="px-3 py-1.5 text-xs font-medium bg-white text-white rounded-lg hover:bg-gray-100 transition-colors"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function WatchlistPage() {
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [actors, setActors] = useState([]); // P1.2: Actor intelligence data
  const [summary, setSummary] = useState({ total: 0, tokens: 0, wallets: 0, actors: 0, withAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, token, wallet, actors, events
  const [searchQuery, setSearchQuery] = useState('');
  const [eventWindow, setEventWindow] = useState('7d');
  
  // P1.2: Actor Profile Drawer state
  const [selectedActorId, setSelectedActorId] = useState(null);
  const [showActorDrawer, setShowActorDrawer] = useState(false);
  
  // P2.3.3 BLOCK 2: Chain filter
  const chainFilter = useChainFilter();
  
  // P2.1: Real-time monitoring
  const {
    summary: realtimeSummary,
    isPolling,
    hasNewActivity,
    totalNew,
    refresh: refreshRealtime,
  } = useRealtimeWatchlist({
    enabled: true,
    onNewActivity: (newSummary) => {
      // Show toast when new activity detected
      if (newSummary.newEvents > 0 || newSummary.newAlerts > 0) {
        toast.info('New activity detected', {
          description: `${newSummary.newEvents} events, ${newSummary.newAlerts} alerts`,
          duration: 4000,
        });
      }
    },
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load summary
      const summaryRes = await watchlistApi.getWatchlistSummary();
      if (summaryRes?.ok || summaryRes?.success) {
        setSummary({
          total: summaryRes.total || 0,
          tokens: summaryRes.tokens || 0,
          wallets: summaryRes.wallets || 0,
          actors: summaryRes.actors || 0,
          withAlerts: summaryRes.withAlerts || 0,
        });
      }
      
      // Load items or events based on tab
      if (activeTab === 'events') {
        const eventsRes = await watchlistApi.getWatchlistEvents({ window: eventWindow });
        if (eventsRes?.ok || eventsRes?.success) {
          setEvents(eventsRes.events || []);
        }
      } else if (activeTab === 'actors') {
        // P1.2: Load actors with intelligence data
        const actorsRes = await watchlistApi.getWatchlistActors();
        if (actorsRes?.ok || actorsRes?.success) {
          setActors(actorsRes.actors || []);
        }
      } else {
        const typeFilter = activeTab === 'all' ? undefined : activeTab;
        const itemsRes = await watchlistApi.getWatchlist(typeFilter);
        if (itemsRes?.ok) {
          setItems(itemsRes.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, eventWindow]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add item
  const handleAddItem = (newItem) => {
    setItems(prev => [{ ...newItem, eventCount: 0 }, ...prev]);
    setSummary(prev => ({
      ...prev,
      total: prev.total + 1,
      [newItem.type + 's']: (prev[newItem.type + 's'] || 0) + 1,
    }));
  };

  // Remove item
  const handleRemoveItem = async (item) => {
    if (!confirm(`Remove ${item.target?.symbol || formatAddress(item.target?.address)} from watchlist?`)) {
      return;
    }
    
    try {
      const response = await watchlistApi.removeFromWatchlist(item._id);
      if (response?.ok) {
        setItems(prev => prev.filter(i => i._id !== item._id));
        setSummary(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          [item.type + 's']: Math.max(0, (prev[item.type + 's'] || 0) - 1),
        }));
        toast.success('Removed from watchlist');
      }
    } catch (err) {
      console.error('Failed to remove:', err);
      toast.error('Failed to remove');
    }
  };

  // Acknowledge event
  const handleAcknowledgeEvent = async (eventId) => {
    try {
      const response = await watchlistApi.acknowledgeEvent(eventId);
      if (response?.ok || response?.success) {
        setEvents(prev => prev.map(e => 
          e._id === eventId ? { ...e, acknowledged: true } : e
        ));
        toast.success('Event acknowledged');
      }
    } catch (err) {
      console.error('Failed to acknowledge:', err);
      toast.error('Failed to acknowledge');
    }
  };

  // Filter items by search
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.target?.address?.toLowerCase().includes(query) ||
      item.target?.symbol?.toLowerCase().includes(query) ||
      item.target?.name?.toLowerCase().includes(query) ||
      item.note?.toLowerCase().includes(query)
    );
  });
  
  // P2.3.3 BLOCK 2: Filter events by selected chains
  const filteredEvents = useMemo(() => {
    return filterEventsByChains(events, chainFilter.selectedChains);
  }, [events, chainFilter.selectedChains]);

  // Tabs - P1.2: Actors tab uses intelligence data
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'token', label: 'Tokens' },
    { id: 'wallet', label: 'Wallets' },
    { id: 'actors', label: 'Actors' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="watchlist-page">
        <main className="max-w-[1200px] mx-auto px-4 py-6">
          {/* Context Path */}
          <ContextPath className="mb-4">
            <ContextPath.Item href="/market">Market</ContextPath.Item>
            <ContextPath.Item current>Watchlist</ContextPath.Item>
          </ContextPath>
          
          {/* P2.1: New Activity Banner */}
          {hasNewActivity && (
            <div 
              className="mb-4 flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl animate-pulse"
              data-testid="new-activity-banner"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-indigo-900">
                    New activity detected
                  </span>
                  <span className="text-xs text-indigo-600 ml-2">
                    {realtimeSummary.newEvents > 0 && `${realtimeSummary.newEvents} events`}
                    {realtimeSummary.newEvents > 0 && realtimeSummary.newAlerts > 0 && ', '}
                    {realtimeSummary.newAlerts > 0 && `${realtimeSummary.newAlerts} alerts`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  loadData();
                  refreshRealtime();
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Refresh now
              </button>
            </div>
          )}
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
              <p className="text-sm text-gray-500 mt-1">
                Active monitoring layer
                {isPolling && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* P2.1: New activity badge */}
              {totalNew > 0 && (
                <div className="relative">
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {totalNew > 9 ? '9+' : totalNew}
                  </span>
                </div>
              )}
              
              <button
                onClick={() => {
                  loadData();
                  refreshRealtime();
                }}
                disabled={loading}
                className="p-2.5 hover:bg-white border border-gray-200 rounded-xl transition-colors relative"
                data-testid="refresh-watchlist"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading || isPolling ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-white font-semibold rounded-xl transition-colors"
                data-testid="track-activity-btn"
              >
                <Plus className="w-4 h-4" />
                Track Activity
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className={`bg-white border border-gray-200 rounded-xl p-4 ${summary.total === 0 ? 'opacity-50' : ''}`}>
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-xs text-gray-500">Total Items</div>
            </div>
            <div className={`bg-white border border-gray-200 rounded-xl p-4 ${summary.tokens === 0 ? 'opacity-50' : ''}`}>
              <div className="text-2xl font-bold text-purple-600">{summary.tokens}</div>
              <div className="text-xs text-gray-500">Tokens</div>
            </div>
            <div className={`bg-white border border-gray-200 rounded-xl p-4 ${summary.wallets === 0 ? 'opacity-50' : ''}`}>
              <div className="text-2xl font-bold text-blue-600">{summary.wallets}</div>
              <div className="text-xs text-gray-500">Wallets</div>
            </div>
            <div className={`bg-white border border-gray-200 rounded-xl p-4 ${summary.actors === 0 ? 'opacity-50' : ''}`}>
              <div className="text-2xl font-bold text-amber-600">{summary.actors}</div>
              <div className="text-xs text-gray-500">Actors</div>
            </div>
            <div className={`bg-white border border-gray-200 rounded-xl p-4 relative ${summary.withAlerts === 0 ? 'opacity-50' : ''}`}>
              <div className="text-2xl font-bold text-emerald-600">{summary.withAlerts}</div>
              <div className="text-xs text-gray-500">With Alerts</div>
              {realtimeSummary.newAlerts > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
                    activeTab === tab.id
                      ? 'bg-white text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  {/* P2.1: New indicator for Events tab */}
                  {tab.id === 'events' && realtimeSummary.newEvents > 0 && activeTab !== 'events' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Search (for items) / Window filter (for events) */}
            {activeTab !== 'events' ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search watchlist..."
                  className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  data-testid="watchlist-search"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* P2.3.3 BLOCK 2: Chain filter */}
                <ChainFilterSelect {...chainFilter} />
                
                <select
                  value={eventWindow}
                  onChange={(e) => setEventWindow(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  data-testid="event-window-select"
                >
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button onClick={loadData} className="mt-4 text-purple-600 hover:underline">
                Try again
              </button>
            </div>
          ) : activeTab === 'events' ? (
            /* Events Tab */
            filteredEvents.length === 0 ? (
              <EmptyState
                title={chainFilter.isFilterActive ? "No events match filter" : "No events yet"}
                description={chainFilter.isFilterActive 
                  ? "Try adjusting your chain filter to see more events."
                  : "Events will appear here when significant activity is detected on your watched items."
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredEvents.map(event => (
                  <EventRow 
                    key={event._id} 
                    event={event} 
                    onAcknowledge={handleAcknowledgeEvent}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'actors' ? (
            /* P1.2: Actors Tab - Intelligence View */
            actors.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No actors in watchlist
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Track cross-chain liquidity actors to monitor their bridge patterns, migration routes, and behavioral anomalies.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-white font-semibold rounded-lg transition-colors"
                  data-testid="empty-track-actor-btn"
                >
                  <Plus className="w-4 h-4" />
                  Track Actor
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid="actors-table">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <div className="col-span-3">Actor</div>
                  <div className="col-span-2">Confidence</div>
                  <div className="col-span-2">Patterns</div>
                  <div className="col-span-2">Chains</div>
                  <div className="col-span-1 text-center">Bridges</div>
                  <div className="col-span-1 text-center">Alerts</div>
                  <div className="col-span-1 text-right">Activity</div>
                </div>
                {/* Table Rows */}
                {actors.map(actor => (
                  <div
                    key={actor.watchlistId || actor.actorId}
                    onClick={() => {
                      setSelectedActorId(actor.address || actor.actorId);
                      setShowActorDrawer(true);
                    }}
                    className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                    data-testid={`actor-row-${actor.actorId}`}
                  >
                    {/* Actor */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 truncate">
                          {actor.label || formatAddress(actor.address)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {formatAddress(actor.address)}
                        </div>
                      </div>
                    </div>
                    {/* Confidence */}
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        actor.confidenceLevel === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                        actor.confidenceLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {actor.confidenceLevel} ({Math.round((actor.confidence || 0) * 100)}%)
                      </span>
                    </div>
                    {/* Patterns */}
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {actor.patterns?.slice(0, 2).map((pattern, idx) => (
                        <span 
                          key={idx}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            pattern.type === 'REPEAT_BRIDGE_PATTERN' ? 'bg-purple-100 text-purple-700' :
                            pattern.type === 'ROUTE_DOMINANCE' ? 'bg-indigo-100 text-indigo-700' :
                            pattern.type === 'STRATEGIC_TIMING' ? 'bg-rose-100 text-rose-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pattern.type === 'REPEAT_BRIDGE_PATTERN' ? 'REPEAT' :
                           pattern.type === 'ROUTE_DOMINANCE' ? 'DOMINANT' :
                           pattern.type === 'STRATEGIC_TIMING' ? 'TIMING' :
                           pattern.type === 'LIQUIDITY_ESCALATION' ? 'ESCALATION' :
                           pattern.type.slice(0, 6)}
                        </span>
                      ))}
                      {actor.patterns?.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          +{actor.patterns.length - 2}
                        </span>
                      )}
                    </div>
                    {/* Chains */}
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {actor.chains?.map((chain, idx) => (
                        <span 
                          key={idx}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            chain === 'ETH' ? 'bg-blue-100 text-blue-700' :
                            chain === 'ARB' ? 'bg-orange-100 text-orange-700' :
                            chain === 'OP' ? 'bg-red-100 text-red-700' :
                            chain === 'BASE' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {chain}
                        </span>
                      ))}
                    </div>
                    {/* Bridges */}
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {actor.bridgeCount7d || 0}
                      </span>
                      <span className="text-xs text-gray-400 ml-0.5">/ 7d</span>
                    </div>
                    {/* Alerts */}
                    <div className="col-span-1 text-center">
                      {actor.openAlerts > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          <Bell className="w-3 h-3" />
                          {actor.openAlerts}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    {/* Last Activity */}
                    <div className="col-span-1 text-right">
                      <span className="text-xs text-gray-500">
                        {actor.lastActivityAt ? timeAgo(actor.lastActivityAt) : '—'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-700 inline-block ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Items Tab */
            filteredItems.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No matches found" : "Your watchlist is empty"}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Track tokens, wallets or actors across multiple chains and get alerts on significant activity, bridges and anomalies."
                  }
                </p>
                {!searchQuery && (
                  <>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-white font-semibold rounded-lg transition-colors"
                      data-testid="empty-track-btn"
                    >
                      <Plus className="w-4 h-4" />
                      Track Activity
                    </button>
                    <p className="text-xs text-gray-400 mt-4">
                      Supported chains: Ethereum, Arbitrum, Base, Optimism, Polygon, BNB
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <WatchlistItemRow
                    key={item._id}
                    item={item}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )
          )}
        </main>

        {/* Track Activity Modal */}
        <TrackActivityModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
        
        {/* P1.2: Actor Profile Drawer */}
        <ActorProfileDrawer
          actorIdOrAddress={selectedActorId}
          isOpen={showActorDrawer}
          onClose={() => {
            setShowActorDrawer(false);
            setSelectedActorId(null);
          }}
          onRemove={async (watchlistId) => {
            try {
              const response = await watchlistApi.removeFromWatchlist(watchlistId);
              if (response?.ok) {
                setActors(prev => prev.filter(a => a.watchlistId !== watchlistId));
                setSummary(prev => ({
                  ...prev,
                  total: Math.max(0, prev.total - 1),
                  actors: Math.max(0, prev.actors - 1),
                }));
                toast.success('Removed from watchlist');
              }
            } catch (err) {
              toast.error('Failed to remove');
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
