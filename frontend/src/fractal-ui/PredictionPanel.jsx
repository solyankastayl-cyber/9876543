/**
 * PREDICTION PANEL — Universal prediction display
 * 
 * Shows:
 * - Action (LONG/SHORT/HOLD)
 * - Confidence
 * - Regime bias
 * - Trading enabled status
 * 
 * Same component for BTC/SPX/DXY.
 * MEMOIZED to prevent unnecessary re-renders.
 */

import React, { memo } from 'react';
import { theme } from '../core/theme';
import { ACTION_TYPES, getActionColor, META_TYPES, META_IMPACTS } from '../platform.contracts';
import { StatBlock } from './StatBlock';

export const PredictionPanel = memo(function PredictionPanel({ prediction, className = '' }) {
  if (!prediction) return null;
  
  const { action, confidence, regimeBias, tradingEnabled } = prediction;
  
  // Map action to display
  const actionDisplay = {
    [ACTION_TYPES.LONG]: { label: 'LONG', icon: '↑', color: theme.positive },
    [ACTION_TYPES.SHORT]: { label: 'SHORT', icon: '↓', color: theme.negative },
    [ACTION_TYPES.HOLD]: { label: 'HOLD', icon: '—', color: theme.textSecondary },
  };
  
  const actionInfo = actionDisplay[action] || actionDisplay[ACTION_TYPES.HOLD];
  
  // Create stat objects for confidence and regime
  const confidenceStat = {
    label: 'Confidence',
    value: confidence?.value ?? confidence,
    formatted: confidence?.formatted,
    meta: confidence?.meta || {
      type: META_TYPES.CONFIDENCE,
      impact: confidence?.value >= 0.7 ? META_IMPACTS.RISK_ON : META_IMPACTS.NEUTRAL,
    },
  };
  
  const regimeStat = regimeBias ? {
    label: 'Regime Bias',
    value: regimeBias?.value ?? regimeBias,
    formatted: regimeBias?.formatted,
    meta: regimeBias?.meta || {
      type: META_TYPES.REGIME,
      impact: META_IMPACTS.NEUTRAL,
    },
  } : null;
  
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="prediction-panel"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Prediction
      </h3>
      
      <div className="flex items-start gap-6">
        {/* Main Action */}
        <div className="flex-shrink-0">
          <div 
            className="flex items-center gap-3 px-6 py-4 rounded-lg"
            style={{ 
              background: `${actionInfo.color}15`,
              border: `2px solid ${actionInfo.color}`,
            }}
          >
            <span className="text-3xl" style={{ color: actionInfo.color }}>
              {actionInfo.icon}
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: actionInfo.color }}
            >
              {actionInfo.label}
            </span>
          </div>
          
          {/* Trading Status */}
          <div className="mt-2 text-center">
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: tradingEnabled ? theme.positiveLight : theme.negativeLight,
                color: tradingEnabled ? theme.positive : theme.negative,
              }}
            >
              {tradingEnabled ? 'Trading Active' : 'Trading Paused'}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <StatBlock data={confidenceStat} size="md" />
          {regimeStat && <StatBlock data={regimeStat} size="md" />}
        </div>
      </div>
    </div>
  );
}

export default PredictionPanel;
