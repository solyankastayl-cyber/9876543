/**
 * Reality Badge Component
 * 
 * Shows CONFIRMS / NO_DATA / CONTRADICTS verdict
 */

import React from 'react';
import { CheckCircle, MinusCircle, XCircle, HelpCircle } from 'lucide-react';

const VERDICT_CONFIG = {
  CONFIRMS: {
    icon: CheckCircle,
    color: '#10b981',
    bg: '#d1fae5',
    label: 'Confirms',
    emoji: '✅',
  },
  NO_DATA: {
    icon: MinusCircle,
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'No Data',
    emoji: '⚪',
  },
  CONTRADICTS: {
    icon: XCircle,
    color: '#ef4444',
    bg: '#fee2e2',
    label: 'Contradicts',
    emoji: '❌',
  },
};

export function RealityBadge({ verdict, size = 'md', showLabel = true }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.NO_DATA;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: { icon: 14, text: '10px', padding: '2px 6px' },
    md: { icon: 16, text: '12px', padding: '4px 10px' },
    lg: { icon: 20, text: '14px', padding: '6px 14px' },
  };
  
  const s = sizeClasses[size] || sizeClasses.md;
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: s.padding,
        borderRadius: '999px',
        background: config.bg,
        border: `1px solid ${config.color}40`,
        fontSize: s.text,
        fontWeight: 600,
        color: config.color,
      }}
      title={`Reality: ${config.label}`}
      data-testid={`reality-badge-${verdict?.toLowerCase()}`}
    >
      <Icon size={s.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function RealityBadgeMini({ verdict }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.NO_DATA;
  return (
    <span title={`Reality: ${config.label}`}>
      {config.emoji}
    </span>
  );
}

export default RealityBadge;
