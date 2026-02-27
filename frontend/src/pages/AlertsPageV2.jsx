/**
 * Alerts V2 Page - System & Intelligence Notifications
 * 
 * NEW PHILOSOPHY:
 * ❌ NOT user rules, NOT market behavior config
 * ✅ System & Intelligence Notifications Layer
 * "What important events happened with system, data, ML, or market"
 * 
 * P2.1: Real-time monitoring with polling
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle2, Clock, 
  Server, Brain, TrendingUp, Shield,
  Loader2, RefreshCw, Check, Filter,
  Wallet, Coins, Users, Eye, ExternalLink,
  ArrowRightLeft, Zap
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import ContextPath from '../components/ContextPath';
import EmptyState from '../components/EmptyState';
import TelegramConnect from '../components/TelegramConnect';
import { getSystemAlerts, getAlertsSummary, acknowledgeAlert } from '../api/systemAlerts.api';
import { toast } from 'sonner';

// Severity badge styling
const SEVERITY_CONFIG = {
  CRITICAL: { 
    bg: 'bg-red-100', 
    text: 'text-red-700', 
    border: 'border-red-200',
    icon: AlertTriangle,
    dot: 'bg-red-500'
  },
  HIGH: { 
    bg: 'bg-orange-100', 
    text: 'text-orange-700', 
    border: 'border-orange-200',
    icon: AlertTriangle,
    dot: 'bg-orange-500'
  },
  MEDIUM: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700', 
    border: 'border-yellow-200',
    icon: Bell,
    dot: 'bg-yellow-500'
  },
  LOW: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    icon: Bell,
    dot: 'bg-blue-500'
  },
  INFO: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-600', 
    border: 'border-gray-200',
    icon: CheckCircle2,
    dot: 'bg-gray-400'
  },
};

// Category icons
const CATEGORY_CONFIG = {
  SYSTEM: { icon: Server, label: 'System', color: 'text-purple-600' },
  ML: { icon: Brain, label: 'Intelligence', color: 'text-blue-600' },
  MARKET: { icon: TrendingUp, label: 'Market', color: 'text-emerald-600' },
  ACTOR: { icon: Users, label: 'Actor Intelligence', color: 'text-indigo-600' },
};

// Source config
const SOURCE_CONFIG = {
  system: { label: 'System', color: 'bg-purple-100 text-purple-700' },
  ml: { label: 'ML', color: 'bg-blue-100 text-blue-700' },
  market: { label: 'Market', color: 'bg-emerald-100 text-emerald-700' },
  bridge: { label: 'Bridge', color: 'bg-orange-100 text-orange-700' },
  chain: { label: 'Chain', color: 'bg-gray-100 text-gray-700' },
  watchlist: { label: 'Watchlist', color: 'bg-amber-100 text-amber-700' },
  actor_intelligence: { label: 'Actor Intel', color: 'bg-indigo-100 text-indigo-700' },
};

// Entity type icons
const ENTITY_TYPE_CONFIG = {
  TOKEN: { icon: Coins, label: 'Token' },
  WALLET: { icon: Wallet, label: 'Wallet' },
  ACTOR: { icon: Users, label: 'Actor' },
};

// Status badge
const STATUS_CONFIG = {
  OPEN: { bg: 'bg-red-50', text: 'text-red-700', label: 'Open' },
  ACKED: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Acknowledged' },
  RESOLVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Resolved' },
};

// Format timestamp
function formatTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Format time ago
function timeAgo(date) {
  if (!date) return '-';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Header Stats Card
function StatsCard({ icon: Icon, label, value, color = 'gray', loading, highlight }) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div 
      className={`bg-white border rounded-xl p-4 relative ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'
      }`} 
      data-testid={`stats-${label.toLowerCase().replace(' ', '-')}`}
    >
      {highlight && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
      )}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          )}
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Alert Row Component
function AlertRow({ alert, onAcknowledge }) {
  const [loading, setLoading] = useState(false);
  
  const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
  const categoryConfig = CATEGORY_CONFIG[alert.category] || CATEGORY_CONFIG.SYSTEM;
  const statusConfig = STATUS_CONFIG[alert.status] || STATUS_CONFIG.OPEN;
  const sourceConfig = SOURCE_CONFIG[alert.source] || SOURCE_CONFIG.system;
  const CategoryIcon = categoryConfig.icon;
  const SeverityIcon = severityConfig.icon;

  // Watchlist entity info
  const entityRef = alert.entityRef;
  const entityConfig = entityRef?.entityType ? ENTITY_TYPE_CONFIG[entityRef.entityType] : null;
  const EntityIcon = entityConfig?.icon;
  const isWatchlist = alert.source === 'watchlist';
  const isActorIntel = alert.source === 'actor_intelligence';
  const isBridgeMigration = alert.metadata?.isBridgeMigration || alert.type?.includes('BRIDGE_MIGRATION');
  const bridgeConfidence = alert.metadata?.confidence;
  
  // Actor Intelligence metadata
  const actorConfidence = alert.metadata?.confidence;
  const actorPatternType = alert.metadata?.eventType;
  const actorAddress = alert.metadata?.actorAddress;

  const handleAck = async () => {
    setLoading(true);
    try {
      await onAcknowledge(alert.alertId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`bg-white border rounded-xl p-4 transition-all hover:shadow-sm ${
        alert.status === 'RESOLVED' ? 'opacity-60' : ''
      } ${severityConfig.border}`}
      data-testid={`alert-row-${alert.alertId}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Severity indicator */}
          <div className={`w-2 h-2 rounded-full ${severityConfig.dot}`} />
          
          {/* Category icon */}
          <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
            <CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} />
          </div>
          
          {/* Title and type */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                {alert.severity}
              </span>
              {/* Source badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceConfig.color}`}>
                {sourceConfig.label}
              </span>
              {/* Bridge Migration badge */}
              {isBridgeMigration && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  <ArrowRightLeft className="w-3 h-3" />
                  Migration
                  {bridgeConfidence && (
                    <span className="ml-1 text-purple-500">
                      {(bridgeConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              )}
              {/* Actor Intelligence Pattern badge */}
              {isActorIntel && actorPatternType && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                  <Users className="w-3 h-3" />
                  {actorPatternType.replace(/_/g, ' ')}
                  {actorConfidence && (
                    <span className="ml-1 text-indigo-500">
                      {(actorConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900">
                {alert.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {categoryConfig.label} • {alert.type?.replace(/_/g, ' ').replace('WATCHLIST ', '')}
              </span>
              {alert.chain && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                  {alert.chain}
                </span>
              )}
              {/* Entity badge for watchlist alerts */}
              {isWatchlist && entityRef && EntityIcon && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-50 rounded text-amber-700">
                  <EntityIcon className="w-3 h-3" />
                  {entityRef.label || entityRef.address?.slice(0, 8) + '...'}
                </span>
              )}
              {/* Entity badge for actor intelligence alerts */}
              {isActorIntel && actorAddress && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-indigo-50 rounded text-indigo-700">
                  <Users className="w-3 h-3" />
                  {actorAddress.slice(0, 6)}...{actorAddress.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Message */}
      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{alert.message}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(alert.createdAt)}</span>
          </div>
          {alert.telegramSent && (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span className="text-gray-400">Sent</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Telegram notification sent</p>
              </TooltipContent>
            </Tooltip>
          )}
          {/* View in Watchlist link */}
          {isWatchlist && (
            <a 
              href="/watchlist"
              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              View in Watchlist
            </a>
          )}
        </div>
        
        {/* Actions */}
        {alert.status === 'OPEN' && (
          <button
            onClick={handleAck}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-white text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            data-testid={`ack-btn-${alert.alertId}`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function AlertsPageV2() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  
  // P2.1: Real-time polling state
  const [isPolling, setIsPolling] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const pollTimeoutRef = useRef(null);
  const lastCountRef = useRef(0);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filters
      const filters = {};
      if (activeTab !== 'all') {
        if (activeTab === 'watchlist') {
          // Watchlist alerts use source filter
          filters.source = 'watchlist';
        } else if (activeTab === 'actor') {
          // Actor Intelligence alerts use source filter
          filters.source = 'actor_intelligence';
        } else {
          filters.category = activeTab.toUpperCase();
        }
      }
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      // Fetch in parallel
      const [alertsRes, summaryRes] = await Promise.all([
        getSystemAlerts(filters),
        getAlertsSummary(),
      ]);
      
      if (alertsRes?.success) {
        const newAlerts = alertsRes.alerts || [];
        
        // P2.1: Detect new alerts
        if (lastCountRef.current > 0 && newAlerts.length > lastCountRef.current) {
          const diff = newAlerts.length - lastCountRef.current;
          setNewAlertsCount(diff);
          toast.info(`${diff} new alert${diff > 1 ? 's' : ''} detected`);
        }
        lastCountRef.current = newAlerts.length;
        
        setAlerts(newAlerts);
      }
      if (summaryRes?.success) {
        setSummary(summaryRes);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  // P2.1: Polling effect - continuous polling indicator
  const [pollingEnabled, setPollingEnabled] = useState(true);
  
  useEffect(() => {
    const POLL_INTERVAL = 30000; // 30 seconds
    
    const startPolling = () => {
      if (!pollingEnabled) return;
      
      pollTimeoutRef.current = setTimeout(async () => {
        setIsPolling(true);
        try {
          const summaryRes = await getAlertsSummary();
          if (summaryRes?.success && summaryRes.open > (summary?.open || 0)) {
            const diff = summaryRes.open - (summary?.open || 0);
            setNewAlertsCount(prev => prev + diff);
          }
        } catch (err) {
          // Silent fail for polling
        } finally {
          setIsPolling(false);
          startPolling();
        }
      }, POLL_INTERVAL);
    };
    
    startPolling();
    
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [summary?.open]);

  // P2.1: Visibility change handler
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
        setNewAlertsCount(0);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle acknowledge
  const handleAcknowledge = async (alertId) => {
    try {
      const result = await acknowledgeAlert(alertId);
      if (result?.success) {
        loadData(); // Refresh
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Tabs
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'system', label: 'System' },
    { id: 'ml', label: 'ML / Intelligence' },
    { id: 'market', label: 'Market' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'actor', label: 'Actor Intelligence' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="alerts-page-v2">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* Context Path */}
          <ContextPath className="mb-4">
            <ContextPath.Item href="/market">Market</ContextPath.Item>
            <ContextPath.Item current>Alerts</ContextPath.Item>
          </ContextPath>

          {/* P2.1: New Alerts Banner */}
          {newAlertsCount > 0 && (
            <div 
              className="mb-4 flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl"
              data-testid="new-alerts-banner"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-900">
                  {newAlertsCount} new alert{newAlertsCount > 1 ? 's' : ''} detected
                </span>
              </div>
              <button
                onClick={() => {
                  loadData();
                  setNewAlertsCount(0);
                }}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                Refresh now
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
              <p className="text-sm text-gray-500 mt-1">
                Runtime & intelligence notifications
                {pollingEnabled && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                    <span className={`w-1.5 h-1.5 bg-green-500 rounded-full ${isPolling ? 'animate-pulse' : ''}`}></span>
                    Live
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                loadData();
                setNewAlertsCount(0);
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isPolling ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatsCard 
              icon={Bell} 
              label="Total Alerts" 
              value={summary?.total || 0}
              color="gray"
              loading={loading && !summary}
            />
            <StatsCard 
              icon={AlertTriangle} 
              label="Active" 
              value={summary?.active || 0}
              color="yellow"
              loading={loading && !summary}
              highlight={newAlertsCount > 0}
            />
            <StatsCard 
              icon={Shield} 
              label="Critical" 
              value={summary?.critical || 0}
              color="red"
              loading={loading && !summary}
            />
            <StatsCard 
              icon={CheckCircle2} 
              label="Resolved (24h)" 
              value={summary?.resolved24h || 0}
              color="green"
              loading={loading && !summary}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="ACKED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex gap-6">
            {/* Main Content - Alerts List */}
            <div className="flex-1 min-w-0">
              {/* Error */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Loading */}
              {loading && alerts.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* Empty State */}
              {!loading && alerts.length === 0 && (
                <EmptyState 
                  icon={CheckCircle2}
                  title="No system alerts detected"
                  description="The system is operating within normal parameters."
                />
              )}

              {/* Alerts List */}
              {!loading && alerts.length > 0 && (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <AlertRow
                      key={alert.alertId}
                      alert={alert}
                      onAcknowledge={handleAcknowledge}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Telegram Connect */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-6">
                <TelegramConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
