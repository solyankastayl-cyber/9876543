/**
 * P1.6 — Sizing Breakdown Component
 * 
 * Shows transparent breakdown of position sizing:
 * Base × Consensus × Conflict × Risk × Volatility = Final
 * 
 * Institutional desk-style, no black boxes.
 * 
 * BLOCK 73.8: Added Phase Grade integration with confidence adjustment
 */

import React from 'react';

const SEVERITY_COLORS = {
  OK: { bg: '#dcfce7', text: '#166534' },
  WARN: { bg: '#fef3c7', text: '#92400e' },
  CRITICAL: { bg: '#fecaca', text: '#991b1b' },
};

const GRADE_COLORS = {
  A: { bg: '#dcfce7', text: '#166534' },
  B: { bg: '#d1fae5', text: '#047857' },
  C: { bg: '#fef3c7', text: '#92400e' },
  D: { bg: '#fed7aa', text: '#c2410c' },
  F: { bg: '#fecaca', text: '#991b1b' },
};

const FACTOR_LABELS = {
  BASE_PRESET: 'Base Preset',
  TIER_WEIGHT: 'Tier Weight',
  CONSENSUS: 'Consensus',
  CONFLICT: 'Conflict',
  RISK: 'Risk Penalty',
  VOLATILITY: 'Volatility',
  TAIL_RISK: 'Tail Risk',
  RELIABILITY: 'Reliability',
  GOVERNANCE: 'Governance',
  PHASE: 'Phase Grade',  // BLOCK 73.7/73.8
};

