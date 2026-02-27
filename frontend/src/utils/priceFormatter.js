/**
 * CENTRALIZED PRICE FORMATTER
 * 
 * BTC → $68,900
 * SPX → 6,909 pts (index, not dollars)
 * 
 * Single source of truth for all price displays.
 */

/**
 * Format price based on asset type
 * @param {number} value - Price value
 * @param {string} asset - Asset symbol ('BTC' | 'SPX')
 * @param {object} options - Formatting options
 * @returns {string} Formatted price string
 */
export function formatPrice(value, asset = 'BTC', options = {}) {
  const { 
    compact = false,      // Use K/M suffixes
    decimals = null,      // Override decimals
    showSign = false,     // Show +/- sign
  } = options;
  
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  const sign = showSign && value >= 0 ? '+' : '';
  
  // SPX is an INDEX, not a dollar asset
  if (asset === 'SPX') {
    const dec = decimals ?? (compact ? 0 : 1);
    
    if (compact && Math.abs(value) >= 1000) {
      return `${sign}${(value / 1000).toLocaleString('en-US', { 
        maximumFractionDigits: 1 
      })}K pts`;
    }
    
    return `${sign}${value.toLocaleString('en-US', { 
      maximumFractionDigits: dec 
    })} pts`;
  }
  
  // BTC and other assets use dollar formatting
  const dec = decimals ?? (compact ? 0 : 0);
  
  if (compact) {
    if (Math.abs(value) >= 1000000) {
      return `${sign}$${(value / 1000000).toLocaleString('en-US', { 
        maximumFractionDigits: 2 
      })}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${sign}$${(value / 1000).toLocaleString('en-US', { 
        maximumFractionDigits: 1 
      })}K`;
    }
  }
  
  return `${sign}$${value.toLocaleString('en-US', { 
    maximumFractionDigits: dec 
  })}`;
}

/**
 * Format percentage change
 * @param {number} value - Decimal value (0.05 = 5%)
 * @param {object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export function formatChange(value, options = {}) {
  const { 
    decimals = 1,
    showSign = true,
  } = options;
  
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  const pct = value * 100;
  const sign = showSign && pct >= 0 ? '+' : '';
  
  return `${sign}${pct.toFixed(decimals)}%`;
}

/**
 * Format return for display (handles both decimal and percentage inputs)
 * @param {number} value - Return value
 * @param {boolean} isDecimal - Whether input is decimal (0.05) or percent (5)
 * @returns {string} Formatted return
 */
export function formatReturn(value, isDecimal = true) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  const pct = isDecimal ? value * 100 : value;
  const sign = pct >= 0 ? '+' : '';
  
  return `${sign}${pct.toFixed(1)}%`;
}

export default { formatPrice, formatChange, formatReturn };
