/**
 * Timeline Market Overlay (P1.9.B)
 * 
 * Applies market context to timeline steps.
 * 
 * Rules:
 * - Market = OVERLAY, not signal
 * - Source: RouteMarketContext (P1.6)
 * - One context → entire route
 * - NO direct market_data API calls
 * - NO price charts, NO candles
 */

import { MARKET_REGIMES, RISK_TAGS, MARKET_REGIME_CONFIG } from './timeline.types';

// ============================================
// Main Overlay Function
// ============================================

/**
 * Apply market overlay to timeline steps
 * 
 * @param {Array} timelineSteps - Timeline steps from mapper
 * @param {Object} marketContext - RouteMarketContext from P1.6
 * @returns {Array} TimelineStep[] with market overlay
 */
export function applyMarketOverlay(timelineSteps, marketContext) {
  // If no timeline or market context, return as-is
  if (!timelineSteps || timelineSteps.length === 0) {
    return [];
  }
  
  if (!marketContext) {
    return timelineSteps.map(step => ({
      ...step,
      market: undefined,
    }));
  }
  
  // Extract market info
  const regime = marketContext.regime || marketContext.marketRegime || MARKET_REGIMES.STABLE;
  const tags = buildMarketTags(marketContext);
  const severity = mapRegimeToSeverity(regime);
  
  // Apply same market context to ALL steps (route-level, not step-level)
  return timelineSteps.map(step => ({
    ...step,
    market: {
      regime,
      tags,
      severity,
      
      // Additional context for tooltips
      volumeSpike: marketContext.volumeSpike || false,
      liquidityDrop: marketContext.liquidityDrop || false,
      confidenceImpact: marketContext.confidenceImpact || 0,
      marketAmplifier: marketContext.marketAmplifier || 1,
    },
  }));
}

// ============================================
// Helper Functions
// ============================================

/**
 * Build market tags from context
 */
function buildMarketTags(marketContext) {
  const tags = [];
  
  if (marketContext.volumeSpike) {
    tags.push('VOLUME_SPIKE');
  }
  
  if (marketContext.liquidityDrop) {
    tags.push('LIQUIDITY_DROP');
  }
  
  if (marketContext.confidenceImpact < -0.1) {
    tags.push('CONFIDENCE_DOWN');
  }
  
  if (marketContext.marketAmplifier > 1.15) {
    tags.push('AMPLIFIED_RISK');
  }
  
  // Context tags from P1.6
  if (marketContext.contextTags && Array.isArray(marketContext.contextTags)) {
    for (const tag of marketContext.contextTags) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  
  return tags;
}

/**
 * Map regime to severity
 */
function mapRegimeToSeverity(regime) {
  const mapping = {
    [MARKET_REGIMES.STABLE]: RISK_TAGS.LOW,
    [MARKET_REGIMES.VOLATILE]: RISK_TAGS.MEDIUM,
    [MARKET_REGIMES.STRESSED]: RISK_TAGS.HIGH,
  };
  return mapping[regime] || RISK_TAGS.LOW;
}

// ============================================
// Market Display Helpers
// ============================================

/**
 * Get regime display config
 */
export function getRegimeConfig(regime) {
  return MARKET_REGIME_CONFIG[regime] || MARKET_REGIME_CONFIG[MARKET_REGIMES.STABLE];
}

/**
 * Get market tag label
 */
export function getMarketTagLabel(tag) {
  const labels = {
    'VOLUME_SPIKE': 'Volume Spike',
    'LIQUIDITY_DROP': 'Liquidity Drop',
    'CONFIDENCE_DOWN': 'Confidence Impact',
    'AMPLIFIED_RISK': 'Amplified Risk',
    'THIN_LIQUIDITY': 'Thin Liquidity',
    'HIGH_VOLATILITY': 'High Volatility',
    'MARKET_STRESS': 'Market Stress',
    'CEX_VOLUME': 'CEX Volume',
    'EXIT_PATTERN': 'Exit Pattern',
  };
  return labels[tag] || tag.replace(/_/g, ' ');
}

/**
 * Get market tag color
 */
export function getMarketTagColor(tag) {
  const colors = {
    'VOLUME_SPIKE': '#F59E0B',
    'LIQUIDITY_DROP': '#EF4444',
    'CONFIDENCE_DOWN': '#EF4444',
    'AMPLIFIED_RISK': '#EF4444',
    'THIN_LIQUIDITY': '#F59E0B',
    'HIGH_VOLATILITY': '#F59E0B',
    'MARKET_STRESS': '#EF4444',
    'CEX_VOLUME': '#F59E0B',
    'EXIT_PATTERN': '#EF4444',
  };
  return colors[tag] || '#6B7280';
}

/**
 * Check if market context is significant
 */
export function isSignificantMarketContext(marketContext) {
  if (!marketContext) return false;
  
  return (
    marketContext.regime === MARKET_REGIMES.STRESSED ||
    marketContext.volumeSpike ||
    marketContext.liquidityDrop ||
    marketContext.marketAmplifier > 1.1
  );
}

/**
 * Get market severity for combined risk
 */
export function getCombinedSeverity(stepRiskTag, marketSeverity) {
  const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const stepOrder = severityOrder[stepRiskTag] || 1;
  const marketOrder = severityOrder[marketSeverity] || 1;
  
  // Take the higher severity
  const maxOrder = Math.max(stepOrder, marketOrder);
  
  return Object.keys(severityOrder).find(k => severityOrder[k] === maxOrder) || 'LOW';
}

/**
 * Get market overlay summary
 */
export function getMarketOverlaySummary(marketContext) {
  if (!marketContext) {
    return {
      regime: 'STABLE',
      description: 'Normal market conditions',
      tags: [],
      severity: 'LOW',
    };
  }
  
  const regime = marketContext.regime || MARKET_REGIMES.STABLE;
  const config = getRegimeConfig(regime);
  const tags = buildMarketTags(marketContext);
  
  let description = config.label;
  
  if (marketContext.volumeSpike) {
    description += ' with volume spike';
  }
  if (marketContext.liquidityDrop) {
    description += ', liquidity concerns';
  }
  
  return {
    regime,
    description,
    tags,
    severity: config.severity,
  };
}

export default {
  applyMarketOverlay,
  getRegimeConfig,
  getMarketTagLabel,
  getMarketTagColor,
  isSignificantMarketContext,
  getCombinedSeverity,
  getMarketOverlaySummary,
};