export function SizingBreakdown({ sizing, volatility }) {
  if (!sizing) {
    return null;
  }

  const { 
    breakdown, 
    finalSize, 
    finalPercent, 
    formula, 
    mode, 
    blockers,
    // BLOCK 73.8: Phase grade data
    phaseGrade,
    phaseSampleQuality,
    phaseScore,
    confidenceAdjustment,
  } = sizing;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>SIZING BREAKDOWN</div>
        <div style={styles.headerRight}>
          {/* BLOCK 73.8: Phase Grade Badge */}
          {phaseGrade && (
            <div 
              style={{
                ...styles.gradeBadge,
                backgroundColor: GRADE_COLORS[phaseGrade]?.bg || '#f3f4f6',
                color: GRADE_COLORS[phaseGrade]?.text || '#374151',
              }}
              data-testid="phase-grade-badge"
              title={`Phase Score: ${phaseScore?.toFixed(0) || 'N/A'} | Sample: ${phaseSampleQuality || 'N/A'}`}
            >
              Phase: {phaseGrade}
            </div>
          )}
          <div style={styles.mode} data-mode={mode}>
            {mode}
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div style={styles.finalResult}>
        <div style={styles.finalLabel}>Final Position Size</div>
        <div style={styles.finalValue}>
          {finalPercent?.toFixed(1) || '0.0'}%
        </div>
      </div>

      {/* BLOCK 73.8: Confidence Adjustment */}
      {confidenceAdjustment && confidenceAdjustment.adjustmentPp !== 0 && (
        <div style={styles.confAdjustment}>
          <span style={styles.confLabel}>Confidence Adj:</span>
          <span style={{
            ...styles.confValue,
            color: confidenceAdjustment.adjustmentPp > 0 ? '#166534' : '#991b1b',
          }}>
            {confidenceAdjustment.adjustmentPp > 0 ? '+' : ''}{(confidenceAdjustment.adjustmentPp * 100).toFixed(0)}pp
          </span>
          <span style={styles.confReason}>
            ({confidenceAdjustment.reason?.replace(/_/g, ' ')})
          </span>
        </div>
      )}

      {/* Blockers */}
      {blockers && blockers.length > 0 && (
        <div style={styles.blockers}>
          <span style={styles.blockersLabel}>Blocked:</span>
          {blockers.map((b, i) => (
            <span key={i} style={styles.blockerBadge}>{b}</span>
          ))}
        </div>
      )}

      {/* Breakdown Table */}
      {breakdown && breakdown.length > 0 && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={styles.colFactor}>Factor</span>
            <span style={styles.colMult}>Multiplier</span>
            <span style={styles.colNote}>Impact</span>
          </div>
          
          {breakdown.map((item, i) => {
            const severity = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.OK;
            const label = FACTOR_LABELS[item.factor] || item.factor;
            
            return (
              <div key={i} style={styles.tableRow}>
                <span style={styles.colFactor}>{label}</span>
                <span style={{
                  ...styles.colMult,
                  color: item.multiplier < 0.7 ? '#dc2626' : item.multiplier < 0.9 ? '#d97706' : '#374151'
                }}>
                  ×{item.multiplier.toFixed(2)}
                </span>
                <span style={{
                  ...styles.colNote,
                  ...styles.severityBadge,
                  backgroundColor: severity.bg,
                  color: severity.text,
                }}>
                  {item.note}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Formula */}
      {formula && (
        <div style={styles.formula}>
          <span style={styles.formulaLabel}>Formula:</span>
          <code style={styles.formulaCode}>{formula} = {(finalSize * 100).toFixed(1)}%</code>
        </div>
      )}

      {/* Volatility Impact Summary */}
      {volatility && (
        <div style={styles.volSummary}>
          <span style={styles.volLabel}>Vol Regime:</span>
          <span style={{
            ...styles.volBadge,
            backgroundColor: getRegimeColor(volatility.regime).bg,
            color: getRegimeColor(volatility.regime).text,
          }}>
            {volatility.regime}
          </span>
          <span style={styles.volImpact}>
            Size ×{volatility.policy?.sizeMultiplier?.toFixed(2)}
          </span>
          {volatility.policy?.confidencePenaltyPp > 0 && (
            <span style={styles.volPenalty}>
              Conf -{(volatility.policy.confidencePenaltyPp * 100).toFixed(0)}pp
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getRegimeColor(regime) {
  const colors = {
    LOW: { bg: '#dcfce7', text: '#166534' },
    NORMAL: { bg: '#f3f4f6', text: '#374151' },
    HIGH: { bg: '#fef3c7', text: '#92400e' },
    EXPANSION: { bg: '#fee2e2', text: '#dc2626' },
    CRISIS: { bg: '#fecaca', text: '#7f1d1d' },
  };
  return colors[regime] || colors.NORMAL;
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  mode: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  // BLOCK 73.8: Phase Grade Badge styles
  gradeBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'help',
  },
  finalResult: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
  },
  finalLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  finalValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'ui-monospace, monospace',
  },
  // BLOCK 73.8: Confidence Adjustment styles
  confAdjustment: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px 12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    border: '1px solid #bbf7d0',
  },
  confLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  confValue: {
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'ui-monospace, monospace',
  },
  confReason: {
    fontSize: '10px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  blockers: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '16px',
    padding: '10px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
  },
  blockersLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#991b1b',
    marginRight: '4px',
  },
  blockerBadge: {
    fontSize: '10px',
    fontWeight: '500',
    padding: '2px 6px',
    borderRadius: '3px',
    backgroundColor: '#fecaca',
    color: '#7f1d1d',
  },
  table: {
    marginBottom: '16px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 80px 1fr',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '10px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '120px 80px 1fr',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
  },
  colFactor: {
    fontSize: '13px',
    color: '#374151',
  },
  colMult: {
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'ui-monospace, monospace',
  },
  colNote: {
    fontSize: '11px',
  },
  severityBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  formula: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  formulaLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  formulaCode: {
    fontSize: '11px',
    fontFamily: 'ui-monospace, monospace',
    color: '#374151',
  },
  volSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  volLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  volBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  volImpact: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'ui-monospace, monospace',
  },
  volPenalty: {
    fontSize: '11px',
    color: '#dc2626',
    fontFamily: 'ui-monospace, monospace',
  },
};

export default SizingBreakdown;
