/**
 * P0 Dashboard - Market Scanner
 * 
 * PURPOSE: Answer "What's happening right now and where should I look?"
 * NOT: Deep analysis, history, or convincing
 * 
 * CONTRACT:
 * - Show system status (ML/Drift)
 * - Signals & Attribution (ML Decision Panel)
 * - Show Top-N tokens by significance
 * - Each token: Decision, Confidence, Badges, One-line Why
 * - Fast scan (5-10 seconds)
 * - Clear path to Token Page
 */

import { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertCircle, Activity, Target, Shield, ChevronRight } from 'lucide-react';
import ExchangePressureCard from '../components/ExchangePressureCard';
import { apiGet } from '../api/client';

// ============================================================================
// SIGNALS & ATTRIBUTION SECTION (ML Decision Panel)
// ============================================================================
function SignalsAttributionSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/api/advanced/signals-attribution');
        setData(result);
      } catch (err) {
        console.error('Failed to load signals attribution:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { coverage, topImpactSignals, confidenceCalibration } = data;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Signals & Attribution
        </h2>
        <Link 
          to="/advanced/signals-attribution" 
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Active Signals</div>
          <div className="text-xl font-bold text-gray-900">{coverage?.activeSignals || 0}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Coverage</div>
          <div className="text-xl font-bold text-gray-900">{coverage?.coveragePercent || 0}%</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Conflict Rate</div>
          <div className="text-xl font-bold text-gray-900">
            {((coverage?.conflictRate || 0) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Top Impact Signals (show top 3) */}
      {topImpactSignals && topImpactSignals.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Contributing Factors</div>
          {topImpactSignals.slice(0, 3).map((signal, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                {signal.direction === 'POSITIVE' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-700">{signal.signalType}</span>
              </div>
              <span className={`text-sm font-semibold ${
                signal.confidenceImpact > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {signal.confidenceImpact > 0 ? '+' : ''}{signal.confidenceImpact}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confidence Calibration Status */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${
        confidenceCalibration?.status === 'OK' 
          ? 'bg-green-50 border border-green-200' 
          : confidenceCalibration?.status === 'OVERCONFIDENT'
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <Shield className={`w-4 h-4 ${
          confidenceCalibration?.status === 'OK' ? 'text-green-600' :
          confidenceCalibration?.status === 'OVERCONFIDENT' ? 'text-amber-600' :
          'text-gray-500'
        }`} />
        <span className="text-sm">
          <span className="font-medium">Calibration:</span>{' '}
          <span className={
            confidenceCalibration?.status === 'OK' ? 'text-green-700' :
            confidenceCalibration?.status === 'OVERCONFIDENT' ? 'text-amber-700' :
            'text-gray-600'
          }>
            {confidenceCalibration?.status || 'UNKNOWN'}
          </span>
        </span>
        {confidenceCalibration?.status === 'OVERCONFIDENT' && (
          <span className="text-xs text-amber-600 ml-2">
            (Confidence may exceed actual probability)
          </span>
        )}
      </div>
    </div>
  );
}

export default function P0Dashboard() {
  const { data, loading, error } = useDashboard(1, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading market scanner...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600">Error loading dashboard: {error}</div>
      </div>
    );
  }

  if (!data || data.tokens.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* P1.3 Exchange Pressure - показываем даже без токенов */}
        <div className="mb-6">
          <ExchangePressureCard network="ethereum" window="24h" />
        </div>

        {/* FREEZE v3.0: Signals & Attribution - показываем даже без токенов */}
        <SignalsAttributionSection />
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900 mb-2">
              No tokens yet
            </div>
            <p className="text-gray-600 text-sm">
              Token rankings will appear once data is ingested
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { globalState, tokens, pagination } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-gray-500">
            {pagination.totalTokens} tokens
          </div>
        </div>
      </div>

      {/* P1.3 Exchange Pressure */}
      <div className="mb-6">
        <ExchangePressureCard network="ethereum" window="24h" />
      </div>

      {/* FREEZE v3.0: Signals & Attribution (ML Decision Panel) */}
      <SignalsAttributionSection />

      {/* Tokens Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Decision
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Why
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tokens.map((token) => (
              <tr key={token.symbol} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/token/${token.symbol}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {token.symbol}
                  </Link>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    token.decision === 'BUY' ? 'bg-green-100 text-green-800' :
                    token.decision === 'SELL' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {token.decision}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          token.confidence >= 70 ? 'bg-green-500' :
                          token.confidence >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${token.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {token.confidence}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {token.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {badge.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                  {token.explanation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
