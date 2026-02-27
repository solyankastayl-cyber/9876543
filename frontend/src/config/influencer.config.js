/**
 * Influencer Config - Constants, utilities and scoring formulas
 * 
 * NO MOCKS - Real data only from API
 */

export const INFLUENCER_GROUPS = [
  { id: 'INFLUENCE', label: 'Influence', color: 'purple' },
  { id: 'SMART', label: 'Smart Money', color: 'blue' },
  { id: 'MEDIA', label: 'Media', color: 'orange' },
  { id: 'TRADING', label: 'Trading / Alpha', color: 'green' },
  { id: 'NFT', label: 'NFT', color: 'pink' },
  { id: 'POPULAR', label: 'Popular', color: 'yellow' },
  { id: 'VC', label: 'VC', color: 'cyan' },
  { id: 'EARLY', label: 'Early', color: 'lime' },
  { id: 'REAL', label: 'Real Data', color: 'emerald' },
];

// Tooltip texts for metrics with formula explanations
export const METRIC_TOOLTIPS = {
  twitterScore: 'Twitter Score (0-1000): Measures account quality based on follower authenticity, engagement rate, posting frequency, and content quality. Formula: weighted sum of (followers_quality × 0.3) + (engagement_rate × 0.25) + (activity_consistency × 0.25) + (content_relevance × 0.2)',
  
  authorityScore: 'Authority Score (0-100): Reflects network position and trustworthiness. Based on: who follows this account (quality of followers), historical prediction accuracy, connection to verified smart money wallets, and consistency over time.',
  
  strongConnections: 'Strong Connections: Count of mutual relationships with accounts having Authority Score > 700. High-trust bidirectional connections indicating insider network access.',
  
  topFollowers: 'Top Followers: The highest-authority accounts following this influencer. Ranked by their own Authority Score.',
  
  realityBadge: 'Reality Check: Compares public Twitter statements with actual on-chain behavior. CONFIRMED = statements match actions (>70%). MIXED = partial (40-70%). RISKY = contradictions (<40%).',
  
  networkScore: 'Network Score (0-100): Weighted quality of connections to trusted actors.',
  
  realityScore: 'Reality Score (-100 to +100): Historical alignment between public statements and on-chain actions.',
  
  engagementRate: 'Engagement Rate: Average percentage of followers who interact with posts.',
  
  groups: {
    INFLUENCE: 'Influence: High-reach accounts with significant market impact.',
    SMART: 'Smart Money: Accounts linked to wallets with proven profitable trading history.',
    MEDIA: 'Media: News outlets, podcasters, and content creators covering crypto.',
    TRADING: 'Trading/Alpha: Active traders sharing technical analysis and trade ideas.',
    NFT: 'NFT: Focused on NFT collections, marketplaces, and digital art.',
    POPULAR: 'Popular: High follower count accounts with mainstream appeal.',
    VC: 'VC: Venture capital firms and their partners investing in crypto.',
    EARLY: 'Early: Accounts that historically identify trends before they go mainstream.',
    REAL: 'Real Data: Accounts imported from live Twitter via Playwright parser.',
  },
  
  realityLevels: {
    CONFIRMED: 'Statements consistently match on-chain actions',
    MIXED: 'Some alignment between words and actions',
    RISKY: 'Frequent contradictions between public statements and behavior'
  }
};

// Authority score color mapping (scale 0-100)
export function getAuthorityColor(score) {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', bar: '#22C55E' };
  if (score >= 70) return { bg: 'bg-lime-500', text: 'text-lime-600', bar: '#84CC16' };
  if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', bar: '#EAB308' };
  if (score >= 50) return { bg: 'bg-orange-500', text: 'text-orange-600', bar: '#F97316' };
  return { bg: 'bg-red-500', text: 'text-red-600', bar: '#EF4444' };
}

// Group style config
export function getGroupConfig(groupId) {
  const colors = {
    INFLUENCE: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    SMART: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    MEDIA: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    TRADING: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    NFT: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    POPULAR: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    VC: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
    EARLY: { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300' },
    REAL: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    ACTIVE: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    INFLUENCER: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    VERIFIED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  };
  return colors[groupId] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
}

// Format followers count
export function formatFollowers(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

// Calculate engagement score (0-1000)
export function calculateEngagementScore(likes, reposts, replies, followers) {
  if (!followers || followers === 0) return 0;
  const engagementRate = ((likes || 0) + (reposts || 0) * 2 + (replies || 0) * 3) / followers;
  return Math.min(Math.round(engagementRate * 10000), 1000);
}

// Calculate authority score (0-1000)
export function calculateAuthorityScore(influence, engagement, confidence) {
  // Normalize values to 0-1 range
  // influence: 0-100 scale → 0-1
  // engagement: 0-10 scale → 0-1
  // confidence: already 0-1
  const inf = Math.min((influence || 50) / 100, 1);
  const eng = Math.min((engagement || 3) / 10, 1);
  const conf = confidence || 0.6;
  return Math.round((inf * 0.5 + eng * 0.3 + conf * 0.2) * 1000);
}

// Calculate network score (0-100)
export function calculateNetworkScore(strongConnections, totalConnections) {
  if (!totalConnections) return 0;
  return Math.min(Math.round((strongConnections / totalConnections) * 100), 100);
}

// Risk level from score
export function getRiskLevel(score) {
  if (score >= 70) return { level: 'LOW', color: 'green', label: 'Low Risk' };
  if (score >= 40) return { level: 'MEDIUM', color: 'yellow', label: 'Medium Risk' };
  return { level: 'HIGH', color: 'red', label: 'High Risk' };
}

// Reality badge from score
export function getRealityBadge(realityScore) {
  if (realityScore >= 70) return { badge: 'CONFIRMED', color: 'green' };
  if (realityScore >= 40) return { badge: 'MIXED', color: 'yellow' };
  return { badge: 'RISKY', color: 'red' };
}
