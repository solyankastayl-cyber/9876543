/**
 * ConnectionsPage - Main page with accounts table
 * Mobile-first responsive design
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronDown, X } from 'lucide-react';
import { IconInfluencer, IconNetwork, IconRadar, IconFund, IconTrophy } from '../../components/icons/FomoIcons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import '../../styles/connections-mobile.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Risk level badge component
const RiskBadge = ({ level }) => {
  const styles = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
    unknown: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium risk-badge ${styles[level] || styles.unknown}`}>
      {level?.charAt(0).toUpperCase() + level?.slice(1) || 'Unknown'}
    </span>
  );
};

// Score display component
const ScoreDisplay = ({ value, max = 1000 }) => {
  const percent = (value / max) * 100;
  let color = 'bg-gray-300';
  if (percent >= 70) color = 'bg-green-500';
  else if (percent >= 40) color = 'bg-yellow-500';
  else if (percent > 0) color = 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2 score-display">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden progress-bar">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 score-value">{Math.round(value)}</span>
    </div>
  );
};

// Mobile Card Component
const ConnectionCard = ({ acc }) => {
  const handle = acc.handle || acc.username || acc.author_id || acc._id;
  const accId = acc.author_id || acc._id || acc.handle;
  const influenceScore = acc.scores?.influence_score || acc.influenceScore || 0;
  const riskLevel = acc.scores?.risk_level || acc.riskLevel || 'unknown';
  
  return (
    <Link
      to={`/connections/${accId}`}
      className="connection-card block bg-white border border-gray-200 rounded-xl p-4"
      data-testid={`connection-card-${handle}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
          {handle?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">@{handle}</div>
          <RiskBadge level={riskLevel} />
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-gray-900">{influenceScore}</div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">{formatNumber(acc.followers)}</div>
          <div className="text-xs text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">{acc.activity?.posts_count || 0}</div>
          <div className="text-xs text-gray-500">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {((acc.activity?.avg_engagement_quality || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Engage</div>
        </div>
      </div>
    </Link>
  );
};

// Format number helper
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Filter Panel Component
const FilterPanel = ({ filters, setFilters, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      influenceMin: 0,
      influenceMax: 1000,
      riskLevel: [],
      activity: 'all',
      timeWindow: 30,
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
  };

  return (
    <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-32px)] bg-white rounded-xl shadow-xl border border-gray-200 p-5 z-50 connections-filter-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Influence Score Range */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Influence Score</label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={1000}
            value={localFilters.influenceMin}
            onChange={(e) => setLocalFilters({ ...localFilters, influenceMin: Number(e.target.value) })}
            className="w-20 text-center"
          />
          <span className="text-gray-400">—</span>
          <Input
            type="number"
            min={0}
            max={1000}
            value={localFilters.influenceMax}
            onChange={(e) => setLocalFilters({ ...localFilters, influenceMax: Number(e.target.value) })}
            className="w-20 text-center"
          />
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={localFilters.influenceMax}
          onChange={(e) => setLocalFilters({ ...localFilters, influenceMax: Number(e.target.value) })}
          className="w-full mt-2 accent-blue-600"
        />
      </div>

      {/* Risk Level */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
        <div className="flex gap-2 flex-wrap">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              onClick={() => {
                const current = localFilters.riskLevel || [];
                setLocalFilters({
                  ...localFilters,
                  riskLevel: current.includes(level)
                    ? current.filter((l) => l !== level)
                    : [...current, level],
                });
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                (localFilters.riskLevel || []).includes(level)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Window */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Time Window</label>
        <div className="flex gap-2 flex-wrap">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setLocalFilters({ ...localFilters, timeWindow: days })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                localFilters.timeWindow === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <Button variant="outline" onClick={handleReset} className="flex-1 min-h-[44px]">
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">
          Apply
        </Button>
      </div>
    </div>
  );
};

// Compare Modal Component
const CompareModal = ({ isOpen, onClose, accounts, selectedAccounts, setSelectedAccounts }) => {
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (selectedAccounts.length !== 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          left: selectedAccounts[0],
          right: selectedAccounts[1],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCompareResult(data.data);
      }
    } catch (err) {
      console.error('Compare error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedAccounts.length === 2) {
      handleCompare();
    } else {
      setCompareResult(null);
    }
  }, [selectedAccounts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white compare-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Compare Accounts</DialogTitle>
        </DialogHeader>

        {/* Account Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 compare-modal-grid">
          {[0, 1].map((idx) => (
            <div key={idx} className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Account {idx + 1}</label>
              <select
                value={selectedAccounts[idx] || ''}
                onChange={(e) => {
                  const newSelected = [...selectedAccounts];
                  newSelected[idx] = e.target.value;
                  setSelectedAccounts(newSelected);
                }}
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.author_id} value={acc.handle}>
                    @{acc.handle}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Compare Results */}
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading comparison...</div>
        )}

        {compareResult && (
          <div className="space-y-6">
            {/* Audience Overlap */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Audience Overlap</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center compare-results-grid">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {(compareResult.audience_overlap.a_to_b * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">A → B</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {(compareResult.audience_overlap.b_to_a * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">B → A</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">
                    {compareResult.audience_overlap.shared_users.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Shared</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {(compareResult.audience_overlap.jaccard_similarity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Jaccard</div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm compare-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Metric</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">@{compareResult.left.handle}</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">@{compareResult.right.handle}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 text-gray-600">Influence Score</td>
                    <td className="px-4 py-3 text-center font-medium">{compareResult.left.influence_score}</td>
                    <td className="px-4 py-3 text-center font-medium">{compareResult.right.influence_score}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600">Active Audience</td>
                    <td className="px-4 py-3 text-center font-medium">{compareResult.left.active_audience_size?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center font-medium">{compareResult.right.active_audience_size?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !compareResult && selectedAccounts.length < 2 && (
          <div className="text-center py-8 text-gray-400">
            Select two accounts to compare
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Main Page Component
export default function ConnectionsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'scores.influence_score', direction: 'desc' });
  const [filters, setFilters] = useState({
    influenceMin: 0,
    influenceMax: 1000,
    riskLevel: [],
    activity: 'all',
    timeWindow: 30,
  });

  // Fetch accounts from unified accounts (seed + imported influencers)
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/connections/unified?limit=100`);
        const data = await res.json();
        if (data.ok) {
          // Transform unified data to match expected format
          const items = data.data?.map(acc => ({
            author_id: acc.id || acc.handle,
            handle: acc.handle || acc.username,
            username: acc.handle || acc.username,
            name: acc.title || acc.name,
            avatar: acc.avatar,
            followers: acc.followers || 0,
            following: acc.following || 0,
            scores: {
              influence_score: acc.twitterScore || Math.round((acc.influence || 0.5) * 1000),
              risk_level: acc.confidence > 0.7 ? 'low' : acc.confidence > 0.4 ? 'medium' : 'high',
            },
            influenceScore: acc.twitterScore || Math.round((acc.influence || 0.5) * 1000),
            riskLevel: acc.confidence > 0.7 ? 'low' : acc.confidence > 0.4 ? 'medium' : 'high',
            activity: {
              posts_count: acc.tweetCount || 0,
              avg_engagement_quality: acc.engagementRate || 0.03,
            },
            categories: acc.categories || [],
            verified: acc.verified || false,
            source: acc.source,
          })) || [];
          setAccounts(items);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((acc) => {
        const handle = acc.handle || acc.username || acc.author_id || '';
        return handle.toLowerCase().includes(s);
      });
    }

    result = result.filter((acc) => {
      const score = acc.scores?.influence_score || acc.influenceScore || 0;
      return score >= filters.influenceMin && score <= filters.influenceMax;
    });

    if (filters.riskLevel.length > 0) {
      result = result.filter((acc) => {
        const risk = acc.scores?.risk_level || acc.riskLevel || 'unknown';
        return filters.riskLevel.includes(risk);
      });
    }

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'scores.influence_score') {
        aVal = a.scores?.influence_score || a.influenceScore || 0;
        bVal = b.scores?.influence_score || b.influenceScore || 0;
      } else {
        aVal = sortConfig.key.split('.').reduce((o, k) => o?.[k], a) || 0;
        bVal = sortConfig.key.split('.').reduce((o, k) => o?.[k], b) || 0;
      }
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [accounts, search, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 connections-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Connections</h1>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Analyze Twitter account influence and engagement metrics
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-2 shrink-0 compare-btn"
              data-testid="compare-button"
            >
              <IconInfluencer size={16} />
              <span className="hidden sm:inline">Compare</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 connections-container">
        {/* Sub-navigation tabs - horizontal scroll on mobile */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 connections-tabs" data-testid="connections-tabs">
          <span className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white flex items-center gap-2 shrink-0">
            <IconInfluencer size={16} />
            <span>Influencers</span>
          </span>
          <Link
            to="/connections/graph"
            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shrink-0"
          >
            <IconNetwork size={16} />
            <span>Graph</span>
          </Link>
          <Link
            to="/connections/radar"
            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shrink-0"
          >
            <IconRadar size={16} />
            <span>Radar</span>
          </Link>
          <Link
            to="/connections/backers"
            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shrink-0"
          >
            <IconFund size={16} />
            <span>Backers</span>
          </Link>
          <Link
            to="/connections/reality"
            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shrink-0"
          >
            <IconTrophy size={16} />
            <span>Leaderboard</span>
          </Link>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 connections-search-bar">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200 w-full"
              data-testid="search-input"
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full sm:w-auto justify-center filter-btn"
              data-testid="filter-button"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.riskLevel.length > 0 || filters.influenceMin > 0 || filters.influenceMax < 1000) && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </Button>
            {showFilters && (
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>
        </div>

        {/* Stats Summary - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 connections-stats">
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 stat-value">{accounts.length}</div>
            <div className="text-xs sm:text-sm text-gray-500 stat-label">Total Accounts</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600 stat-value">
              {accounts.filter((a) => a.scores?.risk_level === 'low').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 stat-label">Low Risk</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600 stat-value">
              {accounts.filter((a) => a.scores?.risk_level === 'medium').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 stat-label">Medium Risk</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-red-600 stat-value">
              {accounts.filter((a) => a.scores?.risk_level === 'high').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 stat-label">High Risk</div>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden connections-cards space-y-3">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              No accounts found. Add test data via API.
            </div>
          ) : (
            filteredAccounts.map((acc) => (
              <ConnectionCard key={acc.author_id} acc={acc} />
            ))
          )}
        </div>

        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto connections-table-wrapper">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No accounts found. Add test data via API.
              </div>
            ) : (
              <table className="w-full connections-table" data-testid="connections-table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('handle')}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Account
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('scores.influence_score')}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Influence
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('scores.risk_level')}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Risk
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <span className="text-sm font-semibold text-gray-600">Followers</span>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden lg:table-cell">
                      <span className="text-sm font-semibold text-gray-600">Engagement</span>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden lg:table-cell">
                      <span className="text-sm font-semibold text-gray-600">Posts</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAccounts.map((acc) => {
                    const handle = acc.handle || acc.username || acc.author_id || acc._id;
                    const accId = acc.author_id || acc._id || acc.handle;
                    const influenceScore = acc.scores?.influence_score || acc.influenceScore || 0;
                    const riskLevel = acc.scores?.risk_level || acc.riskLevel || 'unknown';
                    return (
                    <tr
                      key={accId}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <Link
                          to={`/connections/${accId}`}
                          className="flex items-center gap-3"
                          data-testid={`account-link-${handle}`}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                            {handle?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">@{handle}</div>
                            <div className="text-xs text-gray-400 truncate hidden lg:block">{acc.displayName || acc.name || accId}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <ScoreDisplay value={influenceScore} />
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <RiskBadge level={riskLevel} />
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {formatNumber(acc.followers)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-700">
                          {((acc.activity?.avg_engagement_quality || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-700">
                          {acc.activity?.posts_count || 0}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      <CompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        accounts={accounts}
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}
      />
    </div>
  );
}
