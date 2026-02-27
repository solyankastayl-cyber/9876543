import React, { useState } from 'react';
import { CheckCircle, ExternalLink, Info, Scale, Bookmark, BookmarkCheck, RefreshCw } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function getScoreValue(account, facet) {
  switch (facet) {
    case 'SMART': return clamp01((account.smart ?? account.smartScore ?? 0));
    case 'INFLUENCE': return clamp01((account.influence ?? account.influenceScore ?? 0));
    case 'EARLY': return clamp01((account.early ?? account.earlyScore ?? 0));
    case 'VC': return clamp01((account.authority ?? 0));
    default: return clamp01(account.confidence ?? 0.5);
  }
}

function getScoreLabel(account, facet) {
  const value = getScoreValue(account, facet);
  const percent = Math.round(value * 100);
  switch (facet) {
    case 'SMART': return `Smart ${percent}%`;
    case 'INFLUENCE': return `Influence ${percent}%`;
    case 'EARLY': return `Early ${percent}%`;
    case 'VC': return `Authority ${percent}%`;
    default: return `Score ${percent}%`;
  }
}

function getScoreColor(value) {
  if (value >= 0.8) return 'bg-green-500';
  if (value >= 0.6) return 'bg-yellow-500';
  if (value >= 0.4) return 'bg-orange-500';
  return 'bg-gray-400';
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function UnifiedAccountCard({ 
  item, 
  facet, 
  onOpen, 
  onCompare, 
  onWatchlist, 
  onExplain,
  onRefresh,
  isInWatchlist = false,
  isCompareMode = false 
}) {
  const [showExplain, setShowExplain] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scoreValue = getScoreValue(item, facet);
  const scoreLabel = getScoreLabel(item, facet);
  const scoreColor = getScoreColor(scoreValue);

  const kindLabel = item.kind === 'TWITTER' ? 'Twitter' : item.kind === 'BACKER' ? 'Backer' : 'Project';
  const kindColor = item.kind === 'BACKER' 
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    : item.kind === 'PROJECT'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  // Get engagement value
  const engagement = item.engagement || item.engagementRate || 0;
  const engagementPercent = engagement > 1 ? engagement : engagement * 100;

  const handleRefreshEngagement = async (e) => {
    e.stopPropagation();
    if (refreshing) return;
    
    const handle = item.handle?.replace('@', '') || item.title;
    if (!handle) return;

    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections/unified/refresh-engagement/${handle}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div
      onClick={() => onOpen?.(item)}
      data-testid={`account-card-${item.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
          item.kind === 'BACKER' ? 'bg-purple-500' : item.kind === 'PROJECT' ? 'bg-green-500' : 'bg-blue-500'
        }`}>
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            item.title?.[0] || item.label?.[0] || '?'
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">
              {item.title || item.label}
            </h3>
            {item.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
          </div>
          
          {item.handle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {item.handle}
            </p>
          )}

          {item.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.categories.slice(0, 3).map((cat) => (
                <span key={cat} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Kind badge */}
        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${kindColor}`}>
          {kindLabel}
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{scoreLabel}</span>
          {item.confidence != null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Conf {Math.round(item.confidence * 100)}%
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${scoreColor} transition-all`}
            style={{ width: `${Math.round(scoreValue * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid - Followers & Engagement */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
          <div className="font-bold text-gray-900 dark:text-white">
            {formatNumber(item.followers)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 uppercase text-[10px]">followers</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 text-center">
          <div className="font-bold text-green-600 dark:text-green-400">
            {engagementPercent.toFixed(2)}%
          </div>
          <div className="text-gray-500 dark:text-gray-400 uppercase text-[10px]">engagement</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
        {/* Why This Matters */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExplain ? onExplain(item) : setShowExplain(true);
          }}
          data-testid={`explain-btn-${item.id}`}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <Info className="w-3 h-3" />
          Why
        </button>

        {/* Compare */}
        {onCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompare(item);
            }}
            data-testid={`compare-btn-${item.id}`}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
              isCompareMode 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Scale className="w-3 h-3" />
            Compare
          </button>
        )}

        {/* Watchlist */}
        {onWatchlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchlist(item);
            }}
            data-testid={`watchlist-btn-${item.id}`}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
              isInWatchlist
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isInWatchlist ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
            {isInWatchlist ? 'Saved' : 'Save'}
          </button>
        )}

        {/* Refresh Engagement */}
        {item.kind === 'TWITTER' && (
          <button
            onClick={handleRefreshEngagement}
            disabled={refreshing}
            data-testid={`refresh-btn-${item.id}`}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ml-auto ${
              refreshing
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '...' : 'Refresh'}
          </button>
        )}
      </div>
    </div>
  );
}
