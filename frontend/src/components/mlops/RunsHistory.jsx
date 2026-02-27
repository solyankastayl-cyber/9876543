/**
 * Runs History Component
 * 
 * Shows history of MLOps operations
 */

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Shield,
  Activity,
  Loader2
} from 'lucide-react';

export function RunsHistory({ runs }) {
  const getRunIcon = (type) => {
    switch (type) {
      case 'RETRAIN': return RefreshCw;
      case 'PROMOTION': return ArrowUp;
      case 'ROLLBACK': return ArrowDown;
      case 'SHADOW_EVAL': return Shield;
      default: return Activity;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DONE': return CheckCircle;
      case 'FAILED': return XCircle;
      case 'RUNNING': return Loader2;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'RUNNING': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'RETRAIN': return 'bg-purple-100 text-purple-700';
      case 'PROMOTION': return 'bg-green-100 text-green-700';
      case 'ROLLBACK': return 'bg-red-100 text-red-700';
      case 'SHADOW_EVAL': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '';
    const ms = new Date(end) - new Date(start);
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Group runs by date
  const groupedRuns = runs.reduce((acc, run) => {
    const date = new Date(run.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(run);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Clock className="w-5 h-5 text-gray-500" />
          Operations History
        </h3>
        <span className="text-sm text-gray-500">{runs.length} runs</span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {Object.entries(groupedRuns).map(([date, dateRuns]) => (
          <div key={date}>
            <div className="text-xs text-gray-500 mb-2 sticky top-0 bg-white py-1">
              {date}
            </div>
            <div className="space-y-2">
              {dateRuns.map((run) => {
                const TypeIcon = getRunIcon(run.type);
                const StatusIcon = getStatusIcon(run.status);

                return (
                  <div
                    key={run.runId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(run.type)}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{run.type}</span>
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(run.status)} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {run.runId.slice(0, 12)}...
                        {run.meta?.modelId && ` • Model: ${run.meta.modelId.slice(0, 8)}...`}
                        {run.meta?.metrics && ` • Acc: ${(run.meta.metrics.accuracy * 100).toFixed(1)}%`}
                        {run.meta?.activeHealth && ` • Health: ${run.meta.activeHealth}`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {formatTime(run.createdAt)}
                      </div>
                      {run.finishedAt && (
                        <div className="text-xs text-gray-400">
                          {getDuration(run.startedAt, run.finishedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {runs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No operations yet
          </div>
        )}
      </div>
    </div>
  );
}
