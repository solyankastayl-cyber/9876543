/**
 * STEP A — Hybrid Forecast Renderer
 * BLOCK 73.3 — Unified Path Integration
 * 
 * Shows THREE forecast lines:
 * 1. Synthetic (light green dashed) - AI model forecast
 * 2. Replay (purple dashed) - Fractal historical replay
 * 3. Hybrid (solid green, thick) - Combined forecast (main line)
 * 
 * The Hybrid line is the weighted combination of Synthetic and Replay
 * using the formula: hybrid = (1 - weight) * synthetic + weight * replay
 */

import { formatPrice as formatPriceUtil } from '../../../../utils/priceFormatter';

export function drawHybridForecast(
  ctx,
  forecast,
  primaryMatch,
  xRightAnchor,
  y,
  plotW,
  marginTop,
  marginBottom,
  canvasHeight,
  markers = [], // Legacy markers (fallback)
  symbol = 'BTC' // Asset symbol for price formatting
) {
  // BLOCK 73.3: Prefer unifiedPath if available
  const unifiedPath = forecast?.unifiedPath;
  
  let syntheticData, replayData, hybridData, anchorPrice, N, replayWeight;
  
  if (unifiedPath?.syntheticPath?.length) {
    // NEW: Use unified path (includes t=0)
    syntheticData = unifiedPath.syntheticPath;
    replayData = unifiedPath.replayPath || [];
    hybridData = unifiedPath.hybridPath || [];
    anchorPrice = unifiedPath.anchorPrice;
    N = unifiedPath.horizonDays || syntheticData.length;
    replayWeight = unifiedPath.replayWeight || 0.5;
    
    console.log('[drawHybridForecast] syntheticData:', syntheticData?.length);
    console.log('[drawHybridForecast] replayData:', replayData?.length);
    console.log('[drawHybridForecast] hybridData:', hybridData?.length);
    console.log('[drawHybridForecast] replayWeight:', replayWeight);
    
  } else if (forecast?.pricePath?.length) {
    // LEGACY: Fallback to old format (no t=0)
    const legacyPath = forecast.pricePath;
    anchorPrice = forecast.currentPrice;
    N = legacyPath.length;
    replayWeight = 0.5; // Default weight
    
    // Convert to unified format - Synthetic
    syntheticData = [{ t: 0, price: anchorPrice, pct: 0 }];
    for (let i = 0; i < N; i++) {
      syntheticData.push({
        t: i + 1,
        price: legacyPath[i],
        pct: ((legacyPath[i] / anchorPrice) - 1) * 100
      });
    }
    
    // Legacy replay from primaryMatch
    if (primaryMatch?.replayPath?.length) {
      replayData = [{ t: 0, price: anchorPrice, pct: 0 }];
      for (let i = 0; i < primaryMatch.replayPath.length; i++) {
        replayData.push({
          t: i + 1,
          price: primaryMatch.replayPath[i],
          pct: ((primaryMatch.replayPath[i] / anchorPrice) - 1) * 100
        });
      }
    } else if (primaryMatch?.aftermathNormalized?.length) {
      replayData = [{ t: 0, price: anchorPrice, pct: 0 }];
      for (let i = 0; i < primaryMatch.aftermathNormalized.length; i++) {
        const ret = primaryMatch.aftermathNormalized[i];
        replayData.push({
          t: i + 1,
          price: anchorPrice * (1 + ret),
          pct: ret * 100
        });
      }
    } else {
      replayData = [];
    }
    
    // Calculate hybrid as weighted average if not provided
    hybridData = [];
    if (syntheticData.length > 0 && replayData.length > 0) {
      const maxLen = Math.max(syntheticData.length, replayData.length);
      for (let i = 0; i < maxLen; i++) {
        const synPrice = syntheticData[i]?.price ?? syntheticData[syntheticData.length - 1]?.price;
        const repPrice = replayData[i]?.price ?? replayData[replayData.length - 1]?.price;
        const hybPrice = (1 - replayWeight) * synPrice + replayWeight * repPrice;
        hybridData.push({
          t: i,
          price: hybPrice,
          pct: ((hybPrice / anchorPrice) - 1) * 100
        });
      }
    }
  } else {
    return; // No data to render
  }
  
  // If no hybrid data but have synthetic and replay, calculate it
  if (hybridData.length === 0 && syntheticData.length > 0 && replayData.length > 0) {
    const w = replayWeight || 0.5;
    const maxLen = Math.max(syntheticData.length, replayData.length);
    for (let i = 0; i < maxLen; i++) {
      const synPrice = syntheticData[i]?.price ?? syntheticData[syntheticData.length - 1]?.price;
      const repPrice = replayData[i]?.price ?? replayData[replayData.length - 1]?.price;
      const hybPrice = (1 - w) * synPrice + w * repPrice;
      hybridData.push({
        t: i,
        price: hybPrice,
        pct: ((hybPrice / anchorPrice) - 1) * 100
      });
    }
  }
  
  // Forecast zone width (increased for longer horizons like 180d/365d)
  const forecastZoneWidth = Math.min(plotW * 0.55, 420) - 50;
  const dayToX = (t) => xRightAnchor + (t / N) * forecastZoneWidth;
  
  // === 1. FORECAST ZONE BACKGROUND ===
  ctx.save();
  const bgGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xRightAnchor + forecastZoneWidth, 0
  );
  bgGradient.addColorStop(0, "rgba(0,0,0,0.03)");
  bgGradient.addColorStop(1, "rgba(0,0,0,0.01)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(
    xRightAnchor,
    marginTop,
    forecastZoneWidth + 70,
    canvasHeight - marginTop - marginBottom
  );
  ctx.restore();
  
  // === 2. NOW SEPARATOR ===
  ctx.save();
  ctx.strokeStyle = "rgba(180, 0, 0, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, marginTop);
  ctx.lineTo(xRightAnchor, canvasHeight - marginBottom);
  ctx.stroke();
  ctx.restore();
  
  // === 3. NOW LABEL ===
  ctx.save();
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("NOW", xRightAnchor, marginTop - 6);
  ctx.restore();
  
  // === 4. SYNTHETIC LINE (light green, dashed) - AI Model ===
  if (syntheticData.length > 0) {
    const syntheticPoints = syntheticData.map(p => ({
      x: dayToX(p.t),
      y: y(p.price)
    }));
    
    ctx.save();
    ctx.strokeStyle = 'rgba(134, 239, 172, 0.8)'; // Light green
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([4, 4]); // Dashed
    
    drawSpline(ctx, syntheticPoints);
    ctx.stroke();
    ctx.restore();
  }
  
  // === 5. REPLAY LINE (purple, dashed) - Fractal Continuation ===
  if (replayData.length > 0) {
    const replayPoints = replayData.map(p => ({
      x: dayToX(p.t),
      y: y(p.price)
    }));
    
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.2)';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#8b5cf6'; // Purple
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([6, 4]); // Dashed
    
    drawSpline(ctx, replayPoints);
    ctx.stroke();
    ctx.restore();
  }
  
  // === 6. HYBRID LINE (solid green, thick) - Combined Forecast (MAIN LINE) ===
  if (hybridData.length > 0) {
    const hybridPoints = hybridData.map(p => ({
      x: dayToX(p.t),
      y: y(p.price)
    }));
    
    ctx.save();
    ctx.shadowColor = 'rgba(22, 163, 74, 0.3)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#22c55e'; // Green
    ctx.lineWidth = 3; // Thicker - main line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // NO dash - solid line
    
    drawSpline(ctx, hybridPoints);
    ctx.stroke();
    ctx.restore();
  }
  
  // === 7. TAIL RISK LINE (Worst-case 5%) ===
  if (forecast.tailFloor && forecast.tailFloor > 0) {
    const tailY = y(forecast.tailFloor);
    const tailPrice = Math.round(forecast.tailFloor);
    const formattedPrice = formatPriceUtil(tailPrice, symbol, { compact: false });
    
    if (tailY > marginTop && tailY < canvasHeight - marginBottom) {
      ctx.save();
      
      ctx.strokeStyle = "rgba(200, 0, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(xRightAnchor, tailY);
      ctx.lineTo(dayToX(N), tailY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(xRightAnchor, tailY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 0, 0, 0.85)";
      ctx.fill();
      
      ctx.fillStyle = "rgba(180, 0, 0, 0.9)";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("Worst-case (5%):", xRightAnchor + 10, tailY - 5);
      
      ctx.font = "bold 11px system-ui";
      ctx.fillStyle = "rgba(180, 0, 0, 0.95)";
      ctx.fillText(formattedPrice, xRightAnchor + 112, tailY - 5);
      
      ctx.restore();
    }
  }
  
  // === 8. END MARKERS ===
  const endX = dayToX(N);
  
  // Hybrid end marker (main, largest)
  if (hybridData.length > 0) {
    const lastHybrid = hybridData[hybridData.length - 1];
    const lastHybridY = y(lastHybrid.price);
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(endX, lastHybridY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(endX, lastHybridY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Replay end marker
  if (replayData.length > 0) {
    const lastReplay = replayData[replayData.length - 1];
    const lastReplayY = y(lastReplay.price);
    ctx.save();
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(endX, lastReplayY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(endX, lastReplayY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Synthetic end marker (smallest)
  if (syntheticData.length > 0) {
    const lastSynthetic = syntheticData[syntheticData.length - 1];
    const lastSyntheticY = y(lastSynthetic.price);
    ctx.save();
    ctx.fillStyle = 'rgba(134, 239, 172, 0.9)';
    ctx.beginPath();
    ctx.arc(endX, lastSyntheticY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(endX, lastSyntheticY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // === 9. LEGEND (3 lines) - DYNAMIC POSITIONING ===
  // Check where forecast lines ARE on screen (not where they go)
  // If lines are in BOTTOM half → legend at TOP
  // If lines are in TOP half → legend at BOTTOM
  
  const allForecastY = [
    ...hybridData.map(p => y(p.price)),
    ...replayData.map(p => y(p.price)),
    ...syntheticData.map(p => y(p.price))
  ].filter(v => !isNaN(v) && isFinite(v));
  
  const avgForecastY = allForecastY.length > 0 
    ? allForecastY.reduce((a, b) => a + b, 0) / allForecastY.length 
    : (marginTop + canvasHeight - marginBottom) / 2;
  
  const chartMiddleY = (marginTop + canvasHeight - marginBottom) / 2;
  
  const legendX = xRightAnchor + 12;
  let legendY;
  
  // Y increases downward, so larger Y = lower on screen
  if (avgForecastY > chartMiddleY) {
    // Forecast lines are in BOTTOM half → legend at TOP
    legendY = marginTop + 20;
  } else {
    // Forecast lines are in TOP half → legend at BOTTOM
    legendY = canvasHeight - marginBottom - 75;
  }
  
  ctx.save();
  
  // HYBRID legend (main line) - shown first
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = 'left';
  ctx.fillText('Hybrid', legendX + 12, legendY + 4);
  
  // Replay weight badge
  if (replayWeight != null) {
    ctx.font = "9px system-ui";
    ctx.fillStyle = '#888';
    ctx.fillText(`(${(replayWeight * 100).toFixed(0)}% replay)`, legendX + 55, legendY + 4);
  }
  
  // REPLAY legend
  if (replayData.length > 0) {
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(legendX, legendY + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.font = "11px system-ui";
    ctx.fillText('Replay', legendX + 12, legendY + 22);
    
    // Similarity badge
    if (primaryMatch?.similarity) {
      ctx.font = "9px system-ui";
      ctx.fillStyle = '#888';
      ctx.fillText(`(${(primaryMatch.similarity * 100).toFixed(0)}% sim)`, legendX + 55, legendY + 22);
    }
  }
  
  // SYNTHETIC legend
  if (syntheticData.length > 0) {
    ctx.fillStyle = 'rgba(134, 239, 172, 0.9)';
    ctx.beginPath();
    ctx.arc(legendX, legendY + 36, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.font = "11px system-ui";
    ctx.fillText('Synthetic', legendX + 12, legendY + 40);
  }
  
  ctx.restore();
  
  // === 10. INTERMEDIATE HORIZON MARKERS ===
  const unifiedMarkers = unifiedPath?.markers || {};
  const markerKeys = Object.keys(unifiedMarkers).filter(k => {
    const m = unifiedMarkers[k];
    // Skip 7d marker for 365d horizon (too cluttered)
    if (N >= 365 && k === '7d') return false;
    return m && m.t > 0 && m.t < N;
  });
  
  console.log('[drawHybridForecast] unifiedMarkers:', unifiedMarkers);
  console.log('[drawHybridForecast] markerKeys after filter:', markerKeys);
  console.log('[drawHybridForecast] N:', N);
  
  const legacyMarkers = markers.length > 0 
    ? markers.filter(m => {
        const day = m.day || m.dayIndex + 1;
        // Skip 7d marker for 365d horizon
        if (N >= 365 && day === 7) return false;
        return day < N;
      })
    : (forecast?.markers?.filter(m => {
        const day = m.day || m.dayIndex + 1;
        if (N >= 365 && day === 7) return false;
        return day < N;
      }) || []);
  
  if (markerKeys.length > 0) {
    markerKeys.forEach(key => {
      const marker = unifiedMarkers[key];
      const mx = dayToX(marker.t);
      const my = y(marker.price);
      
      const progress = marker.t / N;
      const markerAlpha = 1 - progress * 0.2;
      
      ctx.save();
      ctx.fillStyle = `rgba(22, 163, 74, ${markerAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + markerAlpha * 0.2})`;
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(marker.horizon, mx, my - 10);
      ctx.restore();
    });
  } else {
    legacyMarkers.forEach(marker => {
      const day = marker.day || (marker.dayIndex + 1);
      const price = marker.price || (hybridData[day]?.price ?? syntheticData[day]?.price);
      if (!price || day >= N) return;
      
      const mx = dayToX(day);
      const my = y(price);
      
      const progress = day / N;
      const markerAlpha = 1 - progress * 0.2;
      
      ctx.save();
      ctx.fillStyle = `rgba(22, 163, 74, ${markerAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      const label = marker.horizon || `${day}d`;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + markerAlpha * 0.2})`;
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(label, mx, my - 10);
      ctx.restore();
    });
  }
  
  // === 11. ENDPOINT HORIZON LABEL ===
  if (hybridData.length > 0) {
    const lastHybrid = hybridData[hybridData.length - 1];
    ctx.save();
    ctx.font = "bold 10px system-ui";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(`${N}d`, endX, y(lastHybrid.price) - 14);
    ctx.restore();
  }
  
  // === 12. FORECAST SUMMARY ===
  // Calculate expected return from HYBRID path (main line)
  const dataForReturn = hybridData.length > 0 ? hybridData : syntheticData;
  const startPrice = dataForReturn[0]?.price || anchorPrice;
  const endPrice = dataForReturn[dataForReturn.length - 1]?.price || startPrice;
  const expectedReturn = ((endPrice - startPrice) / startPrice) * 100;
  const sign = expectedReturn >= 0 ? '+' : '';
  
  ctx.save();
  ctx.font = "11px system-ui";
  ctx.textAlign = "left";
  
  const labelX = xRightAnchor + 10;
  const labelY = canvasHeight - marginBottom + 18;
  
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(`Forecast: ${sign}${expectedReturn.toFixed(1)}%`, labelX, labelY);
  ctx.restore();
}

// Helper: Catmull-Rom spline
function drawSpline(ctx, points) {
  if (points.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

/**
 * MACRO Forecast Renderer
 * Shows cascade level: Hybrid + Macro adjustment
 * 
 * Shows FOUR lines:
 * 1. Synthetic (light green dashed) - AI model forecast
 * 2. Replay (purple dashed) - Fractal historical replay
 * 3. Hybrid (green dashed) - Combined synthetic + replay
 * 4. Macro (gold/orange solid, thick) - Hybrid + Macro adjustment (MAIN LINE)
 */
export function drawMacroForecast(
  ctx,
  forecast,
  primaryMatch,
  xRightAnchor,
  y,
  plotW,
  marginTop,
  marginBottom,
  canvasHeight,
  markers = [],
  symbol = 'DXY'
) {
  const unifiedPath = forecast?.unifiedPath;
  if (!unifiedPath) return;
  
  const syntheticData = unifiedPath.syntheticPath || [];
  const replayData = unifiedPath.replayPath || [];
  const hybridData = unifiedPath.hybridPath || [];
  const macroData = unifiedPath.macroPath || [];
  const anchorPrice = unifiedPath.anchorPrice;
  const N = unifiedPath.horizonDays || syntheticData.length;
  const macroAdjustment = unifiedPath.macroAdjustment;
  
  console.log('[drawMacroForecast] macroPath:', macroData.length);
  console.log('[drawMacroForecast] hybridPath:', hybridData.length);
  console.log('[drawMacroForecast] macroAdjustment:', macroAdjustment);
  
  // Forecast zone width
  const forecastZoneWidth = Math.min(plotW * 0.55, 420) - 50;
  const dayToX = (t) => xRightAnchor + (t / N) * forecastZoneWidth;
  
  // === 1. FORECAST ZONE BACKGROUND ===
  ctx.save();
  const bgGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xRightAnchor + forecastZoneWidth, 0
  );
  bgGradient.addColorStop(0, "rgba(245, 158, 11, 0.03)"); // Orange tint for macro
  bgGradient.addColorStop(1, "rgba(245, 158, 11, 0.01)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(
    xRightAnchor,
    marginTop,
    forecastZoneWidth + 70,
    canvasHeight - marginTop - marginBottom
  );
  ctx.restore();
  
  // === 2. NOW SEPARATOR ===
  ctx.save();
  ctx.strokeStyle = "rgba(180, 0, 0, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, marginTop);
  ctx.lineTo(xRightAnchor, canvasHeight - marginBottom);
  ctx.stroke();
  ctx.restore();
  
  // === 3. NOW LABEL ===
  ctx.save();
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("NOW", xRightAnchor, marginTop - 6);
  ctx.restore();
  
  // === MACRO MODE: Macro is MAIN, Hybrid is HINT (dashed) ===
  // Macro = основная сплошная оранжевая линия
  // Hybrid = второстепенная пунктирная зелёная (подсказка)
  // Draw ORDER: Macro first (bottom), then Hybrid on top (so dashed line is visible)
  
  // === 4. MACRO LINE (orange, solid, thick) - MAIN LINE - draw first ===
  if (macroData.length > 0) {
    const points = macroData.map(p => ({
      x: dayToX(p.t),
      y: y(p.price)
    }));
    
    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#f59e0b'; // Orange/amber
    ctx.lineWidth = 3; // Thick - main line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Solid line - no dash
    drawSpline(ctx, points);
    ctx.stroke();
    ctx.restore();
  }
  
  // === 5. HYBRID LINE (green, dashed) - SECONDARY/HINT - draw on top ===
  if (hybridData.length > 0) {
    const points = hybridData.map(p => ({
      x: dayToX(p.t),
      y: y(p.price)
    }));
    
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)'; // Green (brighter)
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]); // Longer dashes for better visibility
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSpline(ctx, points);
    ctx.stroke();
    ctx.restore();
  }
  
  // === 8. DAY MARKERS on MACRO path (main line) ===
  const allPossibleMarkers = [
    { day: 7, horizon: '7d' },
    { day: 14, horizon: '14d' },
    { day: 30, horizon: '30d' },
    { day: 90, horizon: '90d' },
    { day: 180, horizon: '180d' },
    { day: 365, horizon: '365d' },
  ];
  
  // Filter markers based on horizon - skip 7d for 365d timeframe
  const displayMarkers = allPossibleMarkers
    .filter(m => m.day <= N)
    .filter(m => !(N >= 365 && m.day === 7)); // Skip 7d on 365d timeframe
  
  // Use MACRO path for markers (it's the main line now)
  const pathForMarkers = macroData.length > 0 ? macroData : hybridData;
  
  displayMarkers.forEach((marker, index) => {
    const dayIndex = Math.min(marker.day - 1, pathForMarkers.length - 1);
    const point = pathForMarkers[dayIndex];
    if (!point) return;
    
    const px = dayToX(marker.day);
    const py = y(point.price);
    
    // Circle marker (orange for macro - main line)
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Label - alternate up/down to avoid overlap
    const labelOffset = index % 2 === 0 ? -12 : 18;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(marker.horizon, px, py + labelOffset);
    ctx.restore();
  });
  
  // === 9. END MARKERS ===
  const endX = dayToX(N);
  
  // Macro end marker (main, largest) - ORANGE
  if (macroData.length > 0) {
    const lastMacro = macroData[macroData.length - 1];
    const lastMacroY = y(lastMacro.price);
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(endX, lastMacroY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(endX, lastMacroY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Hybrid end marker (secondary, smaller) - GREEN
  if (hybridData.length > 0) {
    const lastHybrid = hybridData[hybridData.length - 1];
    const lastHybridY = y(lastHybrid.price);
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.beginPath();
    ctx.arc(endX, lastHybridY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(endX, lastHybridY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // === 10. LEGEND (Macro first as main, Hybrid as hint) ===
  const legendX = xRightAnchor + 12;
  const legendY = marginTop + 20;
  
  ctx.save();
  
  // MACRO legend (main line) - shown first
  if (macroData.length > 0) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = "bold 11px system-ui";
    ctx.textAlign = 'left';
    ctx.fillText('Macro', legendX + 12, legendY + 4);
  }
  
  // HYBRID legend (secondary/hint)
  if (hybridData.length > 0) {
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.beginPath();
    ctx.arc(legendX, legendY + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.font = "10px system-ui";
    ctx.fillText('Hybrid', legendX + 12, legendY + 22);
  }
  
  ctx.restore();
  
  // === 11. FORECAST SUMMARY (based on Macro - main line) ===
  const dataForReturn = macroData.length > 0 ? macroData : hybridData;
  const startPrice = dataForReturn[0]?.price || anchorPrice;
  const endPrice = dataForReturn[dataForReturn.length - 1]?.price || startPrice;
  const expectedReturn = ((endPrice - startPrice) / startPrice) * 100;
  const sign = expectedReturn >= 0 ? '+' : '';
  
  ctx.save();
  ctx.font = "11px system-ui";
  ctx.textAlign = "left";
  
  const labelX = xRightAnchor + 10;
  const labelY = canvasHeight - marginBottom + 18;
  
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(`Forecast: ${sign}${expectedReturn.toFixed(1)}%`, labelX, labelY);
  ctx.restore();
}
