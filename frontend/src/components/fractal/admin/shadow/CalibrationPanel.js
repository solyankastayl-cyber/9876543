/**
 * BLOCK 57.2 — Calibration Delta Panel
 * 
 * Shows:
 * - ΔECE (Expected Calibration Error)
 * - ΔBrier Score
 * - Warning if Shadow wins on performance but loses on calibration
 */

import React from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

export default function CalibrationPanel({ calibration, state }) {
  const active = calibration?.active || {};
  const shadow = calibration?.shadow || {};

  const activeECE = (active.ece || 0) * 100;
  const shadowECE = (shadow.ece || 0) * 100;
  const deltaECE = shadowECE - activeECE;

  const activeBrier = (active.brier || 0) * 100;
  const shadowBrier = (shadow.brier || 0) * 100;
  const deltaBrier = shadowBrier - activeBrier;

  // Warning: if ECE or Brier degraded significantly (>2%)
  const calibrationWarning = deltaECE > 2 || deltaBrier > 2;

  const noData = !active.ece && !shadow.ece;

  return (
    <div style={styles.container} data-testid="calibration-panel">
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>Calibration Delta</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.calibration} severity="warning" />
        </div>
        <span style={styles.subtitle}>{state.preset} · {state.horizonKey}</span>
      </div>

      {noData ? (
        <div style={styles.noData}>
          Данные калибровки пока недоступны
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {/* ECE Card */}
            <div style={styles.card}>
              <span style={styles.cardLabel}>Expected Calibration Error (ECE)</span>
              <p style={styles.cardHint}>Насколько уверенность модели соответствует реальным результатам</p>
              <div style={styles.cardRow}>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>ACTIVE</span>
                  <span style={styles.value}>{activeECE.toFixed(2)}%</span>
                </div>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>SHADOW</span>
                  <span style={{ ...styles.value, color: '#3b82f6' }}>{shadowECE.toFixed(2)}%</span>
                </div>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>Δ</span>
                  <span style={{
                    ...styles.deltaValue,
                    color: deltaECE < 0 ? '#22c55e' : deltaECE > 2 ? '#ef4444' : '#64748b'
                  }}>
                    {deltaECE >= 0 ? '+' : ''}{deltaECE.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p style={styles.hint}>Меньше — лучше (модель калиброванее)</p>
            </div>

            {/* Brier Card */}
            <div style={styles.card}>
              <span style={styles.cardLabel}>Brier Score</span>
              <p style={styles.cardHint}>Точность вероятностных прогнозов</p>
              <div style={styles.cardRow}>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>ACTIVE</span>
                  <span style={styles.value}>{activeBrier.toFixed(2)}%</span>
                </div>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>SHADOW</span>
                  <span style={{ ...styles.value, color: '#3b82f6' }}>{shadowBrier.toFixed(2)}%</span>
                </div>
                <div style={styles.valueBlock}>
                  <span style={styles.roleLabel}>Δ</span>
                  <span style={{
                    ...styles.deltaValue,
                    color: deltaBrier < 0 ? '#22c55e' : deltaBrier > 2 ? '#ef4444' : '#64748b'
                  }}>
                    {deltaBrier >= 0 ? '+' : ''}{deltaBrier.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p style={styles.hint}>Меньше — лучше (точнее вероятности)</p>
            </div>
          </div>

          {/* Warning Banner */}
          {calibrationWarning && (
            <div style={styles.warning}>
              <span style={styles.warningIcon}>⚠️</span>
              <div>
                <strong>Калибровка ухудшилась:</strong> Shadow может показывать лучшие метрики производительности,
                но хуже калибрует вероятности. Это может указывать на overfitting или чрезмерную уверенность.
                <br />
                <span style={styles.warningAction}>Рекомендация: проведите дополнительный анализ перед promotion.</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20,
    marginBottom: 24
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b'
  },
  noData: {
    padding: 24,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16
  },
  card: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  cardLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 4
  },
  cardHint: {
    margin: '0 0 12px 0',
    fontSize: 11,
    color: '#94a3b8'
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12
  },
  valueBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  roleLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
    fontFamily: 'ui-monospace, monospace'
  },
  deltaValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'ui-monospace, monospace'
  },
  hint: {
    margin: '8px 0 0 0',
    fontSize: 10,
    color: '#94a3b8'
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: 8,
    fontSize: 12,
    color: '#92400e'
  },
  warningIcon: {
    fontSize: 16,
    flexShrink: 0
  },
  warningAction: {
    display: 'block',
    marginTop: 8,
    fontWeight: 500,
    color: '#78350f'
  }
};
