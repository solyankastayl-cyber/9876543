/**
 * U1.2 - Signal Metadata
 * 
 * Defines titles, colors, tooltips for A-F signal drivers.
 * No ML terminology - user-facing language only.
 */

// Driver codes
export const DRIVER_CODES = ['A', 'B', 'C', 'D', 'E', 'F'];

// Driver metadata
export const DRIVER_META = {
  A: {
    title: 'Exchange Pressure',
    icon: 'ArrowLeftRight',
    description: 'Tracks flows between exchanges and wallets. Large withdrawals signal accumulation, deposits signal distribution.',
    tooltip: 'Measures net flow of tokens to/from exchanges. Withdrawals = bullish, Deposits = bearish.',
  },
  B: {
    title: 'Accumulation Zones',
    icon: 'Layers',
    description: 'Identifies price levels where smart money historically accumulated or distributed.',
    tooltip: 'Historical zones where wallets with good track records have made significant moves.',
  },
  C: {
    title: 'Corridors',
    icon: 'GitBranch',
    description: 'Detects repeated capital flow patterns between wallet clusters.',
    tooltip: 'When the same paths are used repeatedly, it signals coordinated activity.',
  },
  D: {
    title: 'Liquidity',
    icon: 'Droplets',
    description: 'Monitors liquidity additions and removals across DEX pools.',
    tooltip: 'Growing liquidity = confidence in asset. Shrinking = caution or exit.',
  },
  E: {
    title: 'Smart Actors',
    icon: 'Users',
    description: 'Tracks behavior of wallets with historically profitable patterns.',
    tooltip: 'When smart wallets accumulate together, it often precedes price moves.',
  },
  F: {
    title: 'Events',
    icon: 'Bell',
    description: 'Monitors unusual on-chain activity and new interactions.',
    tooltip: 'New contracts, large transactions, or unusual patterns that may signal opportunity or risk.',
  },
};

// State colors (for background/border)
export const STATE_COLORS = {
  // Bullish states
  ACCUMULATION: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  SUPPORT: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PERSISTENT: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  GROWING: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ACCUMULATING: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ACTIVE: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  
  // Bearish states
  DISTRIBUTION: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  RESISTANCE: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  SCATTERED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  SHRINKING: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  DISTRIBUTING: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  ALERT: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  
  // Neutral states
  NEUTRAL: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
  STABLE: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
  
  // Default
  DEFAULT: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};

// Strength indicators
export const STRENGTH_CONFIG = {
  HIGH: { width: 'w-full', color: 'bg-emerald-500', label: 'Strong' },
  MEDIUM: { width: 'w-2/3', color: 'bg-amber-500', label: 'Moderate' },
  LOW: { width: 'w-1/3', color: 'bg-slate-300', label: 'Weak' },
};

// Decision colors
export const DECISION_COLORS = {
  BUY: { bg: 'bg-emerald-500', text: 'text-white', label: 'BUY' },
  SELL: { bg: 'bg-red-500', text: 'text-white', label: 'SELL' },
  NEUTRAL: { bg: 'bg-slate-500', text: 'text-white', label: 'NEUTRAL' },
};

// Quality badges
export const QUALITY_CONFIG = {
  HIGH: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High Confidence' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Confidence' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Low Confidence' },
};

// Helper to get state colors
export function getStateColors(state) {
  return STATE_COLORS[state] || STATE_COLORS.DEFAULT;
}

// Helper to get strength config
export function getStrengthConfig(strength) {
  return STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.LOW;
}
