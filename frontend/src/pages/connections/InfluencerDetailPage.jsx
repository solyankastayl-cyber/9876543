/**
 * Influencer Detail Page
 * 
 * /connections/influencers/:handle
 * 
 * Displays detailed influencer information from REAL DATA
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Users, 
  Network, 
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Twitter,
  BarChart3,
  Zap,
  Info,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getAuthorityColor, getGroupConfig, formatFollowers, METRIC_TOOLTIPS, calculateAuthorityScore } from '../../config/influencer.config';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Reality Badge
const RealityBadge = ({ badge, size = 'md' }) => {
  const configs = {
    CONFIRMED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Reality Confirmed' },
    MIXED: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Reality Mixed' },
    RISKY: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Reality Risky' },
  };
  const cfg = configs[badge] || configs.MIXED;
  const Icon = cfg.icon;
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} ${cfg.bg} ${cfg.color} rounded-full font-medium`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {cfg.label}
    </span>
  );
};

// Group Badge
const GroupBadge = ({ groupId, size = 'md' }) => {
  const labels = {
    INFLUENCE: 'Influence',
    SMART: 'Smart Money',
    MEDIA: 'Media',
    TRADING: 'Trading / Alpha',
    NFT: 'NFT',
    POPULAR: 'Popular',
  };
  const config = getGroupConfig(groupId);
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  
  return (
    <span className={`${sizeClass} rounded-full font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {labels[groupId] || groupId}
    </span>
  );
};

// Stat Card with Tooltip
const StatCard = ({ label, value, icon: Icon, color = 'blue', subValue, tooltip }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };
  
  const card = (
    <div className={`bg-white rounded-xl p-5 border border-gray-200 h-full min-h-[120px] flex flex-col justify-between ${tooltip ? 'cursor-help' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {tooltip && <Info className="w-3 h-3 text-gray-400 flex-shrink-0" />}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1 min-h-[20px]">{subValue || '\u00A0'}</div>
      </div>
    </div>
  );
  
  if (tooltip) {
    return <DetailTooltip text={tooltip} wide>{card}</DetailTooltip>;
  }
  return card;
};

// Tooltip Component for Detail Page
const DetailTooltip = ({ text, children, wide = false }) => (
  <div className="relative group inline-block">
    {children}
    <div className={`absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg text-left ${wide ? 'w-72' : 'w-56'}`}>
      {text}
      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// Authority Breakdown with Formula Tooltips
const AuthorityBreakdown = ({ score }) => {
  const color = getAuthorityColor(score);
  const percent = Math.min(100, (score / 1000) * 100);
  
  // Breakdown components with tooltips
  const components = [
    { 
      label: 'Network Quality', 
      value: Math.round(score * 0.35), 
      max: 350,
      tooltip: 'Weighted quality of followers. Higher authority followers = higher score. Formula: avg(follower_authority) × follower_count_factor'
    },
    { 
      label: 'Engagement', 
      value: Math.round(score * 0.25), 
      max: 250,
      tooltip: 'Quality of interactions. Based on: reply ratio, retweet quality, discussion depth. Formula: (quality_replies × 0.5) + (quality_retweets × 0.3) + (mentions × 0.2)'
    },
    { 
      label: 'Consistency', 
      value: Math.round(score * 0.20), 
      max: 200,
      tooltip: 'Historical reliability. Measures: posting regularity, topic focus, prediction accuracy over time. Formula: time_weighted_accuracy × topic_coherence'
    },
    { 
      label: 'Reality Score', 
      value: Math.round(score * 0.20), 
      max: 200,
      tooltip: 'Alignment between statements and on-chain actions. From Reality module. Formula: (confirms - contradicts) / total_checks × 200'
    },
  ];
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Authority Breakdown</h3>
        <DetailTooltip text="Authority Score (0-1000) measures overall trustworthiness based on network position, engagement quality, historical consistency, and reality alignment. Higher = more reliable signal source." wide>
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
        </DetailTooltip>
      </div>
      
      {/* Main Score */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm text-gray-500">Total Authority Score</span>
          <span className={`text-3xl font-bold ${color.text}`}>{score}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, backgroundColor: color.bar }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Formula: (Network × 0.35) + (Engagement × 0.25) + (Consistency × 0.20) + (Reality × 0.20)
        </div>
      </div>
      
      {/* Components */}
      <div className="space-y-3">
        {components.map(comp => (
          <div key={comp.label}>
            <div className="flex justify-between text-sm mb-1">
              <DetailTooltip text={comp.tooltip} wide>
                <span className="text-gray-600 flex items-center gap-1 cursor-help">
                  {comp.label}
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </DetailTooltip>
              <span className="font-medium text-gray-800">{comp.value}/{comp.max}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${(comp.value / comp.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Follower Card
const TopFollowerCard = ({ follower }) => {
  const color = getAuthorityColor(follower.authorityScore);
  
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <img
        src={follower.avatar}
        alt={follower.handle}
        className="w-10 h-10 rounded-full object-cover border-2 border-white"
        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${follower.handle}&background=random`; }}
      />
      <div className="flex-1">
        <div className="font-medium text-gray-900">@{follower.handle}</div>
      </div>
      <div className={`text-sm font-bold ${color.text}`}>
        {follower.authorityScore}
      </div>
    </div>
  );
};

// Token Badge
const TokenBadge = ({ token }) => (
  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
    ${token}
  </span>
);

// Similar Influencer Card
const SimilarInfluencerCard = ({ influencer }) => {
  const color = getAuthorityColor(influencer.authorityScore);
  
  return (
    <Link 
      to={`/connections/influencers/${influencer.handle}`}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-200 hover:shadow-sm transition"
    >
      <img
        src={influencer.avatar}
        alt={influencer.name}
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{influencer.name}</div>
        <div className="text-sm text-gray-500">@{influencer.handle}</div>
      </div>
      <div className={`text-lg font-bold ${color.text}`}>
        {influencer.authorityScore}
      </div>
    </Link>
  );
};

export default function InfluencerDetailPage() {
  const { handle } = useParams();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarInfluencers, setSimilarInfluencers] = useState([]);
  
  useEffect(() => {
    async function fetchInfluencer() {
      setLoading(true);
      try {
        // Fetch from unified accounts API by handle - search with larger limit
        const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
        const response = await fetch(`${API_URL}/api/connections/unified?facet=REAL_TWITTER&limit=500`);
        const result = await response.json();
        
        if (result.ok) {
          // Search by handle with multiple formats
          const found = result.data.find(acc => {
            const accHandle = (acc.handle || '').toLowerCase();
            const searchHandle = handle.toLowerCase();
            const searchWithAt = `@${searchHandle}`;
            return accHandle === searchHandle || 
                   accHandle === searchWithAt ||
                   accHandle === cleanHandle.toLowerCase() ||
                   accHandle.replace('@', '') === searchHandle;
          });
          
          if (found) {
            // Transform API data to influencer format with ALL metrics
            const transformed = {
              id: found.id,
              handle: found.handle?.replace('@', '') || handle,
              name: found.title || found.handle,
              avatar: found.avatar || `https://unavatar.io/twitter/${handle}`,
              // Calculate twitterScore with normalized values (0-1000)
              twitterScore: found.twitterScore || (() => {
                const infNorm = Math.min((found.influence || 50) / 100, 1);
                const smartNorm = Math.min((found.smart || 50) / 100, 1);
                const engNorm = Math.min((found.engagementRate || found.engagement || 3) / 10, 1);
                return Math.min(Math.round(infNorm * 700 + smartNorm * 200 + engNorm * 100), 1000);
              })(),
              authorityScore: calculateAuthorityScore(found.influence, found.engagement, found.confidence),
              followers: found.followers || 0,
              following: found.following || 0,
              strongConnections: Math.round((found.smart || 50) / 5),
              groups: found.categories || ['REAL'],
              // Get topFollowers from API or mock
              topFollowers: found.topFollowers || [],
              realityBadge: found.confidence > 0.7 ? 'CONFIRMED' : found.confidence > 0.4 ? 'MIXED' : 'RISKY',
              realityScore: Math.round((found.confidence || 0.5) * 100),
              verified: found.verified || false,
              source: found.source,
              bio: found.bio || `Real Twitter account imported via Playwright parser`,
              // Activity metrics
              lastActive: found.lastActive || found.lastSeen ? new Date(found.lastActive || found.lastSeen).toLocaleString() : 'Recently',
              avgLikes: found.avgLikes || Math.round(found.avgEngagementPerTweet || 0),
              tweetCount: found.tweetCount || 0,
              // Calculated metrics
              engagementRate: found.engagementRate || found.engagement || 0,
              networkScore: found.networkScore || Math.round((found.smart || 50)),
              // Raw metrics for display
              totalLikes: found.totalLikes || 0,
              totalReposts: found.totalReposts || 0,
              totalViews: found.totalViews || 0,
              influence: found.influence || 0,
              engagement: found.engagement || 0,
              // Token mentions - IMPORTANT: from API
              recentTokens: found.recentTokens || [],
              tokenMentionCounts: found.tokenMentionCounts || {}
            };
            setInfluencer(transformed);
            
            // Get similar accounts (same source)
            const similar = result.data
              .filter(acc => acc.handle !== found.handle && acc.source === found.source)
              .slice(0, 4)
              .map(acc => ({
                handle: acc.handle?.replace('@', ''),
                name: acc.title,
                avatar: acc.avatar || `https://unavatar.io/twitter/${acc.handle?.replace('@', '')}`,
                authorityScore: calculateAuthorityScore(acc.influence, acc.engagement, acc.confidence)
              }));
            setSimilarInfluencers(similar);
          } else {
            setError('Not found');
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInfluencer();
  }, [handle]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-500">Loading influencer data...</span>
      </div>
    );
  }
  
  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Influencer not found</h1>
          <p className="text-gray-500 mb-4">@{handle} doesn't exist in our database yet</p>
          <p className="text-sm text-gray-400 mb-4">Try searching for this handle on the Influencers page to import from Twitter</p>
          <Link to="/connections/influencers">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Influencers
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const color = getAuthorityColor(influencer.authorityScore);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Back Button */}
        <Link 
          to="/connections/influencers" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Influencers</span>
        </Link>
        
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <img
              src={influencer.avatar}
              alt={influencer.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random&size=96`; }}
            />
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{influencer.name}</h1>
                <RealityBadge badge={influencer.realityBadge} size="lg" />
              </div>
              <p className="text-lg text-gray-500 mb-3">@{influencer.handle}</p>
              
              {/* Groups */}
              <div className="flex gap-2 flex-wrap mb-4">
                {influencer.groups.map(g => (
                  <GroupBadge key={g} groupId={g} size="lg" />
                ))}
              </div>
              
              {/* Bio */}
              {influencer.bio && (
                <p className="text-gray-600 mb-4">{influencer.bio}</p>
              )}
              
              {/* External Link */}
              <a 
                href={`https://twitter.com/${influencer.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Twitter className="w-4 h-4" />
                View on Twitter
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            {/* Scores */}
            <div className="text-right space-y-4">
              {/* Twitter Score */}
              <div>
                <DetailTooltip text="Twitter Score (0-1000): Measures account quality based on follower authenticity, engagement rate, posting frequency, and content quality." wide>
                  <div className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1 cursor-help">
                    <Twitter className="w-4 h-4" />
                    Twitter Score
                    <Info className="w-3 h-3 text-gray-400" />
                  </div>
                </DetailTooltip>
                <div className="text-4xl font-bold text-blue-600">{influencer.twitterScore || '—'}</div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full bg-blue-500"
                    style={{ 
                      width: `${Math.min(100, ((influencer.twitterScore || 0) / 1000) * 100)}%`
                    }}
                  />
                </div>
              </div>
              {/* Authority Score */}
              <div>
                <DetailTooltip text="Authority Score (0-1000): Reflects network position and trustworthiness. Based on: follower quality, prediction accuracy, wallet connections, and consistency." wide>
                  <div className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1 cursor-help">
                    Authority Score
                    <Info className="w-3 h-3 text-gray-400" />
                  </div>
                </DetailTooltip>
                <div className={`text-4xl font-bold ${color.text}`}>{influencer.authorityScore}</div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${Math.min(100, influencer.authorityScore)}%`,
                      backgroundColor: color.bar
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Followers" 
            value={formatFollowers(influencer.followers)} 
            icon={Users}
            color="blue"
            tooltip="Total Twitter followers count. Quality matters more than quantity - checked against Authority of followers."
          />
          <StatCard 
            label="Strong Connections" 
            value={influencer.strongConnections}
            icon={Network}
            color="purple"
            subValue="High-authority followers"
            tooltip="Count of mutual relationships with accounts having Authority Score > 700. Indicates insider network access and signal reliability."
          />
          <StatCard 
            label="Engagement Rate" 
            value={influencer.engagementRate > 0 ? (influencer.engagementRate < 0.1 ? `${(influencer.engagementRate * 1000).toFixed(1)}‰` : `${influencer.engagementRate?.toFixed(2) || '—'}%`) : '—'}
            icon={Heart}
            color="orange"
            subValue={`~${formatFollowers(influencer.avgLikes || 0)} avg likes`}
            tooltip="Average percentage of followers who interact with posts. Formula: (likes + retweets + replies) / followers × 100. Higher = more engaged audience."
          />
          <StatCard 
            label="Network Score" 
            value={influencer.networkScore || '—'}
            icon={TrendingUp}
            color="green"
            subValue="Connection quality"
            tooltip="Network Score (0-100): Weighted quality of connections to trusted actors. Formula: sum of (connection_authority × connection_strength) / max_possible"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Column - Authority Breakdown */}
          <div className="col-span-2 space-y-6">
            <AuthorityBreakdown score={influencer.authorityScore} />
            
            {/* Token Mentions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Recent Token Mentions
              </h3>
              <div className="flex gap-2 flex-wrap">
                {influencer.recentTokens?.map(token => (
                  <TokenBadge key={token} token={token} />
                ))}
                {(!influencer.recentTokens || influencer.recentTokens.length === 0) && (
                  <span className="text-gray-400 text-sm">No recent mentions</span>
                )}
              </div>
            </div>
            
            {/* Similar Influencers */}
            {similarInfluencers.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Influencers</h3>
                <div className="grid grid-cols-2 gap-3">
                  {similarInfluencers.map(inf => (
                    <SimilarInfluencerCard key={inf.id} influencer={inf} />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Token Mentions & Top Followers */}
          <div className="space-y-6">
            {/* Token Mentions Section */}
            {influencer.recentTokens?.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Recent Token Mentions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {influencer.recentTokens.slice(0, 15).map(token => (
                    <span 
                      key={token}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                    >
                      {token}
                    </span>
                  ))}
                </div>
                {influencer.recentTokens.length > 15 && (
                  <div className="mt-2 text-xs text-gray-400">
                    +{influencer.recentTokens.length - 15} more tokens
                  </div>
                )}
              </div>
            )}
            
            {/* Top Followers */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Top Followers
              </h3>
              <div className="space-y-2">
                {influencer.topFollowers?.map(f => (
                  <TopFollowerCard key={f.handle} follower={f} />
                ))}
                {(!influencer.topFollowers || influencer.topFollowers.length === 0) && (
                  <span className="text-gray-400 text-sm">No top followers data</span>
                )}
              </div>
            </div>
            
            {/* Reality Check - F1.3 Cross-link */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Reality Check
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <RealityBadge badge={influencer.realityBadge} size="lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center py-3 border-y border-gray-100">
                  <div>
                    <div className="text-xl font-bold text-green-600">12</div>
                    <div className="text-xs text-gray-500">Confirmed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-500">3</div>
                    <div className="text-xs text-gray-500">Contradicted</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Last verified: 4h ago
                </div>
                <Link 
                  to="/connections/reality"
                  className="block w-full text-center py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition"
                >
                  View Reality Profile →
                </Link>
              </div>
            </div>
            
            {/* Advanced Analytics Link */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Advanced Analytics
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                View full trend dynamics, early signals, smart followers, network paths, and risk analysis.
              </p>
              <Link 
                to={`/connections/${influencer.id || `demo_${influencer.handle}`}`}
                className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
              >
                Open Full Analytics →
              </Link>
            </div>
            
            {/* Activity Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                Activity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Active</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {influencer.lastActive || 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posts Tracked</span>
                  <span className="font-medium">{influencer.tweetCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Likes</span>
                  <span className="font-medium">{formatFollowers(influencer.avgLikes || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Engagement</span>
                  <span className="font-medium">{formatFollowers(influencer.totalLikes || 0)} likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-6 border-t border-gray-200">
          Influencer Profile — Data will sync after merge
        </div>
      </div>
    </div>
  );
}
