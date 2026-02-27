/**
 * BLOCK 73.6 — Phase Performance Heatmap
 * 
 * Institutional-grade phase attribution panel.
 * Shows per-phase performance metrics with grade coloring.
 * 
 * Features:
 * - Grade-based row coloring (A=green, F=red)
 * - Expandable row details on hover/click
 * - Integration with Phase Click Drilldown (73.5.2)
 */

import React, { useEffect, useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Grade colors
const GRADE_COLORS = {
  A: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  B: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  C: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  D: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  F: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' },
};

// Phase type colors (matching chart)
const PHASE_COLORS = {
  ACCUMULATION: '#22c55e',
  MARKUP: '#3b82f6',
  DISTRIBUTION: '#f59e0b',
  MARKDOWN: '#ec4899',
  RECOVERY: '#06b6d4',
  CAPITULATION: '#ef4444',
};

/**
 * Phase Performance Row
 */
function PhaseRow({ phase, isExpanded, onToggle, onPhaseClick }) {
  const gradeColor = GRADE_COLORS[phase.grade] || GRADE_COLORS.F;
  const phaseColor = PHASE_COLORS[phase.phaseName] || '#6b7280';
  
  return (
    <div 
      style={{
        backgroundColor: gradeColor.bg,
        borderLeft: `4px solid ${gradeColor.border}`,
        padding: '12px 16px',
        marginBottom: 2,
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onClick={() => onToggle(phase.phaseId)}
      data-testid={`phase-row-${phase.phaseName.toLowerCase()}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Phase Name + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            backgroundColor: phaseColor,
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.5px',
            minWidth: 100,
            textAlign: 'center',
          }}>
            {phase.phaseName}
          </span>
          
          <span style={{
            backgroundColor: gradeColor.border,
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
          }}>
            {phase.grade}
          </span>
          
          {phase.sampleQuality !== 'OK' && (
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 600,
            }}>
              {phase.sampleQuality}
            </span>
          )}
        </div>
        
        {/* Metrics Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <MetricCell label="Samples" value={phase.samples} />
          <MetricCell 
            label="Hit Rate" 
            value={`${(phase.hitRate * 100).toFixed(0)}%`}
            highlight={phase.hitRate > 0.55 ? 'green' : phase.hitRate < 0.45 ? 'red' : null}
          />
          <MetricCell 
            label="Avg Ret" 
            value={`${phase.avgRet >= 0 ? '+' : ''}${(phase.avgRet * 100).toFixed(1)}%`}
            highlight={phase.avgRet > 0 ? 'green' : 'red'}
          />
          <MetricCell 
            label="Sharpe" 
            value={phase.sharpe?.toFixed(2) || '—'}
            highlight={phase.sharpe > 0.5 ? 'green' : phase.sharpe < 0 ? 'red' : null}
          />
          <MetricCell 
            label="Score" 
            value={phase.score?.toFixed(0) || '0'}
          />
          
          {/* Filter button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPhaseClick) onPhaseClick(phase.phaseId);
            }}
            style={{
              padding: '4px 10px',
              backgroundColor: '#fff',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              color: gradeColor.text,
              cursor: 'pointer',
            }}
            data-testid={`filter-phase-${phase.phaseName.toLowerCase()}`}
          >
            Filter
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${gradeColor.border}33`,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          <DetailCell label="Median Return" value={`${(phase.medianRet * 100).toFixed(2)}%`} />
          <DetailCell label="P10 (Worst)" value={`${(phase.p10 * 100).toFixed(2)}%`} />
          <DetailCell label="P90 (Best)" value={`${(phase.p90 * 100).toFixed(2)}%`} />
          <DetailCell label="Max DD" value={`-${(phase.maxDD * 100).toFixed(1)}%`} />
          <DetailCell label="Profit Factor" value={phase.profitFactor?.toFixed(2) || '—'} />
          <DetailCell label="Expectancy" value={`${(phase.expectancy * 100).toFixed(2)}%`} />
          <DetailCell label="Divergence" value={phase.avgDivergenceScore?.toFixed(0) || '—'} />
          <DetailCell label="Recency" value={`${(phase.recencyWeight * 100).toFixed(0)}%`} />
          
          {phase.warnings?.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: '#b45309' }}>
                Warnings: {phase.warnings.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value, highlight }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: highlight === 'green' ? '#16a34a' : highlight === 'red' ? '#dc2626' : '#1f2937'
      }}>
        {value}
      </div>
    </div>
  );
}

function DetailCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{value}</div>
    </div>
  );
}

