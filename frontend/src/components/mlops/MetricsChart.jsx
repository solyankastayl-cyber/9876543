/**
 * Metrics Chart Component
 * 
 * Visualizes model metrics over time
 */

import { TrendingUp, BarChart3 } from 'lucide-react';

export function MetricsChart({ runs, models }) {
  // Extract shadow eval runs with metrics
  const shadowRuns = runs
    .filter(r => r.type === 'SHADOW_EVAL' && r.status === 'DONE' && r.meta?.activeECE)
    .slice(0, 20)
    .reverse();

  // Extract retrain runs with metrics
  const retrainRuns = runs
    .filter(r => r.type === 'RETRAIN' && r.status === 'DONE' && r.meta?.metrics)
    .slice(0, 10)
    .reverse();

  const maxECE = Math.max(
    ...shadowRuns.map(r => r.meta?.activeECE || 0),
    0.5
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Metrics History
        </h3>
      </div>

      {/* ECE Over Time Chart */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">ECE (Calibration Error) Over Time</div>
        
        {shadowRuns.length > 0 ? (
          <div className="relative h-32">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
              <span>{(maxECE * 100).toFixed(0)}%</span>
              <span>{(maxECE * 50).toFixed(0)}%</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-full flex items-end gap-1">
              {/* Threshold lines */}
              <div 
                className="absolute left-12 right-0 border-t border-dashed border-yellow-400"
                style={{ bottom: `${(0.3 / maxECE) * 100}%` }}
              />
              <div 
                className="absolute left-12 right-0 border-t border-dashed border-green-400"
                style={{ bottom: `${(0.2 / maxECE) * 100}%` }}
              />

              {shadowRuns.map((run, i) => {
                const ece = run.meta?.activeECE || 0;
                const height = (ece / maxECE) * 100;
                const color = ece <= 0.2 ? 'bg-green-500' :
                             ece <= 0.3 ? 'bg-yellow-500' :
                             'bg-red-500';

                return (
                  <div
                    key={run.runId}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                      style={{ height: `${height}%` }}
                      title={`ECE: ${(ece * 100).toFixed(1)}%`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            No shadow evaluations yet
          </div>
        )}
      </div>

      {/* Model Accuracy Comparison */}
      <div>
        <div className="text-sm text-gray-500 mb-2">Model Accuracy Comparison</div>
        
        {models.length > 0 ? (
          <div className="space-y-2">
            {models.slice(0, 5).map((model) => {
              const accuracy = model.metrics.accuracy * 100;
              
              return (
                <div key={model.modelId} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500 truncate">
                    {model.modelId.slice(0, 8)}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        model.stage === 'ACTIVE' ? 'bg-green-500' :
                        model.stage === 'CANDIDATE' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-right text-gray-600">
                    {accuracy.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-400 text-sm">
            No models to compare
          </div>
        )}
      </div>
    </div>
  );
}
