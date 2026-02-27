/**
 * SmartFollowersPanel - Main component for Smart Followers section
 * 
 * Shows:
 * - Summary card with score
 * - Tier distribution bars
 * - Top followers table
 * - Explain block
 */
import { useState, useEffect } from 'react';
import { Users, Crown, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Tier colors
const TIER_COLORS = {
  elite: '#8b5cf6',
  high: '#22c55e',
  upper_mid: '#3b82f6',
  mid: '#06b6d4',
  low_mid: '#f59e0b',
  low: '#ef4444',
};

const TIER_LABELS = {
  elite: 'Elite',
  high: 'High',
  upper_mid: 'Upper-Mid',
  mid: 'Mid',
  low_mid: 'Low-Mid',
  low: 'Low',
};

// Progress bar component
const ProgressBar = ({ value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colors[color] || 'bg-blue-500'} transition-all duration-500`}
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
};

// Tier badge component
const TierBadge = ({ tier }) => {
  const color = TIER_COLORS[tier] || '#6b7280';
  const label = TIER_LABELS[tier] || tier;
  
  return (
    <span 
      className="px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
};

// Summary card
const SummaryCard = ({ data }) => {
  const scorePercent = Math.round(data.smart_followers_score_0_1 * 100);
  
  let verdict = 'Weak audience';
  let verdictColor = 'text-red-600';
  
  if (scorePercent >= 75) {
    verdict = 'Strong smart audience';
    verdictColor = 'text-green-600';
  } else if (scorePercent >= 55) {
    verdict = 'Good smart audience';
    verdictColor = 'text-blue-600';
  } else if (scorePercent >= 35) {
    verdict = 'Average audience';
    verdictColor = 'text-amber-600';
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Smart Followers Score</h3>
            <p className={`text-sm font-medium ${verdictColor}`}>{verdict}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-600">{scorePercent}</div>
          <div className="text-sm text-gray-500">out of 100</div>
        </div>
      </div>
      
      <ProgressBar 
        value={data.smart_followers_score_0_1} 
        color={scorePercent >= 60 ? 'purple' : scorePercent >= 35 ? 'amber' : 'red'} 
      />
      
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{data.followers_count}</div>
          <div className="text-xs text-gray-500">Total Followers</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{data.follower_value_index.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Value Index</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round((data.breakdown.elite_weight_share + data.breakdown.high_weight_share) * 100)}%
          </div>
          <div className="text-xs text-gray-500">Elite+High Share</div>
        </div>
      </div>
    </div>
  );
};

// Tier distribution bars
const TierDistribution = ({ breakdown }) => {
  const tiers = ['elite', 'high', 'upper_mid', 'mid', 'low_mid', 'low'];
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Tier Distribution
      </h4>
      <div className="space-y-3">
        {tiers.map(tier => {
          const share = breakdown.tier_shares[tier] || 0;
          const count = breakdown.tier_counts[tier] || 0;
          
          return (
            <div key={tier} className="flex items-center gap-3">
              <div className="w-20">
                <TierBadge tier={tier} />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.max(share * 100, share > 0 ? 5 : 0)}%`,
                      backgroundColor: TIER_COLORS[tier],
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-600">
                {Math.round(share * 100)}% ({count})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Top followers table
const TopFollowersTable = ({ followers }) => {
  if (!followers || followers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Top Smart Followers
        </h4>
        <div className="text-center text-gray-500 py-4">
          No follower data available
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Top Smart Followers
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Account</th>
              <th className="pb-2 font-medium text-center">Authority</th>
              <th className="pb-2 font-medium text-center">Tier</th>
              <th className="pb-2 font-medium text-right">Impact</th>
            </tr>
          </thead>
          <tbody>
            {followers.slice(0, 8).map((follower, idx) => (
              <tr 
                key={follower.follower_id} 
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: TIER_COLORS[follower.authority_tier] }}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-gray-900">{follower.handle || follower.follower_id}</span>
                  </div>
                </td>
                <td className="py-2 text-center">
                  <span className="font-mono text-gray-700">
                    {(follower.authority_score_0_1 * 100).toFixed(0)}
                  </span>
                </td>
                <td className="py-2 text-center">
                  <TierBadge tier={follower.authority_tier} />
                </td>
                <td className="py-2 text-right">
                  <span className="text-green-600 font-medium">
                    +{(follower.share_of_total * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Explain block
const ExplainBlock = ({ explain }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Analysis Explanation
        </h4>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-gray-800 font-medium">{explain.summary}</p>
          </div>
          
          {/* Drivers */}
          {explain.drivers && explain.drivers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Positive Factors</span>
              </div>
              <ul className="space-y-1">
                {explain.drivers.map((driver, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Concerns */}
          {explain.concerns && explain.concerns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Concerns</span>
              </div>
              <ul className="space-y-1">
                {explain.concerns.map((concern, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">⚠</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommendations */}
          {explain.recommendations && explain.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {explain.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
export default function SmartFollowersPanel({ accountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId) return;
      
      setLoading(true);
      try {
        // Fetch smart followers data - use real data
        const res = await fetch(
          `${BACKEND_URL}/api/connections/smart-followers/${accountId}`
        );
        const json = await res.json();
        
        if (json.ok) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error fetching smart followers:', err);
        setError(err.message);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [accountId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Unable to load smart followers data</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="smart-followers-panel">
      <SummaryCard data={data} />
      
      <div className="grid grid-cols-2 gap-4">
        <TierDistribution breakdown={data.breakdown} />
        <TopFollowersTable followers={data.top_followers} />
      </div>
      
      <ExplainBlock explain={data.explain} />
    </div>
  );
}
