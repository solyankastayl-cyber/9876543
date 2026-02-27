/**
 * WalletsPage - REAL MODE (Phase 16 + P2.3 WebSocket Live Updates)
 * 
 * ARCHITECTURE:
 * - Input address → resolver → real data OR indexing state
 * - NO mock metrics when indexing
 * - Reference wallets as suggestions only (no fake data)
 * - Live progress updates via WebSocket (P2.3) with polling fallback
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, Search, ArrowUpRight, ArrowDownLeft, Star, Bell, Activity, Shield,
  Info, X, ChevronUp, ChevronDown, Check, AlertTriangle, Zap,
  TrendingUp, TrendingDown, Loader2, RefreshCw, Copy, Wifi, WifiOff,
  Users, Clock
} from 'lucide-react';
import SearchInput from '../components/shared/SearchInput';
import StatusBanner from '../components/StatusBanner';
import EmptyState from '../components/EmptyState';
import DataAvailability, { ResolutionInfo, StatusBadge } from '../components/DataAvailability';
import BehaviorFingerprint from '../components/BehaviorFingerprint';
import ReputationCard from '../components/ReputationCard';
import WalletProfileCard from '../components/WalletProfileCard';
import WalletActivitySnapshot from '../components/WalletActivitySnapshot';
import { IndexingState } from '../components/IndexingState';
import { useBootstrapProgress, formatStepName } from '../hooks/useBootstrapProgress';
import { useWebSocket } from '../hooks/useWebSocket';

// B2-B4 Components
import RelatedAddresses from '../components/RelatedAddresses';
import SmartMoneyProfile from '../components/SmartMoneyProfile';
import WalletSignalsBlock from '../components/WalletSignalsBlock';

// Wallet Tracking & Alerts
import TrackWalletButton from '../components/TrackWalletButton';
import CreateWalletAlertModal from '../components/CreateWalletAlertModal';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, walletsApi } from '../api';
import { getWalletSummaryV2, getWalletTimelineV2, getWalletCounterpartiesV2 } from '../api/v2.api';

// Network colors for multichain view
const NETWORK_COLORS = {
  ethereum: '#627EEA',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  base: '#0052FF',
  polygon: '#8247E5',
  bnb: '#F3BA2F',
  zksync: '#8C8DFC',
  scroll: '#FFEEDA',
};

// Reference wallets for quick selection
// IMPORTANT: Only wallets with VERIFIED public sources
// Sources: ENS (forward+reverse verified), Public disclosures, Official announcements
const REFERENCE_WALLETS = [
  // ENS-verified addresses (forward resolution confirmed)
  { 
    label: 'vitalik.eth', 
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 
    type: 'Public', 
    source: 'ENS',
    verified: true,
    labelType: 'identity'
  },
  // Known exchange/protocol addresses (publicly disclosed)
  { 
    label: 'Wintermute', 
    address: '0x4f3a120E72C76c22ae802D129F599BFDbc31cb81', 
    type: 'Market Maker', 
    source: 'Public Disclosure',
    verified: true,
    labelType: 'identity'
  },
  // Behavioral labels (no personal attribution)
  { 
    label: 'High-volume wallet', 
    address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296', 
    type: 'Whale-like', 
    source: 'On-chain patterns',
    verified: false,
    labelType: 'behavioral'
  },
  { 
    label: 'High-activity wallet', 
    address: '0x9Bf4001d307dFd62B26A2F1307ee0C0307632d59', 
    type: 'Trader-like', 
    source: 'On-chain patterns',
    verified: false,
    labelType: 'behavioral'
  },
  { 
    label: 'Fund-like wallet', 
    address: '0x716034C25D9Fb4b38c837aFe417B7a2e4d69Bbe6', 
    type: 'Institutional-like', 
    source: 'On-chain patterns',
    verified: false,
    labelType: 'behavioral'
  },
];

// DISCLAIMER: Personal names shown only with ENS verification or public disclosure

// Wallet Quick Select Button (with verification badge and behavioral tooltip)
function WalletQuickSelect({ wallet, onSelect }) {
  const isBehavioral = wallet.labelType === 'behavioral';
  
  const cardContent = (
    <button
      onClick={() => onSelect(wallet.address)}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-left w-full"
      data-testid={`wallet-quick-select-${wallet.address.slice(0, 8)}`}
    >
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
        <Wallet className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{wallet.label}</span>
          {wallet.verified && (
            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title="Verified identity">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {isBehavioral && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              Behavioral
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{wallet.type}</span>
          {wallet.source && (
            <>
              <span>•</span>
              <span className="text-gray-400">{wallet.source}</span>
            </>
          )}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-400" />
    </button>
  );
  
  // Wrap behavioral labels with tooltip
  if (isBehavioral) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">
            <strong>Behavior-based classification</strong><br />
            Label derived from on-chain patterns. Not a verified identity.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return cardContent;
}

// Indexing State for Wallet (P2.3 - WebSocket Live Updates with polling fallback)
function WalletIndexingState({ resolvedData, onSetAlert, onIndexingComplete }) {
  const dedupKey = resolvedData?.bootstrap?.dedupKey;
  
  // Local state for WebSocket updates
  const [wsProgress, setWsProgress] = useState(null);
  const [wsStep, setWsStep] = useState(null);
  const [wsEta, setWsEta] = useState(null);
  const [wsStatus, setWsStatus] = useState(null);
  
  // WebSocket connection (P2.3)
  const { isConnected } = useWebSocket({
    subscriptions: ['bootstrap'],
    enabled: !!dedupKey,
    onEvent: (event) => {
      // Filter by dedupKey
      if (event.dedupKey !== dedupKey) return;
      
      switch (event.type) {
        case 'bootstrap.progress':
          setWsProgress(event.progress);
          setWsStep(event.step);
          setWsEta(event.eta);
          setWsStatus('running');
          break;
        case 'bootstrap.done':
          setWsProgress(100);
          setWsStatus('done');
          if (onIndexingComplete) {
            onIndexingComplete();
          }
          break;
        case 'bootstrap.failed':
          setWsStatus('failed');
          break;
      }
    },
  });
  
  // Polling fallback (only when WS not connected)
  const pollingEnabled = !!dedupKey && !isConnected;
  const bootstrapProgress = useBootstrapProgress(
    dedupKey,
    pollingEnabled,
    (status) => {
      if (status === 'done' && onIndexingComplete) {
        onIndexingComplete();
      }
    }
  );

  // Use WebSocket data if connected, otherwise fallback to polling or resolver data
  const progress = wsProgress ?? (isConnected ? 0 : (bootstrapProgress.progress || resolvedData?.bootstrap?.progress || 0));
  const step = wsStep ?? (isConnected ? null : (bootstrapProgress.step || resolvedData?.bootstrap?.step));
  const etaSeconds = wsEta ?? (isConnected ? null : (bootstrapProgress.etaSeconds || resolvedData?.bootstrap?.etaSeconds));
  const status = wsStatus ?? (isConnected ? 'queued' : (bootstrapProgress.status || 'running'));

  return (
    <div className="space-y-6">
      {/* Live Indexing Progress */}
      <IndexingState
        progress={progress}
        step={step}
        etaSeconds={etaSeconds}
        status={status}
        attempts={bootstrapProgress.attempts}
        showHint={true}
      />
      
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span>Live updates</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-gray-400" />
            <span>Polling updates</span>
          </>
        )}
      </div>

      {/* Notify Button */}
      <div className="flex justify-center">
        <button
          onClick={onSetAlert}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Notify when ready
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Availability */}
        {resolvedData?.available && (
          <DataAvailability 
            available={resolvedData.available}
            confidence={resolvedData.confidence}
          />
        )}

        {/* Resolution Info */}
        {resolvedData && (
          <ResolutionInfo
            type={resolvedData.type}
            status={resolvedData.status}
            confidence={resolvedData.confidence}
            chain={resolvedData.chain}
            reason={resolvedData.reason}
            suggestions={resolvedData.suggestions}
          />
        )}
      </div>
    </div>
  );
}

