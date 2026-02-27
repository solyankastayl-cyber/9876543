/**
 * Influencer Card Component - F1.1 FINAL
 * 
 * Displays:
 * - Identity (avatar, handle, name, badges)
 * - Twitter Score + Authority Score + colored bars
 * - Followers/Following
 * - Strong Connections with tooltip
 * - Top Followers (avatars)
 * - Reality Badge
 * - Engagement metrics
 */
import { Link } from 'react-router-dom';
import { Network, CheckCircle, AlertTriangle, XCircle, Heart, Clock, TrendingUp, Info, Twitter, Shield } from 'lucide-react';
import { getAuthorityColor, getGroupConfig, formatFollowers, METRIC_TOOLTIPS } from '../../config/influencer.config';

// Tooltip Component with word wrap for formula explanations
const MetricTooltip = ({ text, children, wide = false }) => (
  <div className="relative group inline-block">
    {children}
    <div className={`absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg text-left ${wide ? 'w-72' : 'w-56'}`}>
      {text}
      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// Score Bar Component (used for both Twitter and Authority)
const ScoreBar = ({ score, maxScore = 1000, label, tooltip, icon: Icon, color }) => {
  const percent = Math.min(100, (score / maxScore) * 100);
  const barColor = color || getAuthorityColor(score);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <MetricTooltip text={tooltip}>
          <span className="text-xs text-gray-500 flex items-center gap-1 cursor-help">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
            <Info className="w-3 h-3 text-gray-400" />
          </span>
        </MetricTooltip>
        <span className={`text-lg font-bold ${barColor.text}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: barColor.bar }}
        />
      </div>
    </div>
  );
};

// Group Badge with Tooltip
const GroupBadge = ({ groupId }) => {
  const labels = {
    INFLUENCE: 'Influence',
    SMART: 'Smart',
    MEDIA: 'Media',
    TRADING: 'Trading',
    NFT: 'NFT',
    POPULAR: 'Popular',
    VC: 'VC',
    EARLY: 'Early',
    MOST_SEARCHED: 'Hot',
  };
  const tooltips = {
    INFLUENCE: 'High-reach accounts with significant market impact',
    SMART: 'Linked to wallets with proven profitable trading history',
    MEDIA: 'News outlets, podcasters, and content creators',
    TRADING: 'Active traders sharing technical analysis',
    NFT: 'Focused on NFT collections and digital art',
    POPULAR: 'High follower count with mainstream appeal',
    VC: 'Venture capital firms and partners',
    EARLY: 'Historically identify trends before mainstream',
    MOST_SEARCHED: 'Trending accounts with high search volume',
  };
  const config = getGroupConfig(groupId);
  
  return (
    <MetricTooltip text={tooltips[groupId] || groupId}>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border cursor-help ${config.bg} ${config.text} ${config.border}`}>
        {labels[groupId] || groupId}
      </span>
    </MetricTooltip>
  );
};

