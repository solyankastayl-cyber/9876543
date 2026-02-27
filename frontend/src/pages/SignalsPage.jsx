import { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronLeft, AlertTriangle, RefreshCw, Loader2, Info } from 'lucide-react';
import SearchInput from '../components/shared/SearchInput';
import StatusBanner from '../components/StatusBanner';
import {
  RuleBasedAlert,
  GlassCard,
  getSignalLifecycle,
  calculateSignalScore,
  mockSignalsData
} from '../components/signals';
import EnhancedSignalCard from '../components/EnhancedSignalCard';
import { signalsApi } from '../api';
import ActorSignalsSection from '../components/signals/ActorSignalsSection';
import ContextualSignalsSection from '../components/signals/ContextualSignalsSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Filter chips configuration with tooltips
const QUICK_CHIPS = [
  { key: 'status', label: '<24h', hint: 'Signals detected in the last 24 hours' },
  { key: 'risk', label: 'Risk', hint: 'High-risk patterns (large movements, unusual activity)' },
  { key: 'bridge', label: 'Bridge', hint: 'Cross-chain bridge activities' },
  { key: 'dormant', label: 'Dormant', hint: 'Previously inactive wallets that became active' }
];

const MODE_TABS = [
  { id: 'overview', label: 'Overview', hint: 'Summary of all signal types' },
  { id: 'signals', label: 'Signals', hint: 'Individual transaction signals' },
  { id: 'context', label: 'Contextual', hint: 'Signals with market context analysis' },
  { id: 'actors', label: 'Actor Deviations', hint: 'Unusual behavior from known entities' },
  { id: 'bridge', label: 'Bridge', hint: 'Cross-chain transfer signals' },
  { id: 'risk', label: 'Risk', hint: 'High-risk activity alerts' }
];

const TYPE_FILTERS = ['all', 'whale', 'exchange', 'fund'];
const BEHAVIOR_FILTERS = ['all', 'accumulating', 'distributing', 'dormant'];
const LIFECYCLE_FILTERS = [
  { value: 'all', label: 'All', hint: 'Show all signals regardless of age' },
  { value: 'new', label: 'New', hint: 'Fresh signals (< 4 hours old)' },
  { value: 'active', label: 'Active', hint: 'Ongoing signals (4-24 hours)' },
  { value: 'cooling', label: 'Cooling', hint: 'Signals becoming stale (24-72 hours)' },
  { value: 'archived', label: 'Archived', hint: 'Historical signals (> 72 hours)' }
];

