/**
 * Regime Transitions History Component
 * 
 * P1.1 — Shows historical regime transitions
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Risk level colors
const RISK_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  EXTREME: 'bg-red-100 text-red-800',
};

// Regime display names
const REGIME_LABELS = {
  'BTC_FLIGHT_TO_SAFETY': 'BTC Flight to Safety',
  'PANIC_SELL_OFF': 'Panic Sell-Off',
  'BTC_LEADS_ALT_FOLLOW': 'BTC Leads, Alts Follow',
  'BTC_MAX_PRESSURE': 'BTC Max Pressure',
  'ALT_ROTATION': 'Alt Rotation',
  'FULL_RISK_OFF': 'Full Risk Off',
  'ALT_SEASON': 'Alt Season',
  'CAPITAL_EXIT': 'Capital Exit',
};

export function RegimeTransitionsHistory({ limit = 10 }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('timeline'); // 'timeline' or 'stats'

  useEffect(() => {
    fetchData();
  }, [limit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both history and stats in parallel
      const [historyRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v10/macro-intel/regime/history?limit=${limit}`),
        fetch(`${API_URL}/api/v10/macro-intel/regime/stats`),
      ]);
      
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();
      
      if (historyData.ok) {
        setHistory(historyData.data || []);
      }
      if (statsData.ok) {
        setStats(statsData.data);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="regime-history-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="regime-history-error">
        <p className="text-red-600">Error loading regime history: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="regime-history">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <h3 className="text-lg font-semibold text-gray-900">Regime History</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'timeline' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="view-timeline-btn"
          >
            Timeline
          </button>
          <button
            onClick={() => setView('stats')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'stats' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="view-stats-btn"
          >
            Stats
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <TimelineView history={history} />
      ) : (
        <StatsView stats={stats} />
      )}
    </div>
  );
}

function TimelineView({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No regime history yet</p>
        <p className="text-sm mt-1">Transitions will appear as market conditions change</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry, idx) => (
        <div 
          key={idx}
          className={`flex items-center gap-4 p-3 rounded-lg ${
            idx === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
          }`}
          data-testid={`regime-entry-${idx}`}
        >
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${
              idx === 0 ? 'bg-blue-500' : 'bg-gray-300'
            }`}></div>
            {idx < history.length - 1 && (
              <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {REGIME_LABELS[entry.regime] || entry.regime}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                RISK_COLORS[entry.riskLevel] || 'bg-gray-100 text-gray-600'
              }`}>
                {entry.riskLevel}
              </span>
              {idx === 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  CURRENT
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>
                Started: {format(new Date(entry.startedAt), 'MMM d, HH:mm')}
              </span>
              {entry.durationHours !== undefined && entry.durationHours !== null && (
                <span>Duration: {entry.durationHours}h</span>
              )}
              {entry.metrics && (
                <span>
                  F&G: {entry.metrics.fearGreedStart}
                  {entry.metrics.fearGreedEnd !== undefined && ` → ${entry.metrics.fearGreedEnd}`}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsView({ stats }) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current regime */}
      {stats.currentRegime && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Current Regime</div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">
              {REGIME_LABELS[stats.currentRegime.regime] || stats.currentRegime.regime}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              RISK_COLORS[stats.currentRegime.riskLevel] || 'bg-gray-100'
            }`}>
              {stats.currentRegime.riskLevel}
            </span>
            <span className="text-sm text-gray-500">
              {stats.currentRegime.durationHours}h
            </span>
          </div>
        </div>
      )}

      {/* Distribution */}
      {stats.regimeDistribution && Object.keys(stats.regimeDistribution).length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-600 mb-3">Regime Distribution</div>
          <div className="space-y-2">
            {Object.entries(stats.regimeDistribution)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([regime, data]) => (
                <div key={regime} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-48 truncate">
                    {REGIME_LABELS[regime] || regime}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(data.count / stats.totalTransitions) * 100 || 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-20 text-right">
                    {data.count}x ({data.avgDurationHours}h avg)
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Most frequent transitions */}
      {stats.mostFrequentTransitions && stats.mostFrequentTransitions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-600 mb-3">Most Frequent Transitions</div>
          <div className="space-y-2">
            {stats.mostFrequentTransitions.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">
                  {REGIME_LABELS[t.from]?.split(' ')[0] || t.from}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-700">
                  {REGIME_LABELS[t.to]?.split(' ')[0] || t.to}
                </span>
                <span className="text-gray-500 ml-auto">{t.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total transitions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Total transitions: <span className="font-medium text-gray-900">{stats.totalTransitions}</span>
        </div>
      </div>
    </div>
  );
}

export default RegimeTransitionsHistory;
