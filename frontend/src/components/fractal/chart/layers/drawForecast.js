/**
 * BLOCK 70.2 STEP 2 — Focus-Aware Forecast Renderer
 * 
 * UPDATED: Now uses dynamic markers from focusPack.forecast.markers
 * Instead of hardcoded 7d/14d/30d markers, shows markers appropriate 
 * for the current focus horizon.
 * 
 * Features:
 * - Dynamic forecast zone width based on aftermathDays
 * - Focus-specific markers (only shows days <= current focus)
 * - Confidence band that matches actual distribution series length
 */

import { formatPrice as formatPriceUtil } from '../../../../utils/priceFormatter';

export function drawForecast(
  ctx,
  forecast,
  xRightAnchor,
  y,
  plotW,
  marginTop,
  marginBottom,
  canvasHeight,
  symbol = 'BTC' // Asset symbol for price formatting
) {
  if (!forecast) return;

  const pricePath = forecast.pricePath;
  const upperBand = forecast.upperBand;
  const lowerBand = forecast.lowerBand;
  
  if (!pricePath?.length) return;

  const N = pricePath.length;
  
  // Forecast zone with right padding for 30d marker
  const rightPadding = 70;
  const forecastZoneWidth = Math.min(plotW * 0.55, 380) - rightPadding;
  
  // Day to X coordinate
  const dayToX = (day) => {
    const frac = day / N;
    return xRightAnchor + frac * forecastZoneWidth;
  };

  // === 1. FORECAST ZONE BACKGROUND ===
  ctx.save();
  
  // Light gray background
  const bgGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xRightAnchor + forecastZoneWidth + rightPadding, 0
  );
  bgGradient.addColorStop(0, "rgba(0,0,0,0.03)");
  bgGradient.addColorStop(1, "rgba(0,0,0,0.01)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(
    xRightAnchor,
    marginTop,
    forecastZoneWidth + rightPadding,
    canvasHeight - marginTop - marginBottom
  );
  ctx.restore();

  // === 2. FORECAST START SEPARATOR ===
  ctx.save();
  ctx.strokeStyle = "rgba(180, 0, 0, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, marginTop);
  ctx.lineTo(xRightAnchor, canvasHeight - marginBottom);
  ctx.stroke();
  ctx.restore();

  // === 3. NOW / FORECAST START LABEL ===
  ctx.save();
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("NOW", xRightAnchor, marginTop - 6);
  ctx.restore();

  // === 4. CONFIDENCE BAND (√t growth) with SPLINE ===
  if (upperBand?.length && lowerBand?.length) {
    // Build spline points for bands
    const upperPoints = [{ x: xRightAnchor, y: y(pricePath[0]) }];
    const lowerPoints = [{ x: xRightAnchor, y: y(pricePath[0]) }];
    
    for (let i = 0; i < upperBand.length; i++) {
      upperPoints.push({ x: dayToX(i + 1), y: y(upperBand[i]) });
      lowerPoints.push({ x: dayToX(i + 1), y: y(lowerBand[i]) });
    }
    
    ctx.save();
    ctx.beginPath();
    
    // Draw upper spline
    ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
    for (let i = 0; i < upperPoints.length - 1; i++) {
      const p0 = upperPoints[i - 1] || upperPoints[i];
      const p1 = upperPoints[i];
      const p2 = upperPoints[i + 1];
      const p3 = upperPoints[i + 2] || p2;
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    
    // Draw lower spline (backward)
    for (let i = lowerPoints.length - 1; i > 0; i--) {
      const p0 = lowerPoints[i + 1] || lowerPoints[i];
      const p1 = lowerPoints[i];
      const p2 = lowerPoints[i - 1];
      const p3 = lowerPoints[i - 2] || p2;
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    
    ctx.closePath();
    
    // Gradient fill — fades out towards end
    const bandGradient = ctx.createLinearGradient(
      xRightAnchor, 0,
      xRightAnchor + forecastZoneWidth, 0
    );
    bandGradient.addColorStop(0, "rgba(22, 163, 74, 0.18)");
    bandGradient.addColorStop(0.5, "rgba(22, 163, 74, 0.10)");
    bandGradient.addColorStop(1, "rgba(22, 163, 74, 0.04)");
    ctx.fillStyle = bandGradient;
    ctx.fill();
    ctx.restore();

    // Band edges (subtle spline)
    ctx.save();
    ctx.strokeStyle = "rgba(22, 163, 74, 0.20)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // Upper edge spline
    ctx.beginPath();
    ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
    for (let i = 0; i < upperPoints.length - 1; i++) {
      const p0 = upperPoints[i - 1] || upperPoints[i];
      const p1 = upperPoints[i];
      const p2 = upperPoints[i + 1];
      const p3 = upperPoints[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
    
    // Lower edge spline
    ctx.beginPath();
    ctx.moveTo(lowerPoints[0].x, lowerPoints[0].y);
    for (let i = 0; i < lowerPoints.length - 1; i++) {
      const p0 = lowerPoints[i - 1] || lowerPoints[i];
      const p1 = lowerPoints[i];
      const p2 = lowerPoints[i + 1];
      const p3 = lowerPoints[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // === 5. PRICE PATH WITH CATMULL-ROM SPLINE ===
  // Smooth curve instead of segmented polyline
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  
  // Build points array for spline
  const points = [];
  points.push({ x: xRightAnchor, y: y(pricePath[0]) });
  for (let i = 0; i < pricePath.length; i++) {
    points.push({ x: dayToX(i + 1), y: y(pricePath[i]) });
  }
  
  // Glow effect for premium look
  ctx.shadowColor = 'rgba(22, 163, 74, 0.25)';
  ctx.shadowBlur = 6;
  
  // Draw smooth spline
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  // Catmull-Rom to Bezier conversion
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    
    // Control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  
  // Gradient stroke with confidence decay
  const lineGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xRightAnchor + forecastZoneWidth, 0
  );
  lineGradient.addColorStop(0, "rgba(22, 163, 74, 1)");
  lineGradient.addColorStop(0.5, "rgba(22, 163, 74, 0.8)");
  lineGradient.addColorStop(1, "rgba(22, 163, 74, 0.6)");
  
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // === 6. TAIL RISK MARKER (Human-friendly label) ===
  // Shows "Worst-case (5%)" instead of cryptic "P95 Tail Risk"
  if (forecast.tailFloor && forecast.tailFloor > 0) {
    const tailY = y(forecast.tailFloor);
    const tailPrice = Math.round(forecast.tailFloor);
    // Use centralized formatter based on asset symbol
    const formattedPrice = formatPriceUtil(tailPrice, symbol, { compact: false });
    
    // Only draw if within visible range
    if (tailY > marginTop && tailY < canvasHeight - marginBottom) {
      ctx.save();
      
      // Dashed risk line
      ctx.strokeStyle = "rgba(200, 0, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(xRightAnchor, tailY);
      ctx.lineTo(dayToX(N), tailY);
      ctx.stroke();
      
      // Red dot at forecast start
      ctx.beginPath();
      ctx.arc(xRightAnchor, tailY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 0, 0, 0.85)";
      ctx.fill();
      
      // Human-readable label: "Worst-case (5%): $56,636" or "6,636 pts" for SPX
      ctx.fillStyle = "rgba(180, 0, 0, 0.9)";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("Worst-case (5%):", xRightAnchor + 10, tailY - 5);
      
      // Price value - prominent
      ctx.font = "bold 11px system-ui";
      ctx.fillStyle = "rgba(180, 0, 0, 0.95)";
      ctx.fillText(formattedPrice, xRightAnchor + 112, tailY - 5);
      
      ctx.restore();
    }
  }

  // === 7. KEY DAY MARKERS (dynamic based on horizon) ===
  // Show all intermediate markers appropriate for current focus
  const markers = forecast.markers || [];
  
  // Build complete marker set based on horizon
  const allPossibleMarkers = [
    { day: 7, horizon: '7d' },
    { day: 14, horizon: '14d' },
    { day: 30, horizon: '30d' },
    { day: 90, horizon: '90d' },
    { day: 180, horizon: '180d' },
    { day: 365, horizon: '365d' },
  ];
  
  // Filter markers that fit within current horizon and add prices
  // Skip 7d marker for 365d timeframe to avoid clutter
  const displayMarkers = markers.length > 0 ? markers : allPossibleMarkers
    .filter(m => m.day <= N)
    .filter(m => !(N >= 365 && m.day === 7)) // Skip 7d on 365d timeframe
    .map(m => ({
      ...m,
      price: pricePath[Math.min(m.day - 1, N - 1)]
    }));
  
  // Add final day marker if not already included
  const lastMarkerDay = displayMarkers.length > 0 ? displayMarkers[displayMarkers.length - 1].day : 0;
  if (lastMarkerDay < N) {
    displayMarkers.push({ 
      day: N, 
      horizon: `${N}d`, 
      price: pricePath[N - 1] 
    });
  }
  
  // Track label positions to avoid overlap
  const labelPositions = [];
  
  displayMarkers.forEach((marker, index) => {
    const day = marker.day || (marker.dayIndex + 1);
    const price = marker.price || pricePath[Math.min(day - 1, N - 1)];
    if (!price || day > N) return;
    
    const px = dayToX(day);
    const py = y(price);
    
    // Calculate alpha for confidence decay effect
    const progress = day / N;
    const markerAlpha = 1 - progress * 0.3;
    
    // Circle marker
    ctx.save();
    ctx.fillStyle = `rgba(22, 163, 74, ${markerAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // White inner circle
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Horizon label - alternate up/down to avoid overlap
    const label = marker.horizon || `${day}d`;
    
    // Check if label would overlap with previous labels
    let labelOffset = -12; // default: above
    const labelY = py + labelOffset;
    
    // Alternate labels up/down based on index to prevent overlap
    // Even index: above, Odd index: below
    if (index % 2 === 1) {
      labelOffset = 20; // below the marker
    }
    
    // For very close markers (7d, 14d), use more offset
    if (index > 0) {
      const prevMarker = displayMarkers[index - 1];
      const prevPx = dayToX(prevMarker.day);
      const distance = Math.abs(px - prevPx);
      
      // If markers are too close horizontally, stagger vertically more
      if (distance < 40) {
        labelOffset = index % 2 === 0 ? -18 : 24;
      }
    }
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 + markerAlpha * 0.2})`;
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, px, py + labelOffset);
    ctx.restore();
    
    labelPositions.push({ x: px, y: py + labelOffset });
  });

  // === 8. FORECAST INFO LABEL ===
  // BLOCK 70.2: Show info based on actual forecast data
  const finalPrice = pricePath[N - 1];
  const currentPrice = forecast.currentPrice || pricePath[0];
  const returnPct = currentPrice ? (((finalPrice - currentPrice) / currentPrice) * 100).toFixed(1) : '0.0';
  const confValue = forecast.confidenceDecay?.[0] || 1;
  const confPct = (confValue * 100).toFixed(1);
  const sign = parseFloat(returnPct) >= 0 ? "+" : "";
  const aftermathDays = forecast.aftermathDays || N;
  
  ctx.save();
  ctx.font = "11px system-ui";
  ctx.textAlign = "left";
  
  const labelX = xRightAnchor + 10;
  const labelY = canvasHeight - marginBottom + 18;
  
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(`Forecast: ${sign}${returnPct}%`, labelX, labelY);
  ctx.restore();
}
