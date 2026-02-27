/**
 * Snapshot View Page (Public, Read-only)
 * 
 * Shows an immutable decision snapshot for sharing
 * URL: /snapshot/:id
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, Shield, Zap, 
  Clock, Lock, ExternalLink, AlertTriangle, CheckCircle 
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SnapshotPage() {
  const { id } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/snapshot/${id}`);
        const data = await res.json();
        
        if (data.ok) {
          setSnapshot(data.snapshot);
        } else {
          setError(data.error || 'Snapshot not found');
        }
      } catch (err) {
        setError('Failed to load snapshot');
      }
      setLoading(false);
    };

    fetchSnapshot();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading snapshot...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Snapshot Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { action, confidence, explainability, sourceMeta, symbol, timestamp, createdAt } = snapshot;

  const getActionStyle = () => {
    switch (action) {
      case 'BUY':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: TrendingUp };
      case 'SELL':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: TrendingDown };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: AlertCircle };
    }
  };

  const style = getActionStyle();
  const Icon = style.icon;
  const riskFlags = explainability?.riskFlags || {};

  const formatDate = (ts) => {
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Immutable Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">IMMUTABLE SNAPSHOT</span>
          </div>
          <div className="text-xs text-amber-600">
            This view is frozen and does not reflect current market state
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{symbol}</h1>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
              FOMO AI
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(timestamp)}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span>System: {sourceMeta?.systemVersion || 'v1.0.0'}</span>
          </div>
        </div>

        {/* Decision Card */}
        <div className={`rounded-xl p-6 ${style.bg} border ${style.border} shadow-sm mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Icon className={`w-10 h-10 ${style.text}`} />
              </div>
              <div>
                <span className={`text-4xl font-bold ${style.text}`}>{action}</span>
                <div className="text-gray-600 mt-1">
                  Confidence: <span className="font-semibold">{(confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Verdict</div>
              <div className="text-lg font-semibold text-gray-900">{explainability?.verdict}</div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Drivers */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Decision Drivers
            </h3>
            <div className="space-y-2">
              {explainability?.drivers?.map((driver, i) => (
                <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {driver}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Flags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              Risk Assessment
            </h3>
            <div className="space-y-3">
              <RiskRow label="Whale Risk" value={riskFlags.whaleRisk} />
              <RiskRow label="Market Stress" value={riskFlags.marketStress} />
              <RiskRow label="Contradiction" value={riskFlags.contradiction ? 'YES' : 'NO'} isBool />
              <RiskRow label="Liquidation Risk" value={riskFlags.liquidationRisk ? 'YES' : 'NO'} isBool />
            </div>
          </div>
        </div>

        {/* Applied Rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Applied Rules</h3>
          <div className="flex flex-wrap gap-2">
            {explainability?.appliedRules?.map((rule, i) => {
              const isPass = rule.startsWith('PASS_');
              const isGate = rule.startsWith('GATE_');
              return (
                <span 
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${
                    isPass ? 'bg-green-100 text-green-700' :
                    isGate ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rule}
                </span>
              );
            })}
          </div>
          
          {explainability?.blockedBy && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Blocked by: <strong>{explainability.blockedBy}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Source Meta */}
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Data: <strong>{sourceMeta?.dataMode}</strong></span>
              <span>ML: <strong>{sourceMeta?.mlReady ? 'Active' : 'Inactive'}</strong></span>
              <span>Providers: <strong>{sourceMeta?.providersCount || 0}</strong></span>
            </div>
            <div className="text-xs text-gray-400">
              Snapshot ID: {snapshot.snapshotId}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>This snapshot was created at {formatDate(createdAt)} and cannot be modified.</p>
          <p className="mt-1">
            <a href="/fomo-ai/BTCUSDT" className="text-blue-600 hover:underline flex items-center gap-1 justify-center">
              Go to FOMO AI Live <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ label, value, isBool = false }) {
  const getColor = () => {
    if (isBool) {
      return value === 'YES' ? 'text-red-600' : 'text-green-600';
    }
    switch (value) {
      case 'HIGH':
      case 'EXTREME':
        return 'text-red-600';
      case 'MEDIUM':
      case 'ELEVATED':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${getColor()}`}>{value || 'N/A'}</span>
    </div>
  );
}
