/**
 * MLOps Actions Component
 * 
 * Quick action buttons for MLOps operations
 */

import { useState } from 'react';
import { 
  RefreshCw, 
  ArrowDown, 
  Play, 
  AlertTriangle,
  Loader2,
  Brain
} from 'lucide-react';

export function MLOpsActions({ state, onRetrain, onRollback, candidateId }) {
  const [retraining, setRetraining] = useState(false);
  const [rolling, setRolling] = useState(false);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await onRetrain();
    } finally {
      setRetraining(false);
    }
  };

  const handleRollback = async () => {
    if (!window.confirm('Are you sure you want to rollback to the previous model?')) {
      return;
    }
    setRolling(true);
    try {
      await onRollback();
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900">
        <Play className="w-5 h-5 text-green-500" />
        Quick Actions
      </h3>

      <div className="space-y-3">
        {/* Retrain Button */}
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          {retraining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span className="font-medium">
            {retraining ? 'Training...' : 'Retrain Model'}
          </span>
        </button>
        <p className="text-xs text-gray-500 pl-2">
          Creates a new CANDIDATE model from recent data
        </p>

        {/* Rollback Button */}
        <button
          onClick={handleRollback}
          disabled={rolling || !state?.prevActive}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          {rolling ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown className="w-5 h-5" />
          )}
          <span className="font-medium">
            {rolling ? 'Rolling back...' : 'Rollback Active Model'}
          </span>
        </button>
        <p className="text-xs text-gray-500 pl-2">
          {state?.prevActive 
            ? `Restore previous model: ${state.prevActive.slice(0, 8)}...`
            : 'No previous model to rollback to'
          }
        </p>
      </div>

      {/* Status Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500 mb-2">Current State</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Active:</span>
            <span className="font-mono text-green-600">
              {state?.active ? state.active.slice(0, 12) + '...' : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Candidate:</span>
            <span className="font-mono text-blue-600">
              {state?.candidate ? state.candidate.slice(0, 12) + '...' : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Previous:</span>
            <span className="font-mono text-gray-500">
              {state?.prevActive ? state.prevActive.slice(0, 12) + '...' : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Warning */}
      {candidateId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-700">
              <strong>Candidate Ready:</strong> A candidate model is waiting for promotion.
              Review metrics before promoting to production.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
