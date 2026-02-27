/**
 * BLOCK 65/67 — Volatility Attribution Tab (Admin)
 * 
 * Unified language: English titles/metrics, Russian tooltips
 */

import React, { useState, useEffect } from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// REGIME COLORS
// ═══════════════════════════════════════════════════════════════

const REGIME_COLORS = {
  LOW: { bg: '#dcfce7', text: '#166534' },
  NORMAL: { bg: '#f3f4f6', text: '#374151' },
  HIGH: { bg: '#fef3c7', text: '#92400e' },
  EXPANSION: { bg: '#fee2e2', text: '#dc2626' },
  CRISIS: { bg: '#fecaca', text: '#7f1d1d' },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function VolatilityTab() {
  const [attribution, setAttribution] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [attrRes, timeRes] = await Promise.all([
          fetch(`${API_BASE}/api/fractal/v2.1/admin/volatility/attribution?symbol=BTC`),
          fetch(`${API_BASE}/api/fractal/v2.1/admin/volatility/timeline?symbol=BTC&limit=90`),
        ]);
        
        if (attrRes.ok) {
          setAttribution(await attrRes.json());
        }
        if (timeRes.ok) {
          setTimeline(await timeRes.json());
        }
        setLoading(false);
      } catch (err) {
        console.error('[VolatilityTab] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      {attribution && <HeaderCard attribution={attribution} />}
      
      {/* Regime Timeline */}
      {timeline && <RegimeTimeline timeline={timeline} />}
      
      {/* Protection Delta */}
      {attribution && <ProtectionDeltaCard attribution={attribution} />}
      
      {/* Performance by Regime */}
      {attribution && <RegimePerformanceTable attribution={attribution} />}
      
      {/* Notes */}
      {attribution?.notes && (
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
          <div className="font-semibold mb-2 uppercase tracking-wider">Notes:</div>
          <ul className="list-disc list-inside space-y-1">
            {attribution.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HEADER CARD
// ═══════════════════════════════════════════════════════════════

function HeaderCard({ attribution }) {
  const { sample, summary } = attribution;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">VOLATILITY ATTRIBUTION</h2>
          <InfoTooltip {...FRACTAL_TOOLTIPS.volAttribution} placement="right" />
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          sample.verdict === 'OK' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {sample.verdict}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-1">Symbol</div>
          <div className="text-lg font-bold text-gray-900">{attribution.symbol}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-1">Sample Period</div>
          <div className="text-sm font-mono text-gray-700">{sample.from} → {sample.to}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-1">Snapshots</div>
          <div className="text-lg font-bold text-gray-900">{sample.snapshotsTotal}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-1">Resolved</div>
          <div className="text-lg font-bold text-gray-900">{sample.resolvedTotal}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME TIMELINE
// ═══════════════════════════════════════════════════════════════

function RegimeTimeline({ timeline }) {
  const { timeline: data } = timeline;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">REGIME TIMELINE</h3>
        <InfoTooltip {...FRACTAL_TOOLTIPS.regimeTimeline} placement="right" />
        <span className="text-xs text-gray-400 ml-2">Last {data.length} Days</span>
      </div>
      
      {/* Timeline bars */}
      <div className="flex h-10 rounded-xl overflow-hidden shadow-inner">
        {data.map((entry, i) => {
          const colors = REGIME_COLORS[entry.regime] || REGIME_COLORS.NORMAL;
          return (
            <div
              key={i}
              className="flex-1 relative group cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: colors.bg }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                <div className="font-bold">{entry.t}</div>
                <div>Regime: {entry.regime}</div>
                <div>RV30: {(entry.rv30 * 100).toFixed(1)}%</div>
                <div>Z-Score: {entry.z?.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs">
        {Object.entries(REGIME_COLORS).map(([regime, colors]) => (
          <div key={regime} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: colors.bg }}
            />
            <span className="font-medium" style={{ color: colors.text }}>{regime}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROTECTION DELTA CARD
// ═══════════════════════════════════════════════════════════════

function ProtectionDeltaCard({ attribution }) {
  const { summary } = attribution;
  const { raw, scaled, delta } = summary;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">PROTECTION REPORT</h3>
        <InfoTooltip {...FRACTAL_TOOLTIPS.protectionReport} placement="right" />
        <span className="text-xs text-gray-400 ml-2">Raw vs Scaled</span>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        {/* CAGR */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-2">CAGR</div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 line-through text-sm">{(raw.cagr * 100).toFixed(1)}%</span>
            <span className="text-xl font-bold text-gray-900">{(scaled.cagr * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Sharpe */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-2">Sharpe</div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 line-through text-sm">{raw.sharpe.toFixed(2)}</span>
            <span className={`text-xl font-bold ${delta.sharpe > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scaled.sharpe.toFixed(2)}
            </span>
            <span className={`text-xs font-medium ${delta.sharpe > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({delta.sharpe > 0 ? '+' : ''}{delta.sharpe.toFixed(2)})
            </span>
          </div>
        </div>
        
        {/* MaxDD */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-2">Max Drawdown</div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 line-through text-sm">-{(raw.maxDD * 100).toFixed(1)}%</span>
            <span className={`text-xl font-bold ${delta.maxDD_pp < 0 ? 'text-green-600' : 'text-red-600'}`}>
              -{(scaled.maxDD * 100).toFixed(1)}%
            </span>
            <span className={`text-xs font-medium ${delta.maxDD_pp < 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({delta.maxDD_pp > 0 ? '+' : ''}{delta.maxDD_pp.toFixed(1)}pp)
            </span>
          </div>
        </div>
        
        {/* Worst Day */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 uppercase mb-2">Worst Day</div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 line-through text-sm">{(raw.worstDay * 100).toFixed(1)}%</span>
            <span className={`text-xl font-bold ${delta.worstDay_pp > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(scaled.worstDay * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Key insight */}
      <div className={`mt-5 p-4 rounded-xl text-sm ${delta.maxDD_pp < 0 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
        {delta.maxDD_pp < 0 ? (
          <span>Vol scaling reduced MaxDD by <strong>{Math.abs(delta.maxDD_pp).toFixed(1)}pp</strong> while Sharpe {delta.sharpe > 0 ? 'improved' : 'decreased'} by {Math.abs(delta.sharpe).toFixed(2)}</span>
        ) : (
          <span>Note: Scaled equity shows higher MaxDD — may need policy adjustment</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME PERFORMANCE TABLE
// ═══════════════════════════════════════════════════════════════

function RegimePerformanceTable({ attribution }) {
  const { byRegime } = attribution;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">PERFORMANCE BY REGIME</h3>
        <InfoTooltip {...FRACTAL_TOOLTIPS.regimePerformance} placement="right" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-3 font-bold text-gray-500 uppercase text-xs">Regime</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Days</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Trades</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Hit Rate</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Expectancy</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">MaxDD</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Worst Day</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Size Before</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Size After</th>
              <th className="text-right py-3 px-3 font-bold text-gray-500 uppercase text-xs">Vol Mult</th>
            </tr>
          </thead>
          <tbody>
            {byRegime.map((row) => {
              const colors = REGIME_COLORS[row.regime] || REGIME_COLORS.NORMAL;
              return (
                <tr key={row.regime} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <span 
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {row.regime}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3 font-mono">{row.countDays}</td>
                  <td className="text-right py-3 px-3 font-mono">{row.trades}</td>
                  <td className={`text-right py-3 px-3 font-mono font-bold ${row.hitRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                    {(row.hitRate * 100).toFixed(0)}%
                  </td>
                  <td className={`text-right py-3 px-3 font-mono font-bold ${row.expectancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(row.expectancy * 100).toFixed(2)}%
                  </td>
                  <td className="text-right py-3 px-3 font-mono text-red-600">
                    -{(row.maxDD * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-3 font-mono text-red-600">
                    {(row.worstDay * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-3 font-mono">
                    {(row.avgSizeBeforeVol * 100).toFixed(0)}%
                  </td>
                  <td className="text-right py-3 px-3 font-mono">
                    {(row.avgSizeAfterVol * 100).toFixed(0)}%
                  </td>
                  <td className={`text-right py-3 px-3 font-mono font-bold ${row.avgVolMult < 1 ? 'text-orange-600' : 'text-green-600'}`}>
                    ×{row.avgVolMult.toFixed(2)}
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

export default VolatilityTab;
