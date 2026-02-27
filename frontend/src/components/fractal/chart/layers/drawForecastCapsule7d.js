/**
 * BLOCK 72 — 7D Probability Capsule Renderer
 * 
 * For 7D horizon, we don't draw trajectory (2 points = line = ugly).
 * Instead, we render a PROBABILITY DISTRIBUTION CAPSULE:
 * - P10-P90 (outer band - full range)
 * - P25-P75 (inner band - working zone)
 * - P50 (median marker)
 * 
 * This is how institutional desks show short-term probabilistic outcomes.
 */

export function drawForecastCapsule7d(
  ctx,
  distribution, // { p10, p25, p50, p75, p90 } - returns at day 7
  currentPrice,
  xRightAnchor,
  y,
  plotW,
  marginTop,
  marginBottom,
  canvasHeight
) {
  if (!distribution) return;
  
  const { p10, p25, p50, p75, p90 } = distribution;
  
  // Convert returns to prices
  const priceP10 = currentPrice * (1 + p10);
  const priceP25 = currentPrice * (1 + p25);
  const priceP50 = currentPrice * (1 + p50);
  const priceP75 = currentPrice * (1 + p75);
  const priceP90 = currentPrice * (1 + p90);
  
  // X position for day 7 (7 days from NOW)
  const forecastZoneWidth = Math.min(plotW * 0.55, 380) - 70;
  const xDay7 = xRightAnchor + forecastZoneWidth;
  
  // Determine bias based on p50
  const bias = p50 > 0.005 ? 'BULLISH' : p50 < -0.005 ? 'BEARISH' : 'NEUTRAL';
  const biasColor = bias === 'BULLISH' ? '#22c55e' : bias === 'BEARISH' ? '#ef4444' : '#6b7280';
  
  // Y coordinates
  const yP10 = y(priceP10);
  const yP25 = y(priceP25);
  const yP50 = y(priceP50);
  const yP75 = y(priceP75);
  const yP90 = y(priceP90);
  const yNow = y(currentPrice);
  
  // === 1. FORECAST ZONE BACKGROUND ===
  ctx.save();
  const bgGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xDay7 + 50, 0
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
  
  // === 4. CONNECTING LINES (current price to capsule) ===
  ctx.save();
  ctx.strokeStyle = `${biasColor}33`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  
  // Line to P75
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, yNow);
  ctx.lineTo(xDay7, yP75);
  ctx.stroke();
  
  // Line to P25
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, yNow);
  ctx.lineTo(xDay7, yP25);
  ctx.stroke();
  
  // Line to P50 (main)
  ctx.strokeStyle = `${biasColor}66`;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, yNow);
  ctx.lineTo(xDay7, yP50);
  ctx.stroke();
  
  ctx.restore();
  
  // === 5. CAPSULE WIDTH ===
  const capsuleWidth = 24;
  const capsuleX = xDay7 - capsuleWidth / 2;
  
  // === 6. P10-P90 OUTER BAND (lighter) ===
  ctx.save();
  ctx.fillStyle = `${biasColor}15`;
  ctx.strokeStyle = `${biasColor}30`;
  ctx.lineWidth = 1;
  
  // Rounded rectangle for outer band
  const outerRadius = 4;
  roundedRect(ctx, capsuleX - 4, yP90, capsuleWidth + 8, yP10 - yP90, outerRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // === 7. P25-P75 INNER BAND (darker) ===
  ctx.save();
  ctx.fillStyle = `${biasColor}35`;
  ctx.strokeStyle = `${biasColor}60`;
  ctx.lineWidth = 1.5;
  
  const innerRadius = 3;
  roundedRect(ctx, capsuleX, yP75, capsuleWidth, yP25 - yP75, innerRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // === 8. P50 MEDIAN LINE ===
  ctx.save();
  ctx.strokeStyle = biasColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(capsuleX - 6, yP50);
  ctx.lineTo(capsuleX + capsuleWidth + 6, yP50);
  ctx.stroke();
  
  // P50 dot
  ctx.fillStyle = biasColor;
  ctx.beginPath();
  ctx.arc(xDay7, yP50, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // White center
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(xDay7, yP50, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // === 9. LABELS ===
  ctx.save();
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "left";
  
  const labelX = capsuleX + capsuleWidth + 12;
  
  // 7D label
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText("7D", labelX, yP50 - 25);
  
  // P50 value
  ctx.font = "bold 11px system-ui";
  ctx.fillStyle = biasColor;
  const p50Pct = (p50 * 100).toFixed(1);
  const p50Sign = p50 >= 0 ? '+' : '';
  ctx.fillText(`${p50Sign}${p50Pct}%`, labelX, yP50 + 4);
  
  // Range
  ctx.font = "10px system-ui";
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  const p10Pct = (p10 * 100).toFixed(1);
  const p90Pct = (p90 * 100).toFixed(1);
  ctx.fillText(`${p10Pct}% → ${p90Pct}%`, labelX, yP50 + 18);
  
  ctx.restore();
  
  // === 10. BIAS BADGE (on chart) ===
  ctx.save();
  ctx.font = "bold 9px system-ui";
  ctx.textAlign = "center";
  
  // Background pill
  const badgeWidth = 55;
  const badgeHeight = 16;
  const badgeX = xDay7 - badgeWidth / 2;
  const badgeY = yP90 - 24;
  
  ctx.fillStyle = `${biasColor}20`;
  ctx.strokeStyle = biasColor;
  ctx.lineWidth = 1;
  roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8);
  ctx.fill();
  ctx.stroke();
  
  // Badge text
  ctx.fillStyle = biasColor;
  ctx.fillText(bias, xDay7, badgeY + 11);
  ctx.restore();
  
  // === 11. TAIL FLOOR (P95 risk) ===
  // We use P10 as proxy for tail (or could be computed separately)
  const tailPrice = priceP10;
  const tailY = y(tailPrice);
  
  if (tailY > marginTop && tailY < canvasHeight - marginBottom) {
    ctx.save();
    ctx.strokeStyle = "rgba(200, 0, 0, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xRightAnchor, tailY);
    ctx.lineTo(xDay7 + 30, tailY);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = "rgba(200, 0, 0, 0.7)";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("P10 Floor", xRightAnchor + 8, tailY - 4);
    ctx.restore();
  }
}

// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
