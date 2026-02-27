/**
 * BLOCK 57.2 — Governance Box
 * 
 * Manual governance actions:
 * - Create Promotion Proposal
 * - Freeze Shadow
 * - Archive Shadow
 * 
 * All disabled until resolved >= 30
 */

import React from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

export default function GovernanceBox({ meta, recommendation, canAct, minRequired }) {
  const resolved = meta?.resolvedCount || 0;
  const verdict = recommendation?.verdict || 'INSUFFICIENT_DATA';

  const handlePromotion = () => {
    if (!canAct) return;
    alert('Promotion Proposal flow would open here.\nThis creates a formal proposal for human review.');
  };

  const handleFreeze = () => {
    if (!canAct) return;
    alert('Freeze Shadow flow would open here.\nThis pauses shadow signal generation.');
  };

  const handleArchive = () => {
    if (!canAct) return;
    alert('Archive Shadow flow would open here.\nThis moves shadow to historical reference only.');
  };

  return (
    <div style={styles.container} data-testid="governance-box">
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>Governance Actions</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.governanceActions} severity="warning" />
        </div>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: canAct ? '#dcfce7' : '#f1f5f9',
          color: canAct ? '#166534' : '#64748b'
        }}>
          {canAct ? 'Действия доступны' : 'Действия заблокированы'}
        </span>
      </div>

      {/* Lock Warning */}
      {!canAct && (
        <div style={styles.lockWarning}>
          <span style={styles.lockIcon}>🔒</span>
          <div>
            <strong>Для разблокировки требуется {minRequired}+ resolved signals</strong>
            <br />
            <span style={styles.lockHint}>
              Сейчас: {resolved} resolved. Ещё {minRequired - resolved} до разблокировки.
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.buttonsRow}>
        <button
          onClick={handlePromotion}
          disabled={!canAct}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          data-testid="promotion-btn"
        >
          Создать Promotion Proposal
        </button>

        <button
          onClick={handleFreeze}
          disabled={!canAct}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          data-testid="freeze-btn"
        >
          Freeze Shadow
        </button>

        <button
          onClick={handleArchive}
          disabled={!canAct}
          style={{
            ...styles.button,
            ...styles.dangerButton,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          data-testid="archive-btn"
        >
          Archive Shadow
        </button>
      </div>

      {/* Audit Note */}
      <div style={styles.auditNote}>
        <span style={styles.auditIcon}>📝</span>
        <span>
          Все governance-действия логируются в audit trail и требуют подтверждения.
          Автоматические promotions отключены.
        </span>
      </div>

      {/* Verdict Context */}
      {canAct && (
        <div style={styles.verdictContext}>
          <strong>Текущий вердикт:</strong> {verdict}
          {verdict === 'SHADOW_OUTPERFORMS' && (
            <span style={styles.verdictHint}>
              — Shadow показывает статистически значимое улучшение. Рекомендуется рассмотреть promotion.
            </span>
          )}
          {verdict === 'HOLD_ACTIVE' && (
            <span style={styles.verdictHint}>
              — Active модель работает адекватно. Действия не рекомендуются.
            </span>
          )}
          {verdict === 'INSUFFICIENT_DATA' && (
            <span style={styles.verdictHint}>
              — Недостаточно данных для статистически значимого вывода.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20
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
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500
  },
  lockWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    color: '#374151'
  },
  lockIcon: {
    fontSize: 20
  },
  lockHint: {
    fontSize: 12,
    color: '#64748b'
  },
  buttonsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16
  },
  button: {
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    transition: 'all 0.15s ease'
  },
  primaryButton: {
    backgroundColor: '#000',
    color: '#fff'
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    color: '#374151',
    border: '1px solid #e2e8f0'
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  },
  auditNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#94a3b8'
  },
  auditIcon: {
    fontSize: 14
  },
  verdictContext: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 12,
    color: '#374151'
  },
  verdictHint: {
    color: '#64748b',
    marginLeft: 4
  }
};
