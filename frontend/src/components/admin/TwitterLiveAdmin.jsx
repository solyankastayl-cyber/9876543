/**
 * Twitter Live Admin Panel (Phase 4.2 + 4.3)
 * 
 * Admin UI for read-only Twitter ingestion and Live Participation.
 * Toggle Mock ↔ Live (read-only), view diffs, control participation weights.
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, 
  CheckCircle, XCircle, Eye, Play, Database, Sliders, History,
  RotateCcw, Zap
} from 'lucide-react';
import { Button } from '../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Mode badge styles
const modeStyles = {
  off: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'OFF' },
  read_only: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Read Only' },
  preview: { bg: 'bg-green-100', text: 'text-green-600', label: 'Preview' },
  gradual: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Gradual' },
  full: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Full' },
};

// Decision badge styles
const decisionStyles = {
  ALLOW: { bg: 'bg-green-100', text: 'text-green-700' },
  DEGRADE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  BLOCK: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function TwitterLiveAdmin({ adminToken }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diffResult, setDiffResult] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Phase 4.3 states
  const [participationConfig, setParticipationConfig] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [previewResult, setPreviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('status'); // status | participation | audit

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/status`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch status');
    }
    setLoading(false);
  }, []);

  // Fetch participation config
  const fetchParticipation = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/participation`);
      const data = await res.json();
      if (data.ok) {
        setParticipationConfig(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch participation:', err);
    }
  }, []);

  // Fetch audit log
  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/participation/audit?limit=20`);
      const data = await res.json();
      if (data.ok) {
        setAuditLog(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchParticipation();
    fetchAudit();
  }, [fetchStatus, fetchParticipation, fetchAudit]);

  // Toggle mode
  const toggleMode = async (mode) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(prev => ({ ...prev, ...data.data }));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to toggle mode');
    }
  };

  // Run diff comparison
  const runDiff = async () => {
    setDiffLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (data.ok) {
        setDiffResult(data.data);
      } else {
        setError(data.error || 'Diff failed');
      }
    } catch (err) {
      setError('Failed to run diff');
    }
    
    setDiffLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading Twitter Live status...</span>
        </div>
      </div>
    );
  }

  const modeStyle = status?.mode ? modeStyles[status.mode] : modeStyles.off;

  return (
    <div className="space-y-6" data-testid="twitter-live-admin">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Twitter Live Preview</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${modeStyle.bg} ${modeStyle.text}`}>
            {modeStyle.label}
          </span>
        </div>

        {/* Safety Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">Phase 4.2: Read-Only Mode</h4>
              <p className="text-sm text-yellow-700 mt-1">
                No alerts generated. No writes to core data. Safe validation only.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Mode:</span>
          <div className="flex gap-2">
            <Button 
              variant={status?.mode === 'off' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleMode('off')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              OFF
            </Button>
            <Button 
              variant={status?.mode === 'read_only' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleMode('read_only')}
            >
              <Eye className="w-4 h-4 mr-1" />
              Read Only
            </Button>
            <Button 
              variant={status?.mode === 'preview' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleMode('preview')}
            >
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        {/* Status Info */}
        {status && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Alerts</div>
              <div className="font-semibold text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Disabled
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Writes</div>
              <div className="font-semibold text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Disabled
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Max Age</div>
              <div className="font-semibold text-gray-700">
                {status.max_age_hours}h
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Run Diff */}
      {status?.mode !== 'off' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mock vs Live Comparison</h3>
            <Button onClick={runDiff} disabled={diffLoading}>
              {diffLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Dry Compare
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {diffResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {diffResult.accounts_compared}
                  </div>
                  <div className="text-sm text-blue-600">Accounts Compared</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {diffResult.accounts_with_diff}
                  </div>
                  <div className="text-sm text-orange-600">With Significant Diff</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${diffResult.avg_score_delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {diffResult.avg_score_delta >= 0 ? '+' : ''}{diffResult.avg_score_delta}
                  </div>
                  <div className="text-sm text-purple-600">Avg Score Δ</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${diffResult.avg_confidence_delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {diffResult.avg_confidence_delta >= 0 ? '+' : ''}{(diffResult.avg_confidence_delta * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence Δ</div>
                </div>
              </div>

              {/* Flags */}
              {diffResult.aggregate_flags?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Aggregate Flags</h4>
                  <div className="flex flex-wrap gap-2">
                    {diffResult.aggregate_flags.map((f, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-white rounded text-xs border border-gray-200"
                      >
                        {f.flag} ({f.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Username</th>
                      <th className="px-3 py-2 text-right">Mock Score</th>
                      <th className="px-3 py-2 text-right">Live Score</th>
                      <th className="px-3 py-2 text-right">Δ</th>
                      <th className="px-3 py-2 text-right">Confidence</th>
                      <th className="px-3 py-2 text-left">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffResult.accounts?.slice(0, 10).map((account, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium">@{account.username}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {account.scores.mock.twitter_score}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {account.scores.live.twitter_score}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`flex items-center justify-end gap-1 ${
                            account.scores.delta.twitter_score > 0 ? 'text-green-600' : 
                            account.scores.delta.twitter_score < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {account.scores.delta.twitter_score > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : account.scores.delta.twitter_score < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : null}
                            {account.scores.delta.twitter_score > 0 ? '+' : ''}
                            {account.scores.delta.twitter_score}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            account.confidence.live >= 0.7 ? 'bg-green-100 text-green-700' :
                            account.confidence.live >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {(account.confidence.live * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {account.flags.slice(0, 2).map((flag, fidx) => (
                              <span key={fidx} className="px-1 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Explain */}
              {diffResult.accounts?.[0]?.explain && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">Sample Explain (First Account)</h4>
                  <ul className="space-y-1">
                    {diffResult.accounts[0].explain.map((e, idx) => (
                      <li key={idx} className="text-sm text-blue-600 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Phase 4.3: Live Participation Matrix */}
      {status?.mode !== 'off' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Live Participation Matrix</h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                Phase 4.3
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                await fetchParticipation();
                await fetchAudit();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Phase 4.3 Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-800">Gradual Enable Mode</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Control how live data blends with mock. Formula: <code className="bg-white px-1 rounded">value = mock × (1-w) + live × w</code>
                </p>
              </div>
            </div>
          </div>

          {/* Components Table */}
          {participationConfig && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Component</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Weight</th>
                      <th className="px-3 py-2 text-center">Effective</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(participationConfig.components || {}).map(([name, comp]) => (
                      <tr key={name} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium capitalize">{name.replace('_', ' ')}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            comp.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {comp.enabled ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {comp.weight}%
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {comp.effective_weight ?? comp.weight}%
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              const newWeight = comp.enabled ? 0 : 25;
                              try {
                                const res = await fetch(`${BACKEND_URL}/api/connections/twitter/live/participation/attempt`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ component: name, requested_weight: newWeight }),
                                });
                                const data = await res.json();
                                if (data.ok) {
                                  fetchParticipation();
                                  fetchAudit();
                                } else {
                                  setError(data.data?.reasons?.join(', ') || data.error);
                                }
                              } catch (err) {
                                setError('Failed to update component');
                              }
                            }}
                          >
                            {comp.enabled ? 'Disable' : 'Enable 25%'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Guards Config */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Guard Thresholds
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Min Confidence</span>
                    <div className="font-mono">{participationConfig.guards?.min_confidence}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Delta</span>
                    <div className="font-mono">{(participationConfig.guards?.max_delta * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Spike</span>
                    <div className="font-mono">{participationConfig.guards?.max_spike}x</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Safe Weight</span>
                    <div className="font-mono">{participationConfig.guards?.max_safe_weight}%</div>
                  </div>
                </div>
              </div>

              {/* Rollback Button */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await fetch(`${BACKEND_URL}/api/connections/twitter/live/participation/rollback`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: 'Manual rollback' }),
                      });
                      fetchParticipation();
                      fetchAudit();
                    } catch (err) {
                      setError('Failed to rollback');
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Rollback All
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {auditLog.map((event, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  event.action === 'ENABLE' ? 'bg-green-100 text-green-700' :
                  event.action === 'ROLLBACK' || event.action === 'AUTO_ROLLBACK' ? 'bg-red-100 text-red-700' :
                  event.action === 'GUARD_BLOCK' ? 'bg-red-100 text-red-700' :
                  event.action === 'GUARD_DEGRADE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.action}
                </span>
                <span className="font-medium">{event.component}</span>
                {event.details?.reasons && (
                  <span className="text-gray-500">{event.details.reasons.join(', ')}</span>
                )}
                <span className="text-gray-400 ml-auto">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