/**
 * Global Stats Bar
 */
function GlobalStatsBar({ global, meta }) {
  if (!global) return null;
  
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        marginBottom: 12,
      }}
      data-testid="global-stats-bar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>
          Global Baseline
        </span>
        <span style={{ 
          fontSize: 10, 
          padding: '2px 6px', 
          backgroundColor: '#e2e8f0', 
          borderRadius: 3,
          color: '#475569',
        }}>
          {meta?.tier} • {meta?.resolvedCount} samples
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <MetricCell label="Hit Rate" value={`${(global.hitRate * 100).toFixed(0)}%`} />
        <MetricCell 
          label="Avg Return" 
          value={`${global.avgRet >= 0 ? '+' : ''}${(global.avgRet * 100).toFixed(2)}%`}
          highlight={global.avgRet > 0 ? 'green' : 'red'}
        />
        <MetricCell label="Sharpe" value={global.sharpe?.toFixed(2) || '—'} />
        <MetricCell label="Max DD" value={`-${(global.maxDD * 100).toFixed(1)}%`} />
      </div>
    </div>
  );
}

/**
 * Main Phase Heatmap Component
 */
export function PhaseHeatmap({ tier = 'TACTICAL', onPhaseFilter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/phase-performance?symbol=BTC&tier=${tier}`);
      
      // Check if response is ok before parsing JSON
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const result = await res.json();
      
      if (result.ok) {
        setData(result);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch phase performance');
      }
    } catch (err) {
      console.error('[PhaseHeatmap] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tier]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleToggle = (phaseId) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };
  
  const handlePhaseClick = (phaseId) => {
    if (onPhaseFilter) {
      // Convert internal phaseId to the format expected by chart
      // e.g., "phase_accumulation" -> "ACCUMULATION_2025-01-01_2026-01-01"
      const phaseName = phaseId.replace('phase_', '').toUpperCase();
      // Use current date range as placeholder
      const now = new Date();
      const mockPhaseId = `${phaseName}_${now.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}`;
      onPhaseFilter(mockPhaseId);
    }
  };
  
  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
      }}>
        <div style={{ color: '#6b7280', fontSize: 13 }}>Loading phase performance...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 8,
      }}>
        <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>
      </div>
    );
  }
  
  const { meta, global, phases, warnings } = data || {};
  
  return (
    <div 
      style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="phase-heatmap"
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
            Phase Performance Heatmap
          </span>
          <span style={{ 
            fontSize: 10, 
            padding: '2px 6px', 
            backgroundColor: '#e0e7ff', 
            borderRadius: 3,
            color: '#4338ca',
            fontWeight: 500,
          }}>
            BLOCK 73.6
          </span>
        </div>
        
        {warnings?.includes('FALLBACK_MODE_OVERLAY') && (
          <span style={{
            fontSize: 9,
            padding: '2px 6px',
            backgroundColor: '#fef3c7',
            borderRadius: 3,
            color: '#b45309',
          }}>
            Fallback Mode (Overlay Data)
          </span>
        )}
      </div>
      
      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Global Stats */}
        <GlobalStatsBar global={global} meta={meta} />
        
        {/* Phase Rows */}
        {phases?.length > 0 ? (
          phases.map((phase) => (
            <PhaseRow
              key={phase.phaseId}
              phase={phase}
              isExpanded={expandedPhase === phase.phaseId}
              onToggle={handleToggle}
              onPhaseClick={handlePhaseClick}
            />
          ))
        ) : (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            color: '#6b7280',
            fontSize: 13,
          }}>
            No phase data available
          </div>
        )}
      </div>
      
      {/* Footer Legend */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 10,
        color: '#6b7280',
      }}>
        <span>Grades:</span>
        {Object.entries(GRADE_COLORS).map(([grade, colors]) => (
          <span 
            key={grade}
            style={{
              backgroundColor: colors.bg,
              padding: '2px 6px',
              borderRadius: 3,
              color: colors.text,
              fontWeight: 600,
            }}
          >
            {grade}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PhaseHeatmap;
