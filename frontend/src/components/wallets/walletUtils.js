// Helper functions for wallet display

// Get verdict color classes
export const getVerdictColor = (verdict) => {
  switch (verdict) {
    case 'FOLLOW': return 'bg-green-500/20 border-green-500/30 text-green-400';
    case 'WATCH': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    case 'AVOID': return 'bg-red-500/20 border-red-500/30 text-red-400';
    default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
  }
};

// Get risk color
export const getRiskColor = (score) => {
  if (score < 30) return 'text-green-600';
  if (score < 60) return 'text-yellow-600';
  return 'text-red-600';
};

// Get risk label
export const getRiskLabel = (score) => {
  if (score < 30) return 'Low Risk';
  if (score < 60) return 'Medium Risk';
  return 'High Risk';
};

// Type badge colors
export const getTypeBadgeColor = (type) => {
  switch (type) {
    case 'Smart Money': return 'bg-emerald-100 text-emerald-700';
    case 'Exchange': return 'bg-blue-100 text-blue-700';
    case 'Whale': return 'bg-purple-100 text-purple-700';
    case 'Fund': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
