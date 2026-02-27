/**
 * Phase 5: Calibration Run History
 * Shows history of calibration builds
 */
import { useState, useEffect } from 'react';
import { History, Loader2, CheckCircle, XCircle, Clock, RefreshCw, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getCalibrationRuns } from '../../api/calibration.api';

const STATUS_CONFIG = {
  COMPLETED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', tooltip: 'Build completed successfully' },
  FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', tooltip: 'Build failed due to error or guardrail violation' },
  DRAFT: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', tooltip: 'Build complete, awaiting simulation and activation' },
  ACTIVE: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', tooltip: 'Currently active calibration map' },
};

export function CalibrationRunHistory({ window: filterWindow, limit = 10 }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await getCalibrationRuns(filterWindow, limit);
      setRuns(data.runs || []);
    } catch (err) {
      console.error('Failed to fetch calibration runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [filterWindow, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Build History</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                <p className="text-sm">History of calibration map builds. Each build creates a map that can be simulated and activated.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={fetchRuns}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="refresh-run-history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Refresh build history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No calibration build records</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run, idx) => {
            const statusConfig = STATUS_CONFIG[run.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusConfig.icon;
            
            return (
              <TooltipProvider key={run.runId || idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-help"
                      data-testid={`run-history-item-${idx}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {run.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {run.window}
                            </span>
                          </div>
                          
                          <div className="text-sm font-mono text-gray-600 truncate" title={run.runId}>
                            {run.runId?.slice(0, 20)}...
                          </div>
                          
                          <div className="mt-2 flex gap-4 text-xs text-gray-500">
                            <span>Samples: <strong className="text-gray-700">{run.inputMetrics?.totalSamples || 0}</strong></span>
                            <span>Bins: <strong className="text-gray-700">{run.outputMetrics?.binsCreated || 0}</strong></span>
                            {run.outputMetrics?.deltaECE !== undefined && (
                              <span>ΔECE: <strong className="text-gray-700">{(run.outputMetrics.deltaECE * 100).toFixed(2)}%</strong></span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-xs text-gray-500">
                          {run.createdAt && new Date(run.createdAt).toLocaleString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">{statusConfig.tooltip}</p>
                    <p className="text-xs text-gray-400 mt-1">Run ID: {run.runId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CalibrationRunHistory;
