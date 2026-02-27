/**
 * Labs Constants — Unified
 * 
 * P1.6: Single source of truth for regime names, colors, risk labels
 */

// ═══════════════════════════════════════════════════════════════
// REGIME NAMES (Canonical)
// ═══════════════════════════════════════════════════════════════

export const REGIME_NAMES = {
  // BTC Dominance UP
  BTC_FLIGHT_TO_SAFETY: 'BTC Flight to Safety',
  BTC_LEADS_ALT_FOLLOW: 'BTC Leads, Alts Follow',
  PANIC_SELL_OFF: 'Panic Sell-Off',
  BTC_MAX_PRESSURE: 'BTC Max Pressure',
  
  // BTC Dominance DOWN
  ALT_ROTATION: 'Alt Rotation',
  ALT_SEASON: 'Alt Season',
  CAPITAL_EXIT: 'Capital Exit',
  FULL_RISK_OFF: 'Full Risk Off',
  
  // Neutral
  NEUTRAL: 'Neutral',
  CAUTIOUS_OPTIMISM: 'Cautious Optimism',
  MIXED: 'Mixed Signals',
};

// ═══════════════════════════════════════════════════════════════
// RISK LEVELS
// ═══════════════════════════════════════════════════════════════

export const RISK_LEVELS = {
  LOW: { label: 'LOW', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  MEDIUM: { label: 'MEDIUM', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  HIGH: { label: 'HIGH', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  EXTREME: { label: 'EXTREME', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// ═══════════════════════════════════════════════════════════════
// REGIME COLORS
// ═══════════════════════════════════════════════════════════════

export const REGIME_COLORS = {
  // Risk-Off regimes
  BTC_FLIGHT_TO_SAFETY: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  PANIC_SELL_OFF: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  CAPITAL_EXIT: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  FULL_RISK_OFF: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  
  // Risk-On regimes
  ALT_ROTATION: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  ALT_SEASON: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  BTC_LEADS_ALT_FOLLOW: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  BTC_MAX_PRESSURE: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  
  // Neutral
  NEUTRAL: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  CAUTIOUS_OPTIMISM: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  MIXED: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600' },
};

// ═══════════════════════════════════════════════════════════════
// MARKET BIAS
// ═══════════════════════════════════════════════════════════════

export const MARKET_BIAS = {
  BULLISH: { label: 'Bullish', icon: '↑', color: 'text-green-600' },
  BEARISH: { label: 'Bearish', icon: '↓', color: 'text-red-600' },
  NEUTRAL: { label: 'Neutral', icon: '●', color: 'text-gray-600' },
};

// ═══════════════════════════════════════════════════════════════
// EXPECTATION TYPES
// ═══════════════════════════════════════════════════════════════

export const EXPECTATION_TYPES = {
  RISK_ON: { label: 'Risk On', color: 'text-green-600', bg: 'bg-green-50' },
  RISK_OFF: { label: 'Risk Off', color: 'text-red-600', bg: 'bg-red-50' },
  NEUTRAL: { label: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-50' },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getRegimeName(regime) {
  return REGIME_NAMES[regime] || regime?.replace(/_/g, ' ') || 'Unknown';
}

export function getRegimeColor(regime) {
  return REGIME_COLORS[regime] || REGIME_COLORS.NEUTRAL;
}

export function getRiskStyle(risk) {
  return RISK_LEVELS[risk] || RISK_LEVELS.MEDIUM;
}

export function formatRegimeForDisplay(regime) {
  return getRegimeName(regime);
}
