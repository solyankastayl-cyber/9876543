/**
 * BLOCK 57.2 — Shadow Divergence Panel (Institutional Grade)
 * 
 * One screen, one payload, one question:
 * "Is Shadow actually better, or is it noise?"
 * 
 * Sections:
 * A) Verdict Header
 * B) Equity Overlay Chart
 * C) Divergence Matrix (3×3 heatmap)
 * D) Calibration Delta Panel
 * E) Divergence Ledger
 * F) Governance Controls
 */

import React from 'react';
import { useShadowState, PRESETS, HORIZONS } from './useShadowState';
import { useShadowDivergence, useCellData, useFilteredLedger } from './useShadowDivergence';
import VerdictHeader from './VerdictHeader';
import EquityOverlayChart from './EquityOverlayChart';
import DivergenceMatrix from './DivergenceMatrix';
import CalibrationPanel from './CalibrationPanel';
import DivergenceLedger from './DivergenceLedger';
import GovernanceBox from './GovernanceBox';

export default function ShadowDivergencePanel() {
  const { state, updateState, selectCell } = useShadowState();
  const { data, loading, error, lastFetch, refetch } = useShadowDivergence(state.symbol);
  const cellData = useCellData(data, state.preset, state.horizonKey);
  const filteredLedger = useFilteredLedger(data, state.preset, state.horizon);

  // Loading state
  if (loading && !data) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Loading Shadow Divergence...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <div style={styles.errorText}>Error: {error}</div>
        <button onClick={refetch} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const meta = data.meta;
  const recommendation = data.recommendation;
  const resolved = meta?.resolvedCount || 0;
  const minRequired = 30;
  const canAct = resolved >= minRequired;

  return (
    <div style={styles.container}>
      {/* A) Verdict Header */}
      <VerdictHeader
        meta={meta}
        recommendation={recommendation}
        cellData={cellData}
        state={state}
        lastFetch={lastFetch}
        onRefresh={refetch}
      />

      {/* Main Grid: Chart + Matrix */}
      <div style={styles.mainGrid}>
        {/* B) Equity Overlay Chart */}
        <div style={styles.chartSection}>
          <EquityOverlayChart
            equity={cellData?.equity}
            state={state}
            onNormalizeChange={(normalized) => updateState({ normalized })}
          />
        </div>

        {/* C) Divergence Matrix */}
        <div style={styles.matrixSection}>
          <DivergenceMatrix
            summary={data.summary}
            selectedPreset={state.preset}
            selectedHorizon={state.horizonKey}
            onSelect={selectCell}
          />
        </div>
      </div>

      {/* D) Calibration Panel */}
      <CalibrationPanel
        calibration={cellData?.calibration}
        state={state}
      />

      {/* E) Divergence Ledger */}
      <DivergenceLedger
        ledger={filteredLedger}
        fullLedger={data.divergenceLedger}
        state={state}
        onPresetChange={(preset) => updateState({ preset })}
        onHorizonChange={(horizon) => updateState({ horizon })}
      />

      {/* F) Governance Controls */}
      <GovernanceBox
        meta={meta}
        recommendation={recommendation}
        canAct={canAct}
        minRequired={minRequired}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    gap: 12
  },
  errorIcon: {
    fontSize: 32
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    marginBottom: 24
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20
  },
  matrixSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20
  }
};
