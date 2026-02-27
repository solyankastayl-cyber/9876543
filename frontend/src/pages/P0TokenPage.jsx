/**
 * P0 Token Page - Decision Explanation
 * 
 * PURPOSE: Answer "What's happening with this token and why did system decide this?"
 * NOT: Guarantees, price history, timelines, CTAs
 * 
 * CONTRACT:
 * - Decision Block (BUY/WATCH/SELL with warnings)
 * - Confidence Explainability (BASE × DRIFT × ML = FINAL)
 * - Market Context (price, trend - context only)
 * - Risk Block (why system is cautious)
 * - Actor Signals (top 5, what system sees)
 * 
 * KEY MESSAGE: "ML doesn't change score. ML only confirms or reduces confidence."
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiGet } from '../api/client';

export default function P0TokenPage() {
  const { symbol } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    async function loadToken() {
      try {
        setLoading(true);
        const result = await apiGet(`/api/frontend/token/${symbol}`);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadToken();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading token data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">
            Token Not Found
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getDecisionColor = (action) => {
    if (action === 'BUY') return 'bg-green-50 text-green-700 border-green-200';
    if (action === 'SELL') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{data.symbol}</h1>
        <p className="text-gray-600">{data.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Decision */}
        <div className="lg:col-span-1">
          {/* Decision Block */}
          <div className={`border-2 rounded-lg p-6 ${getDecisionColor(data.decision.action)}`}>
            <div className="text-sm font-medium mb-2">Decision</div>
            <div className="text-3xl font-bold mb-4">{data.decision.action}</div>
            
            <div className="mb-4">
              <div className="text-sm mb-1">Confidence</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white bg-opacity-50 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      data.decision.confidence >= 70 ? 'bg-green-600' :
                      data.decision.confidence >= 50 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${data.decision.confidence}%` }}
                  />
                </div>
                <span className="text-xl font-bold">{data.decision.confidence}%</span>
              </div>
            </div>

            {/* Warning */}
            {data.decision.confidence < 70 && (
              <div className="bg-white bg-opacity-50 rounded p-3 text-xs">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {data.decision.action} ≠ recommendation. Confidence shows system uncertainty.
              </div>
            )}

            {/* Confidence Breakdown */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="mt-4 text-sm underline"
            >
              {showBreakdown ? 'Hide' : 'How confidence is calculated'}
            </button>

            {showBreakdown && (
              <div className="mt-4 bg-white bg-opacity-50 rounded p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Base confidence:</span>
                  <span className="font-medium">{data.decision.baseConfidence}</span>
                </div>
                <div className="text-xs text-gray-600 border-t pt-2 mt-2">
                  ⚠ ML affects confidence only. Score is not changed.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Snapshot */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Market Context</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="text-xl font-semibold">
                  ${data.priceSnapshot.priceUsd.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">24h Change</div>
                <div className={`text-xl font-semibold ${
                  data.priceSnapshot.change24h > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.priceSnapshot.change24h > 0 ? '+' : ''}
                  {data.priceSnapshot.change24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Volume</div>
                <div className="text-xl font-semibold">
                  ${(data.priceSnapshot.volume24h / 1e6).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                <div className="text-xl font-semibold">
                  ${(data.priceSnapshot.marketCap / 1e9).toFixed(1)}B
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              Context only. Trend ≠ Decision. Price growth ≠ BUY.
            </div>
          </div>

          {/* Trend & Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trend */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pattern:</span>
                  <span className="font-medium">{data.trend.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Horizon:</span>
                  <span className="font-medium">{data.trend.horizon}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{data.trend.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Risk */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Risk Score:</span>
                  <span className="font-medium">{data.risk.score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Level:</span>
                  <span className={`font-semibold ${
                    data.risk.level === 'HIGH' ? 'text-red-600' :
                    data.risk.level === 'MEDIUM' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {data.risk.level}
                  </span>
                </div>
              </div>
              {data.risk.level !== 'LOW' && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  High risk prevents high confidence without strong signals.
                </div>
              )}
            </div>
          </div>

          {/* Actor Signals */}
          {data.signals && data.signals.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Actor Signals (Top 5)</h3>
              <div className="space-y-2">
                {data.signals.map((signal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{signal.signalType}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(signal.detectedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${
                      signal.direction === 'POSITIVE' ? 'text-green-600' :
                      signal.direction === 'NEGATIVE' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {signal.direction}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                Signals show what system sees. Signals ≠ confirmation. Signals can conflict.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
