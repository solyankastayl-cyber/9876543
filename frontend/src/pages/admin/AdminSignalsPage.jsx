/**
 * A1.2 - Admin Signals Monitor Page
 * 
 * Read-only view of current signals:
 * - Decision (BUY/SELL/NEUTRAL)
 * - Quality (HIGH/MEDIUM/LOW)
 * - Drivers A-F with state and strength
 */
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { LineChart, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { api } from '../../api/client';

// Real networks
const NETWORKS = ['ethereum', 'bnb'];

// Driver metadata
const DRIVER_META = {
  A: { title: 'Exchange Pressure', desc: 'CEX flows' },
  B: { title: 'Accumulation Zones', desc: 'Price zones' },
  C: { title: 'Corridors', desc: 'Capital paths' },
  D: { title: 'Liquidity', desc: 'DEX pools' },
  E: { title: 'Smart Actors', desc: 'Wallet behavior' },
  F: { title: 'Events', desc: 'On-chain activity' },
};

// Colors
const DECISION_COLORS = {
  BUY: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SELL: 'bg-red-100 text-red-700 border-red-200',
  NEUTRAL: 'bg-slate-100 text-slate-700 border-slate-200',
};

const QUALITY_COLORS = {
  HIGH: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

const STATE_COLORS = {
  // Bullish
  ACCUMULATION: 'text-emerald-600',
  SUPPORT: 'text-emerald-600',
  PERSISTENT: 'text-emerald-600',
  GROWING: 'text-emerald-600',
  ACTIVE: 'text-blue-600',
  STABLE: 'text-slate-600',
  // Bearish
  DISTRIBUTION: 'text-red-600',
  RESISTANCE: 'text-red-600',
  SHRINKING: 'text-red-600',
  ALERT: 'text-amber-600',
  // Neutral
  NEUTRAL: 'text-slate-500',
};

export default function AdminSignalsPage() {
  const [network, setNetwork] = useState('ethereum');
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [signalRes, healthRes] = await Promise.all([
        api.get(`/api/v3/signals/market/${network}`),
        api.get('/api/v3/signals/health').catch(() => ({ data: { ok: false } })),
      ]);

      if (signalRes.data?.ok) {
        setData(signalRes.data.data);
        setError(null);
      } else {
        setError(signalRes.data?.error || 'Failed to load');
      }

      if (healthRes.data?.ok) {
        setHealth(healthRes.data);
      }
    } catch (err) {
      setError('Unable to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LineChart className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">Signals Monitor</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Network selector */}
            <div className="flex gap-1">
              {NETWORKS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                    n === network
                      ? 'bg-white text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Data */}
        {data && (
          <>
            {/* Decision & Quality */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Network */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-700 uppercase">
                      {network.slice(0, 3)}
                    </span>
                  </div>

                  {/* Decision */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${DECISION_COLORS[data.decision]}`}>
                    {data.decision === 'BUY' && <TrendingUp className="w-5 h-5" />}
                    {data.decision === 'SELL' && <TrendingDown className="w-5 h-5" />}
                    {data.decision === 'NEUTRAL' && <Minus className="w-5 h-5" />}
                    <span className="font-bold">{data.decision}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quality */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${QUALITY_COLORS[data.quality]}`}>
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Quality: {data.quality}</span>
                  </div>

                  {/* Confidence */}
                  <span className="text-sm text-slate-500">
                    Confidence: {data.confidence}
                  </span>

                  {/* Timestamp */}
                  <span className="text-xs text-slate-400">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* A2 - Guardrails Block */}
            {data.guardrails?.blocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-amber-800 mb-1">
                      Guardrails Active
                    </div>
                    <div className="text-xs text-amber-700 space-y-1">
                      {data.guardrails.originalDecision && (
                        <p>Original decision: <span className="font-medium">{data.guardrails.originalDecision}</span> → NEUTRAL</p>
                      )}
                      <p>Blocked by:</p>
                      <ul className="list-disc list-inside ml-2">
                        {data.guardrails.blockedBy.map((reason) => (
                          <li key={reason}>{formatGuardrailReason(reason)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drivers Grid */}
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Signal Drivers A-F</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data.drivers).map(([code, driver]) => (
                  <DriverCard key={code} code={code} driver={driver} />
                ))}
              </div>
            </div>

            {/* Health info */}
            {health && (
              <div className="text-xs text-slate-400 text-center">
                Signal v{data.version} · Health: {health.ok ? 'OK' : 'DEGRADED'}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// Helper function for guardrail labels
function formatGuardrailReason(reason) {
  const labels = {
    LOW_QUALITY: 'Signal quality is LOW',
    INDEXER_DEGRADED: 'DEX indexer is degraded',
    INDEXER_PAUSED: 'DEX indexer is paused',
    DRIVER_CONFLICT: 'Drivers show conflicting signals',
    STALE_DATA: 'Data is stale (>15min old)',
  };
  return labels[reason] || reason;
}

// Driver Card Component
function DriverCard({ code, driver }) {
  const meta = DRIVER_META[code];
  const stateColor = STATE_COLORS[driver.state] || 'text-slate-500';

  const strengthWidth = {
    HIGH: 'w-full',
    MEDIUM: 'w-2/3',
    LOW: 'w-1/3',
  };

  const strengthColor = {
    HIGH: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-slate-300',
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs text-slate-400">Driver {code}</span>
          <div className="font-medium text-slate-900 text-sm">{meta.title}</div>
        </div>
        <span className={`text-sm font-medium ${stateColor}`}>{driver.state}</span>
      </div>

      {/* Strength bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Strength</span>
          <span className="text-slate-600">{driver.strength}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full">
          <div className={`h-full rounded-full ${strengthWidth[driver.strength]} ${strengthColor[driver.strength]}`} />
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-500 line-clamp-2">{driver.summary}</p>
    </div>
  );
}
