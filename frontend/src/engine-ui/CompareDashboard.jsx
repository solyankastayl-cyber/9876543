/**
 * COMPARE DASHBOARD — Institutional V1 vs V2 Validation
 * 
 * Блоки:
 * 1. Divergence Panel — V1 vs V2 delta по горизонтам
 * 2. Regime Timeline — визуальная шкала режимов
 * 3. Calibration Drift — версии и drift magnitude
 * 4. Router Stability — fallback count и причины
 * 5. Promotion Readiness — статус и recommendation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../core/theme';
import { StatBlock } from '../fractal-ui/StatBlock';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * CompareDashboard Component
 */
export function CompareDashboard({ className = '' }) {
  const [asset, setAsset] = useState('DXY');
  const [compareData, setCompareData] = useState(null);
  const [promotionData, setPromotionData] = useState(null);
  const [regimeTimeline, setRegimeTimeline] = useState(null);
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [compareRes, promotionRes, regimeRes, driftRes] = await Promise.all([
        fetch(`${API_BASE}/api/macro-engine/${asset}/compare-full`),
        fetch(`${API_BASE}/api/macro-engine/${asset}/promotion/recommendation`),
        fetch(`${API_BASE}/api/macro-engine/v2/regime/timeline?asset=${asset}`),
        fetch(`${API_BASE}/api/macro-engine/v2/calibration/drift?asset=${asset}`),
      ]);
      
      const [compare, promotion, regime, drift] = await Promise.all([
        compareRes.json(),
        promotionRes.json(),
        regimeRes.json(),
        driftRes.json(),
      ]);
      
      setCompareData(compare.data || compare);
      setPromotionData(promotion.data || promotion);
      setRegimeTimeline(regime.data || regime);
      setDriftData(drift.data || drift);
      setError(null);
    } catch (err) {
      console.error('[CompareDashboard] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [asset]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Run backtest
  const runBacktest = async () => {
    try {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const res = await fetch(`${API_BASE}/api/macro-engine/${asset}/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          horizons: ['30D', '90D'],
          stepDays: 7,
        }),
      });
      
      const data = await res.json();
      if (data.ok) {
        alert(`Backtest complete!\nWinner: ${data.data.winner}\nRecommendation: ${data.data.recommendation}`);
        fetchData();
      } else {
        alert(`Backtest failed: ${data.message}`);
      }
    } catch (err) {
      alert(`Backtest error: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div 
        className={`min-h-[600px] flex items-center justify-center ${className}`}
        style={{ background: theme.section }}
        data-testid="compare-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <span style={{ color: theme.textSecondary }}>Loading Compare Dashboard...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`min-h-[600px] flex items-center justify-center ${className}`}
        style={{ background: theme.negativeLight }}
        data-testid="compare-error"
      >
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div style={{ color: theme.negative }}>Failed to load Compare Dashboard</div>
          <div className="text-sm mt-1" style={{ color: theme.textMuted }}>{error}</div>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded"
            style={{ background: theme.accent, color: '#fff' }}
            data-testid="compare-retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className}`} data-testid="compare-dashboard">
      {/* Header */}
      <div 
        className="p-6 border-b"
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderColor: theme.borderDefault
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Compare Dashboard</h1>
            <p style={{ color: theme.textMuted }}>V1 vs V2 Institutional Validation Layer</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="px-3 py-2 rounded"
              style={{ background: theme.cardBg, color: theme.textPrimary, border: `1px solid ${theme.borderDefault}` }}
              data-testid="compare-asset-select"
            >
              <option value="DXY">DXY</option>
              <option value="SPX">SPX</option>
              <option value="BTC">BTC</option>
            </select>
            
            <button
              onClick={runBacktest}
              className="px-4 py-2 rounded font-semibold"
              style={{ background: theme.accent, color: '#fff' }}
              data-testid="run-backtest-btn"
            >
              Run Backtest
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6" style={{ background: theme.bgMain }}>
        {/* 1. Promotion Readiness */}
        <PromotionReadiness data={promotionData} />
        
        {/* 2. Divergence Panel */}
        <DivergencePanel data={compareData} />
        
        {/* 3. Regime Timeline */}
        <RegimeTimeline data={regimeTimeline} />
        
        {/* 4. Calibration Drift */}
        <CalibrationDrift data={driftData} />
        
        {/* 5. Router Stability */}
        <RouterStability data={compareData} />
      </div>
    </div>
  );
}

/**
 * Promotion Readiness Block
 */
function PromotionReadiness({ data }) {
  if (!data) return null;
  
  const statusColors = {
    'READY_FOR_PROMOTION': '#22c55e',
    'HOLD': '#f59e0b',
    'ROLLBACK': '#ef4444',
    'NEEDS_MORE_DATA': '#6b7280',
    'V2_UNDERPERFORMING': '#f97316',
  };
  
  const statusColor = statusColors[data.status] || '#6b7280';
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{ background: theme.cardBg, border: `2px solid ${statusColor}` }}
      data-testid="promotion-readiness"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          Promotion Readiness
        </h2>
        <div 
          className="px-3 py-1 rounded-full font-bold text-sm"
          style={{ background: `${statusColor}22`, color: statusColor }}
        >
          {data.status?.replace(/_/g, ' ')}
        </div>
      </div>
      
      <p className="mb-4" style={{ color: theme.textSecondary }}>
        {data.recommendation}
      </p>
      
      {/* Criteria Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CriteriaCard
          label="Hit Rate Diff"
          value={`${data.criteria?.hitRateDiff?.actual?.toFixed(1) || 0}%`}
          required={`≥${data.criteria?.hitRateDiff?.required || 2}%`}
          passed={data.criteria?.hitRateDiff?.passed}
        />
        <CriteriaCard
          label="Regime Stability"
          value={(data.criteria?.regimeStability?.actual || 0).toFixed(2)}
          required={`≥${data.criteria?.regimeStability?.required || 0.7}`}
          passed={data.criteria?.regimeStability?.passed}
        />
        <CriteriaCard
          label="Fallbacks"
          value={data.criteria?.fallbackCount?.actual || 0}
          required={`≤${data.criteria?.fallbackCount?.required || 0}`}
          passed={data.criteria?.fallbackCount?.passed}
        />
        <CriteriaCard
          label="Weight Drift"
          value={(data.criteria?.calibrationDrift?.actual || 0).toFixed(3)}
          required={`≤${data.criteria?.calibrationDrift?.maxAllowed || 0.2}`}
          passed={data.criteria?.calibrationDrift?.passed}
        />
        <CriteriaCard
          label="Data Fresh"
          value={`${data.criteria?.dataFreshness?.actualStaleDays || 0}d`}
          required={`≤${data.criteria?.dataFreshness?.maxStaleDays || 7}d`}
          passed={data.criteria?.dataFreshness?.passed}
        />
      </div>
      
      {/* Reasons */}
      {data.reasons?.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.borderDefault }}>
          <div className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
            Reasons:
          </div>
          <ul className="list-disc list-inside text-sm" style={{ color: theme.textMuted }}>
            {data.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CriteriaCard({ label, value, required, passed }) {
  return (
    <div 
      className="p-3 rounded"
      style={{ 
        background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${passed ? '#22c55e' : '#ef4444'}`
      }}
    >
      <div className="text-xs" style={{ color: theme.textMuted }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: passed ? '#22c55e' : '#ef4444' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: theme.textMuted }}>req: {required}</div>
    </div>
  );
}

/**
 * Divergence Panel — V1 vs V2 by horizon
 * FIXED: Shows delta as pp (percentage points), not multiplied %
 */
function DivergencePanel({ data }) {
  const horizons = data?.horizons || {};
  
  // Helper to format delta as pp
  const formatDeltaPp = (value) => {
    if (value === null || value === undefined) return '0.00 pp';
    // If value is already in pp format (e.g., 3.83), show directly
    // If value looks like a fraction (e.g., 0.0383), multiply by 100
    const pp = Math.abs(value) < 1 ? value * 100 : value;
    return `${pp >= 0 ? '+' : ''}${pp.toFixed(2)} pp`;
  };
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{ background: theme.cardBg, border: `1px solid ${theme.borderDefault}` }}
      data-testid="divergence-panel"
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: theme.textPrimary }}>
        Divergence Overview (V1 vs V2 Hit Rate)
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.borderDefault}` }}>
              <th className="text-left py-2" style={{ color: theme.textSecondary }}>Horizon</th>
              <th className="text-right py-2" style={{ color: theme.textSecondary }}>V1 Hit Rate</th>
              <th className="text-right py-2" style={{ color: theme.textSecondary }}>V2 Hit Rate</th>
              <th className="text-right py-2" style={{ color: theme.textSecondary }}>Delta (pp)</th>
              <th className="text-right py-2" style={{ color: theme.textSecondary }}>V2 Outperf</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(horizons).map(([horizon, h]) => {
              // Get hit rates (already in % format from API)
              const v1HitRate = h.v1HitRate || 0;
              const v2HitRate = h.v2HitRate || 0;
              // Delta is already in pp from calibration (e.g., 3.83)
              const deltaPp = h.delta ?? (v2HitRate - v1HitRate);
              const deltaColor = deltaPp > 0 ? '#22c55e' : deltaPp < 0 ? '#ef4444' : theme.textMuted;
              
              return (
                <tr key={horizon} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                  <td className="py-2 font-semibold" style={{ color: theme.textPrimary }}>{horizon}</td>
                  <td className="text-right py-2" style={{ color: theme.textSecondary }}>
                    {v1HitRate.toFixed(2)}%
                  </td>
                  <td className="text-right py-2" style={{ color: theme.accent }}>
                    {v2HitRate.toFixed(2)}%
                  </td>
                  <td className="text-right py-2 font-semibold" style={{ color: deltaColor }}>
                    {deltaPp > 0 ? '+' : ''}{deltaPp.toFixed(2)} pp
                  </td>
                  <td 
                    className="text-right py-2 font-semibold"
                    style={{ color: h.v2OutperformanceRate > 50 ? '#22c55e' : '#ef4444' }}
                  >
                    {h.v2OutperformanceRate || 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Regime Timeline — Visual regime periods
 */
function RegimeTimeline({ data }) {
  const periods = data?.periods || [];
  
  const regimeColors = {
    'EASING': '#22c55e',
    'TIGHTENING': '#ef4444',
    'STRESS': '#f97316',
    'NEUTRAL': '#6b7280',
    'NEUTRAL_MIXED': '#8b5cf6',
    'RISK_ON': '#3b82f6',
    'RISK_OFF': '#f59e0b',
  };
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{ background: theme.cardBg, border: `1px solid ${theme.borderDefault}` }}
      data-testid="regime-timeline"
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: theme.textPrimary }}>
        Regime Timeline
      </h2>
      
      {periods.length === 0 ? (
        <div className="text-center py-8" style={{ color: theme.textMuted }}>
          No regime history available
        </div>
      ) : (
        <>
          {/* Visual Timeline Bar */}
          <div className="flex h-8 rounded overflow-hidden mb-4">
            {periods.map((period, i) => {
              const start = new Date(period.start);
              const end = new Date(period.end);
              const duration = end - start;
              const totalDuration = periods.reduce((sum, p) => {
                return sum + (new Date(p.end) - new Date(p.start));
              }, 0);
              const width = Math.max(2, (duration / totalDuration) * 100);
              
              return (
                <div
                  key={i}
                  className="relative group"
                  style={{ 
                    width: `${width}%`,
                    background: regimeColors[period.regime] || '#6b7280'
                  }}
                  title={`${period.regime}: ${period.start} to ${period.end}`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div 
                      className="px-2 py-1 rounded text-xs whitespace-nowrap"
                      style={{ background: '#1e293b', color: '#fff' }}
                    >
                      {period.regime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Periods List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {periods.slice(0, 10).map((period, i) => (
              <div 
                key={i}
                className="flex items-center justify-between text-sm p-2 rounded"
                style={{ background: `${regimeColors[period.regime]}11` }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ background: regimeColors[period.regime] || '#6b7280' }}
                  />
                  <span style={{ color: theme.textPrimary }}>{period.regime}</span>
                </div>
                <div style={{ color: theme.textMuted }}>
                  {period.start?.split('T')[0]} → {period.end?.split('T')[0]}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Calibration Drift — Weight version history
 */
function CalibrationDrift({ data }) {
  const versions = data?.versions || [];
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{ background: theme.cardBg, border: `1px solid ${theme.borderDefault}` }}
      data-testid="calibration-drift"
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: theme.textPrimary }}>
        Calibration Drift
      </h2>
      
      {versions.length === 0 ? (
        <div className="text-center py-8" style={{ color: theme.textMuted }}>
          No calibration history available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.borderDefault}` }}>
                <th className="text-left py-2" style={{ color: theme.textSecondary }}>Date</th>
                <th className="text-right py-2" style={{ color: theme.textSecondary }}>Drift</th>
                <th className="text-right py-2" style={{ color: theme.textSecondary }}>Max Shift</th>
                <th className="text-left py-2 pl-4" style={{ color: theme.textSecondary }}>Top Weights</th>
              </tr>
            </thead>
            <tbody>
              {versions.slice(0, 6).map((v, i) => {
                const topWeights = Object.entries(v.components || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3);
                
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                    <td className="py-2" style={{ color: theme.textPrimary }}>
                      {v.asOf?.split('T')[0]}
                    </td>
                    <td 
                      className="text-right py-2"
                      style={{ 
                        color: v.driftFromPrevious > 0.1 ? '#f59e0b' : theme.textSecondary 
                      }}
                    >
                      {(v.driftFromPrevious || 0).toFixed(4)}
                    </td>
                    <td 
                      className="text-right py-2"
                      style={{ 
                        color: v.maxComponentShift > 0.05 ? '#ef4444' : theme.textSecondary 
                      }}
                    >
                      {(v.maxComponentShift || 0).toFixed(4)}
                    </td>
                    <td className="py-2 pl-4">
                      <div className="flex gap-2">
                        {topWeights.map(([key, weight]) => (
                          <span 
                            key={key}
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ background: theme.accentLight, color: theme.accent }}
                          >
                            {key}: {(weight * 100).toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Router Stability — Fallback tracking
 */
function RouterStability({ data }) {
  const routerStats = data?.routerStats || {};
  
  const totalDecisions = routerStats.v1ChosenCount + routerStats.v2ChosenCount || 0;
  const v2Rate = totalDecisions > 0 
    ? ((routerStats.v2ChosenCount || 0) / totalDecisions * 100).toFixed(1)
    : 0;
  
  return (
    <div 
      className="rounded-lg p-6"
      style={{ background: theme.cardBg, border: `1px solid ${theme.borderDefault}` }}
      data-testid="router-stability"
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: theme.textPrimary }}>
        Router Stability
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          label="Total Decisions"
          value={totalDecisions}
        />
        <StatBlock
          label="V2 Usage Rate"
          value={`${v2Rate}%`}
          color={v2Rate > 50 ? '#22c55e' : '#f59e0b'}
        />
        <StatBlock
          label="Fallback Count"
          value={routerStats.fallbackCount || 0}
          color={routerStats.fallbackCount > 0 ? '#ef4444' : '#22c55e'}
        />
        <StatBlock
          label="V1 Fallbacks"
          value={routerStats.v1ChosenCount || 0}
        />
      </div>
      
      {/* Fallback Reasons */}
      {Object.keys(routerStats.fallbackReasons || {}).length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.borderDefault }}>
          <div className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
            Fallback Reasons:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(routerStats.fallbackReasons || {}).map(([reason, count]) => (
              <span 
                key={reason}
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {reason}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompareDashboard;
