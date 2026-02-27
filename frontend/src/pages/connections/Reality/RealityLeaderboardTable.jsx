/**
 * Reality Leaderboard Table Component - LIGHT THEME
 */

import React from 'react';
import { RealityScoreBadge } from '../../../components/reality/RealityScoreBadge';
import { VerdictMixBar, VerdictMixText } from '../../../components/reality/VerdictMixBar';

export function RealityLeaderboardTable({ entries, onSelect, lightTheme = false }) {
  if (!entries || entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        No data available for this filter.
      </div>
    );
  }
  
  const colors = lightTheme ? {
    border: '#e5e7eb',
    hoverBg: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    avatarBg: '#f3f4f6',
  } : {
    border: '#374151',
    hoverBg: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    avatarBg: '#374151',
  };
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}`, background: lightTheme ? '#f9fafb' : '#111827' }}>
            <th style={{ ...thStyle, color: colors.textSecondary }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left', color: colors.textSecondary }}>Account</th>
            <th style={{ ...thStyle, color: colors.textSecondary }}>Reality Score</th>
            <th style={{ ...thStyle, color: colors.textSecondary }}>Verdict Mix</th>
            <th style={{ ...thStyle, color: colors.textSecondary }}>Sample</th>
            <th style={{ ...thStyle, color: colors.textSecondary }}>Last Event</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr
              key={entry.actorId}
              style={{
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={() => onSelect?.(entry)}
              onMouseEnter={e => e.currentTarget.style.background = colors.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              data-testid={`leaderboard-row-${idx}`}
            >
              {/* Rank */}
              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: colors.textSecondary }}>
                {idx < 3 ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f3f4f6' : '#ffedd5',
                    color: idx === 0 ? '#92400e' : idx === 1 ? '#374151' : '#9a3412',
                    fontWeight: 700,
                  }}>
                    {idx + 1}
                  </span>
                ) : idx + 1}
              </td>
              
              {/* Account */}
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.username}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${colors.border}` }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: colors.avatarBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {(entry.username || entry.actorId || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text, fontSize: '14px' }}>
                      {entry.name || entry.username || entry.actorId}
                    </div>
                    {entry.username && (
                      <div style={{ fontSize: '12px', color: colors.textMuted }}>@{entry.username}</div>
                    )}
                  </div>
                </div>
              </td>
              
              {/* Reality Score */}
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <RealityScoreBadge score={entry.realityScore} level={entry.level} size="sm" />
              </td>
              
              {/* Mix */}
              <td style={{ ...tdStyle, minWidth: '140px' }}>
                <VerdictMixBar
                  confirms={entry.confirms}
                  contradicts={entry.contradicts}
                  nodata={entry.nodata}
                  lightTheme={lightTheme}
                />
                <div style={{ marginTop: '6px' }}>
                  <VerdictMixText
                    confirms={entry.confirms}
                    contradicts={entry.contradicts}
                    nodata={entry.nodata}
                  />
                </div>
              </td>
              
              {/* Sample */}
              <td style={{ ...tdStyle, textAlign: 'center', color: colors.textSecondary, fontWeight: 500 }}>
                {entry.sample != null ? entry.sample : (
                  <span style={{ color: colors.textMuted }}>—</span>
                )}
              </td>
              
              {/* Last */}
              <td style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>
                {entry.lastTs ? formatDate(entry.lastTs) : (
                  <span style={{ color: colors.textMuted }}>No events</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '14px 12px',
  fontSize: '12px',
  fontWeight: 600,
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '14px 12px',
  verticalAlign: 'middle',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default RealityLeaderboardTable;
