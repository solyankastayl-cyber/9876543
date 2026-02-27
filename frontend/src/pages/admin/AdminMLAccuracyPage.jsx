/**
 * Admin ML Accuracy Page - ML v2.1 STEP 2
 * 
 * Accuracy tracking, drift detection, and ML status monitoring.
 */

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../api/client';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  RefreshCw, Loader2, CheckCircle, XCircle,
  HelpCircle, Play, Eye, EyeOff, Zap, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

// ============ INFO TOOLTIP ============
function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-slate-400 hover:text-slate-600 ml-1">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white text-white border-slate-700">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ ML STATUS INDICATOR ============
function MLStatusIndicator({ status }) {
  const config = {
    ACTIVE: { 
      color: 'bg-green-500', 
      text: 'ACTIVE', 
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      description: 'ML model is performing within acceptable parameters'
    },
    DEGRADED: { 
      color: 'bg-amber-500', 
      text: 'DEGRADED', 
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: AlertTriangle,
      description: 'Model performance is below target. Consider retraining.'
    },
    DISABLED: { 
      color: 'bg-red-500', 
      text: 'DISABLED', 
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: XCircle,
      description: 'ML model is disabled due to significant drift.'
    },
  };

  const cfg = config[status] || config.ACTIVE;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.borderColor} ${cfg.bgColor} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${cfg.color} animate-pulse`} />
          <div>
            <div className={`font-semibold ${cfg.textColor}`}>{cfg.text}</div>
            <div className="text-xs text-slate-500 mt-0.5">{cfg.description}</div>
          </div>
        </div>
        <Icon className={`w-6 h-6 ${cfg.textColor}`} />
      </div>
    </div>
  );
}

// ============ ACCURACY CARD ============
function AccuracyCard({ snapshot }) {
  const accuracyPct = (snapshot.accuracy * 100).toFixed(1);
  const isGood = snapshot.accuracy >= 0.55;
  const isBad = snapshot.accuracy < 0.45;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 capitalize">{snapshot.network}</span>
        <Badge variant="outline" className="text-xs">
          {snapshot.window}
        </Badge>
      </div>
      <div className={`text-3xl font-bold ${
        isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-amber-600'
      }`}>
        {accuracyPct}%
      </div>
      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium text-slate-700">{snapshot.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Correct:</span>
          <span className="font-medium text-green-600">{snapshot.correct}</span>
        </div>
        <div className="flex justify-between">
          <span>Wrong:</span>
          <span className="font-medium text-red-600">{snapshot.wrong}</span>
        </div>
      </div>
    </div>
  );
}

// ============ DRIFT EVENT CARD ============
function DriftEventCard({ drift, onAcknowledge, acknowledging }) {
  const severityConfig = {
    LOW: { 
      color: 'bg-yellow-50 border-yellow-200', 
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600'
    },
    MEDIUM: { 
      color: 'bg-orange-50 border-orange-200', 
      badge: 'bg-orange-100 text-orange-700 border-orange-300',
      icon: AlertTriangle,
      iconColor: 'text-orange-600'
    },
    HIGH: { 
      color: 'bg-red-50 border-red-200', 
      badge: 'bg-red-100 text-red-700 border-red-300',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
  };

  const cfg = severityConfig[drift.severity] || severityConfig.LOW;
  const Icon = cfg.icon;
  const deltaPct = (drift.delta * 100).toFixed(1);

  return (
    <div className={`rounded-lg border ${cfg.color} p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 ${cfg.iconColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 capitalize">{drift.network}</span>
              <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                {drift.severity}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Accuracy dropped by <span className="font-mono font-medium text-red-600">{deltaPct}%</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              <div>Baseline ({drift.baselineWindow}): <span className="font-medium">{(drift.baselineValue * 100).toFixed(1)}%</span></div>
              <div>Current ({drift.currentWindow}): <span className="font-medium">{(drift.currentValue * 100).toFixed(1)}%</span></div>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(drift.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
            {drift.actionSuggested}
          </Badge>
          {!drift.acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(drift._id)}
              disabled={acknowledging === drift._id}
              className="text-xs"
            >
              {acknowledging === drift._id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Acknowledge
                </>
              )}
            </Button>
          )}
          {drift.acknowledged && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Acknowledged
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ACCURACY TIMELINE ============
function AccuracyTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No accuracy history available. Run accuracy compute to generate data.
      </div>
    );
  }

  // Sort by date and take last 14 points
  const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-14);
  const maxAccuracy = Math.max(...sorted.map(s => s.accuracy), 0.7);
  const minAccuracy = Math.min(...sorted.map(s => s.accuracy), 0.3);
  const range = maxAccuracy - minAccuracy || 0.1;

  return (
    <div className="h-48 flex items-end gap-1 px-2">
      {sorted.map((s, i) => {
        const height = ((s.accuracy - minAccuracy) / range) * 100;
        const isGood = s.accuracy >= 0.55;
        const isBad = s.accuracy < 0.45;

        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isGood ? 'bg-green-500' : isBad ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">
                    {new Date(s.createdAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-white border-slate-700">
                <div className="text-xs space-y-1">
                  <div className="font-medium">{(s.accuracy * 100).toFixed(1)}%</div>
                  <div className="text-slate-400">
                    {s.correct}/{s.correct + s.wrong} correct
                  </div>
                  <div className="text-slate-400">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminMLAccuracyPage() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [acknowledging, setAcknowledging] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [snapshots, setSnapshots] = useState([]);
  const [history, setHistory] = useState([]);
  const [drifts, setDrifts] = useState([]);
  const [driftSummary, setDriftSummary] = useState(null);

  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedWindow, setSelectedWindow] = useState('7d');

  // Compute ML status based on drift events
  const computeMLStatus = useCallback(() => {
    if (!driftSummary) return 'ACTIVE';
    const { unacknowledged, bySeverity } = driftSummary;
    
    if (bySeverity?.HIGH > 0 || unacknowledged > 5) return 'DISABLED';
    if (bySeverity?.MEDIUM > 0 || unacknowledged > 2) return 'DEGRADED';
    return 'ACTIVE';
  }, [driftSummary]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [snapshotsRes, driftsRes, driftSummaryRes] = await Promise.all([
        api.get(`/api/admin/ml/accuracy/snapshots?window=${selectedWindow}`, { headers }),
        api.get('/api/admin/ml/drift?limit=20', { headers }),
        api.get('/api/admin/ml/drift/summary', { headers }),
      ]);

      if (snapshotsRes.data.ok) setSnapshots(snapshotsRes.data.data || []);
      if (driftsRes.data.ok) setDrifts(driftsRes.data.data || []);
      if (driftSummaryRes.data.ok) setDriftSummary(driftSummaryRes.data.data);

      // Fetch history for first network or selected
      const networks = snapshotsRes.data.data?.map(s => s.network) || [];
      if (networks.length > 0) {
        const networkToFetch = selectedNetwork || networks[0];
        setSelectedNetwork(networkToFetch);
        
        const historyRes = await api.get(
          `/api/admin/ml/accuracy/history?network=${networkToFetch}&window=${selectedWindow}&limit=30`, 
          { headers }
        );
        if (historyRes.data.ok) setHistory(historyRes.data.data || []);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accuracy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWindow]);

  // Fetch history when network changes
  useEffect(() => {
    if (!selectedNetwork) return;
    
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await api.get(
          `/api/admin/ml/accuracy/history?network=${selectedNetwork}&window=${selectedWindow}&limit=30`, 
          { headers }
        );
        if (res.data.ok) setHistory(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    
    fetchHistory();
  }, [selectedNetwork, selectedWindow]);

  // Trigger accuracy compute
  const triggerCompute = async () => {
    setComputing(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post('/api/admin/ml/accuracy/compute', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.ok) {
        setSuccess(`Computed ${res.data.data.computed} snapshots`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Compute failed');
    } finally {
      setComputing(false);
    }
  };

  // Trigger drift detection
  const triggerDriftDetection = async () => {
    setDetecting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post('/api/admin/ml/drift/detect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.ok) {
        setSuccess(`Checked ${res.data.data.checked} networks, found ${res.data.data.drifts} drifts`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Detection failed');
    } finally {
      setDetecting(false);
    }
  };

  // Acknowledge drift
  const acknowledgeDrift = async (driftId) => {
    setAcknowledging(driftId);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post(`/api/admin/ml/drift/${driftId}/acknowledge`, 
        { action: 'NONE' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.ok) {
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Acknowledge failed');
    } finally {
      setAcknowledging(null);
    }
  };

  const mlStatus = computeMLStatus();
  const networks = [...new Set(snapshots.map(s => s.network))];
  const unacknowledgedDrifts = drifts.filter(d => !d.acknowledged);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ML Accuracy & Drift</h1>
              <p className="text-sm text-slate-500">Model performance monitoring and drift detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* ML Status */}
        <MLStatusIndicator status={mlStatus} />

        {/* Manual Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center">
                  Compute Accuracy
                  <InfoTip text="Calculate accuracy snapshots for all networks. Creates 1d and 7d window snapshots." />
                </h3>
                <p className="text-xs text-slate-500 mt-1">Generate accuracy metrics from outcomes</p>
              </div>
              <Button onClick={triggerCompute} disabled={computing}>
                {computing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Compute
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center">
                  Detect Drift
                  <InfoTip text="Compare 1d accuracy vs 7d baseline to detect model degradation." />
                </h3>
                <p className="text-xs text-slate-500 mt-1">Check for model performance degradation</p>
              </div>
              <Button onClick={triggerDriftDetection} disabled={detecting}>
                {detecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-2" />
                )}
                Detect
              </Button>
            </div>
          </div>
        </div>

        {/* Accuracy Timeline */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Accuracy Timeline
              <InfoTip text="Historical accuracy over time for selected network and window" />
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="text-sm border border-slate-300 rounded px-3 py-1.5"
                disabled={networks.length === 0}
              >
                {networks.length === 0 && <option value="">No data</option>}
                {networks.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                className="text-sm border border-slate-300 rounded px-3 py-1.5"
              >
                <option value="1d">1 Day</option>
                <option value="7d">7 Days</option>
                <option value="14d">14 Days</option>
              </select>
            </div>
          </div>
          <AccuracyTimeline history={history} />
        </div>

        {/* Current Snapshots */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Current Accuracy by Network
            <InfoTip text="Latest accuracy snapshot for each network" />
          </h3>
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No snapshots available. Click "Compute" to generate accuracy data.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {snapshots.map((s, i) => (
                <AccuracyCard key={s._id || i} snapshot={s} />
              ))}
            </div>
          )}
        </div>

        {/* Drift Warnings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
              Drift Warnings
              <InfoTip text="Model degradation events that require attention" />
            </h3>
            {driftSummary && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  Total: <span className="font-medium text-slate-700">{driftSummary.total}</span>
                </span>
                <span className="text-amber-600">
                  Pending: <span className="font-medium">{driftSummary.unacknowledged}</span>
                </span>
              </div>
            )}
          </div>

          {unacknowledgedDrifts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span>No active drift warnings. Model performing within thresholds.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {unacknowledgedDrifts.map((d) => (
                <DriftEventCard 
                  key={d._id} 
                  drift={d} 
                  onAcknowledge={acknowledgeDrift}
                  acknowledging={acknowledging}
                />
              ))}
            </div>
          )}

          {/* Show acknowledged drifts if any */}
          {drifts.filter(d => d.acknowledged).length > 0 && (
            <details className="mt-4">
              <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                Show {drifts.filter(d => d.acknowledged).length} acknowledged warnings
              </summary>
              <div className="space-y-3 mt-3 opacity-60">
                {drifts.filter(d => d.acknowledged).map((d) => (
                  <DriftEventCard 
                    key={d._id} 
                    drift={d} 
                    onAcknowledge={acknowledgeDrift}
                    acknowledging={acknowledging}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
