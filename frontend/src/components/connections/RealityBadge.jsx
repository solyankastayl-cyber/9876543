/**
 * Reality Badge Component
 * 
 * PHASE D: Shows on-chain reality verification status.
 */

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function RealityBadge({ 
  verdict, 
  confidence, 
  compact = false,
  showDetails = true 
}) {
  const badges = {
    CONFIRMED: {
      icon: CheckCircle,
      label: 'Reality Confirmed',
      shortLabel: 'Confirmed',
      color: '#10B981',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
    },
    CONTRADICTED: {
      icon: XCircle,
      label: 'Reality Contradicted',
      shortLabel: 'Contradicted',
      color: '#EF4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
    },
    NO_DATA: {
      icon: AlertCircle,
      label: 'Awaiting Confirmation',
      shortLabel: 'Pending',
      color: '#F59E0B',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
    },
  };

  const badge = badges[verdict] || badges.NO_DATA;
  const Icon = badge.icon;

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium 
                   rounded-full border ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}
        title={`${badge.label}${confidence ? ` (${Math.round(confidence * 100)}% confidence)` : ''}`}
      >
        <Icon className="w-3 h-3" />
        {badge.shortLabel}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border 
                    ${badge.bgColor} ${badge.borderColor}`}>
      <Icon className={`w-4 h-4 ${badge.textColor}`} />
      <div>
        <div className={`text-sm font-medium ${badge.textColor}`}>
          {badge.label}
        </div>
        {showDetails && confidence !== undefined && (
          <div className="text-xs text-gray-500">
            {Math.round(confidence * 100)}% confidence
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Trust Multiplier Badge
 */
export function TrustBadge({ multiplier, reason }) {
  const getStyle = () => {
    if (multiplier >= 1.1) return { 
      color: '#10B981', 
      label: 'High Trust',
      icon: CheckCircle 
    };
    if (multiplier >= 0.8) return { 
      color: '#F59E0B', 
      label: 'Normal Trust',
      icon: AlertCircle 
    };
    return { 
      color: '#EF4444', 
      label: 'Low Trust',
      icon: XCircle 
    };
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
      style={{ 
        backgroundColor: `${style.color}15`, 
        color: style.color,
        border: `1px solid ${style.color}30` 
      }}
      title={reason}
    >
      <Icon className="w-3 h-3" />
      {style.label} ({Math.round(multiplier * 100)}%)
    </span>
  );
}
