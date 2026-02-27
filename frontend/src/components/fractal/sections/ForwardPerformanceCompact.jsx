/**
 * FORWARD PERFORMANCE COMPACT — Simplified Layout
 * 
 * FP5: Now supports both BTC and SPX with different data sources:
 * - BTC: /api/fractal/v2.1/admin/forward-equity (equity curve + CAGR/Sharpe)
 * - SPX: /api/fractal/spx/forward/summary (FP4 metrics: hitRate, avgReturn, bias)
 * 
 * Shows:
 * - Header with current settings
 * - Chart (BTC) or Metrics summary (SPX)
 * - Key performance indicators
 */

import React, { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Tooltip descriptions
const TOOLTIPS = {
  forwardPerformance: "Real-time tracking of model predictions vs actual market outcomes. Shows how well the model's signals performed on live data.",
  hitRate: "Percentage of correct predictions. BUY signals count as hits when price rises, REDUCE signals when price falls.",
  avgReturn: "Average realized return across all completed trades, measured from entry to target date.",
  forecast: "Average forecasted return at the time each signal was generated.",
  bias: "Difference between realized and forecasted returns. Values close to 0% indicate a well-calibrated model.",
  trades: "Total number of completed trades used to calculate these statistics.",
  equityCurve: "Shows how your capital would change if you followed all model signals. Starting point = 1.0 (100% of initial capital).",
  maxDD: "Maximum Drawdown — the largest peak-to-trough decline during the trading period. Lower is better.",
  resultsByHorizon: "Model performance broken down by forecast horizon. Each row shows accuracy for trades with that specific holding period.",
};

// Helper component for metric with tooltip (no icon)
function MetricWithTooltip({ label, value, tooltip, valueStyle = {} }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div style={styles.metricBox}>
          <span style={styles.metricLabel}>{label}</span>
          <span style={{ ...styles.metricValue, ...valueStyle }}>
            {value}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ForwardPerformanceCompact({ 
  symbol = 'BTC',
  mode = 'balanced',
  horizon = 7,
  execution = 'ACTIVE'
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // FP5: Both BTC and SPX are now supported
  const isSpx = symbol === 'SPX';
  
  // FP6: Separate state for equity curve
  const [equityCurve, setEquityCurve] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (isSpx || symbol === 'DXY') {
          // SPX/DXY: Fetch both summary and equity curve
          const basePath = symbol === 'DXY' ? 'dxy' : 'spx';
          const [summaryRes, equityRes] = await Promise.all([
            fetch(`${API_URL}/api/fractal/${basePath}/forward/summary`, { signal: controller.signal }),
            fetch(`${API_URL}/api/fractal/${basePath}/forward/equity`, { signal: controller.signal })
          ]);
          
          if (cancelled) return;
          
          if (!summaryRes.ok) {
            setError(`HTTP ${summaryRes.status}`);
            setData(null);
            return;
          }
          
          const summaryJson = await summaryRes.json();
          const equityJson = equityRes.ok ? await equityRes.json() : null;
          
          if (cancelled) return;
          
          if (summaryJson.ok) {
            setData({
              isSpx: true, // Use SPX rendering for both SPX and DXY
              overall: summaryJson.overall,
              byHorizon: summaryJson.byHorizon,
              updatedAt: summaryJson.updatedAt,
            });
            
            // Set equity curve data
            if (equityJson?.ok && equityJson.equity?.length > 0) {
              setEquityCurve(equityJson);
            }
            setError(null);
          } else {
            setError(summaryJson.message || summaryJson.error);
            setData(null);
          }
        } else {
          // BTC: Use legacy equity endpoint
          const preset = mode.toUpperCase();
          const role = execution;
          // FP7: Convert horizon from "30d" to number 30
          const horizonNum = typeof horizon === 'string' ? parseInt(horizon.replace('d', '')) : horizon;
          // Validate horizon - must be 7, 14, or 30
          const validHorizon = [7, 14, 30].includes(horizonNum) ? horizonNum : 30;
          const url = `${API_URL}/api/fractal/v2.1/admin/forward-equity?symbol=${symbol}&preset=${preset}&horizon=${validHorizon}&role=${role}`;
          
          const res = await fetch(url, { signal: controller.signal });
          
          if (cancelled) return;
          
          if (!res.ok) {
            setError(`HTTP ${res.status}`);
            setData(null);
            return;
          }
          
          const json = await res.json();
          
          if (cancelled) return;
          
          if (json.error) {
            setError(json.message || json.error);
            setData(null);
          } else {
            setData(json);
            setError(null);
          }
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol, mode, horizon, execution, isSpx]);

  // Draw equity chart - full width
  useEffect(() => {
    if (!canvasRef.current || !data?.equity?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 900;
    const height = 200;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `100%`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const equity = data.equity;
    const values = equity.map(p => p.value);
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;

    const padding = { top: 15, right: 15, bottom: 25, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = (i) => padding.left + (i / (equity.length - 1 || 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Draw baseline at 1.0
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const y1 = scaleY(1.0);
    ctx.moveTo(padding.left, y1);
    ctx.lineTo(width - padding.right, y1);
    ctx.stroke();

    // Draw equity line
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    
    equity.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(p.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    ctx.lineTo(scaleX(equity.length - 1), scaleY(1.0));
    ctx.lineTo(scaleX(0), scaleY(1.0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.fill();

    // Y-axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (range * i / 4);
      const y = scaleY(v);
      ctx.fillText(v.toFixed(3), padding.left - 6, y + 3);
    }

  }, [data]);

  // FP6: Draw SPX equity curve
  useEffect(() => {
    if (!canvasRef.current || !equityCurve?.equity?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 700;
    const height = 160;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `100%`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const equity = equityCurve.equity;
    const values = equity.map(p => p.value);
    const minVal = Math.min(...values, 1.0) * 0.98;
    const maxVal = Math.max(...values, 1.0) * 1.02;
    const range = maxVal - minVal || 0.1;

    const padding = { top: 15, right: 15, bottom: 25, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = (i) => padding.left + (i / (equity.length - 1 || 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw baseline at 1.0
    ctx.beginPath();
    ctx.strokeStyle = '#9ca3af';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    const y1 = scaleY(1.0);
    ctx.moveTo(padding.left, y1);
    ctx.lineTo(width - padding.right, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Determine if curve is positive or negative
    const finalValue = equity[equity.length - 1]?.value || 1;
    const isPositive = finalValue >= 1.0;

    // Draw equity line
    ctx.beginPath();
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    
    equity.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(p.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area below line
    ctx.lineTo(scaleX(equity.length - 1), scaleY(1.0));
    ctx.lineTo(scaleX(0), scaleY(1.0));
    ctx.closePath();
    ctx.fillStyle = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    ctx.fill();

    // Draw trade markers
    equity.forEach((p, i) => {
      if (i % 3 !== 0 && i !== equity.length - 1) return; // Show every 3rd point
      const x = scaleX(i);
      const y = scaleY(p.value);
      
      ctx.beginPath();
      ctx.fillStyle = p.hit ? '#22c55e' : '#ef4444';
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (range * i / 4);
      const y = scaleY(v);
      ctx.fillText(v.toFixed(3), padding.left - 6, y + 3);
    }

    // Final value label
    const finalY = scaleY(finalValue);
    ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${(finalValue).toFixed(3)}`, width - padding.right + 4, finalY + 4);

  }, [equityCurve]);

  const metrics = data?.metrics;

  // FP5: SPX uses different rendering (metrics table instead of equity chart)
  if (data?.isSpx) {
    const overall = data.overall || {};
    const byHorizon = data.byHorizon || [];
    const hitRatePct = (overall.hitRate * 100).toFixed(1);
    const avgRealizedPct = (overall.avgRealizedReturn * 100).toFixed(2);
    const avgForecastPct = (overall.avgForecastReturn * 100).toFixed(2);
    const biasPct = (overall.bias * 100).toFixed(2);
    
    // Find current horizon data
    const currentHorizonData = byHorizon.find(h => h.horizonDays === horizon) || {};
    const horizonHitRate = currentHorizonData.hitRate ? (currentHorizonData.hitRate * 100).toFixed(1) : null;
    
    return (
      <TooltipProvider>
        <div style={styles.container} data-testid="forward-performance-compact">
          {/* Header with tooltip */}
          <div style={styles.header}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div style={styles.titleRow}>
                  <BarChart3 size={16} style={{ color: '#6b7280' }} />
                  <span style={styles.title}>Forward Performance</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{TOOLTIPS.forwardPerformance}</p>
              </TooltipContent>
            </Tooltip>
            <span style={styles.assetLabel}>SPX</span>
          </div>

          {/* Loading */}
          {loading && (
            <div style={styles.loading}>Loading...</div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.error}>Error: {error}</div>
          )}

          {/* SPX Metrics Display */}
          {!loading && !error && (
            <>
              {/* Overall Metrics Row with tooltips */}
              <div style={styles.metricsRow}>
                <MetricWithTooltip
                  label="Hit Rate"
                  value={`${hitRatePct}%`}
                  tooltip={TOOLTIPS.hitRate}
                  valueStyle={{ 
                    color: overall.hitRate >= 0.5 ? '#22c55e' : '#ef4444',
                    fontSize: '18px'
                  }}
                />
                <MetricWithTooltip
                  label="Avg Return"
                  value={`${overall.avgRealizedReturn >= 0 ? '+' : ''}${avgRealizedPct}%`}
                  tooltip={TOOLTIPS.avgReturn}
                  valueStyle={{ color: overall.avgRealizedReturn >= 0 ? '#22c55e' : '#ef4444' }}
                />
                <MetricWithTooltip
                  label="Forecast"
                  value={`${overall.avgForecastReturn >= 0 ? '+' : ''}${avgForecastPct}%`}
                  tooltip={TOOLTIPS.forecast}
                  valueStyle={{ color: '#6b7280' }}
                />
                <MetricWithTooltip
                  label="Bias"
                  value={`${overall.bias >= 0 ? '+' : ''}${biasPct}%`}
                  tooltip={TOOLTIPS.bias}
                  valueStyle={{ color: Math.abs(overall.bias) < 0.01 ? '#22c55e' : '#f59e0b' }}
                />
                <MetricWithTooltip
                  label="Trades"
                  value={overall.sampleSize || 0}
                  tooltip={TOOLTIPS.trades}
                  valueStyle={{ color: '#374151' }}
                />
              </div>

              {/* Equity Curve Chart */}
              {equityCurve?.equity?.length > 0 && (
                <div style={styles.equitySection}>
                  <div style={styles.equityHeader}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span style={{ ...styles.equityTitle, cursor: 'default' }}>Equity Curve</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{TOOLTIPS.equityCurve}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div style={styles.equityMetrics}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span style={{ ...styles.equityMetricItem, cursor: 'default' }}>
                            Max DD: {(equityCurve.metrics.maxDrawdown * 100).toFixed(1)}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{TOOLTIPS.maxDD}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span style={styles.equityMetricDivider}>·</span>
                      <span style={styles.equityMetricItem}>
                        {equityCurve.metrics.trades} trades
                      </span>
                    </div>
                  </div>
                  <div style={styles.chartWrapper}>
                    <canvas ref={canvasRef} style={styles.canvas} />
                  </div>
                </div>
              )}

              {/* Horizon Breakdown with tooltips */}
              {byHorizon.length > 0 && (
                <div style={styles.horizonSection}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div style={{ ...styles.horizonSectionTitle, cursor: 'default' }}>
                        Results by Horizon
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{TOOLTIPS.resultsByHorizon}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div style={styles.horizonTable}>
                    <div style={styles.horizonHeader}>
                      <span style={styles.horizonHeaderCell}>Horizon</span>
                      <span style={styles.horizonHeaderCell}>Hit Rate</span>
                      <span style={styles.horizonHeaderCell}>Return</span>
                      <span style={styles.horizonHeaderCell}>Trades</span>
                    </div>
                    {byHorizon.slice(0, 4).map(h => {
                      const horizonLabel = h.horizonDays <= 14 ? 'Short-term' : h.horizonDays <= 60 ? 'Medium-term' : 'Long-term';
                      return (
                        <Tooltip key={h.horizonDays}>
                          <TooltipTrigger asChild>
                            <div 
                              style={{
                                ...styles.horizonRow,
                                backgroundColor: h.horizonDays === horizon ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                              }}
                            >
                              <span style={styles.horizonCell}>
                                {h.horizonDays}D
                                {h.horizonDays === horizon && <span style={styles.currentBadge}>current</span>}
                              </span>
                              <span style={{
                                ...styles.horizonCell,
                                color: h.hitRate >= 0.5 ? '#22c55e' : '#ef4444',
                                fontWeight: '600'
                              }}>
                                {(h.hitRate * 100).toFixed(0)}%
                              </span>
                              <span style={{
                                ...styles.horizonCell,
                                color: h.avgRealizedReturn >= 0 ? '#22c55e' : '#ef4444'
                              }}>
                                {h.avgRealizedReturn >= 0 ? '+' : ''}{(h.avgRealizedReturn * 100).toFixed(2)}%
                              </span>
                              <span style={styles.horizonCell}>{h.sampleSize}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{horizonLabel} forecast ({h.horizonDays} days holding period)</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Updated timestamp */}
              {data.updatedAt && (
                <div style={styles.updatedAt}>
                  Updated: {new Date(data.updatedAt).toLocaleDateString('en-US')}
                </div>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div style={styles.container} data-testid="forward-performance-compact">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <BarChart3 size={16} style={{ color: '#6b7280' }} />
          <span style={styles.title}>Forward Performance</span>
          <span style={styles.badge}>
            {horizon}D · {mode.charAt(0).toUpperCase() + mode.slice(1)} · {execution}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>Error: {error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loading}>Loading...</div>
      )}

      {/* Content - Chart + metrics below */}
      {data && !loading && (
        <>
          {data.equity && data.equity.length > 0 ? (
            <div style={styles.chartWrapper}>
              <canvas ref={canvasRef} style={styles.canvas} />
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Activity size={28} style={{ color: '#d1d5db', marginBottom: 6 }} />
              <span style={styles.emptyText}>No resolved trades yet for {horizon}d horizon</span>
            </div>
          )}
          
          {/* Metrics row below chart */}
          <div style={styles.metricsRow}>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>CAGR</span>
              <span style={{ ...styles.metricValue, color: metrics?.cagr > 0 ? '#22c55e' : '#ef4444' }}>
                {metrics?.cagrFormatted || '0.00%'}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Win Rate</span>
              <span style={{ ...styles.metricValue, color: metrics?.winRate >= 50 ? '#22c55e' : '#f59e0b' }}>
                {metrics?.winRateFormatted || '0.0%'}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Max DD</span>
              <span style={{ ...styles.metricValue, color: '#374151' }}>
                {metrics?.maxDDFormatted || '0.00%'}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Sharpe</span>
              <span style={{ ...styles.metricValue, color: metrics?.sharpe > 1 ? '#22c55e' : '#374151' }}>
                {metrics?.sharpe?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={styles.metricLabel}>Trades</span>
              <span style={{ ...styles.metricValue, color: '#374151' }}>
                {metrics?.trades || 0}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    display: 'none', // Hidden
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  loading: {
    padding: '30px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
  },
  chartWrapper: {
    marginBottom: '12px',
  },
  canvas: {
    display: 'block',
    width: '100%',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
  },
  metricsRow: {
    display: 'flex',
    gap: '8px',
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '15px',
    fontWeight: '600',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6b7280',
  },
  // Clean SPX styles - no technical badges
  assetLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
  },
  horizonSection: {
    marginTop: '16px',
  },
  horizonSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    cursor: 'help',
  },
  horizonTable: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  horizonHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    backgroundColor: '#f9fafb',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
  },
  horizonHeaderCell: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'help',
  },
  horizonRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'help',
    transition: 'background-color 0.15s ease',
  },
  horizonCell: {
    fontSize: '13px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  currentBadge: {
    fontSize: '9px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '2px 5px',
    borderRadius: '3px',
    fontWeight: '500',
    marginLeft: '4px',
  },
  updatedAt: {
    marginTop: '12px',
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'right',
  },
  // Equity curve styles - clean
  equitySection: {
    marginTop: '16px',
    marginBottom: '12px',
  },
  equityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  equityTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    display: 'block',
  },
  equityDescription: {
    fontSize: '11px',
    color: '#9ca3af',
    display: 'block',
    marginTop: '2px',
    cursor: 'help',
  },
  equityMetrics: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  equityMetricItem: {
    fontSize: '11px',
    color: '#6b7280',
    cursor: 'help',
  },
  equityMetricDivider: {
    fontSize: '11px',
    color: '#d1d5db',
  },
};

export default ForwardPerformanceCompact;
