/**
 * Phase 5: Calibration Status Card
 * Shows current calibration state
 */
import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getActiveCalibration, disableCalibration } from '../../api/calibration.api';

export function CalibrationStatusCard({ window = '7d', onRefresh }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getActiveCalibration(window);
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch calibration status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [window]);

  const handleDisable = async () => {
    if (!window.confirm('Disable calibration? ML will return to raw confidence values.')) return;
    setDisabling(true);
    try {
      await disableCalibration(window, 'Manual disable from UI');
      await fetchStatus();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to disable calibration:', err);
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const isActive = status?.status === 'ACTIVE';
  const activeMap = status?.activeMap;

  return (
    <div className={`rounded-xl border p-6 ${
      isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
          <h3 className="text-lg font-semibold text-gray-900">Calibration Status</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Calibration adjusts ML confidence values within ±10% bounds to improve prediction reliability without changing decisions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={fetchStatus}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="refresh-calibration-status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Refresh calibration status</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 bg-white rounded-lg cursor-help">
                <div className="text-xs text-gray-500 uppercase">Status</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  isActive ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">{isActive ? 'Calibration map is currently applied to ML confidence' : 'No calibration active, using raw ML confidence'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 bg-white rounded-lg cursor-help">
                <div className="text-xs text-gray-500 uppercase">Window</div>
                <div className="text-lg font-bold text-gray-900">{window}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Time window for calibration data (7d, 14d, or 30d)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {activeMap && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-white rounded-lg cursor-help">
                    <div className="text-xs text-gray-500 uppercase">Map ID</div>
                    <div className="text-sm font-mono text-gray-900 truncate" title={activeMap.mapId}>
                      {activeMap.mapId?.slice(0, 12)}...
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Unique identifier of active calibration map</p>
                  <p className="text-xs text-gray-400 mt-1">{activeMap.mapId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-white rounded-lg cursor-help">
                    <div className="text-xs text-gray-500 uppercase">Activated</div>
                    <div className="text-sm text-gray-900">
                      {activeMap.activatedAt ? new Date(activeMap.activatedAt).toLocaleDateString('en-US') : 'N/A'}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Date when calibration map was activated</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {isActive && activeMap?.guardrails && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 bg-white rounded-lg mb-4 cursor-help">
                <div className="text-xs text-gray-500 uppercase mb-2">Guardrails</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-700">
                    Max Adj: <strong className="text-gray-900">±{(activeMap.guardrails.maxAdjustment * 100).toFixed(0)}%</strong>
                  </span>
                  <span className="text-gray-700">
                    Min Samples: <strong className="text-gray-900">{activeMap.guardrails.minSamplesPerBin}</strong>
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Safety constraints: Maximum adjustment is capped at ±10%, and each bin requires minimum samples for statistical significance.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isActive && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDisable}
                disabled={disabling}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                data-testid="disable-calibration-btn"
              >
                {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Disable Calibration
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Remove active calibration. System will use raw ML confidence values.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {!isActive && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800">
              Calibration is not active. ML confidence is used without correction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalibrationStatusCard;
