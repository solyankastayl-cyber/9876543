/**
 * A6 — Index-based X-axis renderer
 * Draws adaptive time ticks aligned with candles positions
 * FIXED: Uses candles array and x(i) scale to match candle positions
 */

import { formatTickLabel } from "../math/scale";

/**
 * Draw time axis with ticks at candle positions
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} candles - Array of candles with t (timestamp)
 * @param {Function} x - Index to pixel scale x(i)
 * @param {number} horizonDays - Current horizon (7, 14, 30, 90, 180, 365)
 * @param {number} bottomY - Y position for axis
 * @param {number} chartWidth - Available chart width
 */
export function drawTimeAxis(ctx, candles, x, horizonDays, bottomY, chartWidth) {
  if (!candles?.length) return;
  
  const n = candles.length;
  const ONE_DAY = 86400000;
  
  // Calculate optimal number of ticks based on width (min 70px between labels)
  const maxTicks = Math.max(3, Math.floor(chartWidth / 80));
  
  // Calculate tick step (how many candles to skip between ticks)
  const tickStep = Math.max(1, Math.ceil(n / maxTicks));
  
  // Calculate total time span in days
  const domainMin = candles[0].t;
  const domainMax = candles[n - 1].t;
  const totalDays = (domainMax - domainMin) / ONE_DAY;
  
  ctx.save();
  
  // Draw tick marks and labels
  ctx.fillStyle = "#666";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  
  // Calculate NOW position (last candle)
  const nowX = x(n - 1);
  
  for (let i = 0; i < n; i += tickStep) {
    const candle = candles[i];
    const xPos = x(i);
    
    // Skip if too close to NOW label (within 50px)
    if (Math.abs(xPos - nowX) < 50) continue;
    
    // Tick line
    ctx.beginPath();
    ctx.moveTo(xPos, bottomY);
    ctx.lineTo(xPos, bottomY + 5);
    ctx.stroke();
    
    // Label
    const date = new Date(candle.t);
    const label = formatTickLabel(date, horizonDays, totalDays);
    ctx.fillText(label, xPos, bottomY + 16);
  }
  
  ctx.restore();
}

/**
 * Draw vertical separator line at NOW position
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} nowX - X position of NOW
 * @param {number} topY - Top of chart area
 * @param {number} bottomY - Bottom of chart area
 */
export function drawNowSeparator(ctx, nowX, topY, bottomY) {
  ctx.save();
  ctx.strokeStyle = "rgba(180, 0, 0, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(nowX, topY);
  ctx.lineTo(nowX, bottomY);
  ctx.stroke();
  ctx.restore();
  
  // NOW label at top
  ctx.save();
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("NOW", nowX, topY - 6);
  ctx.restore();
}
