/**
 * EXPLAIN ENGINE
 * 
 * Main entry point for generating human-readable explanations.
 * Combines formatter and rules engine.
 * 
 * Usage:
 *   import { generateExplanation } from '@/core/explain';
 *   const text = generateExplanation(0.85, { type: 'confidence', impact: 'risk_on' });
 */

import { formatValue } from './formatter';
import { explainByType } from './rules';

/**
 * Generate a human-readable explanation for a value
 * @param {number|string} value - Raw value
 * @param {Object} meta - TooltipMeta object
 * @returns {string} Human-readable explanation
 */
export function generateExplanation(value, meta) {
  if (!meta) return 'No additional information available.';
  
  const formatted = formatValue(value, meta.type);
  return explainByType(formatted, meta);
}

/**
 * Generate explanation from StatWithMeta object
 * @param {Object} stat - StatWithMeta object
 * @returns {string} Human-readable explanation
 */
export function explainStat(stat) {
  if (!stat) return '';
  return generateExplanation(stat.value, stat.meta);
}

/**
 * Generate short explanation (single sentence)
 * @param {number|string} value
 * @param {Object} meta
 * @returns {string}
 */
export function generateShortExplanation(value, meta) {
  const full = generateExplanation(value, meta);
  // Return first sentence only
  const firstSentence = full.split('.')[0];
  return firstSentence ? `${firstSentence}.` : full;
}

export { formatValue } from './formatter';
export { explainByType } from './rules';

export default {
  generateExplanation,
  explainStat,
  generateShortExplanation,
  formatValue,
  explainByType,
};