// Resolved Wallet View - CONTRACT: All blocks ALWAYS render when status === completed
function WalletResolvedView({ resolvedData, walletData, walletProfile, onCreateAlert }) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [timeWindow, setTimeWindow] = useState('24h'); // NEW: Time window selector
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedData.normalizedId);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  const handleReviewCluster = (clusterId) => {
    setSelectedClusterId(clusterId);
    setShowClusterModal(true);
  };

  // Determine wallet type for header
  const walletType = walletProfile?.classification?.type || resolvedData.type || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Section 1: Wallet Header (B1 - Identification) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {walletProfile?.summary?.headline || resolvedData.label || 'Wallet'}
                </h1>
                {/* Wallet Type Badge */}
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 capitalize">
                  {walletType}
                </span>
                {/* Chain Badge */}
                <span className="px-2 py-0.5 bg-blue-50 rounded text-xs font-medium text-blue-600">
                  {resolvedData.chain || 'Ethereum'}
                </span>
                {/* Status Badge */}
                <span className="px-2 py-0.5 bg-emerald-50 rounded text-xs font-medium text-emerald-600">
                  Resolved
                </span>
              </div>
              {/* Wallet Tags/Badges if any */}
              {walletProfile?.tags && walletProfile.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {walletProfile.tags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-50 rounded text-xs font-medium text-purple-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs font-mono text-gray-500">
                  {resolvedData.normalizedId?.slice(0, 10)}...{resolvedData.normalizedId?.slice(-8)}
                </code>
                <button onClick={handleCopy} className="p-1 hover:bg-gray-100 rounded">
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          {/* Wallet Actions - Track + Alert */}
          <TrackWalletButton
            walletAddress={resolvedData.normalizedId}
            walletLabel={walletProfile?.summary?.headline || resolvedData.label}
            chain={resolvedData.chain || 'Ethereum'}
            onCreateAlert={onCreateAlert}
          />
        </div>
      </div>

      {/* Time Window Selector - Controls all data blocks */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Analysis Time Window</h3>
          <p className="text-xs text-gray-500">Controls all data blocks below</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {['24h', '7d', '30d'].map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeWindow === w 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`time-window-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: WALLET ACTIVITY SNAPSHOT - КЛЮЧЕВОЙ УТЕРЯННЫЙ БЛОК */}
      <WalletActivitySnapshot 
        walletAddress={resolvedData.normalizedId}
        walletData={walletData}
        walletProfile={walletProfile}
        timeWindow={timeWindow}
      />

      {/* Section 3: Behavior Summary (B1 - Profile) */}
      {walletProfile?.behavior ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Behavior Summary</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Checked</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              walletProfile.behavior.label === 'Accumulator' ? 'bg-emerald-50 text-emerald-700' :
              walletProfile.behavior.label === 'Distributor' ? 'bg-red-50 text-red-700' :
              walletProfile.behavior.label === 'Passive' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {walletProfile.behavior.label || 'Unknown Pattern'}
            </div>
            <p className="text-sm text-gray-600">{walletProfile.behavior.description}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Behavior Summary</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Checked</span>
          </div>
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">No behavioral pattern identified</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              This wallet does not show consistent accumulation or distribution behavior.
            </p>
          </div>
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 6: Wallet Signals (NEW API-based) */}
          {resolvedData?.normalizedId && (
            <WalletSignalsBlock walletAddress={resolvedData.normalizedId} timeWindow={timeWindow} />
          )}

          {/* Recent Activity */}
          {walletData?.recentActivity && walletData.recentActivity.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {walletData.recentActivity.slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                      <div className="text-xs text-gray-500">{tx.timestamp}</div>
                    </div>
                    {tx.amount && (
                      <div className="text-sm font-semibold text-gray-900">{tx.amount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Checked</span>
              </div>
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
                  <Activity className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">No recent activity</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  This wallet has not had any recorded transactions in the analyzed period.
                </p>
              </div>
            </div>
          )}

          {/* Behavior Fingerprint - only with real data */}
          {walletData?.behaviorFingerprint && (
            <BehaviorFingerprint behavior={walletData.behaviorFingerprint} />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Section 5: B4 - Historical Performance (Smart Money Profile) */}
          {resolvedData?.normalizedId && (
            <SmartMoneyProfile 
              walletAddress={resolvedData.normalizedId}
              chain={resolvedData.chain || 'Ethereum'}
            />
          )}

          {/* Section 4: B3 - Related Addresses (Clusters) */}
          {resolvedData?.normalizedId && (
            <RelatedAddresses 
              walletAddress={resolvedData.normalizedId}
              chain={resolvedData.chain || 'Ethereum'}
              timeWindow={timeWindow}
              onWalletClick={handleWalletClick}
              onReviewCluster={handleReviewCluster}
            />
          )}

          {/* Section 7.1: Data Availability */}
          {resolvedData?.available && (
            <DataAvailability 
              available={resolvedData.available}
              confidence={resolvedData.confidence}
            />
          )}

          {/* Section 7.2: Resolution Status - убран misleading текст */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Resolution Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Type</span>
                <span className="text-xs font-medium text-gray-900 capitalize">{walletType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Chain</span>
                <span className="text-xs font-medium text-gray-900">{resolvedData.chain || 'Ethereum'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <span className="text-xs font-medium text-emerald-600">Analysis Complete</span>
              </div>
              {/* CONTRACT: убран confidence-based messaging, показываем result reason */}
              {resolvedData.reason && (
                <div className="p-2 bg-gray-50 rounded-lg mt-2">
                  <p className="text-xs text-gray-600">
                    {resolvedData.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reputation Card */}
          {resolvedData?.normalizedId && (
            <ReputationCard type="wallet" targetId={resolvedData.normalizedId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FREEZE v3.0: Multi-Chain View Component
// ============================================================================

function MultiChainView({ address, window = '7d' }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [timeline, setTimeline] = useState([]);
  const [counterparties, setCounterparties] = useState([]);

  // Load multichain data
  useEffect(() => {
    if (!address) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load summary (all networks)
        const summaryRes = await getWalletSummaryV2({ address, window });
        if (summaryRes.ok) {
          setSummary(summaryRes.data);
        }
        
        // Load timeline for selected network
        const timelineRes = await getWalletTimelineV2({ 
          network: selectedNetwork, 
          address, 
          window,
          limit: 20 
        });
        if (timelineRes.ok) {
          setTimeline(timelineRes.data?.timeline || []);
        }
        
        // Load counterparties for selected network
        const cpRes = await getWalletCounterpartiesV2({ 
          network: selectedNetwork, 
          address, 
          window: '30d',
          limit: 10 
        });
        if (cpRes.ok) {
          setCounterparties(cpRes.data?.counterparties || []);
        }
      } catch (err) {
        console.error('Failed to load multichain data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [address, window, selectedNetwork]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const networks = summary?.networks || [];
  const totalNetFlow = networks.reduce((sum, n) => sum + (n.netFlow || 0), 0);

  return (
    <div className="space-y-6">
      {/* Network Summary Cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Network Exposure
        </h3>
        
        {networks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No multi-chain activity detected
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {networks.map(net => {
              const color = NETWORK_COLORS[net.network] || '#888';
              const isPositive = net.netFlow >= 0;
              const isSelected = net.network === selectedNetwork;
              
              return (
                <button
                  key={net.network}
                  onClick={() => setSelectedNetwork(net.network)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                >
                  <div className="text-sm font-semibold text-gray-900 capitalize mb-2">
                    {net.network}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>IN</span>
                    <span className="text-green-600 font-medium">{net.transfersIn || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>OUT</span>
                    <span className="text-red-600 font-medium">{net.transfersOut || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>Net</span>
                    <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{net.netFlow || 0}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Total Summary */}
        {networks.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Net Flow (All Networks)</span>
            <span className={`text-lg font-bold ${totalNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalNetFlow >= 0 ? '+' : ''}{totalNetFlow}
            </span>
          </div>
        )}
      </div>

      {/* Selected Network Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Recent Activity ({selectedNetwork})
          </h3>
          {timeline.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No recent activity on {selectedNetwork}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timeline.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`p-1.5 rounded ${item.direction === 'OUT' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {item.direction === 'OUT' ? (
                      <ArrowUpRight className="w-3 h-3 text-red-600" />
                    ) : (
                      <ArrowDownLeft className="w-3 h-3 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 truncate">
                      {item.direction === 'OUT' ? 'To: ' : 'From: '}
                      {item.counterparty?.slice(0, 10)}...
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Counterparties */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Top Counterparties ({selectedNetwork})
          </h3>
          {counterparties.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No counterparties found
            </div>
          ) : (
            <div className="space-y-2">
              {counterparties.slice(0, 5).map((cp, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-700 truncate">
                      {cp.address?.slice(0, 12)}...{cp.address?.slice(-6)}
                    </div>
                    <div className="text-xs text-gray-500">{cp.txCount || 0} txs</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    cp.direction === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {cp.direction || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [walletProfile, setWalletProfile] = useState(null);
  
  // FREEZE v3.0: Multi-chain toggle
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' | 'multi'

  // ========================================
  // FRONTEND CONTRACT (P0 FIX)
  // ========================================
  // ❌ ЗАПРЕЩЕНО НАВСЕГДА:
  //    if (confidence < X) showAnalyzing()
  //
  // ✅ ЕДИНСТВЕННОЕ ПРАВИЛО:
  //    if (status === 'analyzing' || status === 'pending') showAnalyzing()
  //    else showResult() // даже если данных нет
  // ========================================
  
  const isActuallyAnalyzing = resolvedData && (
    resolvedData.status === 'analyzing' || 
    resolvedData.status === 'pending'
  );
  
  // Terminal states - analysis finished (show results, even if empty)
  const isAnalysisComplete = resolvedData && (
    resolvedData.status === 'completed' ||
    resolvedData.status === 'failed'
  );
  
  // Empty state - address exists but no useful data
  const isEmpty = resolvedData && (
    resolvedData.status === 'not_found' ||
    resolvedData.status === 'error'
  );

  // Resolve wallet address
  const resolveWallet = useCallback(async (address) => {
    if (!address || address.length < 3) return;
    
    setLoading(true);
    setError(null);
    setResolvedData(null);
    setWalletData(null);
    setWalletProfile(null);
    
    try {
      const response = await resolverApi.resolve(address);
      
      if (response?.ok) {
        setResolvedData(response.data);
        
        // FIXED: Load additional data whenever resolved (even with low confidence)
        // Low confidence = partial data, but still show what we have
        if (response.data.status === 'resolved') {
          // Try to get B1 Wallet Profile first
          try {
            const profile = await walletsApi.getProfile(response.data.normalizedId);
            if (profile && !profile.error) {
              setWalletProfile(profile);
            }
          } catch (e) {
            console.log('B1 Wallet profile not available');
          }
          
          // Try to get legacy wallet-specific data
          try {
            const walletResponse = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${response.data.normalizedId}/profile`
            );
            if (walletResponse.ok) {
              const walletJson = await walletResponse.json();
              if (walletJson.ok) {
                setWalletData(walletJson.data);
              }
            }
          } catch (e) {
            console.log('Legacy wallet profile not available');
          }
        }
      } else {
        setError(response?.error || 'Failed to resolve address');
      }
    } catch (err) {
      console.error('Failed to resolve wallet:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      resolveWallet(searchQuery.trim());
    }
  };

  // Handle quick select
  const handleQuickSelect = (address) => {
    setSearchQuery(address);
    resolveWallet(address);
  };

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      resolveWallet(searchQuery.trim());
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="wallets-page">
        
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Status Banner */}
          <StatusBanner className="mb-4" compact />

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
              <p className="text-sm text-gray-500">
                Analyze any wallet address for behavior patterns and risk assessment
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* FREEZE v3.0: Analysis Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAnalysisMode('single')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    analysisMode === 'single' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Single-chain
                </button>
                <button
                  onClick={() => setAnalysisMode('multi')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    analysisMode === 'multi' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Multi-chain
                </button>
              </div>
              {resolvedData && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* P1.2 FIX: Plain search input without icon */}
          <form onSubmit={handleSearch} className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter wallet address or ENS name..."
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              data-testid="wallet-search-input"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </form>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Content */}
          {!resolvedData && !loading && (
            <div className="space-y-6">
              {/* Empty state with suggestions */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze any wallet</h3>
                <p className="text-gray-500 mb-6">
                  Enter an Ethereum address or ENS name to see behavior patterns
                </p>
              </div>

              {/* Quick Select Reference Wallets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Popular wallets to explore
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REFERENCE_WALLETS.map((wallet) => (
                    <WalletQuickSelect 
                      key={wallet.address}
                      wallet={wallet}
                      onSelect={handleQuickSelect}
                    />
                  ))}
                </div>
                {/* Layer 0 Disclaimer */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>
                      <strong>Attribution disclaimer:</strong> Verified badges indicate ENS ownership or public disclosure. 
                      Unverified labels describe on-chain behavior patterns, not identity.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Looking up wallet...</p>
              </div>
            </div>
          )}

          {/* Resolved Content */}
          {resolvedData && !loading && (
            <>
              {/* P0 FIX: Analyzing state - show progress */}
              {isActuallyAnalyzing && (
                <WalletIndexingState 
                  resolvedData={resolvedData}
                  onSetAlert={() => setShowAlertModal(true)}
                  onIndexingComplete={() => {
                    // Auto-refresh resolver when analysis completes
                    resolveWallet(searchQuery);
                  }}
                />
              )}

              {/* FREEZE v3.0: Mode-based content */}
              {isAnalysisComplete && analysisMode === 'single' && (
                <WalletResolvedView 
                  resolvedData={resolvedData}
                  walletData={walletData}
                  walletProfile={walletProfile}
                  onCreateAlert={() => setShowAlertModal(true)}
                />
              )}
              
              {isAnalysisComplete && analysisMode === 'multi' && (
                <MultiChainView 
                  address={resolvedData?.normalizedId}
                  window="7d"
                />
              )}
            </>
          )}
        </div>

        {/* Wallet Alert Modal - WORKING */}
        <CreateWalletAlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          walletAddress={resolvedData?.normalizedId}
          walletLabel={walletProfile?.summary?.headline || resolvedData?.label}
          chain={resolvedData?.chain || 'Ethereum'}
          onSuccess={() => {
            setShowAlertModal(false);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
