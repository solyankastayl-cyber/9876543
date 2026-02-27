/**
 * ActorProfile - REAL MODE (Phase 16 + P2.3 WebSocket Live Updates)
 * 
 * ARCHITECTURE:
 * - resolved + confidence >= 0.4 → ONLY real data
 * - indexing / confidence < 0.4 → EmptyState + "Indexing in progress" (NO mock metrics)
 * - demo mode (env flag) → mock allowed for presentations
 * - WebSocket for live resolver/attribution updates (P2.3)
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Bell, Eye, Check, AlertTriangle, 
  Shield, Users, Wallet, Copy, ArrowUpRight, ChevronDown, X, Gauge,
  Loader2, RefreshCw, Search, Activity, Wifi, WifiOff
} from 'lucide-react';
import ReputationCard from '../components/ReputationCard';
import EmptyState from '../components/EmptyState';
import StatusBanner from '../components/StatusBanner';
import DataAvailability, { ResolutionInfo, StatusBadge } from '../components/DataAvailability';
import KnownAddresses from '../components/KnownAddresses';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { resolverApi, actorsApi } from '../api';

// Config imports (for labels only, not metrics)
import { 
  chainConfig, 
  getEdgeScoreColor, 
  getConfidenceColor,
  alertTypes 
} from '../data/actors';

// Demo mode flag - set via environment
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

// Actor Header Component (minimal - only resolver data)
function ActorHeader({ resolvedData, isFollowed, onToggleFollow, onShowAlerts, showRealNames, setShowRealNames }) {
  const [copiedAddress, setCopiedAddress] = useState(null);
  
  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const displayName = resolvedData?.label || resolvedData?.input || 'Unknown Actor';
  const chain = chainConfig[resolvedData?.chain] || { color: 'bg-gray-500', label: resolvedData?.chain || 'Unknown' };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 capitalize">
                {resolvedData?.type || 'Actor'}
              </span>
              {chain.label && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${chain.color}`} />
                  <span className="text-xs text-gray-500 capitalize">{chain.label}</span>
                </div>
              )}
              {/* Resolution Status */}
              {resolvedData && (
                <StatusBadge 
                  status={resolvedData.status} 
                  confidence={resolvedData.confidence} 
                />
              )}
            </div>
            {/* Address */}
            {resolvedData?.normalizedId && (
              <div className="mt-2 flex items-center gap-2">
                <code className="text-xs font-mono text-gray-500">
                  {resolvedData.normalizedId.slice(0, 10)}...{resolvedData.normalizedId.slice(-8)}
                </code>
                <button onClick={() => handleCopyAddress(resolvedData.normalizedId)} className="p-1 hover:bg-gray-100 rounded">
                  {copiedAddress === resolvedData.normalizedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isFollowed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
            {isFollowed ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={onShowAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Alerts
          </button>
          <Link
            to="/watchlist"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Watchlist
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Loading actor profile...</p>
      </div>
    </div>
  );
}

// Real Actor Stats Grid (only shows when we have REAL data)
function RealActorStats({ reputation, actorData }) {
  if (!reputation && !actorData) return null;

  const stats = [
    { label: 'Trust Score', value: reputation?.trustScore ? `${reputation.trustScore}/100` : '—' },
    { label: 'Signals', value: reputation?.signalCount || actorData?.signalCount || '—' },
    { label: 'Activity', value: actorData?.activityLevel || '—' },
    { label: 'Risk', value: reputation?.riskLevel || '—' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">{stat.label}</div>
          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

// Analysis State Component
function IndexingState({ resolvedData, onSetAlert }) {
  return (
    <div className="space-y-6">
      {/* Analysis Banner */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Analyzing on-chain behavior</h3>
            <p className="text-sm text-blue-700 mb-4">
              We're gathering data for this actor. Analytics will appear once we have enough activity.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onSetAlert}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Notify when ready
              </button>
              <Link
                to="/actors"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Browse other actors →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What we know */}
      {resolvedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Availability */}
          {resolvedData.available && (
            <DataAvailability 
              available={resolvedData.available}
              confidence={resolvedData.confidence}
            />
          )}

          {/* Resolution Info */}
          <ResolutionInfo
            type={resolvedData.type}
            status={resolvedData.status}
            confidence={resolvedData.confidence}
            chain={resolvedData.chain}
            reason={resolvedData.reason}
            suggestions={resolvedData.suggestions}
          />
        </div>
      )}

      {/* Suggestions */}
      <EmptyState
        type="no_data"
        title="What you can do while waiting"
        description="While we index this actor's data, here are some alternatives:"
        suggestions={[
          'Set up an alert to be notified when data is ready',
          'Browse actors with available data',
          'Check back in a few minutes'
        ]}
      />
    </div>
  );
}

// Resolved State - Real Data Display
function ResolvedState({ resolvedData, reputation, actorData }) {
  return (
    <div className="space-y-6">
      {/* Real Stats */}
      <RealActorStats reputation={reputation} actorData={actorData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reputation Summary */}
          {reputation && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reputation Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase mb-1">Trust Level</div>
                  <div className="text-xl font-bold text-gray-900">{reputation.trustLevel || 'Unknown'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase mb-1">Signal Quality</div>
                  <div className="text-xl font-bold text-gray-900">{reputation.signalQuality || '—'}</div>
                </div>
              </div>
              {reputation.summary && (
                <p className="mt-4 text-sm text-gray-600">{reputation.summary}</p>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          {actorData?.recentActivity && actorData.recentActivity.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {actorData.recentActivity.slice(0, 5).map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.type}</div>
                      <div className="text-xs text-gray-500">{activity.timestamp}</div>
                    </div>
                    {activity.amount && (
                      <div className="text-sm font-semibold text-gray-900">{activity.amount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity Message */}
          {(!actorData?.recentActivity || actorData.recentActivity.length === 0) && (
            <EmptyState
              type="no_data"
              title="No recent activity"
              description="This actor hasn't had any recorded activity recently."
            />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Known Addresses - Attribution Layer */}
          {resolvedData?.normalizedId && (
            <KnownAddresses 
              subjectType="actor" 
              subjectId={resolvedData.label || resolvedData.normalizedId}
            />
          )}

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
            />
          )}

          {/* Reputation Card */}
          {resolvedData?.normalizedId && (
            <ReputationCard type="actor" targetId={resolvedData.normalizedId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActorProfile() {
  const { actorId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [resolvedData, setResolvedData] = useState(null);
  const [actorData, setActorData] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [isFollowed, setIsFollowed] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Determine state based on resolver response
  // FIXED: Low confidence is NOT indexing - it means "not enough activity"
  // Only actual status determines indexing state
  const isIndexing = resolvedData && (
    resolvedData.status === 'indexing' || 
    resolvedData.status === 'pending'
  );
  
  // FIXED: Resolved state should show data even with low confidence
  const isResolved = resolvedData && !isIndexing;

  // Load actor data
  const loadActorData = useCallback(async () => {
    if (!actorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Resolve the actor
      const resolveResponse = await resolverApi.resolve(actorId);
      
      if (resolveResponse?.ok) {
        setResolvedData(resolveResponse.data);
        
        // Only fetch additional data if resolved with good confidence
        if (resolveResponse.data.status === 'resolved' && resolveResponse.data.confidence >= 0.4) {
          const address = resolveResponse.data.normalizedId || actorId;
          
          // Get reputation
          try {
            const reputationResponse = await actorsApi.getActorReputation(address);
            if (reputationResponse?.ok) {
              setReputation(reputationResponse.data);
            }
          } catch (e) {
            console.log('Reputation not available');
          }
          
          // Get actor trust/data
          try {
            const trustResponse = await actorsApi.getActorTrust(address);
            if (trustResponse?.ok && trustResponse.data) {
              setActorData(trustResponse.data);
            }
          } catch (e) {
            console.log('Trust data not available');
          }
        }
      } else {
        setError(resolveResponse?.error || 'Failed to resolve actor');
      }
    } catch (err) {
      console.error('Failed to load actor:', err);
      setError('Failed to load actor data');
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    loadActorData();
  }, [loadActorData]);

  // ============================================
  // P2.3.A: WebSocket — invalidate → refetch
  // ============================================
  const handleWsEvent = useCallback((event) => {
    // resolver.updated — refetch resolver data
    if (event.type === 'resolver.updated' && event.subjectId === actorId) {
      console.log('[WS] resolver.updated → refetch');
      loadActorData();
    }
    
    // attribution.confirmed — refetch (may have new label)
    if (event.type === 'attribution.confirmed' && event.subjectId === actorId) {
      console.log('[WS] attribution.confirmed → refetch');
      loadActorData();
    }
    
    // bootstrap.done — indexing complete, refetch
    if (event.type === 'bootstrap.done' && event.dedupKey === actorId) {
      console.log('[WS] bootstrap.done → refetch');
      loadActorData();
    }
  }, [actorId, loadActorData]);

  const { isConnected: wsConnected } = useWebSocket({
    subscriptions: ['resolver', 'attribution', 'bootstrap'],
    onEvent: handleWsEvent,
    enabled: !!actorId,
  });

  const handleRefresh = () => {
    loadActorData();
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        
        <div className="px-4 py-6 max-w-[1400px] mx-auto">
          {/* Back link + Refresh */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              to="/actors" 
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Actors
            </Link>
            <div className="flex items-center gap-2">
              {/* WS Status Indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                    wsConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{wsConnected ? 'Live' : 'Polling'}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {wsConnected ? 'Real-time updates active' : 'Using periodic refresh'}
                </TooltipContent>
              </Tooltip>
              <StatusBanner compact />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && !loading && (
            <EmptyState
              type="error"
              title="Failed to load actor"
              description={error}
              action={{
                label: 'Try Again',
                onClick: handleRefresh,
                icon: RefreshCw,
              }}
            />
          )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {resolvedData ? (
                <>
                  {/* Actor Header - Always show with resolver data */}
                  <ActorHeader 
                    resolvedData={resolvedData}
                    isFollowed={isFollowed}
                    onToggleFollow={() => setIsFollowed(!isFollowed)}
                    onShowAlerts={() => setShowAlertModal(true)}
                  />

                  {/* STRICT POLICY: Show content based on state */}
                  {isIndexing && (
                    <IndexingState 
                      resolvedData={resolvedData}
                      onSetAlert={() => setShowAlertModal(true)}
                    />
                  )}

                  {isResolved && (
                    <ResolvedState 
                      resolvedData={resolvedData}
                      reputation={reputation}
                      actorData={actorData}
                    />
                  )}

                  {/* Edge case: neither indexing nor resolved */}
                  {!isIndexing && !isResolved && (
                    <EmptyState
                      type="search"
                      title="Actor not found"
                      description="We couldn't find sufficient data for this actor."
                      action={{
                        label: 'Browse Actors',
                        onClick: () => navigate('/actors'),
                        icon: Users,
                      }}
                    />
                  )}
                </>
              ) : (
                /* No resolver data at all */
                <EmptyState
                  type="search"
                  title="Actor not found"
                  description={`We couldn't find an actor with ID "${actorId}". Try searching for a different address or name.`}
                  action={{
                    label: 'Browse Actors',
                    onClick: () => navigate('/actors'),
                    icon: Users,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Alert Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={() => setShowAlertModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <h3 className="font-bold text-gray-900">Actor Alerts</h3>
                </div>
                <button onClick={() => setShowAlertModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">
                  Get notified about <span className="font-semibold text-gray-900">{resolvedData?.label || actorId}</span>
                </p>
                
                <div className="space-y-2">
                  {alertTypes.map(alert => (
                    <label key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{alert.name}</div>
                        <div className="text-xs text-gray-500">{alert.description}</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-gray-900 rounded" />
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="w-full mt-4 py-3 bg-white text-white rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Save Alert Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
