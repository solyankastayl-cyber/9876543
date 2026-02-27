/**
 * EVIDENCE PANEL — Shows reasoning behind decisions
 * 
 * Displays:
 * - Headline summary
 * - Key drivers
 * - Conflicts
 * - What would flip the decision
 */

import React, { useState } from 'react';
import { theme } from '../core/theme';
import { META_IMPACTS } from '../platform.contracts';

export function EvidencePanel({ evidence, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!evidence) return null;
  
  const { headline, summary, drivers, conflicts, whatWouldFlip } = evidence;
  
  // Impact color mapping
  const impactColor = {
    [META_IMPACTS.RISK_ON]: theme.positive,
    [META_IMPACTS.RISK_OFF]: theme.negative,
    [META_IMPACTS.NEUTRAL]: theme.textSecondary,
    [META_IMPACTS.MIXED]: theme.warning,
  };
  
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="evidence-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: theme.textSecondary }}
        >
          Evidence & Reasoning
        </h3>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs px-2 py-1 rounded"
          style={{ 
            background: theme.section,
            color: theme.textSecondary,
          }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Headline */}
      {headline && (
        <div 
          className="text-lg font-medium mb-4"
          style={{ color: theme.textPrimary }}
        >
          {headline}
        </div>
      )}
      
      {/* Summary */}
      {summary && (
        <div 
          className="text-sm mb-4"
          style={{ color: theme.textSecondary }}
        >
          {summary}
        </div>
      )}
      
      {/* Drivers */}
      {drivers && drivers.length > 0 && (
        <div className="mb-4">
          <div 
            className="text-xs font-medium uppercase mb-2"
            style={{ color: theme.textMuted }}
          >
            Key Drivers
          </div>
          <div className="space-y-2">
            {drivers.slice(0, expanded ? undefined : 3).map((driver, i) => (
              <div 
                key={driver.id || i}
                className="flex items-start gap-3 py-2 px-3 rounded"
                style={{ background: theme.section }}
              >
                <div 
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: impactColor[driver.impact] || theme.textMuted }}
                />
                <div className="flex-1">
                  <div className="text-sm" style={{ color: theme.textPrimary }}>
                    {driver.description}
                  </div>
                  {driver.strength !== undefined && (
                    <div className="text-xs mt-1" style={{ color: theme.textMuted }}>
                      Strength: {(driver.strength * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Expanded content */}
      {expanded && (
        <>
          {/* Conflicts */}
          {conflicts && conflicts.length > 0 && (
            <div className="mb-4">
              <div 
                className="text-xs font-medium uppercase mb-2"
                style={{ color: theme.textMuted }}
              >
                Conflicts
              </div>
              <div className="space-y-1">
                {conflicts.map((conflict, i) => (
                  <div 
                    key={i}
                    className="text-sm py-1 px-3 rounded"
                    style={{ 
                      background: theme.warningLight,
                      color: theme.warning,
                    }}
                  >
                    ⚠️ {conflict}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* What Would Flip */}
          {whatWouldFlip && whatWouldFlip.length > 0 && (
            <div>
              <div 
                className="text-xs font-medium uppercase mb-2"
                style={{ color: theme.textMuted }}
              >
                What Would Change This
              </div>
              <ul className="space-y-1">
                {whatWouldFlip.map((item, i) => (
                  <li 
                    key={i}
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EvidencePanel;
