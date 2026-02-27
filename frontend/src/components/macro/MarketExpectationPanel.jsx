/**
 * Market Expectation Panel
 * 
 * P1.2 — Shows what the market "expects" based on macro drivers
 */

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const EXPECTATION_STYLES = {
  RISK_ON: {
    bg: 'bg-green-50 border-green-200',
    icon: ArrowUpIcon,
    iconColor: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
  },
  RISK_OFF: {
    bg: 'bg-red-50 border-red-200',
    icon: ArrowDownIcon,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
  },
  NEUTRAL: {
    bg: 'bg-gray-50 border-gray-200',
    icon: MinusIcon,
    iconColor: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-800',
  },
};

export function MarketExpectationPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExpectation();
    const interval = setInterval(fetchExpectation, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchExpectation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v10/market-expectation/current`);
      const json = await res.json();
      
      if (json.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.message || 'Failed to load');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="expectation-loading">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="expectation-error">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const style = EXPECTATION_STYLES[data.expectation] || EXPECTATION_STYLES.NEUTRAL;
  const Icon = style.icon;

  return (
    <div 
      className={`rounded-xl border p-6 transition-colors ${style.bg}`}
      data-testid="market-expectation-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Market Expectation</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${style.badge}`}>
          {data.macroRegime?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Main expectation */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Icon className={`w-6 h-6 ${style.iconColor}`} />
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-900">
            {data.expectation.replace('_', ' ')}
          </div>
          <div className="text-sm text-gray-500">
            Confidence: {Math.round(data.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-700 mb-4">
        {data.explanation}
      </p>

      {/* Drivers */}
      {data.drivers && data.drivers.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">DRIVERS</div>
          <div className="flex flex-wrap gap-2">
            {data.drivers.map((driver, idx) => (
              <span 
                key={idx}
                className="text-xs px-2 py-1 bg-white rounded-full border border-gray-200 text-gray-600"
              >
                {driver}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {data.metrics && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">BTC Dom</div>
              <div className="text-sm font-medium text-gray-900">
                {data.metrics.btcDominance?.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Stable Dom</div>
              <div className="text-sm font-medium text-gray-900">
                {data.metrics.stableDominance?.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fear/Greed</div>
              <div className="text-sm font-medium text-gray-900">
                {data.metrics.fearGreedIndex}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketExpectationPanel;
