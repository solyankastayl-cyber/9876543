/**
 * Phase 6: ML Mode Selector
 * Radio buttons for OFF / ADVISOR / ASSIST
 */
import { useState, useEffect } from 'react';
import { Radio, Loader2, AlertTriangle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getModeState, setMode } from '../../api/mlModes.api';

const MODE_CONFIG = {
  OFF: {
    label: 'OFF',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    activeBg: 'bg-gray-200',
    description: 'ML completely disabled. Engine-only mode.',
    tooltip: 'ML service is not called. Calibration map is ignored. System runs purely on Rules Engine decisions.',
  },
  ADVISOR: {
    label: 'ADVISOR',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    activeBg: 'bg-amber-100',
    description: 'ML affects ONLY confidence (±10%).',
    tooltip: 'ML provides confidence overlay only. Decision (BUY/SELL/NEUTRAL) is NOT changed. Ranking position is NOT changed. Used for UI and analytics.',
  },
  ASSIST: {
    label: 'ASSIST',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    activeBg: 'bg-green-100',
    description: 'ML affects ordering within bucket.',
    tooltip: 'ML can reorder items within the same bucket. Max shift: ±2 positions. Bucket assignment cannot change. Requires ALL gates to PASS.',
  },
};

export function ModeSelector({ onModeChange }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  const fetchState = async () => {
    try {
      const data = await getModeState();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch mode state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleModeChange = async (newMode) => {
    if (state?.mode === newMode) return;
    if (state?.killSwitch?.status === 'TRIGGERED' && newMode !== 'OFF') {
      setError('Kill Switch is TRIGGERED. Only OFF mode is allowed.');
      return;
    }
    
    setError(null);
    setSwitching(true);
    
    try {
      const result = await setMode(newMode);
      if (result.success) {
        setState(prev => ({ ...prev, mode: result.mode }));
        if (onModeChange) onModeChange(result.mode);
      } else {
        setError(result.reason || 'Failed to change mode');
      }
    } catch (err) {
      setError(err.message || 'Failed to change mode');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentMode = state?.mode || 'OFF';
  const isKillSwitchTriggered = state?.killSwitch?.status === 'TRIGGERED';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">ML Mode</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Select how ML interacts with the system. Each mode has strict boundaries that cannot be bypassed.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${MODE_CONFIG[currentMode].bg} ${MODE_CONFIG[currentMode].color}`}>
          {currentMode}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(MODE_CONFIG).map(([mode, config]) => {
          const isActive = currentMode === mode;
          const isDisabled = switching || (isKillSwitchTriggered && mode !== 'OFF');
          
          return (
            <TooltipProvider key={mode}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleModeChange(mode)}
                    disabled={isDisabled}
                    data-testid={`mode-btn-${mode.toLowerCase()}`}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isActive 
                        ? `${config.activeBg} ${config.border} ring-2 ring-offset-2 ring-${config.color.replace('text-', '')}`
                        : `${config.bg} border-transparent hover:${config.border}`
                    } ${isDisabled && !isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`text-lg font-bold ${config.color}`}>{config.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                    
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">{config.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {switching && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Switching mode...
        </div>
      )}

      {/* Invariants reminder */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-help">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <strong>Invariants:</strong> ML never changes decision (BUY/SELL/NEUTRAL), 
                  never bypasses Engine gates, never changes bucket (HIGH/MED/LOW).
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
            <p className="text-sm">These are hardcoded architectural constraints verified by attack tests. No API exists to bypass them.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default ModeSelector;
