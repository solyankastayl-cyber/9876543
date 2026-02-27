/**
 * Shadow Health Component
 * 
 * Visualizes current shadow monitoring state
 */

import { Shield, AlertTriangle, CheckCircle, Clock, Activity, Play } from 'lucide-react';

export function ShadowHealth({ health, onEvaluate }) {
  if (!health) return null;

  const { active, candidate, config } = health;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Shield className="w-5 h-5 text-blue-500" />
          Shadow Monitoring
        </h3>
        <button
          onClick={onEvaluate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
        >
          <Play className="w-4 h-4" />
          Run Evaluation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Active Model Health */}
        <HealthCard
          title="Active Model"
          modelId={active.modelId}
          health={active.health}
          critStreak={active.critStreak}
          degStreak={active.degStreak}
          lastEvalAt={active.lastEvalAt}
        />

        {/* Candidate Model Health */}
        <HealthCard
          title="Candidate Model"
          modelId={candidate.modelId}
          health={candidate.health}
          critStreak={candidate.critStreak}
          degStreak={candidate.degStreak}
          lastEvalAt={candidate.lastEvalAt}
        />
      </div>

      {/* Thresholds Info */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="text-xs text-gray-500 mb-2">Health Thresholds</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Healthy: ECE ≤ {config.ECE_HEALTHY}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">Degraded: ECE ≤ {config.ECE_DEGRADED}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Critical: ECE &gt; {config.ECE_DEGRADED}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span className="text-gray-600">Auto-action at {config.CRITICAL_STREAK_THRESHOLD}× critical streak</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, modelId, health, critStreak, degStreak, lastEvalAt }) {
  const getHealthStyle = () => {
    switch (health) {
      case 'HEALTHY':
        return { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, color: 'text-green-600' };
      case 'DEGRADED':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock, color: 'text-yellow-600' };
      case 'CRITICAL':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, color: 'text-red-600' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', icon: Activity, color: 'text-gray-500' };
    }
  };

  const style = getHealthStyle();
  const Icon = style.icon;

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {health && (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${style.color} bg-white border ${style.border}`}>
            <Icon className="w-3 h-3" />
            {health}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="text-gray-500">Model:</span>{' '}
          <span className="font-mono text-gray-700">
            {modelId ? modelId.slice(0, 12) + '...' : 'None'}
          </span>
        </div>

        {modelId && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Crit Streak:</span>{' '}
                <span className={critStreak >= 3 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                  {critStreak || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Deg Streak:</span>{' '}
                <span className={degStreak >= 3 ? 'text-yellow-600' : 'text-gray-700'}>
                  {degStreak || 0}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Last eval: {formatTime(lastEvalAt)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
