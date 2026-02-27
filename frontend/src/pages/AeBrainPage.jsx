/**
 * AE Brain Page — Macro Analysis Engine
 * 
 * Displays AE Brain terminal with:
 * - Current regime state
 * - Causal graph links
 * - Scenarios with probabilities
 * - Novelty detection
 * - Recommendations
 */

import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function AeBrainPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/ae/terminal`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading AE Brain...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const { regime, causal, scenarios, novelty, recommendation, explain } = data || {};

  const getTiltIcon = (tilt) => {
    if (tilt === 'UP') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (tilt === 'DOWN') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRegimeColor = (r) => {
    if (r?.includes('BULL') || r?.includes('RISK_ON')) return 'text-green-600 bg-green-50';
    if (r?.includes('BEAR') || r?.includes('STRESS')) return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AE Brain</h1>
            <p className="text-sm text-gray-500">Macro Analysis Engine — {data?.asOf}</p>
          </div>
        </div>

        {/* Headline */}
        {explain?.headline && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{explain.headline}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {explain.drivers?.map((d, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regime */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current Regime</h2>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${getRegimeColor(regime?.regime)}`}>
              <Activity className="w-5 h-5" />
              {regime?.regime || 'N/A'}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Confidence: <span className="font-medium">{((regime?.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
            <ul className="mt-3 space-y-1">
              {regime?.reasons?.map((r, i) => (
                <li key={i} className="text-sm text-gray-500">• {r}</li>
              ))}
            </ul>
          </div>

          {/* Scenarios */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Scenarios</h2>
            <div className="space-y-4">
              {scenarios?.scenarios?.map((s, i) => (
                <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-sm font-bold text-purple-600">{(s.prob * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">DXY</span>
                      {getTiltIcon(s.tilt?.DXY)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">SPX</span>
                      {getTiltIcon(s.tilt?.SPX)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">BTC</span>
                      {getTiltIcon(s.tilt?.BTC)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recommendation</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Size Multiplier</span>
                <div className="text-3xl font-bold text-gray-900">{recommendation?.sizeMultiplier?.toFixed(2) || '1.00'}x</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Guard Level</span>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                  recommendation?.guard === 'NONE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {recommendation?.guard === 'NONE' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {recommendation?.guard || 'NONE'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Causal Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Causal Graph</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {causal?.links?.map((link, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{link.from}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  link.impact === '+' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {link.impact === '+' ? '→' : '⊣'}
                </span>
                <span className="font-medium text-gray-700">{link.to}</span>
                <span className="text-xs text-gray-400 ml-auto">{(link.strength * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Novelty */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Novelty Detection</h2>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold ${
              novelty?.novelty === 'KNOWN' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {novelty?.novelty || 'N/A'}
            </div>
            <span className="text-sm text-gray-500">Score: {novelty?.score?.toFixed(2) || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AeBrainPage;
