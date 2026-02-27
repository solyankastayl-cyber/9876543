/**
 * Actors Page - EPIC A3: Actors UI v2
 * 
 * Displays actor cards with Edge Score from actor-scores API.
 * Philosophy: Observed structure, not predictions.
 * 
 * Features:
 * - Server-side pagination
 * - Filter by Type, Source Level, Flow Role, Min Edge Score
 * - Sort by Edge Score (default), Participation
 * - Link to Actor Detail page
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, Users, ChevronLeft, ChevronRight,
  Building2, Wallet, Loader2, Info, ArrowUpRight,
  TrendingUp, ArrowDownRight, Minus, Filter, X
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// CONSTANTS
// ============================================

const TYPE_BADGES = {
  'exchange': { label: 'Exchange', color: 'bg-blue-100 text-blue-700' },
  'fund': { label: 'Fund', color: 'bg-purple-100 text-purple-700' },
  'market_maker': { label: 'Market Maker', color: 'bg-amber-100 text-amber-700' },
  'whale': { label: 'Whale', color: 'bg-emerald-100 text-emerald-700' },
  'trader': { label: 'Trader', color: 'bg-cyan-100 text-cyan-700' },
};

const SOURCE_BADGES = {
  'verified': { label: 'Verified', color: 'bg-green-100 text-green-700', icon: '✓' },
  'attributed': { label: 'Attributed', color: 'bg-yellow-100 text-yellow-700', icon: '~' },
  'behavioral': { label: 'Behavioral', color: 'bg-gray-100 text-gray-500', icon: '?' },
};

const FLOW_ROLE_BADGES = {
  'accumulator': { label: 'Accumulator', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  'distributor': { label: 'Distributor', color: 'bg-red-100 text-red-700', icon: ArrowDownRight },
  'neutral': { label: 'Neutral', color: 'bg-gray-100 text-gray-600', icon: Minus },
  'market_maker_like': { label: 'MM-like', color: 'bg-blue-100 text-blue-700', icon: ArrowUpRight },
};

const SCORE_BANDS = {
  elite: { min: 80, label: 'Elite', color: 'bg-purple-600' },
  high: { min: 60, label: 'High', color: 'bg-emerald-500' },
  medium: { min: 40, label: 'Medium', color: 'bg-amber-500' },
  low: { min: 0, label: 'Low', color: 'bg-gray-400' },
};

function getScoreBand(score) {
  if (score >= 80) return SCORE_BANDS.elite;
  if (score >= 60) return SCORE_BANDS.high;
  if (score >= 40) return SCORE_BANDS.medium;
  return SCORE_BANDS.low;
}

// Coverage Badge Colors
const COVERAGE_COLORS = {
  'High': { bg: 'bg-emerald-100', text: 'text-emerald-700', tooltip: 'Strong observational confidence. Multiple verified data sources.' },
  'Medium': { bg: 'bg-amber-100', text: 'text-amber-700', tooltip: 'Moderate observational confidence. Some addresses may be unverified.' },
  'Low': { bg: 'bg-gray-100', text: 'text-gray-500', tooltip: 'Limited observational confidence. Data may be incomplete.' },
};

// ============================================
// COMPONENTS
// ============================================

function CoverageBadge({ coverage }) {
  const band = coverage?.band || 'Low';
  const score = coverage?.score || 0;
  const colors = COVERAGE_COLORS[band] || COVERAGE_COLORS.Low;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help ${colors.bg} ${colors.text}`}>
          {score}%
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs max-w-40">
          <p className="font-semibold mb-1">Coverage: {band}</p>
          <p>{colors.tooltip}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function EdgeScoreBar({ score }) {
  const band = getScoreBand(score);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help" data-testid="edge-score-bar">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${band.color} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 w-8">{score}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs max-w-48">
          <p className="font-semibold mb-1">Edge Score: {band.label}</p>
          <p>Structural influence based on volume, connectivity, activity. NOT a trading signal.</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function TypeBadge({ type }) {
  const badge = TYPE_BADGES[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function SourceBadge({ sourceLevel }) {
  const badge = SOURCE_BADGES[sourceLevel] || SOURCE_BADGES.behavioral;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.color} cursor-help`}>
          {badge.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-semibold">{badge.label}</p>
          {sourceLevel === 'verified' && <p>Confirmed via public disclosure</p>}
          {sourceLevel === 'attributed' && <p>Attributed via correlation (penalty applied)</p>}
          {sourceLevel === 'behavioral' && <p>Pattern-based only (view only)</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function FlowRoleBadge({ flowRole }) {
  const badge = FLOW_ROLE_BADGES[flowRole] || FLOW_ROLE_BADGES.neutral;
  const Icon = badge.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.color} cursor-help`}>
          <Icon className="w-3 h-3" />
          {badge.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs max-w-40">
          <p className="font-semibold">{badge.label}</p>
          {flowRole === 'accumulator' && <p>Net inflow &gt; 30% of total volume</p>}
          {flowRole === 'distributor' && <p>Net outflow &gt; 30% of total volume</p>}
          {flowRole === 'market_maker_like' && <p>High bidirectional flow + frequency</p>}
          {flowRole === 'neutral' && <p>Balanced flow pattern</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// A4-FE-3: Temporal Context Badge
function TemporalBadge({ actorId }) {
  const [temporal, setTemporal] = useState(null);
  
  useEffect(() => {
    // Fetch temporal context for actor
    const fetchTemporal = async () => {
      try {
        const res = await fetch(`${API_URL}/api/actors-builder/${actorId}/temporal`);
        const data = await res.json();
        if (data.ok) {
          setTemporal(data.data);
        }
      } catch (err) {
        // Silent fail - temporal is optional
      }
    };
    fetchTemporal();
  }, [actorId]);
  
  if (!temporal) return null;
  
  const { badge, description } = temporal;
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-700',
    gray: 'bg-gray-100 text-gray-600',
    amber: 'bg-amber-100 text-amber-700',
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help ${colorClasses[badge.color] || colorClasses.gray}`}>
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs max-w-48">
          <p className="font-semibold mb-1">{description}</p>
          <p className="text-gray-400 italic">Fact-based. Not a prediction.</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Actor Row Component with A4 updates
function ActorRow({ actor, onView }) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group"
      data-testid={`actor-row-${actor.actorId}`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Actor Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 truncate">
                {actor.actorName || actor.actorId}
              </span>
              <SourceBadge sourceLevel={actor.sourceLevel || 'behavioral'} />
              <CoverageBadge coverage={actor.coverage} />
              {/* A4-FE-3: Temporal Badge */}
              <TemporalBadge actorId={actor.actorId} />
            </div>
            <div className="flex items-center gap-2">
              <TypeBadge type={actor.actorType} />
              <FlowRoleBadge flowRole={actor.flowRole} />
            </div>
          </div>
        </div>
        
        {/* Center: Metrics */}
        <div className="hidden md:flex items-center gap-8 px-4">
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 mb-1 cursor-help border-b border-dashed border-gray-400">Edge Score</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">Structural influence based on volume, connectivity, and activity. NOT a trading signal.</p>
              </TooltipContent>
            </Tooltip>
            <EdgeScoreBar score={actor.edgeScore} />
          </div>
          
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 mb-1 cursor-help border-b border-dashed border-gray-400">Participation</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">Share of total network activity over the selected time window.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-900">
              {(actor.participation * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 mb-1 cursor-help border-b border-dashed border-gray-400">Coverage</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">Data completeness score. How much of the actor's on-chain activity is observed.</p>
              </TooltipContent>
            </Tooltip>
            <span className={`text-sm font-semibold ${
              actor.coverage?.band === 'High' ? 'text-emerald-600' :
              actor.coverage?.band === 'Medium' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {actor.coverage?.score || 0}%
            </span>
          </div>
          
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 mb-1 cursor-help border-b border-dashed border-gray-400">Volume (USD)</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">Total trading volume in USD over the selected time window.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-sm font-semibold text-gray-900">
              {formatUSD(actor.metrics?.totalVolumeUsd)}
            </span>
          </div>
        </div>
        
        {/* Right: Actions - A4-FE-4: CTA Graph */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/actors/correlation?focus=${actor.actorId}`}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            data-testid={`view-in-graph-${actor.actorId}`}
            title="View in Graph"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Graph
          </Link>
          <Link
            to={`/actors/${actor.actorId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-white hover:bg-gray-100 transition-colors"
            data-testid={`view-actor-${actor.actorId}`}
          >
            View
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      
      {/* Mobile: Metrics */}
      <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Score:</span>
          <EdgeScoreBar score={actor.edgeScore} />
        </div>
        <span className="text-xs text-gray-600">
          {formatUSD(actor.metrics?.totalVolumeUsd)}
        </span>
      </div>
    </div>
  );
}

// Filter Panel
function FilterPanel({ filters, onChange, onClear }) {
  const hasFilters = filters.type || filters.sourceLevel || filters.flowRole || filters.minScore > 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
        </div>
        {hasFilters && (
          <button 
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            data-testid="clear-filters"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select 
            value={filters.type || ''}
            onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            data-testid="filter-type"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_BADGES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        
        {/* Source Level */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Source</label>
          <select 
            value={filters.sourceLevel || ''}
            onChange={(e) => onChange({ ...filters, sourceLevel: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            data-testid="filter-source"
          >
            <option value="">All Sources</option>
            {Object.entries(SOURCE_BADGES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        
        {/* Flow Role */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Flow Role</label>
          <select 
            value={filters.flowRole || ''}
            onChange={(e) => onChange({ ...filters, flowRole: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            data-testid="filter-flow-role"
          >
            <option value="">All Roles</option>
            {Object.entries(FLOW_ROLE_BADGES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        
        {/* Min Score */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Score: {filters.minScore || 0}</label>
          <input 
            type="range"
            min="0"
            max="100"
            value={filters.minScore || 0}
            onChange={(e) => onChange({ ...filters, minScore: parseInt(e.target.value) || 0 })}
            className="w-full"
            data-testid="filter-min-score"
          />
        </div>
      </div>
    </div>
  );
}

// Pagination
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        data-testid="prev-page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <span className="text-sm text-gray-600 px-4">
        Page {page} of {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        data-testid="next-page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Helper
function formatUSD(value) {
  if (!value) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ============================================
// MAIN PAGE
// ============================================

export default function ActorsPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [summary, setSummary] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    window: '7d',
    type: undefined,
    sourceLevel: undefined,
    flowRole: undefined,
    minScore: 0,
    sort: 'edge_score',
    sortOrder: 'desc',
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load scores
  const loadScores = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        window: filters.window,
        page: page.toString(),
        limit: '20',
        sort: filters.sort,
        sortOrder: filters.sortOrder,
      });
      
      if (filters.flowRole) params.set('flowRole', filters.flowRole);
      if (filters.minScore > 0) params.set('minScore', filters.minScore.toString());
      
      const res = await fetch(`${API_URL}/api/actor-scores?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        // Client-side filtering for type (not supported by backend yet)
        let filtered = data.data;
        if (filters.type) {
          filtered = filtered.filter(s => s.actorType === filters.type);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(s => 
            (s.actorName || '').toLowerCase().includes(q) ||
            s.actorId.toLowerCase().includes(q)
          );
        }
        
        setScores(filtered);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load scores');
      }
    } catch (err) {
      console.error('Load scores error:', err);
      setError('Failed to connect to server');
    }
    
    setLoading(false);
  }, [filters, searchQuery]);
  
  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/actor-scores/summary?window=${filters.window}`);
      const data = await res.json();
      if (data.ok) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Load summary error:', err);
    }
  }, [filters.window]);
  
  useEffect(() => {
    loadScores(1);
    loadSummary();
  }, [loadScores, loadSummary]);
  
  const handlePageChange = (newPage) => {
    loadScores(newPage);
  };
  
  const handleClearFilters = () => {
    setFilters({
      ...filters,
      type: undefined,
      sourceLevel: undefined,
      flowRole: undefined,
      minScore: 0,
    });
    setSearchQuery('');
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="actors-page">
        <main className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Actors</h1>
              <span className="px-2 py-1 bg-emerald-100 rounded text-xs font-semibold text-emerald-700">
                L0 STRUCTURAL
              </span>
            </div>
            <p className="text-gray-500">
              Network participants ranked by structural influence.
              <span className="font-medium text-gray-700"> Scores reflect observed behavior, not predictions.</span>
            </p>
          </div>
          
          {/* EPIC A4 FINAL: Info Block - What is this tab? */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">
                  Actors = aggregated profiles of network participants
                </p>
                <p className="text-gray-600">
                  They show <span className="font-medium">structural role</span>, not profitability or prediction.
                  Data comes from on-chain analysis of wallets, entities, and flow patterns.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                  <span><span className="font-medium">Actor</span> = aggregated identity</span>
                  <span><span className="font-medium">Wallet</span> = single address</span>
                  <span><span className="font-medium">Entity</span> = known organization</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">Total Actors</div>
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">Avg Edge Score</div>
                <div className="text-2xl font-bold text-gray-900">{summary.avgEdgeScore}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">Elite (≥80)</div>
                <div className="text-2xl font-bold text-purple-600">{summary.distribution?.elite || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">High (≥60)</div>
                <div className="text-2xl font-bold text-emerald-600">{summary.distribution?.high || 0}</div>
              </div>
            </div>
          )}
          
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actors..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                data-testid="search-input"
              />
            </div>
            
            {/* Window Selector */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
              {['24h', '7d', '30d'].map(w => (
                <button
                  key={w}
                  onClick={() => setFilters({ ...filters, window: w })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filters.window === w 
                      ? 'bg-white text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid={`window-${w}`}
                >
                  {w}
                </button>
              ))}
            </div>
            
            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium"
              data-testid="sort-select"
            >
              <option value="edge_score">Sort: Edge Score</option>
              <option value="participation">Sort: Participation</option>
              <option value="volume">Sort: Volume</option>
            </select>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                showFilters ? 'bg-white text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
              data-testid="toggle-filters"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel 
              filters={filters} 
              onChange={setFilters} 
              onClear={handleClearFilters}
            />
          )}
          
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Not a trading signal</p>
                <p>Edge Scores reflect network position and data coverage based on volume, connectivity, and activity patterns. This is structural analysis, not performance prediction.</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={() => loadScores(1)} 
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Retry
              </button>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 mb-2">No actors found</p>
              <p className="text-xs text-gray-400">Try adjusting filters or run score calculation first</p>
            </div>
          ) : (
            <>
              <div className="space-y-3" data-testid="actors-list">
                {scores.map(actor => (
                  <ActorRow key={actor.actorId} actor={actor} />
                ))}
              </div>
              
              <Pagination 
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
              
              <div className="mt-4 text-center text-xs text-gray-400">
                Showing {scores.length} of {pagination.total} actors
              </div>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
