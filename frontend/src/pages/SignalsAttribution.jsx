/**
 * Advanced Signals & Attribution
 * Answers: "Why does the system think this way?"
 * 
 * Checklist:
 * - Signal coverage shown (count, %, conflict rate)
 * - Top-5 signals by impact
 * - Each signal: type, direction, confidence impact
 * - Confidence calibration status clear
 * - If not OK -> human explanation
 * - Link to token example
 * - Clear: signals ≠ decisions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { apiGet } from '../api/client';

export default function SignalsAttribution() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/api/advanced/signals-attribution');
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Loading signals attribution...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-600">Failed to load signals attribution</div>;
  }

  const { coverage, topImpactSignals, confidenceCalibration, links } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Signals & Attribution</h1>

      {/* Coverage */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Signal Coverage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Active Signals</div>
            <div className="text-2xl font-bold">{coverage.activeSignals}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Coverage</div>
            <div className="text-2xl font-bold">{coverage.coveragePercent}%</div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Conflict Rate</div>
            <div className="text-2xl font-bold">
              {(coverage.conflictRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Impact Signals */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Top Impact Signals</h2>
        <div className="text-sm text-gray-600 mb-4">Signals influencing confidence (last 7 days)</div>
        
        <div className="space-y-3">
          {topImpactSignals.map((signal, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {signal.direction === 'POSITIVE' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">{signal.signalType}</div>
                  <div className="text-xs text-gray-600">{signal.direction}</div>
                </div>
              </div>
              <div className={`text-xl font-bold ${
                signal.confidenceImpact > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {signal.confidenceImpact > 0 ? '+' : ''}{signal.confidenceImpact}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-gray-600">
          Signals show what system sees. Signals ≠ confirmation. Signals can conflict.
        </div>
      </div>

      {/* Confidence Calibration */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Confidence Calibration</h2>
        
        <div className="flex items-center gap-3 mb-3">
          <div className={`text-2xl font-bold ${
            confidenceCalibration.status === 'OK' ? 'text-green-600' :
            confidenceCalibration.status === 'INSUFFICIENT_DATA' ? 'text-gray-600' :
            'text-yellow-600'
          }`}>
            {confidenceCalibration.status}
          </div>
        </div>

        {confidenceCalibration.note && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-gray-700">{confidenceCalibration.note}</div>
          </div>
        )}

        {confidenceCalibration.status === 'OVERCONFIDENT' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm text-red-800">
              ⚠ System is overconfident in 70-100% BUY zone. 
              Confidence scores may be higher than actual outcome probability.
            </div>
          </div>
        )}
      </div>

      {/* Link to Product */}
      {links.tokenExample && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-2">See How This Affects Decisions</h2>
          <p className="text-sm text-gray-700 mb-4">
            View signal attribution on a real token example
          </p>
          <Link
            to={`/token/${links.tokenExample}`}
            className="inline-block px-6 py-3 bg-white text-white rounded-lg hover:bg-gray-100 font-medium"
          >
            View {links.tokenExample} →
          </Link>
        </div>
      )}
    </div>
  );
}
