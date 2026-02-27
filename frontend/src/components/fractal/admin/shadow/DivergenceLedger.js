/**
 * BLOCK 57.2 — Divergence Ledger
 * 
 * Table showing divergent decisions between ACTIVE and SHADOW.
 * Filters by preset/horizon.
 */

import React, { useState } from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

export default function DivergenceLedger({ ledger, fullLedger, state, onPresetChange, onHorizonChange }) {
  const [showAll, setShowAll] = useState(false);

  const displayLedger = showAll ? fullLedger : ledger;

  if (!fullLedger || fullLedger.length === 0) {
    return (
      <div style={styles.container} data-testid="divergence-ledger">
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h3 style={styles.title}>Divergence Ledger</h3>
            <InfoTooltip {...FRACTAL_TOOLTIPS.divergenceLedger} severity="info" />
          </div>
        </div>
        <div style={styles.noData}>
          Расхождения ещё не зафиксированы.
          <br />
          <span style={styles.hint}>Расхождение возникает, когда ACTIVE и SHADOW принимают разные торговые решения.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} data-testid="divergence-ledger">
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>Divergence Ledger</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.divergenceLedger} severity="info" />
        </div>
        <div style={styles.filters}>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            <span>Показать все ({fullLedger.length})</span>
          </label>
        </div>
      </div>

      {displayLedger.length === 0 ? (
        <div style={styles.noData}>
          Нет расхождений для {state.preset} · {state.horizonKey}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Preset</th>
                <th style={styles.th}>Horizon</th>
                <th style={styles.th}>Active</th>
                <th style={styles.th}>Shadow</th>
                <th style={styles.th}>Realized</th>
                <th style={styles.th}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {displayLedger.slice(0, 20).map((row, i) => {
                const winnerColor = row.winner === 'SHADOW' ? '#3b82f6' :
                                   row.winner === 'ACTIVE' ? '#374151' : '#94a3b8';
                const realizedColor = row.realizedReturn >= 0 ? '#22c55e' : '#ef4444';

                return (
                  <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{row.asofDate}</td>
                    <td style={styles.td}>
                      <span style={styles.presetBadge}>{row.preset?.slice(0, 3)}</span>
                    </td>
                    <td style={styles.td}>{row.horizon}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.actionBadge,
                        backgroundColor: row.activeAction === 'LONG' ? '#dcfce7' :
                                        row.activeAction === 'SHORT' ? '#fef2f2' : '#f3f4f6',
                        color: row.activeAction === 'LONG' ? '#166534' :
                               row.activeAction === 'SHORT' ? '#dc2626' : '#6b7280'
                      }}>
                        {row.activeAction}
                      </span>
                      <span style={styles.sizeText}>{(row.activeSize * 100).toFixed(0)}%</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.actionBadge,
                        backgroundColor: row.shadowAction === 'LONG' ? '#dbeafe' :
                                        row.shadowAction === 'SHORT' ? '#fef2f2' : '#f3f4f6',
                        color: row.shadowAction === 'LONG' ? '#1d4ed8' :
                               row.shadowAction === 'SHORT' ? '#dc2626' : '#6b7280'
                      }}>
                        {row.shadowAction}
                      </span>
                      <span style={styles.sizeText}>{(row.shadowSize * 100).toFixed(0)}%</span>
                    </td>
                    <td style={{ ...styles.td, color: realizedColor, fontFamily: 'ui-monospace' }}>
                      {row.realizedReturn >= 0 ? '+' : ''}{(row.realizedReturn * 100).toFixed(2)}%
                    </td>
                    <td style={{ ...styles.td, color: winnerColor, fontWeight: 600 }}>
                      {row.winner}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {displayLedger.length > 20 && (
        <div style={styles.footer}>
          Показано 20 из {displayLedger.length} записей
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
  filters: {
    display: 'flex',
    gap: 12
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#64748b',
    cursor: 'pointer'
  },
  noData: {
    padding: 32,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13
  },
  hint: {
    fontSize: 11,
    color: '#cbd5e1'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #e2e8f0',
    color: '#64748b',
    fontWeight: 500,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
    fontSize: 12
  },
  rowEven: {
    backgroundColor: '#fff'
  },
  rowOdd: {
    backgroundColor: '#f8fafc'
  },
  presetBadge: {
    padding: '2px 6px',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 500,
    color: '#475569'
  },
  actionBadge: {
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500
  },
  sizeText: {
    marginLeft: 6,
    fontSize: 10,
    color: '#94a3b8'
  },
  footer: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8'
  }
};
