/**
 * Advanced ML Health
 * Combines ML Ready + Shadow ML + Safety
 * Answers: "Is ML ready and safe to use?"
 * 
 * Checklist:
 * - Readiness: READY/NOT_READY with blocking reasons
 * - Shadow ML: comparison available, verdict clear
 * - FP risk highlighted if exists
 * - Kill Switch status visible
 * - Last rollback with reason
 * - Actions only active if allowed
 * - Can't retrain if NOT_READY
 * - Can't enable ML without Shadow
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { apiGet } from '../api/client';

export default function MLHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/api/advanced/ml-health');
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Loading ML health...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-600">Failed to load ML health</div>;
  }

  const { readiness, shadowPerformance, safety, actions } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ML Health</h1>

      {/* Readiness Gate */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Readiness Gate</h2>
        
        <div className="flex items-center gap-3 mb-4">
          {readiness.status === 'READY' ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">READY</span>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-red-600">NOT READY</span>
            </>
          )}
        </div>

        {readiness.blockingReasons.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Blocking reasons:</div>
            {readiness.blockingReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-600">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shadow ML Performance */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Shadow ML Summary</h2>
        
        {!shadowPerformance.comparisonAvailable ? (
          <div className="text-gray-500 text-sm">
            No shadow evaluation data available yet
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Precision Lift</div>
                <div className={`text-2xl font-bold ${
                  shadowPerformance.precisionLift > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {shadowPerformance.precisionLift > 0 ? '+' : ''}
                  {shadowPerformance.precisionLift?.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">FP Delta</div>
                <div className={`text-2xl font-bold ${
                  shadowPerformance.fpDelta < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {shadowPerformance.fpDelta > 0 ? '+' : ''}
                  {shadowPerformance.fpDelta?.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Verdict</div>
                <div className={`text-lg font-bold ${
                  shadowPerformance.verdict === 'OUTPERFORMS' ? 'text-green-600' :
                  shadowPerformance.verdict === 'DEGRADED' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {shadowPerformance.verdict}
                </div>
              </div>
            </div>

            {shadowPerformance.verdict === 'DEGRADED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>FP Risk:</strong> ML shows elevated false positives. Auto-rollback will trigger if enabled.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Block */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Safety
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Kill Switch:</span>
            <span className={`font-bold text-lg ${
              safety.killSwitch === 'TRIGGERED' ? 'text-red-600' : 'text-green-600'
            }`}>
              {safety.killSwitch}
            </span>
          </div>

          {safety.lastRollbackReason && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-gray-700">Last Rollback:</div>
              <div className="text-sm text-gray-600">{safety.lastRollbackReason}</div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-700">Rule Overrides:</span>
            <span className="font-bold text-lg">{safety.ruleOverrides}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!actions.canRetrain}
            className={`px-6 py-3 rounded-lg font-medium ${
              actions.canRetrain
                ? 'bg-white text-white hover:bg-gray-100'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Retrain Model
          </button>

          <button
            disabled={!actions.canRunShadowEval}
            className={`px-6 py-3 rounded-lg font-medium ${
              actions.canRunShadowEval
                ? 'bg-white text-white hover:bg-gray-100'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Run Shadow Evaluation
          </button>

          <button
            disabled={!actions.canDisableML}
            className={`px-6 py-3 rounded-lg font-medium ${
              actions.canDisableML
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Disable ML (Manual)
          </button>
        </div>
      </div>
    </div>
  );
}
