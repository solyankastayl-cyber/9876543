/**
 * L4.1 — Daily Run Card with Lifecycle Integration
 * 
 * Shows daily run status with lifecycle before/after
 */

import React, { useState, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, ArrowRight, Activity } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function StepBadge({ step }) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded ${step.ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {step.ok ? (
          <CheckCircle className="w-3 h-3 text-emerald-600" />
        ) : (
          <XCircle className="w-3 h-3 text-red-600" />
        )}
        <span className={`text-xs font-medium ${step.ok ? 'text-emerald-800' : 'text-red-800'}`}>
          {step.name}
        </span>
      </div>
      <span className="text-xs text-gray-500">{step.ms}ms</span>
    </div>
  );
}

function LifecycleTransition({ before, after, transition }) {
  if (!before || !after) return null;
  
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 mb-2">Lifecycle Transition</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center p-2 bg-white rounded border">
          <p className="text-xs text-gray-500">Before</p>
          <p className="font-semibold text-gray-900">{before.status}</p>
          <p className="text-xs text-gray-500">{before.liveSamples}/30 samples</p>
        </div>
        
        <ArrowRight className={`w-5 h-5 ${transition ? 'text-amber-500' : 'text-gray-300'}`} />
        
        <div className={`flex-1 text-center p-2 rounded border ${transition ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
          <p className="text-xs text-gray-500">After</p>
          <p className={`font-semibold ${transition ? 'text-amber-800' : 'text-gray-900'}`}>{after.status}</p>
          <p className="text-xs text-gray-500">{after.liveSamples}/30 samples</p>
        </div>
      </div>
      
      {transition && (
        <p className="mt-2 text-sm text-amber-600 text-center font-medium">
          Status Changed: {transition}
        </p>
      )}
    </div>
  );
}

export function L4DailyRunCard() {
  const [asset, setAsset] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runNow = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/ops/daily-run/run-now?asset=${asset}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.ok) {
        setResult(data.data);
      } else {
        setError(data.error || 'Run failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [asset]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm" data-testid="l4-daily-run-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Daily Run Orchestrator</h3>
            <p className="text-xs text-gray-500">L4.1 Lifecycle Integration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={asset}
            onChange={e => setAsset(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="BTC">BTC</option>
            <option value="SPX">SPX</option>
          </select>
          
          <button
            onClick={runNow}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Now
          </button>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${result.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {result.ok ? 'SUCCESS' : 'FAILED'}
              </div>
              <span className="text-sm text-gray-500">{result.asset} • {result.mode}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {result.durationMs}ms
              </span>
              <span className="text-xs text-gray-400 font-mono">{result.runId}</span>
            </div>
            
            {/* Lifecycle Transition */}
            <LifecycleTransition 
              before={result.lifecycle?.before}
              after={result.lifecycle?.after}
              transition={result.lifecycle?.transition}
            />
            
            {/* Steps */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Pipeline Steps ({result.steps?.length || 0})</p>
              <div className="grid grid-cols-2 gap-1">
                {result.steps?.map((step, i) => (
                  <StepBadge key={i} step={step} />
                ))}
              </div>
            </div>
            
            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-600 font-medium mb-1">Warnings</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-amber-800">{w}</p>
                ))}
              </div>
            )}
            
            {/* Errors */}
            {result.errors?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium mb-1">Errors</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-800">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!result && !error && (
          <div className="text-center py-8 text-gray-500">
            <p>Click "Run Now" to execute daily pipeline with lifecycle hooks</p>
            <p className="text-xs mt-1">Steps: Snapshot → Resolve → Drift → Lifecycle → Warmup → Promote → Integrity</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default L4DailyRunCard;
