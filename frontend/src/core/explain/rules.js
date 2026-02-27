/**
 * EXPLANATION RULES ENGINE
 * 
 * Deterministic rules for generating human-readable explanations.
 * No manual text - only rules that generate text automatically.
 * 
 * Each function takes a formatted value and metadata,
 * and returns an explanation string.
 */

import { META_TYPES, META_IMPACTS } from '../../platform.contracts';

/**
 * Main entry point - select explanation by type
 */
export function explainByType(formattedValue, meta) {
  switch (meta?.type) {
    case META_TYPES.PROBABILITY:
      return explainProbability(formattedValue, meta);
    
    case META_TYPES.MULTIPLIER:
      return explainMultiplier(formattedValue, meta);
    
    case META_TYPES.ALLOCATION:
      return explainAllocation(formattedValue, meta);
    
    case META_TYPES.REGIME:
      return explainRegime(formattedValue, meta);
    
    case META_TYPES.LIQUIDITY:
      return explainLiquidity(formattedValue, meta);
    
    case META_TYPES.STRESS:
      return explainStress(formattedValue, meta);
    
    case META_TYPES.CONFIDENCE:
      return explainConfidence(formattedValue, meta);
    
    case META_TYPES.VOLATILITY:
      return explainVolatility(formattedValue, meta);
    
    case META_TYPES.SCORE:
      return explainScore(formattedValue, meta);
    
    default:
      return 'Current system state indicator.';
  }
}

/* ---------- RULE FUNCTIONS ---------- */

function explainProbability(value, meta) {
  if (meta.impact === META_IMPACTS.RISK_ON) {
    return `Higher probability (${value}) supports continuation of risk-positive conditions.`;
  }
  if (meta.impact === META_IMPACTS.RISK_OFF) {
    return `Elevated probability (${value}) signals increased downside risk.`;
  }
  return `Current probability stands at ${value}.`;
}

function explainMultiplier(value, meta) {
  if (meta.direction === 'negative') {
    return `Position size is reduced by factor ${value} due to defensive conditions.`;
  }
  if (meta.direction === 'positive') {
    return `Position size is increased by factor ${value} due to supportive conditions.`;
  }
  return `Adjustment factor applied: ${value}.`;
}

function explainAllocation(value, meta) {
  if (meta.relatedAssets?.length) {
    return `Current allocation equals ${value} of capital for ${meta.relatedAssets.join(', ')}.`;
  }
  return `Current allocation equals ${value} of capital.`;
}

function explainRegime(value, meta) {
  if (meta.impact === META_IMPACTS.RISK_OFF) {
    return `Market regime indicates defensive environment (${value}).`;
  }
  if (meta.impact === META_IMPACTS.RISK_ON) {
    return `Market regime reflects supportive conditions (${value}).`;
  }
  return `Current regime: ${value}.`;
}

function explainLiquidity(value, meta) {
  if (meta.impact === META_IMPACTS.RISK_ON) {
    return `Liquidity conditions are supportive (${value}).`;
  }
  if (meta.impact === META_IMPACTS.RISK_OFF) {
    return `Liquidity contraction detected (${value}).`;
  }
  return 'Liquidity conditions are neutral.';
}

function explainStress(value, meta) {
  if (meta.impact === META_IMPACTS.RISK_OFF) {
    return `Stress indicators are elevated (${value}). Risk reduction recommended.`;
  }
  return 'Stress levels are contained.';
}

function explainConfidence(value, meta) {
  const level = parseFloat(value) >= 70 ? 'high' : parseFloat(value) >= 40 ? 'moderate' : 'low';
  return `Model confidence level is ${value} (${level}). ${
    level === 'low' ? 'Consider reduced position sizing.' : ''
  }`;
}

function explainVolatility(value, meta) {
  if (meta.impact === META_IMPACTS.RISK_OFF) {
    return `Elevated volatility (${value}) suggests increased market uncertainty.`;
  }
  if (meta.impact === META_IMPACTS.RISK_ON) {
    return `Low volatility (${value}) indicates stable market conditions.`;
  }
  return `Current volatility: ${value}.`;
}

function explainScore(value, meta) {
  if (meta.drivers?.length) {
    return `Score of ${value} driven by: ${meta.drivers.slice(0, 3).join(', ')}.`;
  }
  return `Composite score: ${value}.`;
}

export default { explainByType };
