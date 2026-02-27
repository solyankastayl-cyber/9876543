/**
 * Phase 5: Calibration Build Panel
 * UI to build new calibration maps
 */
import { useState } from 'react';
import { Hammer, Play, Loader2, CheckCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { buildCalibrationMap, simulateCalibration, applyCalibration } from '../../api/calibration.api';

const WINDOW_OPTIONS = [
  { value: '7d', label: '7 days', tooltip: 'Short-term calibration, more responsive to recent data' },
  { value: '14d', label: '14 days', tooltip: 'Medium-term calibration, balanced approach' },
  { value: '30d', label: '30 days', tooltip: 'Long-term calibration, more stable but slower to adapt' },
];

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global (all signals)', tooltip: 'Single calibration map for all signals' },
  { value: 'token', label: 'Per-Token', tooltip: 'Separate calibration map per token (more granular)' },
];

export function CalibrationBuildPanel({ onBuildComplete }) {
  const [config, setConfig] = useState({
    window: '7d',
    scope: 'global',
    limit: 1000,
    realOnly: true,
  });
  
  const [buildResult, setBuildResult] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [building, setBuilding] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  const handleBuild = async () => {
    setError(null);
    setBuildResult(null);
    setSimResult(null);
    setBuilding(true);
    
    try {
      const result = await buildCalibrationMap(config);
      if (result.success) {
        setBuildResult(result);
      } else {
        setError(result.error || 'Build failed');
      }
    } catch (err) {
      setError(err.message || 'Build failed');
    } finally {
      setBuilding(false);
    }
  };

  const handleSimulate = async () => {
    if (!buildResult?.runId) return;
    setError(null);
    setSimulating(true);
    
    try {
      const result = await simulateCalibration(buildResult.runId);
      setSimResult(result);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleApply = async () => {
    if (!buildResult?.runId || !buildResult?.mapId) return;
    if (!simResult?.guardResult?.passed) {
      if (!window.confirm('Simulation did not pass. Apply anyway?')) return;
    }
    
    setError(null);
    setApplying(true);
    
    try {
      const result = await applyCalibration(buildResult.runId, buildResult.mapId, 'PRODUCTION');
      if (result.success) {
        setBuildResult(null);
        setSimResult(null);
        if (onBuildComplete) onBuildComplete();
      } else {
        setError(result.error || 'Apply failed');
      }
    } catch (err) {
      setError(err.message || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hammer className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Build Calibration</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Create a new calibration map from shadow data. Maps are tested in simulation before activation.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Config Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs text-gray-500 uppercase">Window</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Time period for calibration data collection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select
            value={config.window}
            onChange={(e) => setConfig(c => ({ ...c, window: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="build-window-select"
          >
            {WINDOW_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs text-gray-500 uppercase">Scope</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Granularity of calibration (global vs per-token)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select
            value={config.scope}
            onChange={(e) => setConfig(c => ({ ...c, scope: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="build-scope-select"
          >
            {SCOPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs text-gray-500 uppercase">Sample Limit</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Maximum number of samples to use for calibration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <input
            type="number"
            value={config.limit}
            onChange={(e) => setConfig(c => ({ ...c, limit: parseInt(e.target.value) || 1000 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={100}
            max={10000}
            data-testid="build-limit-input"
          />
        </div>

        <div className="flex items-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.realOnly}
                    onChange={(e) => setConfig(c => ({ ...c, realOnly: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    data-testid="build-realonly-checkbox"
                  />
                  <span className="text-sm text-gray-700">Real only</span>
                </label>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Use only samples with real market outcomes (not simulated)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Build Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleBuild}
              disabled={building}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              data-testid="build-calibration-btn"
            >
              {building ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Hammer className="w-5 h-5" />
                  Build Calibration Map
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white border-gray-700">
            <p className="text-sm">Create a new calibration map from shadow data. Map will be in DRAFT status until applied.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Build Result */}
      {buildResult && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Map built (DRAFT)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">Run ID: <span className="font-mono text-xs">{buildResult.runId?.slice(0, 12)}...</span></div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">Unique build run identifier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">Map ID: <span className="font-mono text-xs">{buildResult.mapId?.slice(0, 12)}...</span></div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">Unique calibration map identifier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">Samples: <strong>{buildResult.inputMetrics?.totalSamples || 0}</strong></div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">Total number of samples used for calibration</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">Bins: <strong>{buildResult.outputMetrics?.binsCreated || 0}</strong></div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">Number of confidence bins created for calibration</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Simulation */}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                    data-testid="simulate-calibration-btn"
                  >
                    {simulating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Simulate
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">Dry-run calibration to verify guardrails pass before activation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleApply}
                    disabled={applying || !simResult}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      simResult?.guardResult?.passed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    data-testid="apply-calibration-btn"
                  >
                    {applying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Apply
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">{simResult?.guardResult?.passed ? 'Activate calibration map for production use' : 'Simulation required before applying'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Simulation Result */}
          {simResult && (
            <div className={`p-4 rounded-lg border ${
              simResult.guardResult?.passed
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                simResult.guardResult?.passed ? 'text-green-700' : 'text-red-700'
              }`}>
                {simResult.guardResult?.passed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="font-medium">{simResult.message}</span>
              </div>
              
              {simResult.guardResult?.checks && (
                <div className="space-y-1 text-sm">
                  {simResult.guardResult.checks.map((check, idx) => (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            {check.passed ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            )}
                            <span className={check.passed ? 'text-green-700' : 'text-red-700'}>
                              {check.name}: {check.message}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 text-white border-gray-700">
                          <p className="text-sm">Guardrail check: {check.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-help">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Calibration adjusts ML confidence within ±10% bounds. 
                  BUY/SELL/NEUTRAL decisions are never changed.
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
            <p className="text-sm">This is a core safety invariant. Calibration only affects confidence display, not actual trading decisions.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default CalibrationBuildPanel;
