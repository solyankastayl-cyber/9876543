/**
 * STAT BLOCK — Universal statistics display component
 * 
 * Automatically renders:
 * - Label
 * - Formatted value
 * - Hover tooltip with auto-generated explanation
 * 
 * NO manual text required.
 */

import React, { useState } from 'react';
import { generateExplanation, formatValue } from '../core/explain';
import { theme } from '../core/theme';

export function StatBlock({ data, size = 'md', variant = 'default', className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!data) return null;
  
  const { label, value, formatted, meta } = data;
  const displayValue = formatted || formatValue(value, meta?.type);
  const explanation = generateExplanation(value, meta);
  
  // Size variants
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Variant styles
  const variantStyles = {
    default: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
    },
    positive: {
      background: theme.positiveLight,
      border: `1px solid ${theme.positive}`,
    },
    negative: {
      background: theme.negativeLight,
      border: `1px solid ${theme.negative}`,
    },
    accent: {
      background: theme.accentLight,
      border: `1px solid ${theme.accent}`,
    },
  };
  
  const style = variantStyles[variant] || variantStyles.default;
  
  // Value color based on meta impact
  const getValueColor = () => {
    if (!meta?.impact) return theme.textPrimary;
    switch (meta.impact) {
      case 'risk_on':
        return theme.positive;
      case 'risk_off':
        return theme.negative;
      case 'mixed':
        return theme.warning;
      default:
        return theme.textPrimary;
    }
  };
  
  return (
    <div 
      className={`relative rounded-lg p-4 ${className}`}
      style={style}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-testid={`stat-${label?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Label */}
      <div 
        className="text-xs font-medium uppercase tracking-wide mb-1"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </div>
      
      {/* Value */}
      <div 
        className={`font-bold ${sizeClasses[size]}`}
        style={{ color: getValueColor() }}
      >
        {displayValue}
      </div>
      
      {/* Tooltip */}
      {showTooltip && explanation && (
        <div 
          className="absolute z-50 left-0 right-0 -bottom-2 transform translate-y-full"
          style={{
            background: theme.textPrimary,
            color: theme.background,
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.4',
            boxShadow: theme.shadowMd,
            maxWidth: '300px',
          }}
        >
          {explanation}
          <div 
            className="absolute -top-1 left-4 w-2 h-2 rotate-45"
            style={{ background: theme.textPrimary }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Inline stat (no border/background)
 */
export function StatInline({ data, className = '' }) {
  if (!data) return null;
  
  const { label, value, formatted, meta } = data;
  const displayValue = formatted || formatValue(value, meta?.type);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span style={{ color: theme.textSecondary }} className="text-sm">
        {label}:
      </span>
      <span style={{ color: theme.textPrimary }} className="font-medium">
        {displayValue}
      </span>
    </div>
  );
}

/**
 * Stat row (multiple stats in a row)
 */
export function StatRow({ stats, className = '' }) {
  if (!stats?.length) return null;
  
  return (
    <div className={`flex gap-4 ${className}`}>
      {stats.map((stat, i) => (
        <StatBlock key={stat?.label || i} data={stat} size="sm" />
      ))}
    </div>
  );
}

export default StatBlock;
