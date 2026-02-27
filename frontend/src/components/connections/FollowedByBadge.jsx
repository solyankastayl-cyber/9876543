/**
 * FollowedByBadge - Shows "Followed by Top Accounts" badge
 * 
 * PHASE A1: Visual indicator for accounts followed by high-authority accounts
 */

import React, { useState, useEffect } from 'react';
import { Crown, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchFollowers } from '../../api/connectionsGraphV2.api';

export default function FollowedByBadge({ accountId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    
    const load = async () => {
      try {
        const res = await fetchFollowers(accountId);
        if (res.ok) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load followers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [accountId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-700/50 rounded h-6 w-32" />
    );
  }

  if (!data || data.followerCount === 0) {
    return null;
  }

  const { badge, followScore, followerCount, topFollowers, followers } = data;

  // Compact badge view
  if (compact) {
    if (!badge) return null;
    
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                   bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30"
        title={`Followed by ${topFollowers.length} top accounts`}
      >
        <Crown className="w-3 h-3" />
        Top Follow
      </span>
    );
  }

  return (
    <div className="bg-gray-800/80 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
        data-testid="followed-by-toggle"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${badge ? 'bg-amber-500/20' : 'bg-gray-700/50'}`}>
            {badge ? (
              <Crown className="w-4 h-4 text-amber-400" />
            ) : (
              <Users className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              Followed by {followerCount} accounts
            </div>
            <div className="text-xs text-gray-400">
              Follow Score: {Math.round(followScore * 100)}%
            </div>
          </div>
        </div>
        
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {/* Top Followers Badge */}
      {badge && topFollowers.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Crown className="w-3 h-3" />
            <span>Followed by Top:</span>
            <span className="text-gray-300">
              {topFollowers.slice(0, 3).map(f => f.label).join(', ')}
              {topFollowers.length > 3 && ` +${topFollowers.length - 3} more`}
            </span>
          </div>
        </div>
      )}
      
      {/* Expanded list */}
      {expanded && followers && followers.length > 0 && (
        <div className="border-t border-gray-700 max-h-60 overflow-y-auto">
          {followers.map((follower, idx) => (
            <div 
              key={follower.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-700/30 border-b border-gray-700/50 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                <span className="text-sm text-white">{follower.label}</span>
                {follower.authority > 0.7 && (
                  <Crown className="w-3 h-3 text-amber-400" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  Auth: {Math.round(follower.authority * 100)}%
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(follower.followedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
