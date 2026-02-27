/**
 * Wallet Credibility Badge Component
 */

import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

const BADGE_CONFIG = {
  HIGH: {
    icon: ShieldCheck,
    color: '#10b981',
    bg: '#d1fae5',
    label: 'High',
  },
  MEDIUM: {
    icon: Shield,
    color: '#f59e0b',
    bg: '#fef3c7',
    label: 'Medium',
  },
  LOW: {
    icon: ShieldAlert,
    color: '#ef4444',
    bg: '#fee2e2',
    label: 'Low',
  },
  UNKNOWN: {
    icon: ShieldQuestion,
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'Unknown',
  },
};

export function WalletCredibilityBadge({ badge, size = 'md', showLabel = true }) {
  const config = BADGE_CONFIG[badge] || BADGE_CONFIG.UNKNOWN;
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
      title={`Wallet Credibility: ${config.label}`}
      data-testid={`wallet-badge-${badge?.toLowerCase()}`}
    >
      <Icon size={s.icon} />
      {showLabel && <span>Wallet: {config.label}</span>}
    </span>
  );
}

export default WalletCredibilityBadge;
