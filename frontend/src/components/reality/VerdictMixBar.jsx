/**
 * Verdict Mix Bar Component - LIGHT THEME SUPPORT
 * 
 * Shows C / X / N distribution
 */

import React from 'react';

export function VerdictMixBar({ confirms, contradicts, nodata, height = 8, lightTheme = false }) {
  const total = confirms + contradicts + nodata;
  if (total === 0) return null;
  
  const cPct = (confirms / total) * 100;
  const xPct = (contradicts / total) * 100;
  const nPct = (nodata / total) * 100;
  
  const bgColor = lightTheme ? '#e5e7eb' : '#374151';
  
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height,
        borderRadius: height / 2,
        overflow: 'hidden',
        background: bgColor,
      }}
      title={`Confirms: ${confirms}, Contradicts: ${contradicts}, No Data: ${nodata}`}
    >
      {cPct > 0 && (
        <div
          style={{
            width: `${cPct}%`,
            background: '#10b981',
          }}
        />
      )}
      {xPct > 0 && (
        <div
          style={{
            width: `${xPct}%`,
            background: '#ef4444',
          }}
        />
      )}
      {nPct > 0 && (
        <div
          style={{
            width: `${nPct}%`,
            background: '#9ca3af',
          }}
        />
      )}
    </div>
  );
}

export function VerdictMixText({ confirms, contradicts, nodata }) {
  return (
    <span style={{ fontSize: '12px', color: '#6b7280' }}>
      <span style={{ color: '#10b981', fontWeight: 600 }}>{confirms}</span>
      <span style={{ color: '#9ca3af' }}> true</span>
      {' · '}
      <span style={{ color: '#ef4444', fontWeight: 600 }}>{contradicts}</span>
      <span style={{ color: '#9ca3af' }}> fake</span>
    </span>
  );
}

export default VerdictMixBar;
