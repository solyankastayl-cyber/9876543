import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { drawBackground } from "./layers/drawBackground";
import { drawGrid } from "./layers/drawGrid";
import { drawCandles } from "./layers/drawCandles";
import { drawSMA } from "./layers/drawSMA";
import { drawPhases } from "./layers/drawPhases";
import { drawForecast } from "./layers/drawForecast";
import { draw7dArrow } from "./layers/draw7dArrow";
import { drawHybridForecast, drawMacroForecast } from "./layers/drawHybridForecast";
import { drawTimeAxis, drawNowSeparator } from "./layers/drawTimeAxis";
import { makeIndexXScale, makeYScale, paddedMinMax, createTimeScale } from "./math/scale";
import { PhaseTooltip } from "./PhaseTooltip";
import { formatPrice as formatPriceUtil } from "../../../utils/priceFormatter";

function Tooltip({ candle, sma, phase, symbol = 'BTC', viewMode = 'ABS', currentPrice = null }) {
  const date = new Date(candle.t).toLocaleDateString();
  const up = candle.c >= candle.o;
  
  // Check if we should show percent values (SPX in PERCENT mode)
  const showPercent = symbol === 'SPX' && viewMode === 'PERCENT' && currentPrice;
  
  // Format value based on mode
  const formatValue = (p) => {
    if (showPercent) {
      const pct = ((p - currentPrice) / currentPrice) * 100;
      return pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
    }
    return formatPriceUtil(p, symbol, { compact: false, decimals: 0 });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "#fff",
        border: "1px solid #e5e5e5",
        padding: "12px 14px",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderRadius: 8,
        minWidth: 140,
        zIndex: 10
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{date}</div>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(0,0,0,0.5)" }}>Open</span>
          <span>{formatValue(candle.o)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(0,0,0,0.5)" }}>High</span>
          <span>{formatValue(candle.h)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(0,0,0,0.5)" }}>Low</span>
          <span>{formatValue(candle.l)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(0,0,0,0.5)" }}>Close</span>
          <span style={{ color: up ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {formatValue(candle.c)}
          </span>
        </div>
        {sma && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(0,0,0,0.5)" }}>SMA200</span>
            <span style={{ color: "#3b82f6" }}>{formatValue(sma)}</span>
          </div>
        )}
        {phase && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ color: "rgba(0,0,0,0.5)" }}>Phase</span>
            <span style={{ fontWeight: 500 }}>{phase}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BLOCK U4 — Forecast Tooltip (for hover in forecast zone)
 * Shows date, forecast price, return %, and range (P10-P90)
 * For macro mode: shows only Macro and Hybrid prices
 * For other modes: shows Hybrid, Synthetic, Replay
 */
function ForecastTooltip({ day, forecastData, currentPrice, horizonDays, symbol = 'BTC', mode = 'synthetic' }) {
  if (!forecastData || day < 0) return null;
  
  const { syntheticPrice, replayPrice, hybridPrice, macroPrice, p10, p90 } = forecastData;
  
  // Use centralized formatter
  const formatPrice = (p) => formatPriceUtil(p, symbol, { compact: true });
  
  const formatReturn = (p) => {
    if (!p || !currentPrice) return '—';
    const ret = ((p - currentPrice) / currentPrice * 100);
    const sign = ret >= 0 ? '+' : '';
    return `${sign}${ret.toFixed(1)}%`;
  };
  
  // Calculate date
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + day);
  const dateStr = forecastDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  // For Macro mode - show only Macro and Hybrid
  const isMacroMode = mode === 'macro' || mode === 'adjusted';
  
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "#fff",
        border: "1px solid #e5e5e5",
        padding: "8px 10px",
        fontSize: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderRadius: 6,
        minWidth: 140,
        zIndex: 10
      }}
      data-testid="forecast-tooltip"
    >
      <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span>{dateStr}</span>
        <span style={{ color: '#666', fontSize: 9 }}>Day +{day}/{horizonDays}</span>
      </div>
      
      <div style={{ display: "grid", gap: 2 }}>
        {/* MACRO MODE: Show Macro and Hybrid only */}
        {isMacroMode && (
          <>
            {/* Macro Price - MAIN */}
            {(macroPrice || hybridPrice) && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: '3px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: "#f59e0b", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                  Macro
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>{formatPrice(macroPrice || hybridPrice)}</div>
                  <div style={{ fontSize: 9, color: (macroPrice || hybridPrice) >= currentPrice ? '#16a34a' : '#ef4444' }}>
                    {formatReturn(macroPrice || hybridPrice)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Hybrid Price */}
            {hybridPrice && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: '2px 0'
              }}>
                <span style={{ color: "#16a34a", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                  Hybrid
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 10 }}>{formatPrice(hybridPrice)}</div>
                  <div style={{ fontSize: 8, color: hybridPrice >= currentPrice ? '#22c55e' : '#ef4444' }}>
                    {formatReturn(hybridPrice)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* NON-MACRO MODE: Show Hybrid, Synthetic, Replay */}
        {!isMacroMode && (
          <>
            {/* Hybrid Price - MAIN (shown first, bold) */}
            {hybridPrice && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: '3px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: "#16a34a", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                  Hybrid
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>{formatPrice(hybridPrice)}</div>
                  <div style={{ fontSize: 9, color: hybridPrice >= currentPrice ? '#16a34a' : '#ef4444' }}>
                    {formatReturn(hybridPrice)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Synthetic Price */}
            {syntheticPrice && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: '2px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: "#86efac", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#86efac' }}></span>
                  Synthetic
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 10 }}>{formatPrice(syntheticPrice)}</div>
                  <div style={{ fontSize: 8, color: syntheticPrice >= currentPrice ? '#22c55e' : '#ef4444' }}>
                    {formatReturn(syntheticPrice)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Replay Price */}
            {replayPrice && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: '2px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: "#8b5cf6", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#8b5cf6' }}></span>
                  Replay
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 10 }}>{formatPrice(replayPrice)}</div>
                  <div style={{ fontSize: 8, color: replayPrice >= currentPrice ? '#22c55e' : '#ef4444' }}>
                    {formatReturn(replayPrice)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Range P10-P90 */}
            {(p10 || p90) && (
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: '2px 0',
                marginTop: 2
              }}>
                <span style={{ color: "rgba(0,0,0,0.4)", fontSize: 8 }}>Range</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace' }}>
                  {formatPrice(p10)} — {formatPrice(p90)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * C) Tail Risk Tooltip — Human-readable explanation
 * Shows "Worst-case (5%)" with context: horizon, sample size, data source
 */
function TailRiskTooltip({ data, position, symbol = 'BTC' }) {
  if (!data) return null;
  
  const { price, horizon, sampleSize, dataMode } = data;
  const formattedPrice = formatPriceUtil(price, symbol, { compact: false });
  
  return (
    <div
      style={{
        position: "fixed",
        left: position.x + 16,
        top: position.y - 10,
        background: "#fff",
        border: "1px solid #fca5a5",
        padding: "12px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        borderRadius: 8,
        minWidth: 220,
        maxWidth: 280,
        zIndex: 1000,
        pointerEvents: "none"
      }}
      data-testid="tail-risk-tooltip"
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#b91c1c", fontSize: 13 }}>
        Worst-case (5%): {formattedPrice}
      </div>
      
      <div style={{ color: "#666", fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
        This is the price level below which results fall in approximately 5% of the worst cases for this horizon.
      </div>
      
      <div style={{ display: "grid", gap: 4, fontSize: 11, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
        {horizon && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>Horizon:</span>
            <span style={{ fontWeight: 500 }}>{horizon}</span>
          </div>
        )}
        {sampleSize != null && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>Sample size:</span>
            <span style={{ fontWeight: 500 }}>{sampleSize} matches</span>
          </div>
        )}
        {dataMode && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>Data:</span>
            <span style={{ 
              fontWeight: 600, 
              color: dataMode === 'REAL' ? '#16a34a' : '#d97706'
            }}>
              {dataMode}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function FractalChartCanvas({ 
  chart, 
  forecast, 
  focus = '30d', 
  mode = 'price', 
  primaryMatch, 
  normalizedSeries, 
  width, 
  height,
  // BLOCK 73.5.2: Phase click callback
  onPhaseClick,
  selectedPhaseId,
  // Asset symbol for price formatting (BTC vs SPX)
  symbol = 'BTC',
  // VIEW MODE: ABS (absolute) or PERCENT (% from current price)
  // Only affects SPX - BTC always shows $
  viewMode = 'ABS'
}) {
  const ref = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  
  // BLOCK 73.5.1: Phase hover state
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [phaseTooltipPos, setPhaseTooltipPos] = useState({ x: 0, y: 0 });
  
  // BLOCK U4: Forecast zone hover state
  const [forecastHoverDay, setForecastHoverDay] = useState(-1);
  const [forecastHoverData, setForecastHoverData] = useState(null);
  
  // C) Tail Risk tooltip state
  const [tailRiskHover, setTailRiskHover] = useState(null);
  const [tailRiskTooltipPos, setTailRiskTooltipPos] = useState({ x: 0, y: 0 });
  
  // BLOCK 73.1.1: Determine axis mode from backend normalizedSeries
  const renderMode = focus === '7d' ? 'CAPSULE_7D' : 'TRAJECTORY';
  const axisMode = normalizedSeries?.mode === 'PERCENT' ? 'PERCENT' : 'PRICE';
  const isPercentMode = axisMode === 'PERCENT';

  // Increased margins: top for Y-axis labels, right for forecast zone (180d+ horizons)
  // A6: Increased bottom margin for X-axis time labels
  const margins = useMemo(() => ({ left: 70, right: 350, top: 36, bottom: 52 }), []);
  
  // BLOCK 73.5.1: Phase zones from chart
  const phaseZones = useMemo(() => chart?.phaseZones || [], [chart]);
  const phaseStats = useMemo(() => chart?.phaseStats || [], [chart]);
  
  // U4: Extract horizon days from focus
  const horizonDays = useMemo(() => {
    const match = focus?.match(/(\d+)d/);
    return match ? parseInt(match[1]) : 30;
  }, [focus]);

  // Mouse handler

  // Mouse handler (BLOCK 73.5.1: Phase hover detection + U4: Forecast zone hover)
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !chart?.candles?.length) return;

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const plotW = width - margins.left - margins.right;
      const step = plotW / (chart.candles.length - 1);
      const index = Math.round((mx - margins.left) / step);
      
      // U4: Calculate forecast zone boundaries (match drawHybridForecast)
      const xRightAnchor = margins.left + plotW;
      const forecastZoneWidth = Math.min(plotW * 0.55, 420) - 50;

      // U4: Check if cursor is in forecast zone
      if (mx > xRightAnchor && mx < xRightAnchor + forecastZoneWidth && forecast) {
        // C) First check if hovering over tail risk line (priority over forecast day hover)
        if (forecast?.tailFloor) {
          // Calculate Y position of tail risk line
          const candles = chart.candles;
          let minY = Infinity, maxY = -Infinity;
          for (const c of candles) {
            if (c.l < minY) minY = c.l;
            if (c.h > maxY) maxY = c.h;
          }
          if (forecast?.pricePath?.length) {
            for (let i = 0; i < forecast.pricePath.length; i++) {
              const upper = forecast.upperBand?.[i];
              const lower = forecast.lowerBand?.[i];
              if (upper && upper > maxY) maxY = upper;
              if (lower && lower < minY) minY = lower;
            }
            if (forecast.tailFloor < minY) minY = forecast.tailFloor;
          }
          // Add padding
          const range = maxY - minY;
          minY -= range * 0.08;
          maxY += range * 0.08;
          
          // Calculate tail Y position
          const plotH = height - margins.top - margins.bottom;
          const tailY = margins.top + ((maxY - forecast.tailFloor) / (maxY - minY)) * plotH;
          
          // Check if mouse is near tail risk line (within 12px vertically)
          if (Math.abs(my - tailY) < 12) {
            setTailRiskHover({
              price: forecast.tailFloor,
              horizon: focus?.toUpperCase() || '30D',
              sampleSize: forecast.stats?.matchCount || forecast.matchCount || null,
              dataMode: forecast.stats?.dataMode || forecast.dataMode || null
            });
            setTailRiskTooltipPos({ x: e.clientX, y: e.clientY });
            setForecastHoverDay(-1);
            setForecastHoverData(null);
            setHoverIndex(null);
            setHoveredPhase(null);
            return;
          }
        }
        
        // Reset tail risk hover if not on the line
        setTailRiskHover(null);
        
        // Calculate which day in forecast we're hovering
        const dayProgress = (mx - xRightAnchor) / forecastZoneWidth;
        const day = Math.round(dayProgress * horizonDays);
        
        if (day >= 0 && day <= horizonDays) {
          setForecastHoverDay(day);
          setHoverIndex(null);
          setHoveredPhase(null);
          
          // Get forecast data for this day
          const unifiedPath = forecast?.unifiedPath;
          const currentPrice = unifiedPath?.anchorPrice || forecast?.currentPrice;
          
          let syntheticPrice = null;
          let replayPrice = null;
          
          if (unifiedPath?.syntheticPath?.length > day) {
            syntheticPrice = unifiedPath.syntheticPath[day]?.price;
          } else if (forecast?.pricePath?.length > day) {
            syntheticPrice = day === 0 ? currentPrice : forecast.pricePath[day - 1];
          }
          
          if (unifiedPath?.replayPath?.length > day) {
            replayPrice = unifiedPath.replayPath[day]?.price;
          } else if (primaryMatch?.replayPath?.length > day) {
            replayPrice = day === 0 ? currentPrice : primaryMatch.replayPath[day - 1];
          }
          
          // HYBRID: Calculate hybrid price from unifiedPath or as weighted average
          let hybridPrice = null;
          if (unifiedPath?.hybridPath?.length > day) {
            hybridPrice = unifiedPath.hybridPath[day]?.price;
          } else if (syntheticPrice && replayPrice) {
            // Fallback: calculate hybrid as weighted average (50% by default)
            const weight = unifiedPath?.replayWeight || 0.5;
            hybridPrice = (1 - weight) * syntheticPrice + weight * replayPrice;
          }
          
          setForecastHoverData({
            hybridPrice,
            syntheticPrice,
            replayPrice,
            p10: forecast?.p10Path?.[day],
            p90: forecast?.p90Path?.[day]
          });
          
          return;
        }
      }
      
      // Reset tail risk hover when outside forecast zone
      setTailRiskHover(null);
      
      // Reset forecast hover when not in forecast zone
      setForecastHoverDay(-1);
      setForecastHoverData(null);

      if (index >= 0 && index < chart.candles.length) {
        setHoverIndex(index);
        
        // BLOCK 73.5.1: Detect phase under cursor
        const candle = chart.candles[index];
        const candleTs = candle.t;
        
        // Find phase zone containing this candle
        const zone = phaseZones.find(z => candleTs >= z.from && candleTs <= z.to);
        
        if (zone && phaseStats.length > 0) {
          // Find matching phase stats
          const stats = phaseStats.find(s => 
            s.from === new Date(zone.from).toISOString() || 
            new Date(s.from).getTime() === zone.from
          );
          
          if (stats) {
            setHoveredPhase(stats);
            setPhaseTooltipPos({ x: e.clientX, y: e.clientY });
          } else {
            setHoveredPhase(null);
          }
        } else {
          setHoveredPhase(null);
        }
      } else {
        setHoverIndex(null);
        setHoveredPhase(null);
      }
    };

    const handleLeave = () => {
      setHoverIndex(null);
      setHoveredPhase(null);
      setForecastHoverDay(-1);
      setForecastHoverData(null);
      setTailRiskHover(null);
    };
    
    // BLOCK 73.5.2: Handle phase click
    const handleClick = (e) => {
      if (!onPhaseClick) return;
      
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const plotW = width - margins.left - margins.right;
      const step = plotW / (chart.candles.length - 1);
      const index = Math.round((mx - margins.left) / step);
      
      if (index >= 0 && index < chart.candles.length) {
        const candle = chart.candles[index];
        const candleTs = candle.t;
        
        // Find phase zone containing this candle
        const zone = phaseZones.find(z => candleTs >= z.from && candleTs <= z.to);
        
        if (zone && phaseStats.length > 0) {
          const stats = phaseStats.find(s => 
            s.from === new Date(zone.from).toISOString() || 
            new Date(s.from).getTime() === zone.from
          );
          
          if (stats) {
            // Toggle selection - if same phase clicked again, deselect
            if (selectedPhaseId === stats.phaseId) {
              onPhaseClick(null);
            } else {
              onPhaseClick(stats.phaseId, stats);
            }
          }
        }
      }
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, [chart, width, margins, phaseZones, phaseStats, onPhaseClick, selectedPhaseId, forecast, primaryMatch, horizonDays]);

  // Render
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBackground(ctx, width, height);

    if (!chart?.candles?.length) {
      drawGrid(ctx, width, height, margins.left, margins.top, margins.right, margins.bottom);
      return;
    }

    const candles = chart.candles;
    const ts = candles.map(c => c.t);
    const currentPrice = candles[candles.length - 1]?.c || 0;

    // BLOCK 73.1.1: Y-scale depends on axis mode
    let minY, maxY, yScale;
    
    if (isPercentMode && normalizedSeries) {
      // PERCENT MODE: Use % range from backend
      minY = normalizedSeries.yRange?.minPercent ?? -50;
      maxY = normalizedSeries.yRange?.maxPercent ?? 50;
      
      // Add extra padding for visibility
      const range = maxY - minY;
      minY = Math.max(minY, -100); // Cap at -100%
      maxY = Math.min(maxY, 200);  // Cap at +200% for readability
      
    } else {
      // RAW PRICE MODE: Calculate from candles and forecast
      minY = Infinity;
      maxY = -Infinity;
      
      for (const c of candles) {
        if (c.l < minY) minY = c.l;
        if (c.h > maxY) maxY = c.h;
      }
      
      // Extend Y range to include forecast band
      if (forecast?.pricePath?.length) {
        for (let i = 0; i < forecast.pricePath.length; i++) {
          const upper = forecast.upperBand?.[i];
          const lower = forecast.lowerBand?.[i];
          if (upper && upper > maxY) maxY = upper;
          if (lower && lower < minY) minY = lower;
        }
        if (forecast.tailFloor && forecast.tailFloor < minY) {
          minY = forecast.tailFloor;
        }
      } else if (forecast?.points?.length) {
        for (const p of forecast.points) {
          if (p.lower < minY) minY = p.lower;
          if (p.upper > maxY) maxY = p.upper;
        }
        if (forecast.tailFloor && forecast.tailFloor < minY) {
          minY = forecast.tailFloor;
        }
      }
    }
    
    const mm = paddedMinMax(minY, maxY, 0.08);

    // ═══════════════════════════════════════════════════════════════
    // A) TIMESTAMP-BASED X-AXIS
    // ═══════════════════════════════════════════════════════════════
    
    // A3: Calculate time domain
    const nowTs = candles[candles.length - 1].t;
    const ONE_DAY = 86400000;
    
    // FIXED: Use visible history portion (what fits on screen), not full history
    // Original logic: candles array defines visible history, NOW at last candle
    // Keep NOW at ~70% of plot width, forecast takes remaining 30%
    const historyPortion = 0.70; // 70% for history, 30% for forecast
    
    // Calculate how much history to show based on candles count
    const historyStartTs = candles[0].t;
    const historySpan = nowTs - historyStartTs;
    
    // Forecast extends horizonDays into the future
    const forecastSpan = horizonDays * ONE_DAY;
    
    // Full visible domain
    const domainMin = historyStartTs;
    const domainMax = nowTs + forecastSpan;
    
    // A2: Create timestamp-based X scale
    const plotW = width - margins.left - margins.right;
    const xTimeScale = createTimeScale(domainMin, domainMax, margins.left, margins.left + plotW);
    
    // Legacy index-based scale (for backward compatibility with layers that use index)
    const { x, step } = makeIndexXScale(candles.length, margins.left, margins.right, width);
    
    // NOW X position using legacy scale (keeps original positioning)
    // This ensures NOW stays at the boundary between history and forecast
    const nowX = x(candles.length - 1);
    
    // A4: Create wrapper that maps timestamp to pixel
    // For candles: use their timestamp directly
    // For forecast: convert dayIndex to timestamp
    const xByTs = (ts) => xTimeScale(ts);
    const xByIndex = (i) => {
      if (i < candles.length) {
        return xTimeScale(candles[i].t);
      }
      // Forecast index (relative to now)
      const forecastDay = i - candles.length + 1;
      return xTimeScale(nowTs + forecastDay * ONE_DAY);
    };
    
    // VIEW MODE TOGGLE: For SPX, allow switching between ABS (pts) and PERCENT (%)
    // This is UI-only transform, doesn't affect backend data
    const isViewPercent = symbol === 'SPX' && viewMode === 'PERCENT';
    
    // Transform values for percent view
    const toViewValue = (price) => {
      if (!isViewPercent) return price;
      return ((price - currentPrice) / currentPrice) * 100;
    };
    
    // BLOCK 73.1.1: Create appropriate Y scale
    let y;
    let displayMinY = mm.minY;
    let displayMaxY = mm.maxY;
    
    if (isViewPercent) {
      // Transform min/max to percent
      displayMinY = toViewValue(mm.minY);
      displayMaxY = toViewValue(mm.maxY);
      const { y: yPercent } = makeYScale(displayMinY, displayMaxY, margins.top, margins.bottom, height);
      // Wrapper that converts price to percent then maps
      y = (price) => {
        const pct = toViewValue(price);
        return yPercent(pct);
      };
      y.isPercent = true;
      y.isViewPercent = true;
      y.currentPrice = currentPrice;
    } else if (isPercentMode) {
      // Y scale for percent values (from backend normalized mode)
      const { y: yPercent } = makeYScale(mm.minY, mm.maxY, margins.top, margins.bottom, height);
      // Wrapper that converts price to percent then maps
      y = (price) => {
        const pct = ((price / currentPrice) - 1) * 100;
        return yPercent(pct);
      };
      // Also expose percent scale directly
      y.percent = yPercent;
      y.isPercent = true;
      y.currentPrice = currentPrice;
    } else {
      const { y: yPrice } = makeYScale(mm.minY, mm.maxY, margins.top, margins.bottom, height);
      y = yPrice;
      y.isPercent = false;
    }

    // phases -> grid -> candles -> sma -> forecast
    drawPhases(ctx, chart.phaseZones, ts, x, margins.top, height, margins.bottom);
    drawGrid(ctx, width, height, margins.left, margins.top, margins.right, margins.bottom);
    drawCandles(ctx, candles, x, y, step, isPercentMode || isViewPercent, currentPrice);
    drawSMA(ctx, chart.sma200, ts, x, y);

    // A7: Draw NOW separator line (using legacy x position for consistency)
    drawNowSeparator(ctx, nowX, margins.top, height - margins.bottom);
    
    // A5-A6: Draw X-axis with ticks at candle positions
    // Uses candles array and x(i) scale to match candle positions
    drawTimeAxis(ctx, candles, x, horizonDays, height - margins.bottom, plotW);

    // anchor at last candle x (using legacy scale)
    const xAnchor = nowX;
    
    // BLOCK 72.3: Choose forecast renderer based on focus and mode
    // BLOCK 73.3: Pass markers to hybrid renderer for 14D continuity
    if (mode === 'macro' && forecast?.unifiedPath?.macroPath?.length) {
      // Macro mode: draw cascade (hybrid + macro adjustment)
      drawMacroForecast(
        ctx,
        forecast,
        primaryMatch,
        xAnchor,
        y,
        plotW,
        margins.top,
        margins.bottom,
        height,
        forecast?.markers || [],
        symbol
      );
    } else if (mode === 'hybrid' && primaryMatch) {
      // Hybrid mode: draw both synthetic and replay
      drawHybridForecast(
        ctx,
        forecast,
        primaryMatch,
        xAnchor,
        y,
        plotW,
        margins.top,
        margins.bottom,
        height,
        forecast?.markers || [], // BLOCK 73.3: Pass markers for continuity
        symbol // Asset symbol for price formatting
      );
    } else if (renderMode === 'CAPSULE_7D' && forecast?.distribution7d) {
      // 7D: Draw compact directional arrow + insight block
      draw7dArrow(
        ctx,
        forecast.distribution7d,
        forecast.currentPrice,
        xAnchor,
        y,
        margins.top,
        margins.bottom,
        height,
        forecast.stats || {}
      );
    } else {
      // 14D+: Draw aftermath-driven trajectory with fan
      drawForecast(ctx, forecast, xAnchor, y, plotW, margins.top, margins.bottom, height, symbol);
    }

    // Crosshair
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length) {
      const xi = x(hoverIndex);
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xi, margins.top);
      ctx.lineTo(xi, height - margins.bottom);
      ctx.stroke();
      ctx.restore();
    }

    // Y-axis labels
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "11px system-ui";
    const yTicks = 5;
    
    // Check if we're in percent view mode (either from backend or UI toggle)
    const showPercentLabels = isPercentMode || isViewPercent;
    
    if (showPercentLabels) {
      // PERCENT MODE (from backend normalized or view toggle): Show % labels
      for (let i = 0; i <= yTicks; i++) {
        const pct = displayMinY + (i / yTicks) * (displayMaxY - displayMinY);
        const yPos = y(mm.minY + (i / yTicks) * (mm.maxY - mm.minY));
        const label = pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
        ctx.fillText(label, 4, yPos + 4);
      }
      // Draw NOW reference line at 0%
      const nowY = isViewPercent ? y(currentPrice) : y.percent(0);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margins.left, nowY);
      ctx.lineTo(width - margins.right, nowY);
      ctx.stroke();
      ctx.setLineDash([]);
      // NOW label
      ctx.fillStyle = '#22c55e';
      ctx.fillText('NOW 0%', margins.left - 45, nowY + 4);
    } else {
      // PRICE MODE: Show $ labels for BTC, pts for SPX
      for (let i = 0; i <= yTicks; i++) {
        const price = mm.minY + (i / yTicks) * (mm.maxY - mm.minY);
        const yPos = y(price);
        // Format based on asset symbol
        const label = symbol === 'SPX' 
          ? price.toLocaleString(undefined, { maximumFractionDigits: 0 })
          : '$' + price.toLocaleString(undefined, { maximumFractionDigits: 0 });
        ctx.fillText(label, 4, yPos + 4);
      }
    }
    ctx.restore();

  }, [chart, forecast, focus, mode, primaryMatch, normalizedSeries, isPercentMode, renderMode, width, height, margins, hoverIndex, horizonDays, symbol, viewMode]);

  const hoverCandle = hoverIndex !== null && chart?.candles?.[hoverIndex];
  const hoverSma = hoverCandle && chart?.sma200?.find(s => s.t === hoverCandle.t)?.value;
  const hoverPhaseName = hoverCandle && chart?.phaseZones?.find(
    z => hoverCandle.t >= z.from && hoverCandle.t <= z.to
  )?.phase;
  
  // U4: Get current price for forecast tooltip
  const currentPrice = chart?.candles?.[chart.candles.length - 1]?.c || forecast?.currentPrice;

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={ref} style={{ cursor: tailRiskHover ? "help" : "crosshair" }} />
      {/* Historical data tooltip */}
      {hoverCandle && (
        <Tooltip candle={hoverCandle} sma={hoverSma} phase={hoverPhaseName} symbol={symbol} viewMode={viewMode} currentPrice={currentPrice} />
      )}
      {/* U4: Forecast zone tooltip */}
      {forecastHoverDay >= 0 && forecastHoverData && (
        <ForecastTooltip 
          day={forecastHoverDay}
          forecastData={forecastHoverData}
          currentPrice={currentPrice}
          horizonDays={horizonDays}
          symbol={symbol}
          mode={mode}
        />
      )}
      {/* C) Tail Risk Tooltip */}
      {tailRiskHover && (
        <TailRiskTooltip 
          data={tailRiskHover}
          position={tailRiskTooltipPos}
          symbol={symbol}
        />
      )}
      {/* BLOCK 73.5.1: Phase Tooltip */}
      <PhaseTooltip 
        phase={hoveredPhase}
        position={phaseTooltipPos}
        visible={!!hoveredPhase}
      />
    </div>
  );
}
