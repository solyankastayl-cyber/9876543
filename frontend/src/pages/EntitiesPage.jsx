/**
 * EntitiesPage - REAL MODE (Phase 16)
 * Dynamic entity analytics with Universal Resolver
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Users, Info, ChevronLeft, ChevronRight, 
  Link2, X, Eye, Bell, Check, Search, Loader2, RefreshCw, Building,
  AlertCircle
} from 'lucide-react';
import AlertModal from '../components/AlertModal';
import EmptyState from '../components/EmptyState';
import StatusBanner from '../components/StatusBanner';
import { AddressCountBadge } from '../components/KnownAddresses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { entitiesApi, resolverApi } from '../api';

// Known entities for quick start (when database is empty)
const KNOWN_ENTITIES = [
  { id: 'binance', name: 'Binance', type: 'exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png' },
  { id: 'coinbase', name: 'Coinbase', type: 'exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png' },
  { id: 'kraken', name: 'Kraken', type: 'exchange', logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png' },
  { id: 'a16z', name: 'a16z Crypto', type: 'fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'paradigm', name: 'Paradigm', type: 'fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'pantera', name: 'Pantera Capital', type: 'fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'jump', name: 'Jump Trading', type: 'market_maker', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'galaxy', name: 'Galaxy Digital', type: 'fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 'grayscale', name: 'Grayscale', type: 'fund', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
];

const activityConfig = {
  'accumulating': { label: 'Accumulating', color: 'bg-white text-white' },
  'distributing': { label: 'Distributing', color: 'bg-gray-100 text-gray-600' },
  'rotating': { label: 'Rotating', color: 'bg-gray-200 text-gray-700' },
  'holding': { label: 'Holding', color: 'bg-gray-100 text-gray-600' },
  'unknown': { label: 'Unknown', color: 'bg-gray-50 text-gray-400' },
};

const ITEMS_PER_PAGE = 9;

// Helper functions for formatting
function formatUSD(value) {
  if (!value) return null;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNetFlow(value) {
  if (!value) return null;
  const prefix = value >= 0 ? '+' : '';
  return prefix + formatUSD(Math.abs(value));
}

// Pagination Component
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 py-4 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-teal-500 hover:bg-teal-50'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-teal-400 text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                currentPage === page ? 'bg-teal-500 text-white' : 'text-teal-500 hover:bg-teal-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            currentPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-teal-500 hover:bg-teal-50'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{startItem} - {endItem}</span> out of <span className="font-semibold text-gray-700">{totalItems}</span>
      </div>
    </div>
  );
}

// Entity Card Component
function EntityCard({ entity, onAddToWatchlist, onCreateAlert, isInWatchlist, loading }) {
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Try to load real profile data
  useEffect(() => {
    async function loadProfile() {
      if (!entity.id) return;
      setProfileLoading(true);
      try {
        const response = await entitiesApi.getEntityProfile(entity.id);
        if (response?.ok) {
          setProfileData(response.data);
        }
      } catch (err) {
        // Silent fail - use mock data
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [entity.id]);

  const displayData = profileData || entity;
  const activity = displayData.activity || 'unknown';
  const confidence = displayData.confidence || displayData.trustScore;

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all hover:border-gray-900 ${
      loading ? 'opacity-50' : ''
    }`}>
      <Link to={`/entity/${entity.id}`} className="block">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={entity.logo || 'https://via.placeholder.com/48'} 
            alt={entity.name} 
            className="w-12 h-12 rounded-2xl bg-gray-100"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48?text=' + entity.name?.charAt(0);
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{entity.name}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                {entity.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{entity.addressCount || displayData.addresses || '—'} addresses</span>
            </div>
          </div>
          {profileLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Activity & Attribution */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${activityConfig[activity]?.color || activityConfig.unknown.color}`}>
            {activityConfig[activity]?.label || activity}
          </span>
          {/* Attribution Status Badge */}
          {entity.attribution && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
                  entity.attribution.status === 'verified' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : entity.attribution.status === 'high_confidence'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {entity.attribution.status === 'verified' && <Check className="w-3 h-3" />}
                  {entity.attribution.status === 'verified' ? 'Verified' : 
                   entity.attribution.status === 'high_confidence' ? 'High Conf.' : 'Assumed'}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-xs">
                  <p className="font-semibold mb-1">
                    {entity.attribution.status === 'verified' 
                      ? 'Verified Attribution' 
                      : 'Behavioral Attribution'}
                  </p>
                  <p className="text-gray-400">
                    {entity.attribution.method === 'seed_dataset' 
                      ? 'Source: Curated dataset'
                      : entity.attribution.method === 'cluster_inference'
                      ? 'Derived from on-chain patterns'
                      : 'Attribution method: ' + entity.attribution.method}
                  </p>
                  {entity.attribution.evidence?.length > 0 && (
                    <p className="mt-1 text-gray-400">
                      Evidence: {entity.attribution.evidence.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {/* Address Count Badge */}
          <AddressCountBadge subjectType="entity" subjectId={entity.id} />
        </div>

        {/* Holdings & Flow if available */}
        {(displayData.holdings || displayData.netflow24h) && (
          <div className="flex items-center gap-4 mb-4 text-xs">
            {displayData.holdings && (
              <div>
                <span className="text-gray-500">Holdings: </span>
                <span className="font-semibold text-gray-900">{displayData.holdings}</span>
              </div>
            )}
            {displayData.netflow24h && (
              <div>
                <span className="text-gray-500">24h Flow: </span>
                <span className={`font-semibold ${
                  displayData.netflow24h.startsWith('+') ? 'text-emerald-600' : 
                  displayData.netflow24h.startsWith('-') ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {displayData.netflow24h}
                </span>
              </div>
            )}
          </div>
        )}
      </Link>
      
      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Link to={`/entity/${entity.id}`} className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          View details →
        </Link>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWatchlist?.(entity);
                }}
                className={`p-1.5 rounded transition-colors ${
                  isInWatchlist 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
                data-testid={`watchlist-btn-${entity.id}`}
              >
                {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateAlert?.(entity);
                }}
                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                data-testid={`alert-btn-${entity.id}`}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Create Alert</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// No Data Placeholder
function NoDataPlaceholder({ type }) {
  if (!type || type === 'entities') {
    return (
      <div className="col-span-full">
        <EmptyState
          type="no_data"
          title="Type a name or address to search entities"
          description="Search for exchanges, funds, or market makers by name or wallet address to see their aggregate holdings and market impact."
          suggestions={[
            'Try "Binance", "Coinbase", or "a16z"',
            'Enter a known exchange address',
            'Filter by entity type above'
          ]}
        />
      </div>
    );
  }
  
  return (
    <div className="col-span-full">
      <EmptyState
        type="no_data"
        title={`No ${type} entities found`}
        description={`We don't have data on ${type} entities matching your search. Try a different query or change the filter.`}
        suggestions={[
          'Check your search spelling',
          'Try a broader search term',
          'Change the filter type'
        ]}
      />
    </div>
  );
}

