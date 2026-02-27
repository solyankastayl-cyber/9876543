/**
 * P1: ML Monitoring Dashboard Components
 * Enhanced visibility into ML state and safety
 */
import { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  Clock, Shield, TrendingUp, ArrowRight, Zap,
  Loader2, RefreshCw
} from 'lucide-react';
import { getModeState, getModeAudit, getKillSwitchEvents } from '../../api/mlModes.api';
import { api } from '../../api/client';

// ============ 1. ML LIFECYCLE TIMELINE ============
export function MLLifecycleTimeline() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchState();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const modes = ['OFF', 'ADVISOR', 'ASSIST'];
  const currentMode = state?.mode || 'OFF';
  const currentIdx = modes.indexOf(currentMode);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">ML Lifecycle</h3>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between mb-4">
        {modes.map((mode, idx) => {
          const isActive = idx === currentIdx;
          const isPast = idx < currentIdx;
          
          return (
            <div key={mode} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${idx < modes.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isActive 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                    : isPast 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {isActive ? '●' : isPast ? '✓' : idx + 1}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {mode}
                </span>
              </div>
              {idx < modes.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  isPast ? 'bg-green-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current state info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Current Mode:</span>
          <span className={`font-bold ${
            currentMode === 'OFF' ? 'text-gray-600' :
            currentMode === 'ADVISOR' ? 'text-amber-600' : 'text-green-600'
          }`}>{currentMode}</span>
        </div>
        {state?.modeChangedAt && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">Changed:</span>
            <span className="text-gray-700">
              {new Date(state.modeChangedAt).toLocaleString('ru-RU')}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">By:</span>
          <span className="text-gray-700">{state?.modeChangedBy || 'system'}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Mode changes are gate-driven and logged.
      </p>
    </div>
  );
}

// ============ 2. WHY ML IS BLOCKED CARD ============
export function WhyMLBlockedCard() {
  const [gates, setGates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGates = async () => {
      try {
        const res = await api.get('/api/ml/readiness');
        if (res.data.ok) {
          setGates(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch gates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGates();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const gatesList = [
    { key: 'datasetOk', label: 'DATASET', desc: 'Minimum samples required' },
    { key: 'modelQualityOk', label: 'CALIBRATION', desc: 'ECE threshold' },
    { key: 'driftOk', label: 'STABILITY', desc: 'No drift detected' },
    { key: 'shadowOk', label: 'SHADOW', desc: 'Shadow mode validated' },
    { key: 'coverageOk', label: 'COVERAGE', desc: 'Market coverage' },
  ];

  const allPassed = gatesList.every(g => gates?.gates?.[g.key]);

  return (
    <div className={`rounded-xl border-2 p-6 ${
      allPassed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        {allPassed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        )}
        <h3 className="text-lg font-semibold text-gray-900">
          {allPassed ? 'ML Ready for Activation' : 'Why ML is Blocked'}
        </h3>
      </div>

      <div className="space-y-2">
        {gatesList.map(gate => {
          const passed = gates?.gates?.[gate.key];
          return (
            <div 
              key={gate.key}
              className={`flex items-center justify-between p-2 rounded-lg ${
                passed ? 'bg-white/50' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-medium text-sm ${
                  passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {gate.label}
                </span>
              </div>
              <span className="text-xs text-gray-500">{gate.desc}</span>
            </div>
          );
        })}
      </div>

      {gates?.blocking_reasons?.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <div className="text-xs text-red-600 uppercase mb-1">Blocking Reasons</div>
          <ul className="text-sm text-red-700 space-y-1">
            {gates.blocking_reasons.map((reason, idx) => (
              <li key={idx}>• {reason.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4 text-center italic">
        No override buttons. Gates are absolute.
      </p>
    </div>
  );
}

// ============ 3. KILL SWITCH HISTORY ============
export function KillSwitchHistory({ limit = 10 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getKillSwitchEvents(limit);
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch kill switch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">Kill Switch History</h3>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No kill switch events</p>
          <p className="text-xs text-gray-400 mt-1">System has been stable</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.map((event, idx) => (
            <div 
              key={event.eventId || idx}
              className={`p-3 rounded-lg border ${
                event.eventType === 'TRIGGER' || event.eventType === 'AUTO_OFF' || event.eventType === 'MANUAL_OFF'
                  ? 'bg-red-50 border-red-100'
                  : 'bg-green-50 border-green-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  event.eventType === 'RESET' 
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {event.eventType}
                </span>
                <span className="text-xs text-gray-500">
                  {event.timestamp && new Date(event.timestamp).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{event.modeBefore}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-900">{event.modeAfter}</span>
              </div>
              {event.trigger?.type && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  Trigger: {event.trigger.type}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center italic">
        "Kill Switch is not an incident — it's a feature."
      </p>
    </div>
  );
}

// ============ 4. ML INFLUENCE SCOPE ============
export function MLInfluenceScope() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900">ML Influence Scope</h3>
      </div>

      {/* Visual diagram */}
      <div className="relative p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          {/* Signals */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">Signals</span>
          </div>

          <ArrowRight className="w-6 h-6 text-gray-400" />

          {/* Engine */}
          <div className="text-center relative">
            <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mb-2 ring-2 ring-green-300">
              <Zap className="w-10 h-10 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">Engine</span>
            
            {/* ML arrow pointing up */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-300">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-[10px] text-purple-600 mt-1">ML</div>
                <div className="h-4 w-0.5 bg-purple-300" />
              </div>
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-gray-400" />

          {/* Decision */}
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">Decision</span>
          </div>
        </div>
      </div>

      {/* Constraints */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-700">no BUY/SELL</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-700">no gates</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-700">no buckets</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-700">confidence ±10%</span>
        </div>
      </div>
    </div>
  );
}

// ============ 5. MINIMAL REGRESSION PANEL ============
export function MinimalRegressionPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/api/ml/shadow/summary');
        if (res.data.ok) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const getColor = (value, thresholds) => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (thresholds.good(value)) return 'text-green-600';
    if (thresholds.warn(value)) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBgColor = (value, thresholds) => {
    if (value === null || value === undefined) return 'bg-gray-50';
    if (thresholds.good(value)) return 'bg-green-50';
    if (thresholds.warn(value)) return 'bg-amber-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const agreement = metrics?.lastRun?.metrics?.agreementRate ?? null;
  const flip = metrics?.lastRun?.metrics?.flipRate ?? null;
  const ece = metrics?.lastRun?.metrics?.calibration?.ece ?? null;

  const agreementThresholds = {
    good: v => v >= 0.7,
    warn: v => v >= 0.5,
  };
  const flipThresholds = {
    good: v => v <= 0.05,
    warn: v => v <= 0.07,
  };
  const eceThresholds = {
    good: v => v <= 0.10,
    warn: v => v <= 0.15,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Daily Metrics</h3>
        <span className="text-xs text-gray-400">(MVP)</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-lg text-center ${getBgColor(agreement, agreementThresholds)}`}>
          <div className="text-xs text-gray-500 uppercase mb-1">Agreement</div>
          <div className={`text-2xl font-bold ${getColor(agreement, agreementThresholds)}`}>
            {agreement !== null ? `${(agreement * 100).toFixed(0)}%` : 'N/A'}
          </div>
        </div>

        <div className={`p-4 rounded-lg text-center ${getBgColor(flip, flipThresholds)}`}>
          <div className="text-xs text-gray-500 uppercase mb-1">Flip Rate</div>
          <div className={`text-2xl font-bold ${getColor(flip, flipThresholds)}`}>
            {flip !== null ? `${(flip * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        <div className={`p-4 rounded-lg text-center ${getBgColor(ece, eceThresholds)}`}>
          <div className="text-xs text-gray-500 uppercase mb-1">ECE</div>
          <div className={`text-2xl font-bold ${getColor(ece, eceThresholds)}`}>
            {ece !== null ? ece.toFixed(3) : 'N/A'}
          </div>
        </div>
      </div>

      {metrics?.lastRun?.completedAt && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Last run: {new Date(metrics.lastRun.completedAt).toLocaleString('ru-RU')}
        </p>
      )}
    </div>
  );
}

// ============ EXPORTS ============
// Components are exported inline with 'export function'
