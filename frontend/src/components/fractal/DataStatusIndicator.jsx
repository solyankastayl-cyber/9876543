/**
 * BLOCK U3 — Data Status Indicator (Enhanced)
 * 
 * Shows whether data is REAL (from backend calculation) or FALLBACK (cached/mock)
 * With detailed diagnostics for transparency.
 * 
 * Rules:
 * - REAL: matchesCount > 0, quality >= 0.5, no errors
 * - FALLBACK: noMatches, notEnoughCoverage, backendFallback, low quality
 * - ERROR: API failed
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Database, Loader2 } from 'lucide-react';

export function DataStatusIndicator({ 
  status = 'unknown', // 'real' | 'fallback' | 'error' | 'loading'
  reason,
  meta,
  matchesCount = 0,
  coverage,
  quality,
  horizon,
  sampleSize
}) {
  // U3: Determine status from data with detailed reason
  let computedStatus = status;
  let computedReason = reason;
  let fallbackReason = null;
  
  if (status === 'loading') {
    computedStatus = 'loading';
    computedReason = 'Fetching data...';
  } else if (status === 'error') {
    computedStatus = 'error';
    computedReason = reason || 'API Error';
  } else if (status === 'unknown' || !reason) {
    // Auto-detect status from metadata
    if (matchesCount > 0 && meta?.focus) {
      // Check quality threshold
      if (quality !== undefined && quality < 0.3) {
        computedStatus = 'fallback';
        computedReason = `${matchesCount} matches`;
        fallbackReason = 'notEnoughCoverage';
      } else if (sampleSize !== undefined && sampleSize < 5) {
        computedStatus = 'fallback';
        computedReason = `${matchesCount} matches`;
        fallbackReason = 'lowSampleSize';
      } else {
        computedStatus = 'real';
        computedReason = `${matchesCount} matches`;
      }
    } else if (matchesCount === 0) {
      computedStatus = 'fallback';
      computedReason = 'No matches';
      fallbackReason = 'noMatches';
    }
  }
  
  // Downgrade to fallback if quality is very low
  if (computedStatus === 'real' && quality !== undefined && quality < 0.5) {
    computedStatus = 'fallback';
    fallbackReason = 'lowQuality';
  }
  
  const configs = {
    real: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'REAL',
      description: 'Live backend calculation',
    },
    fallback: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'FALLBACK',
      description: 'Limited or cached data',
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'ERROR',
      description: 'Failed to fetch',
    },
    loading: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      label: 'LOADING',
      description: 'Fetching data',
    },
    unknown: {
      icon: Database,
      color: 'text-slate-400',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      label: 'UNKNOWN',
      description: 'Status unknown',
    },
  };
  
  const fallbackReasons = {
    noMatches: 'No historical matches found',
    notEnoughCoverage: 'Insufficient data coverage',
    lowSampleSize: 'Too few samples',
    lowQuality: 'Low quality score',
    backendFallback: 'Backend returned fallback',
  };
  
  const config = configs[computedStatus] || configs.unknown;
  const Icon = config.icon;
  const isLoading = computedStatus === 'loading';
  
  // Build tooltip text
  const tooltipText = [
    config.description,
    fallbackReason ? fallbackReasons[fallbackReason] : null,
    horizon ? `Horizon: ${horizon}` : null,
    quality !== undefined ? `Quality: ${(quality * 100).toFixed(0)}%` : null,
    sampleSize !== undefined ? `Sample: ${sampleSize}` : null,
  ].filter(Boolean).join(' | ');
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.bg} ${config.border} ${config.color}`}
      title={tooltipText}
      data-testid="data-status-indicator"
    >
      <Icon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      <span>DATA: {config.label}</span>
      {computedReason && (
        <span className="text-[10px] opacity-75 font-normal">({computedReason})</span>
      )}
      {fallbackReason && computedStatus === 'fallback' && (
        <span className="text-[9px] opacity-60 font-normal ml-0.5">
          [{fallbackReasons[fallbackReason]?.split(' ')[0]}]
        </span>
      )}
    </div>
  );
}

export default DataStatusIndicator;
