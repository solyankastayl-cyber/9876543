// Token price formatting
export const formatPrice = (price) => {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

// Get change color
export const getChangeColor = (change) => {
  if (change > 0) return 'text-emerald-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
};

// Get action color
export const getActionColor = (action) => {
  switch (action) {
    case 'Buy': return 'text-emerald-600 bg-emerald-50';
    case 'Sell': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

// Get structure status color
export const getStructureColor = (status) => {
  switch (status) {
    case 'SUPPORTIVE': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'BULLISH': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    case 'BEARISH': return 'text-red-600 bg-red-50 border-red-200';
    case 'NEUTRAL': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Get trend icon direction
export const getTrendIcon = (trend) => {
  switch (trend) {
    case 'improving': return 'up';
    case 'declining': return 'down';
    default: return 'stable';
  }
};

// Format large numbers
export const formatLargeNumber = (num) => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num}`;
};
