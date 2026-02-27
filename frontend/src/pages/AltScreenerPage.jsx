/**
 * Alt Screener Page (Block 1.6)
 * ==============================
 * ML-powered altcoin screener with pattern matching and explainability.
 * 
 * Light theme, spacious layout, no visual noise.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Brain, Target, TrendingUp, AlertCircle, Zap, Info } from 'lucide-react';
import { fetchAltScreenerML, fetchScreenerHealth } from '@/api/altScreener.api';
import { AltScreenerFilters, AltScreenerTable } from '@/modules/altScreener';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AltScreenerPage() {
  // Filter state
  const [horizon, setHorizon] = useState('4h');
  const [limit, setLimit] = useState(30);
  const [minScore, setMinScore] = useState(0.65);
  const [preset, setPreset] = useState('SMART');

  // Data state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);

  // Fetch data
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [res, healthRes] = await Promise.all([
        fetchAltScreenerML({ horizon, limit }),
        fetchScreenerHealth(),
      ]);
      setData(res);
      setHealth(healthRes);
    } catch (e) {
      setErr(e?.payload?.error || e?.payload?.message || e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, limit]);

  // Filter by minScore
  const rows = useMemo(() => {
    const list = data?.predictions ?? [];
    return list.filter((r) => Number(r.pWinner ?? 0) >= minScore);
  }, [data, minScore]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Header health={health} />

        {/* Filters Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <AltScreenerFilters
                horizon={horizon} setHorizon={setHorizon}
                limit={limit} setLimit={setLimit}
                minScore={minScore} setMinScore={setMinScore}
                preset={preset} setPreset={setPreset}
              />
              <Button
                onClick={load}
                disabled={loading}
                variant="outline"
                className="border-gray-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Meta badges */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <MetaBadge>Model: {data?.modelVersion?.split('_').slice(-1)[0] || '—'}</MetaBadge>
              <MetaBadge>Horizon: {horizon}</MetaBadge>
              <MetaBadge>Min Score: {(minScore * 100).toFixed(0)}%</MetaBadge>
              <MetaBadge>Shown: {rows.length}</MetaBadge>
              <MetaBadge>Scanned: {data?.totalScanned ?? 0}</MetaBadge>
              {data?.modelAccuracy && (
                <MetaBadge className="bg-green-50 text-green-700 border-green-200">
                  Accuracy: {(data.modelAccuracy * 100).toFixed(1)}%
                </MetaBadge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {err && <ErrorBox err={err} />}
        {!err && data?.ok === false && <ErrorBox err={data?.error || data?.message || 'Unknown error'} />}

        {/* Main table */}
        <AltScreenerTable
          rows={rows}
          onSelect={(r) => {
            // Future: navigate to detail page
            console.log('Selected:', r);
            // For now, show alert with info
            alert(`${r.symbol}\n\nScore: ${(r.pWinner * 100).toFixed(1)}%\nConfidence: ${(r.confidence * 100).toFixed(0)}%\n\nTop factors:\n${
              (r.topContributions || []).slice(0, 3).map(c => `  ${c.feature}: ${c.contribution.toFixed(3)}`).join('\n')
            }`);
          }}
        />

        {/* Footer note */}
        <Footnote />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Header({ health }) {
  const hasModel = health?.models?.count > 0;
  const winnersCount = health?.winnerMemory?.total ?? 0;

  return (
    <div className="flex justify-between items-start gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alt Screener</h1>
            <p className="text-gray-500 text-sm">
              ML-powered pattern matching • Exchange layer only
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4">
        <QuickStat 
          icon={Target} 
          label="Models" 
          value={health?.models?.count ?? 0} 
          color={hasModel ? 'green' : 'yellow'} 
        />
        <QuickStat 
          icon={TrendingUp} 
          label="Winners" 
          value={winnersCount} 
          color={winnersCount > 0 ? 'green' : 'gray'} 
        />
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color }) {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[color]}`}>
      <Icon className="h-4 w-4" />
      <div className="text-xs">
        <span className="text-gray-500">{label}:</span>
        <span className="font-bold ml-1">{value}</span>
      </div>
    </div>
  );
}

function MetaBadge({ children, className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      bg-gray-100 text-gray-600 border border-gray-200
      ${className}
    `}>
      {children}
    </span>
  );
}

function ErrorBox({ err }) {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">{String(err)}</p>
            <p className="text-red-600 text-sm mt-1">
              {err === 'NO_MODEL' && (
                <>Tip: Run ML training job first via <code className="bg-red-100 px-1 rounded">POST /api/admin/exchange/screener/ml/train</code></>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Footnote() {
  return (
    <div className="flex items-start gap-2 text-gray-400 text-xs">
      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <p>
        "WHY" shows top feature contributions (logistic regression weights × normalized features).
        Predictions are based on Exchange layer indicators only. 
        <Link to="/exchange/alt-radar" className="text-blue-500 hover:underline ml-1">
          View Alt Radar →
        </Link>
      </p>
    </div>
  );
}
