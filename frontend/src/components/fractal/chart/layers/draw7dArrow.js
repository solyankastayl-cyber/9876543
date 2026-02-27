/**
 * BLOCK 72.3 — 7D Compact Arrow + Insight Block
 * 
 * - Small diagonal arrow from NOW
 * - 7D Insight Block filling the empty space
 * - Subtle glow effect
 * - Integrated into chart context
 */

export function draw7dArrow(
  ctx,
  distribution,
  currentPrice,
  xRightAnchor,
  y,
  marginTop,
  marginBottom,
  canvasHeight,
  stats = {}
) {
  if (!distribution) return;
  
  const { p50, p10, p90 } = distribution;
  
  // Determine direction
  const direction = p50 > 0.005 ? 'BULLISH' : p50 < -0.005 ? 'BEARISH' : 'NEUTRAL';
  
  // Colors
  const colors = {
    BULLISH: '#22c55e',
    BEARISH: '#ef4444',
    NEUTRAL: '#9ca3af'
  };
  const color = colors[direction];
  
  // Stats
  const sampleSize = stats.sampleSize || 15;
  const hitRate = stats.hitRate || 0.6;
  const dispersion = Math.abs((p90 || 0.15) - (p10 || -0.15));
  const dispersionPenalty = Math.min(dispersion / Math.max(Math.abs(p50), 0.01), 1) * 0.3;
  const confidence = Math.min(100, Math.max(0, (hitRate * 100) * (1 - dispersionPenalty) * (sampleSize >= 10 ? 1 : 0.8)));
  
  let timing = 'WAIT';
  if (direction === 'BULLISH' && confidence > 50) timing = 'ENTER';
  else if (direction === 'BEARISH' && confidence > 50) timing = 'EXIT';
  
  // === 1. FORECAST ZONE BACKGROUND ===
  ctx.save();
  const zoneWidth = 180;
  const bgGradient = ctx.createLinearGradient(
    xRightAnchor, 0,
    xRightAnchor + zoneWidth, 0
  );
  bgGradient.addColorStop(0, "rgba(0,0,0,0.025)");
  bgGradient.addColorStop(1, "rgba(0,0,0,0.005)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(
    xRightAnchor,
    marginTop,
    zoneWidth,
    canvasHeight - marginTop - marginBottom
  );
  ctx.restore();
  
  // === 2. NOW SEPARATOR ===
  ctx.save();
  ctx.strokeStyle = "rgba(200, 50, 50, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xRightAnchor, marginTop);
  ctx.lineTo(xRightAnchor, canvasHeight - marginBottom);
  ctx.stroke();
  ctx.restore();
  
  // === 3. NOW LABEL ===
  ctx.save();
  ctx.fillStyle = "rgba(200, 50, 50, 0.7)";
  ctx.font = "bold 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("NOW", xRightAnchor, marginTop - 4);
  ctx.restore();
  
  // === 4. ARROW CALCULATION ===
  const nowX = xRightAnchor;
  const nowY = y(currentPrice);
  
  // Arrow parameters - slightly longer with glow
  const maxLength = 55;
  const baseLength = 35;
  const forecastPct = Math.abs(p50 * 100);
  const scaledLength = Math.min(maxLength, baseLength + forecastPct * 1.5);
  
  // Angle: ±30° for bullish/bearish
  let angle;
  if (direction === 'BULLISH') {
    angle = -Math.PI / 6;
  } else if (direction === 'BEARISH') {
    angle = Math.PI / 6;
  } else {
    angle = 0;
  }
  
  const endX = nowX + scaledLength * Math.cos(angle);
  const endY = nowY + scaledLength * Math.sin(angle);
  
  // === 5. DRAW ARROW WITH GLOW ===
  ctx.save();
  
  // Glow effect
  ctx.shadowColor = `${color}40`;
  ctx.shadowBlur = 8;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(nowX, nowY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
  
  // === 6. DRAW ARROW HEAD ===
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = `${color}30`;
  ctx.shadowBlur = 4;
  
  const headSize = 9;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 7),
    endY - headSize * Math.sin(angle - Math.PI / 7)
  );
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 7),
    endY - headSize * Math.sin(angle + Math.PI / 7)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  // === 7. 7D INSIGHT BLOCK (fills empty space) ===
  const blockX = xRightAnchor + 12;
  const blockY = marginTop + 20;
  
  ctx.save();
  
  // Header: "7D OUTLOOK"
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.textAlign = "left";
  ctx.fillText("7D OUTLOOK", blockX, blockY);
  
  // Big arrow + percentage
  ctx.font = "bold 20px system-ui";
  ctx.fillStyle = color;
  const arrowSymbol = direction === 'BULLISH' ? '▲' : direction === 'BEARISH' ? '▼' : '►';
  const sign = p50 >= 0 ? '+' : '';
  ctx.fillText(`${arrowSymbol} ${sign}${(p50 * 100).toFixed(1)}%`, blockX, blockY + 24);
  
  // Stats section
  ctx.font = "11px system-ui";
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  
  const statsY = blockY + 46;
  const lineHeight = 16;
  
  ctx.fillText(`Confidence: ${confidence.toFixed(0)}%`, blockX, statsY);
  ctx.fillText(`Hit rate: ${(hitRate * 100).toFixed(0)}%`, blockX, statsY + lineHeight);
  ctx.fillText(`Matches: ${sampleSize}`, blockX, statsY + lineHeight * 2);
  
  // Timing badge
  const timingY = statsY + lineHeight * 3 + 4;
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = timing === 'ENTER' ? '#22c55e' : timing === 'EXIT' ? '#ef4444' : '#f59e0b';
  ctx.fillText(`Timing: ${timing}`, blockX, timingY);
  
  ctx.restore();
  
  // === 8. Small label near arrow ===
  ctx.save();
  ctx.font = "bold 11px system-ui";
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  
  const labelX = endX + 8;
  const labelY = direction === 'BULLISH' ? endY - 2 : 
                 direction === 'BEARISH' ? endY + 14 : 
                 endY + 4;
  
  ctx.fillText(`${sign}${(p50 * 100).toFixed(1)}%`, labelX, labelY);
  ctx.font = "9px system-ui";
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillText("7D", labelX, labelY + 11);
  ctx.restore();
}
