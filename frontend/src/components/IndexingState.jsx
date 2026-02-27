/**
 * IndexingState Component (P2.1 Step 3)
 * 
 * Unified component for displaying indexing progress.
 * Features:
 * - Progress bar with animation
 * - Current step display
 * - ETA countdown
 * - "You can leave this page" hint
 */
import React from 'react';
import { Loader2, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatETA, formatStepName } from '../hooks/useBootstrapProgress';

/**
 * Progress bar with smooth animation
 */
function ProgressBar({ progress, status }) {
  const getBarColor = () => {
    if (status === 'done') return 'bg-emerald-500';
    if (status === 'failed') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

/**
 * Main IndexingState component
 */
export function IndexingState({
  progress = 0,
  step = null,
  etaSeconds = null,
  status = 'running',
  attempts = 0,
  showHint = true,
  compact = false,
  className = '',
}) {
  const eta = formatETA(etaSeconds);
  const stepName = formatStepName(step);
  const isDone = status === 'done';
  const isFailed = status === 'failed';
  const isQueued = status === 'queued';
  const isRunning = status === 'running';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isRunning && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        {isQueued && <Clock className="w-4 h-4 text-gray-400" />}
        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {isFailed && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span className="text-sm text-gray-600">
          {isQueued && 'Preparing...'}
          {isRunning && `Analyzing (${progress}%)`}
          {isDone && 'Ready'}
          {isFailed && 'Analysis failed'}
        </span>
        {eta && isRunning && (
          <span className="text-xs text-gray-400">{eta}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          )}
          {isQueued && (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
          )}
          {isDone && (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          )}
          {isFailed && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {isQueued && 'Preparing Analysis'}
              {isRunning && 'Analyzing Wallet'}
              {isDone && 'Analysis Complete'}
              {isFailed && 'Analysis Failed'}
            </h3>
            <p className="text-sm text-gray-500">{stepName}</p>
          </div>
        </div>
        
        {/* Progress percentage */}
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">{progress}%</span>
          {eta && (isRunning || isQueued) && (
            <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
              {eta}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar progress={progress} status={status} />

      {/* Step details */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          {isRunning && (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Gathering on-chain data...</span>
            </>
          )}
          {isQueued && <span>Waiting to start...</span>}
          {isDone && <span>All data collected</span>}
          {isFailed && attempts > 0 && (
            <span>Failed after {attempts} attempt{attempts > 1 ? 's' : ''}</span>
          )}
        </div>
        
        {attempts > 1 && (isRunning || isQueued) && (
          <span className="text-amber-600 text-xs">
            Retry {attempts}/5
          </span>
        )}
      </div>

      {/* Hint */}
      {showHint && (isRunning || isQueued) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            You can leave this page — analysis continues in the background
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for cards/lists
 */
export function IndexingBadge({ status, progress, etaSeconds, className = '' }) {
  const eta = formatETA(etaSeconds);
  
  const getConfig = () => {
    switch (status) {
      case 'done':
        return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, text: 'Ready' };
      case 'failed':
        return { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Failed' };
      case 'queued':
        return { color: 'bg-gray-100 text-gray-600', icon: Clock, text: 'Queued' };
      case 'running':
      default:
        return { color: 'bg-blue-100 text-blue-700', icon: Loader2, text: `${progress}%` };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const isSpinning = status === 'running';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <Icon className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
      <span>{config.text}</span>
      {eta && status === 'running' && (
        <span className="text-gray-500">({eta})</span>
      )}
    </div>
  );
}

export default IndexingState;