// Reality Badge with detailed Tooltip
const RealityBadge = ({ badge }) => {
  const configs = {
    CONFIRMED: { 
      icon: CheckCircle, 
      color: 'text-green-500', 
      bg: 'bg-green-50', 
      label: 'Confirmed',
      tooltip: 'Reality CONFIRMED: Public statements match on-chain behavior (>70% alignment). This account walks the talk.'
    },
    MIXED: { 
      icon: AlertTriangle, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50', 
      label: 'Mixed',
      tooltip: 'Reality MIXED: Partial alignment between statements and actions (40-70%). Some discrepancies observed.'
    },
    RISKY: { 
      icon: XCircle, 
      color: 'text-red-500', 
      bg: 'bg-red-50', 
      label: 'Risky',
      tooltip: 'Reality RISKY: Frequent contradictions between public statements and on-chain activity (<40% alignment). Exercise caution.'
    },
  };
  const cfg = configs[badge] || configs.MIXED;
  const Icon = cfg.icon;
  
  return (
    <MetricTooltip text={cfg.tooltip} wide>
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg} cursor-help`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    </MetricTooltip>
  );
};

// Top Followers Preview with Tooltip
const TopFollowersPreview = ({ followers }) => {
  if (!followers?.length) return null;
  
  return (
    <MetricTooltip text={METRIC_TOOLTIPS.topFollowers}>
      <div className="flex items-center cursor-help">
        <div className="flex -space-x-2">
          {followers.slice(0, 5).map((f, i) => (
            <div 
              key={f.handle}
              className="relative group/avatar"
              style={{ zIndex: 5 - i }}
            >
              <img
                src={f.avatar}
                alt={f.handle}
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${f.handle}&background=random`; }}
              />
              {/* Individual Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                @{f.handle} ({f.authorityScore})
              </div>
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-2 flex items-center gap-1">
          Top followers
          <Info className="w-3 h-3" />
        </span>
      </div>
    </MetricTooltip>
  );
};

// Token Badge
const TokenBadge = ({ token }) => (
  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
    ${token}
  </span>
);

// Network Score Bar
const NetworkScoreBar = ({ score }) => {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#84CC16' : '#EAB308';
  return (
    <MetricTooltip text={METRIC_TOOLTIPS.networkScore}>
      <div className="flex items-center gap-2 cursor-help">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{score}</span>
      </div>
    </MetricTooltip>
  );
};

// Strong Connections with Tooltip
const StrongConnectionsDisplay = ({ count }) => (
  <MetricTooltip text={METRIC_TOOLTIPS.strongConnections}>
    <div className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-1 cursor-help">
      <Network className="w-4 h-4 text-blue-500" />
      {count}
    </div>
  </MetricTooltip>
);

export default function InfluencerCard({ influencer, view = 'grid', compareMode = false, onCompareClick }) {
  const isGrid = view === 'grid';
  
  const handleCardClick = (e) => {
    if (compareMode && onCompareClick) {
      e.preventDefault();
      e.stopPropagation();
      onCompareClick(influencer);
    }
  };
  
  if (isGrid) {
    // Grid View (Card) - CLICKABLE
    return (
      <Link 
        to={compareMode ? '#' : `/connections/influencers/${influencer.handle}`}
        onClick={handleCardClick}
        className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-200 overflow-hidden cursor-pointer"
        data-testid={`influencer-card-${influencer.handle}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <img
              src={influencer.avatar}
              alt={influencer.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random`; }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{influencer.name}</h3>
                <RealityBadge badge={influencer.realityBadge} />
              </div>
              <p className="text-sm text-gray-500">@{influencer.handle}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {influencer.groups?.slice(0, 2).map(g => (
                  <GroupBadge key={g} groupId={g} />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Scores Section - Twitter + Authority */}
        <div className="px-4 py-3 bg-gray-50 space-y-3">
          <ScoreBar 
            score={influencer.twitterScore || influencer.authorityScore} 
            label="Twitter Score"
            tooltip={METRIC_TOOLTIPS.twitterScore}
            icon={Twitter}
            color={{ text: 'text-blue-600', bar: '#3B82F6' }}
          />
          <ScoreBar 
            score={influencer.authorityScore} 
            label="Authority"
            tooltip={METRIC_TOOLTIPS.authorityScore}
            icon={Shield}
          />
        </div>
        
        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3 text-center border-b border-gray-100">
          <div>
            <div className="text-lg font-semibold text-gray-800">
              {formatFollowers(influencer.followers)}
            </div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800">
              {influencer.networkScore || '—'}
            </div>
            <div className="text-xs text-gray-500">Network</div>
          </div>
          <div>
            <StrongConnectionsDisplay count={influencer.strongConnections} />
            <div className="text-xs text-gray-500">Strong</div>
          </div>
        </div>
        
        {/* Extended Data Section */}
        <div className="p-4 space-y-3">
          {/* Top Followers */}
          <TopFollowersPreview followers={influencer.topFollowers} />
          
          {/* Recent Tokens */}
          {influencer.recentTokens?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Mentions:</span>
              {influencer.recentTokens.map(token => (
                <TokenBadge key={token} token={token} />
              ))}
            </div>
          )}
          
          {/* Engagement & Network */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Heart className="w-3 h-3" />
                Engagement
              </div>
              <div className="text-sm font-medium text-gray-700">
                {influencer.engagementRate > 0 
                  ? (influencer.engagementRate < 0.1 
                    ? `${(influencer.engagementRate * 1000).toFixed(1)}‰` 
                    : `${influencer.engagementRate.toFixed(2)}%`)
                  : (influencer.engagement > 0 
                    ? `${(influencer.engagement * 100).toFixed(0)}%` 
                    : '—')}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <TrendingUp className="w-3 h-3" />
                Network
              </div>
              <NetworkScoreBar score={influencer.networkScore || 0} />
            </div>
          </div>
          
          {/* Last Active */}
          {influencer.lastActive && (
            <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
              <Clock className="w-3 h-3" />
              Active {influencer.lastActive}
            </div>
          )}
        </div>
      </Link>
    );
  }
  
  // List View (Row) - CLICKABLE
  return (
    <Link 
      to={compareMode ? '#' : `/connections/influencers/${influencer.handle}`}
      onClick={handleCardClick}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-purple-200 transition-all duration-200 cursor-pointer"
      data-testid={`influencer-row-${influencer.handle}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar + Identity */}
        <div className="flex items-center gap-3 w-64 flex-shrink-0">
          <img
            src={influencer.avatar}
            alt={influencer.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random`; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{influencer.name}</h3>
              <RealityBadge badge={influencer.realityBadge} />
            </div>
            <p className="text-sm text-gray-500">@{influencer.handle}</p>
          </div>
        </div>
        
        {/* Groups */}
        <div className="flex gap-1 w-40 flex-shrink-0">
          {influencer.groups?.slice(0, 2).map(g => (
            <GroupBadge key={g} groupId={g} />
          ))}
        </div>
        
        {/* Twitter Score */}
        <div className="w-24 flex-shrink-0 text-center">
          <MetricTooltip text={METRIC_TOOLTIPS.twitterScore}>
            <div className="cursor-help">
              <div className="text-sm font-bold text-blue-600">{influencer.twitterScore || '—'}</div>
              <div className="text-xs text-gray-400">Twitter</div>
            </div>
          </MetricTooltip>
        </div>
        
        {/* Authority */}
        <div className="w-32 flex-shrink-0">
          <MetricTooltip text={METRIC_TOOLTIPS.authorityScore}>
            <div className="cursor-help">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, influencer.authorityScore)}%`,
                        backgroundColor: getAuthorityColor(influencer.authorityScore).bar
                      }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-bold ${getAuthorityColor(influencer.authorityScore).text}`}>
                  {influencer.authorityScore}
                </span>
              </div>
              <div className="text-xs text-gray-400 text-center">Authority</div>
            </div>
          </MetricTooltip>
        </div>
        
        {/* Followers */}
        <div className="w-24 text-center flex-shrink-0">
          <div className="text-sm font-medium">{formatFollowers(influencer.followers)}</div>
          <div className="text-xs text-gray-400">followers</div>
        </div>
        
        {/* Strong Connections */}
        <div className="w-20 text-center flex-shrink-0">
          <MetricTooltip text={METRIC_TOOLTIPS.strongConnections}>
            <div className="cursor-help">
              <div className="text-sm font-medium flex items-center justify-center gap-1">
                <Network className="w-3 h-3 text-blue-500" />
                {influencer.strongConnections}
              </div>
              <div className="text-xs text-gray-400">strong</div>
            </div>
          </MetricTooltip>
        </div>
        
        {/* Recent Tokens */}
        <div className="flex-1 flex items-center gap-1">
          {influencer.recentTokens?.slice(0, 3).map(token => (
            <TokenBadge key={token} token={token} />
          ))}
        </div>
        
        {/* Engagement - show only if significant */}
        <div className="w-24 text-right flex-shrink-0">
          {(influencer.engagementRate > 0.01 || influencer.engagement > 0) ? (
            <>
              <div className="text-sm font-medium text-gray-700">
                {influencer.engagementRate > 0 
                  ? (influencer.engagementRate < 0.1 
                    ? `${(influencer.engagementRate * 1000).toFixed(1)}‰` 
                    : `${influencer.engagementRate.toFixed(2)}%`)
                  : (influencer.engagement > 0 
                    ? `${(influencer.engagement * 100).toFixed(0)}%` 
                    : '—')}
              </div>
              <div className="text-xs text-gray-400">engage</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-gray-700">{influencer.networkScore || '—'}</div>
              <div className="text-xs text-gray-400">network</div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
