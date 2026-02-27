/**
 * Feature Names Mapping
 * ======================
 * Maps feature indices to human-readable names.
 * Order must match normalizeVector() in pattern.space.ts
 */

export const FEATURE_NAMES = [
  'RSI',
  'RSI Slope',
  'RSI Z-Score',
  'MACD Histogram',
  'Momentum 1h',
  'Momentum 4h',
  'Momentum 24h',
  'Volume Z-Score',
  'Volume Trend',
  'Order Imbalance',
  'Funding Score',
  'Funding Trend',
  'OI Delta',
  'OI Z-Score',
  'Long Bias',
  'Liquidation Pressure',
  'Liquidation Z-Score',
  'Cascade Risk',
  'Volatility',
  'Volatility Z-Score',
  'Trend Strength',
  'Breakout Score',
  'Mean Reversion Score',
  'Squeeze Score',
  'BTC Correlation',
  'BTC Dominance Delta',
];

export function featureNameByIdx(idx) {
  return FEATURE_NAMES[idx] ?? `Feature #${idx}`;
}

export default FEATURE_NAMES;
