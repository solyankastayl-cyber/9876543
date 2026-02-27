/**
 * Phase 6: Kill Switch Panel
 * Status display and manual controls
 */
import { useState, useEffect } from 'react';
import { AlertOctagon, Shield, Loader2, AlertTriangle, RefreshCw, Power, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getModeState, triggerKillSwitch, resetKillSwitch } from '../../api/mlModes.api';

export function KillSwitchPanel({ onKillSwitchChange }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const handleTrigger = async () => {
    if (!window.confirm('Activate Kill Switch? ML will be immediately disabled.')) return;
    
    setTriggering(true);
    try {
      await triggerKillSwitch('Manual trigger from UI');
      await fetchState();
      if (onKillSwitchChange) onKillSwitchChange();
    } catch (err) {
      console.error('Failed to trigger kill switch:', err);
    } finally {
      setTriggering(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset Kill Switch? ML will be available for activation again.')) return;
    
    setResetting(true);
    try {
      await resetKillSwitch();
      await fetchState();
      if (onKillSwitchChange) onKillSwitchChange();
    } catch (err) {
      console.error('Failed to reset kill switch:', err);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const killSwitch = state?.killSwitch || { status: 'ARMED' };
  const isTriggered = killSwitch.status === 'TRIGGERED';

  return (
    <div className={`rounded-xl border-2 p-6 ${
      isTriggered 
        ? 'bg-red-50 border-red-300' 
        : 'bg-green-50 border-green-300'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isTriggered ? (
            <AlertOctagon className="w-6 h-6 text-red-600" />
          ) : (
            <Shield className="w-6 h-6 text-green-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Kill Switch</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Emergency shutdown mechanism. When triggered, all ML operations stop immediately. Engine continues to work normally.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          isTriggered 
            ? 'bg-red-200 text-red-800' 
            : 'bg-green-200 text-green-800'
        }`}>
          {isTriggered ? 'TRIGGERED' : 'ARMED'}
        </span>
      </div>

      {/* Status description */}
      <p className={`text-sm mb-4 ${isTriggered ? 'text-red-700' : 'text-green-700'}`}>
        {isTriggered 
          ? 'ML is completely disabled. System is running in Engine-only mode.'
          : 'System is ready. Kill Switch activates automatically when thresholds are exceeded.'}
      </p>

      {/* Trigger info */}
      {isTriggered && killSwitch.reason && (
        <div className="mb-4 p-3 bg-red-100 rounded-lg">
          <div className="text-xs text-red-600 uppercase mb-1">Trigger Reason</div>
          <div className="text-sm text-red-800 font-medium">{killSwitch.reason}</div>
          {killSwitch.triggeredAt && (
            <div className="text-xs text-red-600 mt-1">
              {new Date(killSwitch.triggeredAt).toLocaleString('en-US')}
            </div>
          )}
        </div>
      )}

      {/* Thresholds info */}
      <div className="mb-4 p-3 bg-white/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-gray-500 uppercase">Auto Triggers</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Kill Switch triggers automatically when any of these thresholds is exceeded. No manual intervention required.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-gray-600">Flip Rate &gt; 7%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">ML predictions flip too frequently, indicating instability</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-gray-600">ECE &gt; 0.15</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Expected Calibration Error too high, predictions unreliable</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-gray-600">Critical Alert</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Any CRITICAL severity alert triggers immediate shutdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-gray-600">ML Timeout</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">ML service not responding within 30 seconds</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Health metrics */}
      {state?.lastHealthCheck && (
        <div className="mb-4 p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase mb-2">Last Health Check</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Flip Rate: </span>
              <span className={`font-medium ${state.lastHealthCheck.flipRate > 0.07 ? 'text-red-600' : 'text-green-600'}`}>
                {(state.lastHealthCheck.flipRate * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">ECE: </span>
              <span className={`font-medium ${state.lastHealthCheck.ece > 0.15 ? 'text-red-600' : 'text-green-600'}`}>
                {state.lastHealthCheck.ece?.toFixed(3) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isTriggered ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  data-testid="reset-kill-switch-btn"
                >
                  {resetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reset (Re-Arm)
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Re-arm the Kill Switch. ML will be available for activation but won't auto-enable.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleTrigger}
                  disabled={triggering}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  data-testid="trigger-kill-switch-btn"
                >
                  {triggering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  Emergency Shutdown
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Immediately disable all ML operations. Engine continues normally.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export default KillSwitchPanel;
