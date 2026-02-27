/**
 * System Runtime Status Component
 * 
 * Investor-grade status indicator for:
 * - Settings → Intelligence
 * - ML Monitoring Dashboard
 * - Audit/Investor views
 * 
 * Shows ML influence level without implying ML control.
 */
import { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Shield, TrendingUp, 
  CheckCircle, AlertTriangle, Loader2, HelpCircle 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getModeState } from '../api/mlModes.api';
import { api } from '../api/client';

// Human-readable terminology
const ML_INFLUENCE_LABELS = {
  OFF: 'Disabled',
  ADVISOR: 'Confidence only (±10%)',
  ASSIST: 'Ordering within bucket',
};

const DRIFT_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium', 
  HIGH: 'High',
  STABLE: 'Stable',
};

const DRIFT_COLORS = {
  LOW: 'text-green-600 bg-green-100',
  STABLE: 'text-green-600 bg-green-100',
  MEDIUM: 'text-amber-600 bg-amber-100',
  HIGH: 'text-red-600 bg-red-100',
};

export function SystemRuntimeStatus({ compact = false }) {
  const [modeState, setModeState] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modeData, healthRes] = await Promise.all([
          getModeState(),
          api.get('/api/system/health').catch(() => ({ data: { status: 'unknown' } })),
        ]);
        setModeState(modeData);
        setSystemHealth(healthRes.data);
      } catch (err) {
        console.error('Failed to fetch system status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const mode = modeState?.mode || 'OFF';
  const killSwitch = modeState?.killSwitch?.status || 'ARMED';
  const driftLevel = modeState?.lastHealthCheck?.gatesPassed ? 'LOW' : 'MEDIUM';

  // Compact version for headers
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs cursor-help">
                <Cpu className="w-3 h-3" />
                <span>Rules-only</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-white border-gray-200">
              <p className="text-sm">Decision Engine operates in Rules-only mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-help ${
                mode === 'OFF' ? 'bg-gray-100 text-gray-600' : 
                mode === 'ADVISOR' ? 'bg-amber-50 text-amber-700' : 
                'bg-green-50 text-green-700'
              }`}>
                <Activity className="w-3 h-3" />
                <span>ML: {mode}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-white border-gray-200">
              <p className="text-sm">ML Influence: {ML_INFLUENCE_LABELS[mode]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Full version for Settings/Monitoring
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">System Runtime Status</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
              <p className="text-sm">Real-time system status showing decision engine mode, ML influence level, and safety status. ML never controls decisions.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Decision Engine */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-4 bg-blue-50 rounded-lg cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 uppercase font-medium">Decision Engine</span>
                </div>
                <div className="text-lg font-bold text-blue-800">Rules-only</div>
                <div className="text-xs text-blue-600 mt-1">Source of truth</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
              <p className="text-sm">The Decision Engine operates in Rules-only mode. All BUY/SELL/NEUTRAL decisions are made by deterministic rules, never by ML.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* ML Influence */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-4 rounded-lg cursor-help ${
                mode === 'OFF' ? 'bg-gray-50' : 
                mode === 'ADVISOR' ? 'bg-amber-50' : 
                'bg-green-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className={`w-4 h-4 ${
                    mode === 'OFF' ? 'text-gray-500' : 
                    mode === 'ADVISOR' ? 'text-amber-600' : 
                    'text-green-600'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    mode === 'OFF' ? 'text-gray-500' : 
                    mode === 'ADVISOR' ? 'text-amber-600' : 
                    'text-green-600'
                  }`}>ML Influence</span>
                </div>
                <div className={`text-lg font-bold ${
                  mode === 'OFF' ? 'text-gray-700' : 
                  mode === 'ADVISOR' ? 'text-amber-800' : 
                  'text-green-800'
                }`}>{mode}</div>
                <div className={`text-xs mt-1 ${
                  mode === 'OFF' ? 'text-gray-500' : 
                  mode === 'ADVISOR' ? 'text-amber-600' : 
                  'text-green-600'
                }`}>{ML_INFLUENCE_LABELS[mode]}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
              <p className="text-sm">{
                mode === 'OFF' ? 'ML is completely disabled. System runs on Engine only.' :
                mode === 'ADVISOR' ? 'ML provides confidence overlay (±10%). Does NOT change decisions or rankings.' :
                'ML can reorder items within same bucket (±2 positions). Does NOT change decisions or bucket assignments.'
              }</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Drift Level */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-4 rounded-lg cursor-help ${
                driftLevel === 'LOW' || driftLevel === 'STABLE' ? 'bg-green-50' :
                driftLevel === 'MEDIUM' ? 'bg-amber-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`w-4 h-4 ${
                    driftLevel === 'LOW' || driftLevel === 'STABLE' ? 'text-green-600' :
                    driftLevel === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    driftLevel === 'LOW' || driftLevel === 'STABLE' ? 'text-green-600' :
                    driftLevel === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'
                  }`}>Drift Level</span>
                </div>
                <div className={`text-lg font-bold ${
                  driftLevel === 'LOW' || driftLevel === 'STABLE' ? 'text-green-800' :
                  driftLevel === 'MEDIUM' ? 'text-amber-800' : 'text-red-800'
                }`}>{DRIFT_LABELS[driftLevel] || 'Unknown'}</div>
                <div className={`text-xs mt-1 ${
                  driftLevel === 'LOW' || driftLevel === 'STABLE' ? 'text-green-600' :
                  driftLevel === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'
                }`}>Data consistency</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
              <p className="text-sm">Drift Level indicates data consistency and prediction stability. Low = stable, Medium = some variance, High = significant changes detected.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Kill Switch */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-4 rounded-lg cursor-help ${
                killSwitch === 'ARMED' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${
                    killSwitch === 'ARMED' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    killSwitch === 'ARMED' ? 'text-green-600' : 'text-red-600'
                  }`}>Kill Switch</span>
                </div>
                <div className={`text-lg font-bold ${
                  killSwitch === 'ARMED' ? 'text-green-800' : 'text-red-800'
                }`}>{killSwitch === 'ARMED' ? 'Armed' : 'Triggered'}</div>
                <div className={`text-xs mt-1 ${
                  killSwitch === 'ARMED' ? 'text-green-600' : 'text-red-600'
                }`}>{killSwitch === 'ARMED' ? 'Ready to protect' : 'ML disabled'}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
              <p className="text-sm">{
                killSwitch === 'ARMED' 
                  ? 'Kill Switch is armed and ready. Will automatically disable ML if safety thresholds are exceeded.' 
                  : 'Kill Switch has been triggered. All ML operations are disabled. Engine continues normally.'
              }</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Architecture note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
          <p className="text-xs text-gray-600">
            <strong>Architecture guarantee:</strong> Decision Engine is the sole source of truth. 
            ML provides advisory signals only and cannot influence BUY/SELL/NEUTRAL decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SystemRuntimeStatus;
