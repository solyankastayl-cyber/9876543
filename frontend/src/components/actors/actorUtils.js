// Chain icons/colors
export const chainConfig = {
  'ETH': { color: 'bg-blue-500', label: 'Ethereum' },
  'SOL': { color: 'bg-purple-500', label: 'Solana' },
  'BASE': { color: 'bg-blue-600', label: 'Base' },
  'ARB': { color: 'bg-sky-500', label: 'Arbitrum' },
  'OP': { color: 'bg-red-500', label: 'Optimism' },
};

// Edge Score color helper
export const getEdgeScoreColor = (score) => {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-500 bg-red-50 border-red-200';
};

// Influence Role calculation
export const getInfluenceRole = (actor) => {
  const { followers_count = 0, leads_count = 0, follows_count = 0 } = actor;
  const leadsRatio = follows_count > 0 ? leads_count / follows_count : leads_count;
  const followsRatio = leads_count > 0 ? follows_count / leads_count : follows_count;
  const significantFollowers = 3;
  const significantFollows = 2;
  
  if (followers_count >= significantFollowers && leadsRatio > 1.2) return 'Leader';
  if (follows_count >= significantFollows && followsRatio > 1.2) return 'Follower';
  return 'Neutral';
};

// Influence Role badge config
export const influenceRoleConfig = {
  'Leader': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🟢' },
  'Follower': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🟡' },
  'Neutral': { bg: 'bg-gray-100', text: 'text-gray-600', icon: '⚪' },
};

// Filter options
export const strategyFilters = ['Accumulator', 'Smart Money', 'Momentum', 'Early DEX', 'Narrative Rider', 'LP / Yield', 'HFT', 'Arbitrage'];
export const riskFilters = ['Low', 'Medium', 'High'];
export const latencyFilters = ['Early', 'Medium', 'Late'];

// Sort options
export const sortOptions = [
  { value: 'edgeScore', label: 'Edge Score' },
  { value: 'influence', label: 'Influence' },
  { value: 'activity', label: 'Newest activity' },
  { value: 'pnl', label: 'PnL (highest)' },
  { value: 'winRate', label: 'Win rate' },
  { value: 'risk', label: 'Risk (lowest)' },
  { value: 'signals', label: 'Active signals' },
];

// Confidence colors
export const confidenceColors = {
  high: { bg: 'bg-[#16C784]', text: 'text-[#16C784]', label: 'High Confidence' },
  medium: { bg: 'bg-[#F5A524]', text: 'text-[#F5A524]', label: 'Medium Confidence' },
  low: { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', label: 'Low Confidence' },
};

// Latency colors
export const latencyColors = {
  'Early': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Late': 'bg-red-100 text-red-700',
};

// Type badge colors
export const typeBadgeColors = {
  'Fund': 'bg-blue-100 text-blue-700',
  'Trader': 'bg-purple-100 text-purple-700',
  'Whale': 'bg-orange-100 text-orange-700',
  'Cluster': 'bg-gray-100 text-gray-700',
};

// Action type colors
export const actionColors = {
  'BUY': 'text-emerald-600',
  'SELL': 'text-red-500',
  'SWAP': 'text-blue-600',
  'BRIDGE': 'text-purple-600',
};