export default function EntitiesPage() {
  const navigate = useNavigate();
  
  // State
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  
  // Pattern filter state
  const [patternFilter, setPatternFilter] = useState(null);
  const [entityPatterns, setEntityPatterns] = useState({}); // entityId -> pattern
  const [patternsLoading, setPatternsLoading] = useState(false);
  
  // Attribution filter state (Layer 0)
  const [attributionFilter, setAttributionFilter] = useState('all'); // 'all' | 'verified' | 'assumed'
  
  // Watchlist & Alerts
  const [watchlist, setWatchlist] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEntity, setAlertEntity] = useState('');

  // Load entities from API
  const loadEntities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request all entities (limit=100) for client-side filtering/pagination
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.data?.entities?.length > 0) {
          // Map API response to frontend format
          const mapped = data.data.entities.map(e => ({
            id: e.slug || e.id,
            name: e.name,
            type: e.category, // API returns 'category', frontend uses 'type'
            logo: e.logo,
            description: e.description,
            addressCount: e.addressesCount,
            coverage: e.coverage,
            status: e.status,
            netflow24h: e.netFlow24h ? formatNetFlow(e.netFlow24h) : null,
            holdings: e.totalHoldingsUSD ? formatUSD(e.totalHoldingsUSD) : null,
            tags: e.tags,
            // Attribution (Layer 0)
            attribution: e.attribution,
          }));
          setEntities(mapped);
          return;
        }
      }
      
      // Fallback to known entities
      setEntities(KNOWN_ENTITIES);
    } catch (err) {
      console.error('Failed to load entities:', err);
      setEntities(KNOWN_ENTITIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Load patterns for all entities
  const loadEntityPatterns = useCallback(async () => {
    if (entities.length === 0) return;
    
    setPatternsLoading(true);
    const patterns = {};
    
    // Load patterns for each entity (in parallel, max 5)
    const batchSize = 5;
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      await Promise.all(batch.map(async (entity) => {
        try {
          const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entity.id}/pattern-bridge`);
          const data = await res.json();
          if (data.ok && data.data?.patterns?.length > 0) {
            // Get dominant pattern (most addresses)
            const sorted = data.data.patterns.sort((a, b) => b.addresses.length - a.addresses.length);
            patterns[entity.id] = sorted[0].pattern;
          }
        } catch (e) {
          // Silent fail
        }
      }));
    }
    
    setEntityPatterns(patterns);
    setPatternsLoading(false);
  }, [entities]);

  useEffect(() => {
    if (entities.length > 0) {
      loadEntityPatterns();
    }
  }, [entities, loadEntityPatterns]);

  // Filter entities
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || entity.type === filterType;
    const matchesPattern = !patternFilter || entityPatterns[entity.id] === patternFilter;
    return matchesSearch && matchesType && matchesPattern;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEntities = filteredEntities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers
  const handleAddToWatchlist = (entity) => {
    setWatchlist(prev => {
      if (prev.includes(entity.id)) {
        return prev.filter(id => id !== entity.id);
      }
      return [...prev, entity.id];
    });
  };

  const handleCreateAlert = (entity) => {
    setAlertEntity(entity.name);
    setShowAlertModal(true);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handlePatternFilterChange = (pattern) => {
    setPatternFilter(patternFilter === pattern ? null : pattern);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    loadEntities();
  };

  // Get unique types for filter
  const entityTypes = ['all', ...new Set(entities.map(e => e.type).filter(Boolean))];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        
        <div className="px-4 py-6">
          {/* Status Banner */}
          <StatusBanner className="mb-4" compact />
          
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Entities</h1>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white text-white max-w-xs border border-white/20">
                    <p className="text-xs">Entity = group of addresses controlled by single actor. Track exchanges, funds, and market makers — their aggregate influence on the market.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
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
            <p className="text-sm text-gray-500">Track exchanges, funds, and market makers — their holdings, flows, and market impact</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* P0 FIX: Plain search input without icon overlay */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search entities..."
                className="w-full max-w-md px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
                data-testid="entities-search-input"
              />
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                {entityTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterType === type ? 'bg-white text-white' : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {type === 'all' ? 'All' : type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pattern Filters - Dynamic based on existing patterns */}
            {(() => {
              // Pattern config for styling
              const patternConfig = {
                accumulator: { label: 'Accumulator', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                distributor: { label: 'Distributor', color: 'bg-red-100 text-red-700 border-red-300' },
                active_trader: { label: 'Active Trader', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                whale: { label: 'Whale', color: 'bg-purple-100 text-purple-700 border-purple-300' },
                stablecoin_focused: { label: 'Stablecoin', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                mixed: { label: 'Mixed', color: 'bg-gray-100 text-gray-700 border-gray-300' },
              };
              
              // Get unique patterns that exist in data
              const existingPatterns = [...new Set(Object.values(entityPatterns))].filter(Boolean);
              
              if (existingPatterns.length === 0 && !patternsLoading) {
                return null; // Don't show pattern section if no patterns
              }
              
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 mr-2">Pattern:</span>
                  {patternsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading patterns...</span>
                    </div>
                  ) : (
                    <>
                      {existingPatterns.map(patternId => {
                        const config = patternConfig[patternId] || { label: patternId, color: 'bg-gray-100 text-gray-700 border-gray-300' };
                        const count = Object.values(entityPatterns).filter(p => p === patternId).length;
                        const isActive = patternFilter === patternId;
                        return (
                          <button
                            key={patternId}
                            onClick={() => handlePatternFilterChange(patternId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isActive 
                                ? config.color + ' ring-2 ring-offset-1 ring-gray-400' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                            data-testid={`pattern-filter-${patternId}`}
                          >
                            {config.label}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                              isActive ? 'bg-white/30' : 'bg-gray-200'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                      {patternFilter && (
                        <button
                          onClick={() => setPatternFilter(null)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Entities Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paginatedEntities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  onAddToWatchlist={handleAddToWatchlist}
                  onCreateAlert={handleCreateAlert}
                  isInWatchlist={watchlist.includes(entity.id)}
                />
              ))}
            </div>
          ) : (
            <NoDataPlaceholder 
              type={searchQuery ? filterType : null}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEntities.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          )}

          {/* Data Source Notice */}
          {!loading && entities === KNOWN_ENTITIES && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-900">Using reference data</div>
                  <p className="text-sm text-amber-700 mt-1">
                    Showing known entities as placeholders. Real entity profiles will load as you explore individual entities or as the system indexes more data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Alert Modal */}
      <AlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        defaultEntity={alertEntity}
      />
    </TooltipProvider>
  );
}
