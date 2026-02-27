/**
 * P2.A — Signal Status Badge Component
 * 
 * Visual indicator for signal lifecycle status.
 */

import React from 'react';

const STATUS_CONFIG = {
  NEW: { 
    dot: '🔵', 
    label: 'NEW', 
    className: 'bg-blue-500/15 text-blue-300 border-blue-500/25' 
  },
  ACTIVE: { 
    dot: '🟢', 
    label: 'ACTIVE', 
    className: 'bg-green-500/15 text-green-300 border-green-500/25' 
  },
  COOLDOWN: { 
    dot: '🟡', 
    label: 'COOLDOWN', 
    className: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/25' 
  },
  RESOLVED: { 
    dot: '⚫', 
    label: 'RESOLVED', 
    className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25' 
  },
  // Legacy status mappings
  new: { 
    dot: '🔵', 
    label: 'NEW', 
    className: 'bg-blue-500/15 text-blue-300 border-blue-500/25' 
  },
  active: { 
    dot: '🟢', 
    label: 'ACTIVE', 
    className: 'bg-green-500/15 text-green-300 border-green-500/25' 
  },
  cooling: { 
    dot: '🟡', 
    label: 'COOLDOWN', 
    className: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/25' 
  },
  archived: { 
    dot: '⚫', 
    label: 'RESOLVED', 
    className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25' 
  },
};

export function SignalStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
      data-testid="signal-status-badge"
    >
      <span>{config.dot}</span>
      <span>{config.label}</span>
    </span>
  );
}

export default SignalStatusBadge;
