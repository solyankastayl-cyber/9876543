/**
 * Advanced System Overview
 * Main Advanced screen - "Can I trust the system right now?"
 * 
 * Checklist:
 * - ML Mode shown (RULES_ONLY/SHADOW/ACTIVE)
 * - Drift Level shown and colored
 * - Safety Status clear (SAFE/DEGRADED)
 * - Auto-Rollback State visible
 * - Product Impact: ML affects confidence only
 * - Tokens affected by ML shown
 * - Confidence cap active if drift != LOW
 * - NO training metrics
 * - NO precision/recall
 * - NO train/evaluate buttons
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Shield, Activity } from 'lucide-react';
import { apiGet } from '../api/client';

export default function SystemOverview({ embedded = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/api/advanced/system-overview');
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
    return <div className="p-8">Loading system overview...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-600">Failed to load system overview</div>;
  }

  const { systemState, productImpact, recentCriticalEvents } = data;

  const getStatusColor = (status) => {
    if (status === 'SAFE' || status === 'ARMED' || status === 'ACTIVE') return 'text-green-600';
    if (status === 'SHADOW' || status === 'MEDIUM') return 'text-yellow-600';
    if (status === 'DEGRADED' || status === 'TRIGGERED' || status === 'HIGH' || status === 'CRITICAL') return 'text-red-600';
    return 'text-gray-600';
  };

  const content = (
    <>
      {/* System State */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">ML Mode</div>
          <div className={`text-2xl font-bold ${getStatusColor(systemState.mlMode)}`}>
            {systemState.mlMode}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Drift Level</div>
          <div className={`text-2xl font-bold ${getStatusColor(systemState.driftLevel)}`}>
            {systemState.driftLevel}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Safety</div>
          <div className={`text-2xl font-bold ${getStatusColor(systemState.safety)}`}>
            {systemState.safety === 'SAFE' ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                SAFE
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                DEGRADED
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Auto-Rollback</div>
          <div className={`text-2xl font-bold ${getStatusColor(systemState.autoRollback)}`}>
            {systemState.autoRollback}
          </div>
        </div>
      </div>

      {/* Product Impact - KEY SECTION */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Product Impact
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">ML affects confidence:</span>
            <span className="font-bold text-lg">
              {productImpact.mlAffectsConfidence ? (
                <span className="text-green-600">YES</span>
              ) : (
                <span className="text-gray-600">NO</span>
              )}
            </span>
          </div>

          {productImpact.mlAffectsConfidence && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Avg ML modifier:</span>
                <span className="font-bold text-lg">
                  {productImpact.avgMlModifier?.toFixed(2) || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tokens affected:</span>
                <span className="font-bold text-lg">
                  {productImpact.tokensAffected || 0} / 20
                </span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-700">Confidence cap active:</span>
            <span className="font-bold text-lg">
              {productImpact.confidenceCapActive ? (
                <span className="text-red-600">YES</span>
              ) : (
                <span className="text-green-600">NO</span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-300 text-sm text-gray-700">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Important:</strong> ML affects confidence only. Score is not changed.
        </div>
      </div>

      {/* Recent Critical Events */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Last Critical Events</h2>
        
        {recentCriticalEvents.length === 0 ? (
          <div className="text-gray-500 text-sm">No critical events in recent history</div>
        ) : (
          <div className="space-y-2">
            {recentCriticalEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-600">{event.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation - only show when not embedded */}
      {!embedded && (
        <div className="flex gap-4">
          <Link
            to="/advanced/ml-health"
            className="px-6 py-3 bg-white text-white rounded-lg hover:bg-gray-100 font-medium"
          >
            → Go to ML Health
          </Link>
          <Link
            to="/advanced/signals-attribution"
            className="px-6 py-3 bg-white text-white rounded-lg hover:bg-gray-100 font-medium"
          >
            → Go to Signals & Attribution
          </Link>
        </div>
      )}
    </>
  );

  // If embedded, return content without wrapper
  if (embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  // Standalone page with header
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">System Overview</h1>
      {content}
    </div>
  );
}
