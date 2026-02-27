/**
 * WalletProfileCard - B1 Wallet Intelligence UI
 * 
 * Displays wallet profile with:
 * - Human-readable headline and description
 * - Behavioral tags
 * - Activity metrics
 * - Confidence indicator
 * 
 * UI Principles:
 * ✅ Show behavioral labels, not raw data
 * ✅ Tooltips for explanations
 * ✅ Confidence badge
 * ❌ Don't show raw tx hash, gas, nonce
 */
import { 
  Wallet, Activity, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Clock, Coins,
  Zap, Shield, AlertTriangle, Info, Users
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Tag configuration with colors and descriptions
const TAG_CONFIG = {
  // Activity
  active: { 
    color: 'bg-green-100 text-green-700', 
    label: 'Active',
    description: 'Regular activity in the last 30 days'
  },
  dormant: { 
    color: 'bg-gray-100 text-gray-600', 
    label: 'Dormant',
    description: 'No activity for 90+ days'
  },
  new: { 
    color: 'bg-blue-100 text-blue-700', 
    label: 'New',
    description: 'Wallet created within last 7 days'
  },
  
  // Volume
  'high-volume': { 
    color: 'bg-purple-100 text-purple-700', 
    label: 'High Volume',
    description: 'Total volume over $1M'
  },
  'low-volume': { 
    color: 'bg-gray-100 text-gray-500', 
    label: 'Low Volume',
    description: 'Total volume under $1K'
  },
  whale: { 
    color: 'bg-amber-100 text-amber-700', 
    label: 'Whale',
    description: 'Total volume over $10M'
  },
  
  // Behavior
  trader: { 
    color: 'bg-cyan-100 text-cyan-700', 
    label: 'Trader',
    description: 'Frequent trading activity (2+ tx/day)'
  },
  holder: { 
    color: 'bg-emerald-100 text-emerald-700', 
    label: 'Holder',
    description: 'Long-term holding behavior'
  },
  flipper: { 
    color: 'bg-red-100 text-red-700', 
    label: 'Flipper',
    description: 'Quick buy-sell patterns'
  },
  degen: { 
    color: 'bg-pink-100 text-pink-700', 
    label: 'Degen',
    description: 'High-risk, bursty behavior'
  },
  
  // Technical
  'bridge-user': { 
    color: 'bg-indigo-100 text-indigo-700', 
    label: 'Bridge User',
    description: 'Uses cross-chain bridges frequently'
  },
  'cex-like': { 
    color: 'bg-orange-100 text-orange-700', 
    label: 'CEX-like',
    description: 'Exchange-like transaction patterns'
  },
  contract: { 
    color: 'bg-slate-100 text-slate-700', 
    label: 'Contract',
    description: 'Smart contract address'
  },
  multisig: { 
    color: 'bg-violet-100 text-violet-700', 
    label: 'Multisig',
    description: 'Multi-signature wallet'
  },
};

// Format large numbers
function formatNumber(num) {
  if (num === undefined || num === null) return '-';
  if (Math.abs(num) >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K';
  }
  return '$' + num.toFixed(0);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short',
    day: 'numeric'
  });
}

// Confidence indicator
function ConfidenceIndicator({ confidence }) {
  const level = confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';
  const color = confidence >= 0.8 
    ? 'text-green-600 bg-green-50' 
    : confidence >= 0.5 
      ? 'text-amber-600 bg-amber-50' 
      : 'text-gray-600 bg-gray-50';
  
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
          <Shield className="w-3 h-3" />
          {level} confidence
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Profile confidence: {Math.round(confidence * 100)}%</p>
        <p className="text-xs text-gray-400 mt-1">
          Based on transaction count and activity duration
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Tag badge
function TagBadge({ tag }) {
  const config = TAG_CONFIG[tag] || { 
    color: 'bg-gray-100 text-gray-600', 
    label: tag,
    description: 'Behavioral tag'
  };
  
  return (
    <Tooltip>
      <TooltipTrigger>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Main component
export default function WalletProfileCard({ profile }) {
  if (!profile) return null;
  
  const { 
    address, 
    chain, 
    activity, 
    flows, 
    behavior, 
    tokens, 
    tags, 
    confidence, 
    summary 
  } = profile;
  
  // Determine net flow direction
  const isNetPositive = flows?.netFlow > 0;
  const NetFlowIcon = isNetPositive ? TrendingUp : TrendingDown;
  const netFlowColor = isNetPositive ? 'text-green-600' : 'text-red-600';
  
  return (
    <TooltipProvider>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" data-testid="wallet-profile-card">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {summary?.headline || 'Wallet Profile'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs text-gray-500 font-mono">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </code>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{chain}</span>
                </div>
              </div>
            </div>
            <ConfidenceIndicator confidence={confidence} />
          </div>
          
          {/* Summary description */}
          {summary?.description && (
            <p className="mt-3 text-sm text-gray-600">
              {summary.description}
            </p>
          )}
          
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {/* Net Flow */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <NetFlowIcon className={`w-3.5 h-3.5 ${netFlowColor}`} />
              Net Flow
            </div>
            <div className={`text-lg font-bold ${netFlowColor}`}>
              {isNetPositive ? '+' : ''}{formatNumber(flows?.netFlow)}
            </div>
          </div>
          
          {/* Total Volume */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Activity className="w-3.5 h-3.5" />
              Total Volume
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber((flows?.totalIn || 0) + (flows?.totalOut || 0))}
            </div>
          </div>
          
          {/* Transaction Count */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Zap className="w-3.5 h-3.5" />
              Transactions
            </div>
            <div className="text-lg font-bold text-gray-900">
              {activity?.txCount?.toLocaleString() || '-'}
            </div>
          </div>
          
          {/* Active Days */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Active Days
            </div>
            <div className="text-lg font-bold text-gray-900">
              {activity?.activeDays || '-'}
            </div>
          </div>
        </div>
        
        {/* Behavior Details */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Behavior Analysis</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {/* Dominant Action */}
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Primary Behavior</div>
              <div className="font-medium text-gray-900 capitalize">
                {behavior?.dominantAction || 'Mixed'}
              </div>
            </div>
            
            {/* Avg Transaction Size */}
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Avg. Transaction</div>
              <div className="font-medium text-gray-900">
                {formatNumber(flows?.avgTxSize)}
              </div>
            </div>
            
            {/* Activity Period */}
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Active Since</div>
              <div className="font-medium text-gray-900">
                {formatDate(activity?.firstSeen)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Tokens (if available) */}
        {tokens?.topTokens && tokens.topTokens.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">
                Top Tokens ({tokens.interactedCount} total)
              </span>
            </div>
            
            <div className="space-y-2">
              {tokens.topTokens.slice(0, 5).map((token, i) => (
                <div 
                  key={token.address || i}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200">
                      <span className="text-xs font-bold text-gray-600">
                        {(token.symbol || '?')[0]}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {token.symbol || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatNumber(token.buyVolume)}
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <ArrowDownRight className="w-3 h-3" />
                      {formatNumber(token.sellVolume)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