export default function SignalsPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [behaviorFilter, setBehaviorFilter] = useState('all');
  const [statusChangeFilter, setStatusChangeFilter] = useState(false);
  const [riskSpikeFilter, setRiskSpikeFilter] = useState(false);
  const [bridgeAlignedFilter, setBridgeAlignedFilter] = useState(false);
  const [dormantFilter, setDormantFilter] = useState(false);
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('unknown'); // 'active' | 'indexing' | 'idle'
  const [hasRealData, setHasRealData] = useState(false);
  const itemsPerPage = 12;

  // Demo mode flag - set via environment
  const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

  // Fetch system status and signals
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // First check system/indexer status
        let isIndexing = false;
        try {
          const statusResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/resolve/indexer-status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.ok) {
              isIndexing = statusData.data.status === 'indexing' || statusData.data.pendingJobs > 0;
              setSystemStatus(isIndexing ? 'indexing' : statusData.data.status || 'active');
            }
          }
        } catch (e) {
          console.log('Could not fetch indexer status');
        }

        // Fetch signals
        const response = await signalsApi.getLatestSignals(1, 50);
        
        if (response.ok && response.data && response.data.length > 0) {
          // We have REAL data
          const mappedSignals = response.data.map((signal, idx) => ({
            id: signal._id || `signal-${idx}`,
            _id: signal._id,
            fromAddress: signal.fromAddress,
            toAddress: signal.toAddress,
            assetAddress: signal.assetAddress,
            amount: signal.amount,
            timestamp: signal.timestamp,
            signalType: signal.signalType || 'transfer',
            severity: signal.severity || 'medium',
            behavior: signal.behavior || 'accumulating',
            type: signal.actorType || 'whale',
            watchType: 'address',
            label: signal.label || `Signal ${idx + 1}`,
            statusChange: new Date(signal.timestamp).getTime() > Date.now() - 24*60*60*1000 ? '24h' : null,
            riskLevel: signal.severity === 'high' ? 'high' : signal.severity === 'low' ? 'low' : 'medium',
          }));
          setWatchlist(mappedSignals);
          setHasRealData(true);
        } else {
          // No real data
          setHasRealData(false);
          
          // STRICT POLICY: Only show mock in explicit demo mode
          if (DEMO_MODE) {
            setWatchlist(mockSignalsData);
          } else {
            setWatchlist([]); // Empty - show EmptyState instead
          }
        }
      } catch (error) {
        console.error('Failed to fetch signals:', error);
        setHasRealData(false);
        
        // STRICT POLICY: Only show mock in explicit demo mode
        if (DEMO_MODE) {
          setWatchlist(mockSignalsData);
        } else {
          setWatchlist([]); // Empty - show EmptyState instead
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [DEMO_MODE]);

  // Handlers
  const handleRemove = (id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleWatch = (id) => {
    setWatchlist(prev => prev.map(item =>
      item.id === id ? { ...item, watching: !item.watching } : item
    ));
  };

  const handleOpenAlerts = (item) => {
    setSelectedItem(item);
    setIsAlertsPanelOpen(true);
  };

  const handleUserAction = ({ action, itemId, value }) => {
    setWatchlist(prev => prev.map(item => {
      if (item.id === itemId) {
        switch (action) {
          case 'mute':
            return { ...item, muted: value };
          case 'track':
            return { ...item, tracking: value };
          default:
            return item;
        }
      }
      return item;
    }));
  };

  // Filtering
  const filteredWatchlist = watchlist.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType || 
                       (filterType === 'cluster' && item.watchType === 'cluster') ||
                       (filterType === 'token' && item.watchType === 'token');
    
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
                         item.label?.toLowerCase().includes(searchLower) || 
                         item.address?.toLowerCase().includes(searchLower) ||
                         item.type?.toLowerCase().includes(searchLower);
    
    const matchesBehavior = behaviorFilter === 'all' || item.behavior === behaviorFilter;
    const matchesStatusChange = !statusChangeFilter || item.statusChange === '24h';
    const matchesRiskSpike = !riskSpikeFilter || item.riskLevel === 'high';
    const matchesBridgeAligned = !bridgeAlignedFilter || item.bridgeAligned === true;
    const matchesDormant = !dormantFilter || item.dormantDays > 7;
    
    const itemLifecycle = getSignalLifecycle(item.timestamp, calculateSignalScore(item).score);
    const matchesLifecycle = lifecycleFilter === 'all' || itemLifecycle === lifecycleFilter;
    
    const matchesMode = 
      viewMode === 'overview' ? true :
      viewMode === 'signals' ? (item.statusChange === '24h' || item.behaviorChanged || (item.deltaSignals && item.deltaSignals.length > 0)) :
      viewMode === 'bridge' ? item.bridgeAligned === true :
      viewMode === 'risk' ? item.riskLevel === 'high' :
      true;
    
    return matchesType && matchesSearch && matchesBehavior && 
           matchesStatusChange && matchesRiskSpike && 
           matchesBridgeAligned && matchesDormant && matchesMode && matchesLifecycle;
  });

  // Pagination - reset handled via setter function
  const totalPages = Math.ceil(filteredWatchlist.length / itemsPerPage);
  // Ensure currentPage is valid
  const validCurrentPage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) return 1;
    return currentPage;
  }, [currentPage, totalPages]);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWatchlist = filteredWatchlist.slice(startIndex, endIndex);

  // Metrics
  const activeSignals = watchlist.filter(item => item.statusChange === '24h').length;

  // Filter state management
  const filterStates = {
    status: { state: statusChangeFilter, setter: setStatusChangeFilter },
    risk: { state: riskSpikeFilter, setter: setRiskSpikeFilter },
    bridge: { state: bridgeAlignedFilter, setter: setBridgeAlignedFilter },
    dormant: { state: dormantFilter, setter: setDormantFilter }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="signals-page">
      
      {/* Status Banner */}
      <div className="px-4 pt-3">
        <StatusBanner compact />
      </div>

      {/* Mock Data Notice */}
      {DEMO_MODE && !hasRealData && (
        <div className="px-4 pt-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-700">
              <span className="font-medium">Using reference data.</span> Real signals will appear as the system indexes on-chain activity.
            </span>
          </div>
        </div>
      )}
      
      {/* Signals Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Signals</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-white text-white rounded font-semibold">{activeSignals}</span>
              <span className="text-gray-500">active</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-auto">
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search signals..."
              testId="signals-search-input"
              inputClassName="bg-gray-50 border-2 border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500"
            />
          </div>
          
          <div className="w-32"></div>
        </div>
      </div>

      {/* Market Context Strip */}
      {watchlist.length > 0 && (
        <div className="px-4 py-2 bg-white">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">24h:</span>
            {(() => {
              const dist = watchlist.filter(i => i.behavior === 'distributing' && i.statusChange === '24h').length;
              const acc = watchlist.filter(i => i.behavior === 'accumulating' && i.statusChange === '24h').length;
              const bridge = watchlist.filter(i => i.bridgeAligned).length;
              const risk = watchlist.filter(i => i.riskLevel === 'high').length;
              
              const items = [];
              if (dist > 0) items.push(<span key="d" className="text-white">{dist} distributing</span>);
              if (acc > 0) items.push(<span key="a" className="text-white">{acc} accumulating</span>);
              if (bridge >= 2) items.push(<span key="b" className="text-gray-700">{bridge} bridge-aligned</span>);
              if (risk > 0) items.push(<span key="r" className="text-gray-700">{risk} high-risk</span>);
              if (items.length === 0) items.push(<span key="n" className="text-gray-400">No significant changes</span>);
              
              return items.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-600">•</span>}
                  {item}
                </span>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Mode tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {MODE_TABS.map(mode => (
              <button
                key={mode.id}
                onClick={() => {
                  setViewMode(mode.id);
                  setCurrentPage(1);
                }}
                data-testid={`mode-tab-${mode.id}`}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === mode.id ? 'bg-white text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-1">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.key}
                onClick={() => {
                  filterStates[chip.key].setter(!filterStates[chip.key].state);
                  setCurrentPage(1);
                }}
                data-testid={`chip-${chip.key}`}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                  filterStates[chip.key].state ? 'bg-white text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              data-testid="advanced-filters-toggle"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-4" data-testid="advanced-filters">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase">Type:</span>
              {TYPE_FILTERS.map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setFilterType(t);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    filterType === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase">Behavior:</span>
              {BEHAVIOR_FILTERS.map(b => (
                <button
                  key={b}
                  onClick={() => {
                    setBehaviorFilter(b);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    behaviorFilter === b ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {b === 'all' ? 'All' : b}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase">Lifecycle:</span>
              {LIFECYCLE_FILTERS.map(l => (
                <button
                  key={l.value}
                  onClick={() => {
                    setLifecycleFilter(l.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    lifecycleFilter === l.value ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actor Deviations Tab */}
      {viewMode === 'actors' && (
        <div className="px-4 pb-4">
          <ActorSignalsSection />
        </div>
      )}

      {/* Contextual Signals Tab */}
      {viewMode === 'context' && (
        <div className="px-4 pb-4">
          <ContextualSignalsSection />
        </div>
      )}

      {/* Signals Grid */}
      {viewMode !== 'actors' && (
      <div className="px-4 pb-4">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty states - based on system status */}
        {!loading && filteredWatchlist.length === 0 && (
          <>
            {/* Case 1: System is analyzing */}
            {systemStatus === 'indexing' && (
              <div className="py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Gathering market data</h3>
                  <p className="text-gray-500 mb-6">
                    We're collecting on-chain activity. Signals will appear here as they are detected.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-xl text-sm font-medium hover:bg-gray-100"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Check again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Case 2: System is active but no signals */}
            {systemStatus !== 'indexing' && !hasRealData && (
              <div className="py-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="text-6xl mb-4">📡</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No signals detected yet</h3>
                  <p className="text-gray-500 mb-6">
                    We're monitoring on-chain activity. Signals will appear when significant movements are detected.
                  </p>
                  <div className="text-sm text-gray-400">
                    System status: <span className="font-medium text-gray-600 capitalize">{systemStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Case 3: Has data but filters hide everything */}
            {hasRealData && (
              <GlassCard className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No signals match your filters</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStates({ type: 'all', behavior: 'all', risk: 'all' });
                    setLifecycleFilter('all');
                  }}
                  className="px-4 py-2 bg-white text-white rounded-xl text-sm font-medium hover:bg-gray-100"
                >
                  Clear all filters
                </button>
              </GlassCard>
            )}
          </>
        )}

        {/* Signals list */}
        {!loading && filteredWatchlist.length > 0 && (
          <>
            {/* Signals count */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-bold">{paginatedWatchlist.length}</span> signals with Trust & Reputation
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {paginatedWatchlist.map(item => (
                <EnhancedSignalCard 
                  key={item.id || item._id} 
                  signal={item} 
                  onRemove={handleRemove}
                  onOpenAlerts={handleOpenAlerts}
                  onUserAction={handleUserAction}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'text-gray-700 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid="pagination-prev"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-semibold text-sm transition-colors ${
                            currentPage === pageNum
                              ? 'bg-teal-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-700 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid="pagination-next"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>

                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredWatchlist.length)}</span> out of <span className="font-bold text-gray-900">{filteredWatchlist.length}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Alerts Modal */}
      {isAlertsPanelOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <GlassCard className="w-[600px] max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rule-Based Alerts</h2>
                <p className="text-sm text-gray-600">Configure smart alerts for {selectedItem.label}</p>
              </div>
              <button 
                onClick={() => {
                  setIsAlertsPanelOpen(false);
                  setSelectedItem(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
                data-testid="close-alerts-modal"
              >
                <span className="text-2xl text-gray-400">&times;</span>
              </button>
            </div>
            
            <RuleBasedAlert 
              item={selectedItem}
              onSaveRule={(rule) => {
                console.log('Rule saved:', rule);
                alert(`✅ Alert rule saved!\n\nType: ${rule.type}\nThreshold: ${rule.threshold}%\nEntity: ${rule.entityLabel}`);
                setIsAlertsPanelOpen(false);
                setSelectedItem(null);
              }}
            />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
