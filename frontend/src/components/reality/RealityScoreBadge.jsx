/**
 * Reality Score Badge Component
 */

import React from 'react';
import { Award, TrendingUp, AlertTriangle, XOctagon, HelpCircle } from 'lucide-react';

const LEVEL_CONFIG = {
  ELITE: {
    icon: Award,
    color: '#10b981',
    bg: '#d1fae5',
    label: 'Elite',
    description: 'Highly trustworthy',
  },
  STRONG: {
    icon: TrendingUp,
    color: '#3b82f6',
    bg: '#dbeafe',
    label: 'Strong',
    description: 'Good track record',
  },
  MIXED: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: '#fef3c7',
    label: 'Mixed',
    description: 'Inconsistent record',
  },
  RISKY: {
    icon: XOctagon,
    color: '#ef4444',
    bg: '#fee2e2',
    label: 'Risky',
    description: 'Unreliable signals',
  },
  INSUFFICIENT: {
    icon: HelpCircle,
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'Insufficient',
    description: 'Not enough data',
  },
};

export function RealityScoreBadge({ score, level, size = 'md' }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.INSUFFICIENT;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: { icon: 14, text: '11px', padding: '3px 8px' },
    md: { icon: 16, text: '13px', padding: '4px 12px' },
    lg: { icon: 20, text: '15px', padding: '6px 16px' },
  };
  
  const s = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: s.padding,
        borderRadius: '10px',
        background: config.bg,
        border: `1px solid ${config.color}`,
      }}
      title={config.description}
      data-testid={`reality-score-${level?.toLowerCase()}`}
    >
      <Icon size={s.icon} style={{ color: config.color }} />
      <span style={{ fontWeight: 700, fontSize: s.text, color: config.color }}>
        {score ?? '--'}
      </span>
      <span style={{ fontSize: s.text, color: config.color, opacity: 0.8 }}>
        {config.label}
      </span>
    </div>
  );
}

export default RealityScoreBadge;
