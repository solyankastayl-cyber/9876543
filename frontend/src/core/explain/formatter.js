/**
 * VALUE FORMATTER
 * 
 * Universal formatter for displaying values based on their type.
 * No manual text - only formatting rules.
 */

import { META_TYPES } from '../../platform.contracts';

/**
 * Format a value based on its meta type
 * @param {number|string} value - Raw value
 * @param {string} type - META_TYPES value
 * @returns {string} Formatted string
 */
export function formatValue(value, type) {
  if (value === null || value === undefined) return '—';
  
  if (typeof value === 'number') {
    switch (type) {
      case META_TYPES.PROBABILITY:
        return `${(value * 100).toFixed(1)}%`;
      
      case META_TYPES.MULTIPLIER:
        return `×${value.toFixed(2)}`;
      
      case META_TYPES.ALLOCATION:
        return `${(value * 100).toFixed(1)}%`;
      
      case META_TYPES.CONFIDENCE:
        return `${(value * 100).toFixed(1)}%`;
      
      case META_TYPES.SCORE:
        return value.toFixed(2);
      
      case META_TYPES.VOLATILITY:
        return `${(value * 100).toFixed(1)}%`;
      
      default:
        return value.toFixed(2);
    }
  }
  
  return String(value);
}

/**
 * Format confidence level as text
 */
export function formatConfidenceLevel(value) {
  if (typeof value !== 'number') return 'Unknown';
  if (value >= 0.7) return 'High';
  if (value >= 0.4) return 'Medium';
  return 'Low';
}

/**
 * Format size as percentage
 */
export function formatSize(value) {
  if (typeof value !== 'number') return '—';
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Format return value
 */
export function formatReturn(value, showSign = true) {
  if (typeof value !== 'number') return '—';
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export default { formatValue, formatConfidenceLevel, formatSize, formatReturn };
