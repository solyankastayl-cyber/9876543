/**
 * ============================================================
 * FRACTAL PLATFORM V2 — UNIFIED FRONTEND CONTRACT
 * ============================================================
 * 
 * This file defines all data contracts between backend and frontend.
 * Frontend does NOT know formulas or calculations.
 * It only knows these contracts.
 */

/* ===========================
   1. BASE META TYPES
   =========================== */

export const META_TYPES = {
  PROBABILITY: 'probability',
  SCORE: 'score',
  MULTIPLIER: 'multiplier',
  REGIME: 'regime',
  ALLOCATION: 'allocation',
  VOLATILITY: 'volatility',
  LIQUIDITY: 'liquidity',
  STRESS: 'stress',
  CONFIDENCE: 'confidence',
  UNKNOWN: 'unknown',
};

export const META_IMPACTS = {
  RISK_ON: 'risk_on',
  RISK_OFF: 'risk_off',
  NEUTRAL: 'neutral',
  MIXED: 'mixed',
};

/**
 * @typedef {Object} TooltipMeta
 * @property {string} type - META_TYPES value
 * @property {string} impact - META_IMPACTS value
 * @property {string} [direction] - 'positive' | 'negative' | 'neutral'
 * @property {string[]} [drivers] - backend-provided causes
 * @property {string[]} [relatedAssets] - e.g. ['spx', 'btc']
 */

/**
 * @typedef {Object} StatWithMeta
 * @property {string} label - Display label
 * @property {number|string} value - Raw value
 * @property {string} [formatted] - Pre-formatted display value
 * @property {TooltipMeta} meta - Metadata for tooltip generation
 */

/* ===========================
   2. ACTION TYPES
   =========================== */

export const ACTION_TYPES = {
  LONG: 'LONG',
  SHORT: 'SHORT',
  HOLD: 'HOLD',
};

/* ===========================
   3. FRACTAL MODES
   =========================== */

export const FRACTAL_MODES = {
  SYNTHETIC: 'synthetic',
  REPLAY: 'replay',
  HYBRID: 'hybrid',
  ADJUSTED: 'adjusted',
};

/* ===========================
   4. GUARD LEVELS
   =========================== */

export const GUARD_LEVELS = {
  NONE: 'NONE',
  WARN: 'WARN',
  CRISIS: 'CRISIS',
  BLOCK: 'BLOCK',
};

/**
 * Guard level caps for position sizing
 */
export const GUARD_CAPS = {
  BTC: {
    [GUARD_LEVELS.NONE]: 1.0,
    [GUARD_LEVELS.WARN]: 0.70,
    [GUARD_LEVELS.CRISIS]: 0.35,
    [GUARD_LEVELS.BLOCK]: 0,
  },
  SPX: {
    [GUARD_LEVELS.NONE]: 1.0,
    [GUARD_LEVELS.WARN]: 0.80,
    [GUARD_LEVELS.CRISIS]: 0.50,
    [GUARD_LEVELS.BLOCK]: 0,
  },
  DXY: {
    [GUARD_LEVELS.NONE]: 1.0,
    [GUARD_LEVELS.WARN]: 0.85,
    [GUARD_LEVELS.CRISIS]: 0.60,
    [GUARD_LEVELS.BLOCK]: 0.25,
  },
};

/* ===========================
   5. SCENARIO TYPES
   =========================== */

export const SCENARIO_TYPES = {
  BASE: 'BASE',
  BULL: 'BULL',
  BEAR: 'BEAR',
};

/* ===========================
   6. HELPER FUNCTIONS
   =========================== */

/**
 * Create a StatWithMeta object
 */
export function createStat(label, value, type = META_TYPES.UNKNOWN, impact = META_IMPACTS.NEUTRAL, extra = {}) {
  return {
    label,
    value,
    formatted: formatStatValue(value, type),
    meta: {
      type,
      impact,
      ...extra,
    },
  };
}

/**
 * Format stat value based on type
 */
export function formatStatValue(value, type) {
  if (typeof value !== 'number') return String(value);
  
  switch (type) {
    case META_TYPES.PROBABILITY:
    case META_TYPES.CONFIDENCE:
    case META_TYPES.ALLOCATION:
      return `${(value * 100).toFixed(1)}%`;
    case META_TYPES.MULTIPLIER:
      return `×${value.toFixed(2)}`;
    case META_TYPES.SCORE:
      return value.toFixed(2);
    default:
      return value.toFixed(2);
  }
}

/**
 * Get action color
 */
export function getActionColor(action) {
  switch (action) {
    case ACTION_TYPES.LONG:
      return '#16A34A'; // green
    case ACTION_TYPES.SHORT:
      return '#DC2626'; // red
    case ACTION_TYPES.HOLD:
    default:
      return '#6B7280'; // gray
  }
}

/**
 * Get guard level color
 */
export function getGuardColor(level) {
  switch (level) {
    case GUARD_LEVELS.NONE:
      return '#16A34A'; // green
    case GUARD_LEVELS.WARN:
      return '#F59E0B'; // yellow
    case GUARD_LEVELS.CRISIS:
      return '#F97316'; // orange
    case GUARD_LEVELS.BLOCK:
      return '#DC2626'; // red
    default:
      return '#6B7280'; // gray
  }
}

export default {
  META_TYPES,
  META_IMPACTS,
  ACTION_TYPES,
  FRACTAL_MODES,
  GUARD_LEVELS,
  GUARD_CAPS,
  SCENARIO_TYPES,
  createStat,
  formatStatValue,
  getActionColor,
  getGuardColor,
};
