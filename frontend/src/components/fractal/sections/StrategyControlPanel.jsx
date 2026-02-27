/**
 * STRATEGY CONTROL PANEL — Mode & Execution Only
 * 
 * Controls:
 * - Mode: Conservative | Balanced | Aggressive
 * - Execution: Active / Shadow
 * 
 * NOTE: Horizon is controlled by GLOBAL focus selector at top of page.
 * Strategy inherits horizon from parent - no duplicate selector here.
 */

import React from 'react';
import { Settings, Play, Eye } from 'lucide-react';

const MODES = [
  { key: 'conservative', label: 'Conservative' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'aggressive', label: 'Aggressive' },
];

const EXECUTIONS = [
  { key: 'ACTIVE', label: 'Active', icon: Play, color: '#22c55e' },
  { key: 'SHADOW', label: 'Shadow', icon: Eye, color: '#6366f1' },
];

export function StrategyControlPanel({ 
  mode = 'balanced', 
  execution = 'ACTIVE',
  onModeChange,
  onExecutionChange,
  loading = false,
  // Display current horizon from parent (read-only)
  currentHorizon = '30d',
}) {
  return (
    <div className="strategy-control-panel" data-testid="strategy-control-panel" style={styles.container}>
      {/* Title */}
      <div style={styles.titleSection}>
        <Settings style={styles.icon} size={16} />
        <span style={styles.title}>Strategy Controls</span>
        {/* Show current horizon as plain text (read-only) */}
        <span style={styles.horizonLabel}>{currentHorizon.toUpperCase()}</span>
      </div>

      {/* Controls Row */}
      <div style={styles.controlsRow}>
        {/* Mode Selector */}
        <div style={styles.controlGroup}>
          <span style={styles.label}>Mode</span>
          <div style={styles.buttonGroup}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => onModeChange?.(m.key)}
                disabled={loading}
                data-testid={`mode-${m.key}`}
                style={{
                  ...styles.button,
                  ...(mode === m.key ? styles.buttonActive : {}),
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Execution Selector */}
        <div style={styles.controlGroup}>
          <span style={styles.label}>Execution</span>
          <div style={styles.buttonGroup}>
            {EXECUTIONS.map(e => {
              const Icon = e.icon;
              const isActive = execution === e.key;
              return (
                <button
                  key={e.key}
                  onClick={() => onExecutionChange?.(e.key)}
                  disabled={loading}
                  data-testid={`execution-${e.key}`}
                  style={{
                    ...styles.executionButton,
                    backgroundColor: isActive ? e.color : '#f3f4f6',
                    color: isActive ? '#fff' : '#6b7280',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <Icon size={12} style={{ marginRight: 4 }} />
                  {e.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  icon: {
    color: '#6b7280',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  horizonLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 'auto',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f3f4f6',
    padding: '3px',
    borderRadius: '8px',
  },
  button: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    backgroundColor: '#111827',
    color: '#fff',
  },
  executionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
  },
  divider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#e5e7eb',
  },
};

export default StrategyControlPanel;
