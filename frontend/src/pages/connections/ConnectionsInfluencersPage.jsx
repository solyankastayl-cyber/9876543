/**
 * Influencers Page - Connections showcase
 * 
 * /connections/influencers
 * 
 * REAL DATA VERSION - Uses Playwright parser data
 */
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, 
  Grid, 
  List, 
  Users,
  TrendingUp,
  Network,
  Radio,
  Building2,
  Trophy,
  Search,
  X,
  RefreshCw,
  Loader2,
  Scale,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import InfluencerCard from '../../components/connections/InfluencerCard';
import CompareModal from '../../components/connections/CompareModal';
import { INFLUENCER_GROUPS, getGroupConfig, METRIC_TOOLTIPS } from '../../config/influencer.config';
import { useUnifiedAccounts, useTwitterSearch } from '../../api/connections.api';

// Filter Chip
const FilterChip = ({ group, isActive, onClick, count }) => {
  const config = getGroupConfig(group.id);
  
  return (
    <button
      onClick={onClick}
      data-testid={`filter-${group.id.toLowerCase()}`}
      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition border flex items-center gap-1.5 md:gap-2 flex-shrink-0 whitespace-nowrap
        ${isActive 
          ? `${config.bg} ${config.text} ${config.border}` 
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
    >
      {group.label}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

// Sort options
const SORT_OPTIONS = [
  { value: 'authority', label: 'Authority Score' },
  { value: 'twitter', label: 'Twitter Score' },
  { value: 'followers', label: 'Followers' },
  { value: 'connections', label: 'Strong Connections' },
];

export default function ConnectionsInfluencersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL state
  const groupFromUrl = searchParams.get('group') || '';
  const sortFromUrl = searchParams.get('sort') || 'influence';
  const viewFromUrl = searchParams.get('view') || 'grid';
  const searchFromUrl = searchParams.get('q') || '';
  const pageFromUrl = parseInt(searchParams.get('page') || '1');
  
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [viewMode, setViewMode] = useState(viewFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const ITEMS_PER_PAGE = 50;
  
  // Compare state
  const [compareMode, setCompareMode] = useState(false);
  const [compareAccounts, setCompareAccounts] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  
  // Fetch real data from API - get more to enable pagination
  const { data: realAccounts, loading, error, stats, refetch } = useUnifiedAccounts('REAL_TWITTER', {
    limit: 500,
    search: searchFromUrl
  });
  
  // Twitter search for importing new data
  const { search: searchTwitter, loading: searching } = useTwitterSearch();
  
  // Handle live Twitter search
  const handleLiveSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    await searchTwitter(searchQuery, 20);
    // Refetch to get newly imported accounts
    setTimeout(() => refetch(), 1000);
  };
  
  // Handle compare selection
  const toggleCompareAccount = (inf) => {
    setCompareAccounts(prev => {
      const exists = prev.find(a => a.id === inf.id);
      if (exists) {
        return prev.filter(a => a.id !== inf.id);
      }
      if (prev.length >= 2) {
        return [prev[1], inf];
      }
      return [...prev, inf];
    });
  };
  
  // Open compare modal when 2 accounts selected
  useEffect(() => {
    if (compareAccounts.length === 2) {
      setCompareModalOpen(true);
    }
  }, [compareAccounts]);
  
  // Update URL when filters change
  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'influence' && key === 'sort') {
      params.set(key, value);
    } else if (value && key !== 'sort') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };
  
  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        updateParams('q', searchQuery);
      } else {
        updateParams('q', '');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Transform API data to influencer format
  const influencers = useMemo(() => {
    return realAccounts.map(acc => {
      // Normalize scores to 0-1 range
      const influenceNorm = (acc.influence || 50) / 100;
      const smartNorm = (acc.smart || 50) / 100;
      const engagementNorm = Math.min((acc.engagementRate || acc.engagement || 3) / 10, 1);
      
      // Calculate twitterScore (0-1000 scale)
      const twitterScore = acc.twitterScore || Math.round(influenceNorm * 700 + smartNorm * 200 + engagementNorm * 100);
      
      return {
        id: acc.id,
        handle: acc.handle?.replace('@', '') || acc.title,
        name: acc.title || acc.handle,
        avatar: acc.avatar || `https://unavatar.io/twitter/${acc.handle?.replace('@', '')}`,
        twitterScore: Math.min(twitterScore, 1000),
        authorityScore: acc.authority || Math.round(influenceNorm * 100),
        followers: acc.followers || 0,
        following: acc.following || 0,
        strongConnections: Math.round(smartNorm * 20),
        groups: [...(acc.categories || []), 'REAL'],
        topFollowers: [],
        realityScore: Math.round((acc.confidence || 0.6) * 100),
        realityBadge: acc.confidence > 0.7 ? 'CONFIRMED' : acc.confidence > 0.4 ? 'MIXED' : 'RISKY',
        verified: acc.verified || false,
        source: acc.source,
        networkScore: acc.networkScore || 0,
        engagementRate: acc.engagementRate || acc.engagement || 0,
        engagement: acc.engagement || 0,
        avgLikes: acc.avgLikes || 0,
        tweetCount: acc.tweetCount || 0,
        lastActive: acc.lastActive,
        recentTokens: acc.recentTokens || [],
        tokenMentionCounts: acc.tokenMentionCounts || {},
        recentTweetsText: acc.recentTweetsText || []
      };
    });
  }, [realAccounts]);
  
  // Group counts from real data
  const groupCounts = useMemo(() => {
    const counts = { REAL: influencers.length };
    INFLUENCER_GROUPS.forEach(g => {
      counts[g.id] = influencers.filter(inf => inf.groups?.includes(g.id)).length;
    });
    return counts;
  }, [influencers]);
  
  // Filter and sort influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...influencers];
    
    // Search filter
    if (searchFromUrl) {
      const q = searchFromUrl.toLowerCase();
      result = result.filter(inf => 
        inf.name?.toLowerCase().includes(q) ||
        inf.handle?.toLowerCase().includes(q)
      );
    }
    
    // Group filter
    if (groupFromUrl) {
      result = result.filter(inf => inf.groups.includes(groupFromUrl));
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortFromUrl) {
        case 'twitter':
          return (b.twitterScore || 0) - (a.twitterScore || 0);
        case 'followers':
          return b.followers - a.followers;
        case 'connections':
          return b.strongConnections - a.strongConnections;
        case 'authority':
        default:
          return b.authorityScore - a.authorityScore;
      }
    });
    
    return result;
  }, [influencers, searchFromUrl, groupFromUrl, sortFromUrl]);
  
  // Pagination
  const totalPages = Math.ceil(filteredInfluencers.length / ITEMS_PER_PAGE);
  const paginatedInfluencers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInfluencers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInfluencers, currentPage]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFromUrl, groupFromUrl, sortFromUrl]);
  
  const handleGroupClick = (groupId) => {
    if (groupFromUrl === groupId) {
      updateParams('group', '');
    } else {
      updateParams('group', groupId);
    }
  };
  
  const handleViewChange = (mode) => {
    setViewMode(mode);
    updateParams('view', mode === 'grid' ? '' : mode);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    updateParams('q', '');
  };
  
  return (
    <div className="min-h-screen bg-gray-50" data-testid="influencers-page">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        
        {/* Stats Banner */}
        {stats && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
            <span className="text-green-700 font-medium">Real Twitter Data</span>
            <span className="text-green-600">
              {stats.total} accounts • {stats.last24h} imported today
            </span>
            <div className="flex items-center gap-2 md:ml-auto">
              <button 
                onClick={async () => {
                  try {
                    await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/connections/unified/refresh`, { method: 'POST' });
                    setTimeout(() => refetch(), 2000);
                  } catch (e) { console.error(e); }
                }}
                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 text-xs md:text-sm"
                data-testid="auto-refresh-btn"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Auto</span> Refresh
              </button>
              <button 
                onClick={refetch}
                className="text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 text-xs md:text-sm"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        )}
        
        {/* Loading/Error states */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading real accounts...</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            Error: {error}
          </div>
        )}
        
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Influencers</h1>
              <p className="text-xs md:text-sm text-gray-500 truncate">Who influences the crypto market and why</p>
            </div>
          </div>
        </div>
        
        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-4 mb-4 md:mb-6">
          {/* Top Row - Search + Sort + View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-3 md:mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLiveSearch()}
                data-testid="influencer-search"
                className="w-full px-3 md:px-4 pr-20 md:pr-24 py-2.5 md:py-2 border border-gray-200 rounded-lg text-sm md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                style={{ fontSize: '16px' }} /* Prevent iOS zoom */
              />
              {searchQuery && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={handleLiveSearch}
                    disabled={searching}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Fetch'}
                  </button>
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Sort + Compare + View - row on mobile */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort */}
              <Select 
                value={sortFromUrl} 
                onValueChange={(val) => updateParams('sort', val)}
              >
                <SelectTrigger className="w-36 md:w-48 h-10 md:h-9 bg-white text-xs md:text-sm [&>span]:!flex [&>span]:!flex-row [&>span]:!items-center [&>span]:!whitespace-nowrap" data-testid="influencer-sort">
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">Sort:</span>
                    <SelectValue placeholder="Influence" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Compare Button */}
              <button 
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setCompareAccounts([]);
                }}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-lg border transition text-xs md:text-sm font-medium ${
                  compareMode 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                }`}
                data-testid="compare-mode-btn"
              >
                <Scale className="w-4 h-4" />
                <span className="hidden sm:inline">{compareMode ? `${compareAccounts.length}/2` : 'Compare'}</span>
              </button>
              {compareMode && compareAccounts.length === 2 && (
                <button 
                  onClick={() => setCompareModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs md:text-sm font-medium hover:bg-green-700 transition"
                  data-testid="compare-now-btn"
                >
                  <Scale className="w-4 h-4" />
                  Compare Now
                </button>
              )}
              {compareMode && compareAccounts.length > 0 && (
                <button 
                  onClick={() => setCompareAccounts([])}
                  className="text-red-500 hover:text-red-700 text-xs px-2"
                >
                  Clear
                </button>
              )}
              
              {/* View Toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange('grid')}
                  data-testid="view-grid"
                  className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  data-testid="view-list"
                  className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Group Filters - horizontal scroll always, single row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ maxWidth: '100%' }}>
            <span className="text-xs md:text-sm text-gray-500 mr-1 md:mr-2 flex-shrink-0">Groups:</span>
            <button
              onClick={() => updateParams('group', '')}
              data-testid="filter-all"
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition border flex-shrink-0 whitespace-nowrap
                ${!groupFromUrl 
                  ? 'bg-gray-900 text-white border-gray-900' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              All
              <span className="ml-1.5 text-xs opacity-70">({influencers.length})</span>
            </button>
            {INFLUENCER_GROUPS.map(group => (
              <FilterChip
                key={group.id}
                group={group}
                isActive={groupFromUrl === group.id}
                onClick={() => handleGroupClick(group.id)}
                count={groupCounts[group.id]}
              />
            ))}
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredInfluencers.length}</span> influencers
            {groupFromUrl && (
              <span> in <span className="font-medium text-purple-600">{groupFromUrl}</span></span>
            )}
            {searchFromUrl && (
              <span> matching "<span className="font-medium">{searchFromUrl}</span>"</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Authority Score (v3)
            </span>
          </div>
        </div>
        
        {/* Influencer Grid/List */}
        {filteredInfluencers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center" data-testid="empty-state">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No influencers found</h3>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <Button 
              variant="outline" 
              onClick={() => {
                clearSearch();
                updateParams('group', '');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="influencer-grid">
            {paginatedInfluencers.map(influencer => (
              <div 
                key={influencer.id} 
                className={`relative ${compareMode ? 'cursor-pointer' : ''}`}
              >
                {compareMode && (
                  <div className={`absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    compareAccounts.find(a => a.id === influencer.id)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {compareAccounts.find(a => a.id === influencer.id) 
                      ? compareAccounts.findIndex(a => a.id === influencer.id) + 1 
                      : ''}
                  </div>
                )}
                <InfluencerCard 
                  influencer={influencer} 
                  view="grid"
                  compareMode={compareMode}
                  onCompareClick={toggleCompareAccount}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3" data-testid="influencer-list">
            {paginatedInfluencers.map(influencer => (
              <div 
                key={influencer.id} 
                className={`relative ${compareMode ? 'cursor-pointer' : ''}`}
              >
                {compareMode && (
                  <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    compareAccounts.find(a => a.id === influencer.id)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {compareAccounts.find(a => a.id === influencer.id) 
                      ? compareAccounts.findIndex(a => a.id === influencer.id) + 1 
                      : ''}
                  </div>
                )}
                <InfluencerCard 
                  influencer={influencer} 
                  view="list"
                  compareMode={compareMode}
                  onCompareClick={toggleCompareAccount}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-6 border-t border-gray-200">
          Influencers List — Real Twitter Data via Playwright Parser
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 mb-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <span className="text-sm text-gray-500 ml-2">
            Page {currentPage} of {totalPages} ({filteredInfluencers.length} total)
          </span>
        </div>
      )}
      
      {/* Compare Modal */}
      {compareModalOpen && compareAccounts.length === 2 && (
        <CompareModal
          accountA={{
            author_id: compareAccounts[0].id,
            username: compareAccounts[0].name,
            handle: compareAccounts[0].handle,
            avatar: compareAccounts[0].avatar,
            profile: compareAccounts[0].followers >= 500000 ? 'whale' : compareAccounts[0].followers >= 50000 ? 'influencer' : 'retail',
            risk_level: compareAccounts[0].realityBadge === 'CONFIRMED' ? 'low' : 'medium',
            influence_base: Math.round((compareAccounts[0].authorityScore || 500)),
            influence_adjusted: Math.round((compareAccounts[0].twitterScore || 500)),
            trend: { velocity_norm: 0.1, acceleration_norm: 0.05, state: 'stable' },
            early_signal: { 
              score: Math.round(compareAccounts[0].twitterScore * 0.8), 
              badge: compareAccounts[0].twitterScore > 700 ? 'rising' : 'none', 
              confidence: 0.7 
            },
          }}
          accountB={{
            author_id: compareAccounts[1].id,
            username: compareAccounts[1].name,
            handle: compareAccounts[1].handle,
            avatar: compareAccounts[1].avatar,
            profile: compareAccounts[1].followers >= 500000 ? 'whale' : compareAccounts[1].followers >= 50000 ? 'influencer' : 'retail',
            risk_level: compareAccounts[1].realityBadge === 'CONFIRMED' ? 'low' : 'medium',
            influence_base: Math.round((compareAccounts[1].authorityScore || 500)),
            influence_adjusted: Math.round((compareAccounts[1].twitterScore || 500)),
            trend: { velocity_norm: 0.1, acceleration_norm: 0.05, state: 'stable' },
            early_signal: { 
              score: Math.round(compareAccounts[1].twitterScore * 0.8), 
              badge: compareAccounts[1].twitterScore > 700 ? 'rising' : 'none', 
              confidence: 0.7 
            },
          }}
          onClose={() => {
            setCompareModalOpen(false);
            setCompareAccounts([]);
            setCompareMode(false);
          }}
        />
      )}
    </div>
  );
}
