/**
 * FRACTAL RESEARCH TERMINAL — Canvas Drawing Engine
 * Renders: candles, volume, grid, axes, crosshair, forecast overlay, fractal overlay
 */

import { DEFAULT_LAYOUT, DEFAULT_THEME } from "./types";
import { priceToY, clamp, denormalizePrice } from "./scales";
import { fmtDate, fmtPrice } from "./format";

/**
 * Main draw function — orchestrates all layers
 */
export function drawChart(
  ctx,
  candles,
  viewport,
  cross,
  width,
  height,
  options = {},
  layout = DEFAULT_LAYOUT,
  theme = DEFAULT_THEME
) {
  const plotW = width - layout.padL - layout.padR;
  const plotH = height - layout.padT - layout.padB - layout.volH;

  // Clear and fill background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  // Get visible candles
  const start = clamp(viewport.start, 0, Math.max(0, candles.length - 1));
  const end = clamp(viewport.end, start + 1, candles.length);
  const visible = candles.slice(start, end);
  const n = visible.length;

  if (n === 0) return;

  // Compute price range
  let minP = Infinity, maxP = -Infinity;
  let maxV = 0;
  for (const c of visible) {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
    if (typeof c.volume === "number" && c.volume > maxV) maxV = c.volume;
  }

  if (!Number.isFinite(minP) || !Number.isFinite(maxP)) return;

  // Add padding to price range
  const pricePad = (maxP - minP) * 0.06 || 1;
  minP -= pricePad;
  maxP += pricePad;

  // Draw layers in order
  drawGrid(ctx, layout, width, height, plotW, plotH, theme);
  
  // MA200
  if (options.showMA200 && candles.length >= 200) {
    drawMA200(ctx, candles, viewport, layout, minP, maxP, plotW, plotH);
  }

  drawCandles(ctx, visible, layout, minP, maxP, plotW, plotH, theme);

  // Fractal overlay
  if (options.fractal) {
    drawFractalOverlay(ctx, options.fractal, visible, candles, viewport, layout, minP, maxP, plotW, plotH, theme);
  }

  // Forecast overlay
  if (options.forecast) {
    drawForecastOverlay(ctx, options.forecast, visible, layout, minP, maxP, plotW, plotH, theme);
  }

  drawVolume(ctx, visible, layout, plotW, plotH, maxV, theme);
  drawRightAxis(ctx, layout, width, minP, maxP, plotH, theme);
  drawTimeAxis(ctx, layout, width, height, visible, plotW, theme);

  // Crosshair on top
  if (cross.active) {
    drawCrosshair(ctx, layout, width, height, visible, minP, maxP, plotW, plotH, cross, theme);
  }
}

function drawGrid(ctx, l, width, height, plotW, plotH, theme) {
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;

  const hLines = 5;
  for (let i = 0; i <= hLines; i++) {
    const y = l.padT + (i * plotH) / hLines;
    ctx.beginPath();
    ctx.moveTo(l.padL, y);
    ctx.lineTo(l.padL + plotW, y);
    ctx.stroke();
  }

  const vLines = 6;
  for (let i = 0; i <= vLines; i++) {
    const x = l.padL + (i * plotW) / vLines;
    ctx.beginPath();
    ctx.moveTo(x, l.padT);
    ctx.lineTo(x, l.padT + plotH + l.volH);
    ctx.stroke();
  }
}

function drawCandles(ctx, visible, l, minP, maxP, plotW, plotH, theme) {
  const n = visible.length;
  const cw = plotW / n;
  const bodyW = Math.max(1, Math.floor(cw * 0.7));

  for (let i = 0; i < n; i++) {
    const c = visible[i];
    const xCenter = l.padL + i * cw + cw / 2;

    const yO = priceToY(c.open, minP, maxP, l.padT, plotH);
    const yC = priceToY(c.close, minP, maxP, l.padT, plotH);
    const yH = priceToY(c.high, minP, maxP, l.padT, plotH);
    const yL = priceToY(c.low, minP, maxP, l.padT, plotH);

    const bull = c.close >= c.open;
    ctx.strokeStyle = bull ? theme.bull : theme.bear;
    ctx.fillStyle = bull ? theme.bull : theme.bear;

    ctx.beginPath();
    ctx.moveTo(xCenter, yH);
    ctx.lineTo(xCenter, yL);
    ctx.stroke();

    const top = Math.min(yO, yC);
    const h = Math.max(1, Math.abs(yO - yC));
    const x = Math.floor(xCenter - bodyW / 2);
    ctx.fillRect(x, Math.floor(top), bodyW, Math.floor(h));
  }
}

function drawVolume(ctx, visible, l, plotW, plotH, maxV, theme) {
  const n = visible.length;
  const cw = plotW / n;
  const baseY = l.padT + plotH + l.volH;

  ctx.globalAlpha = 0.25;
  for (let i = 0; i < n; i++) {
    const c = visible[i];
    const v = typeof c.volume === "number" ? c.volume : 0;
    const h = maxV > 0 ? (v / maxV) * (l.volH - 6) : 0;

    const bull = c.close >= c.open;
    ctx.fillStyle = bull ? theme.bull : theme.bear;

    const x = l.padL + i * cw + 1;
    ctx.fillRect(x, baseY - h, Math.max(1, cw - 2), h);
  }
  ctx.globalAlpha = 1;
}

function drawMA200(ctx, candles, viewport, l, minP, maxP, plotW, plotH) {
  const period = 200;
  const start = Math.max(0, viewport.start);
  const end = Math.min(candles.length, viewport.end);
  
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  let started = false;
  const n = end - start;
  const cw = plotW / n;

  for (let i = start; i < end; i++) {
    if (i < period - 1) continue;

    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const ma = sum / period;

    const localIndex = i - start;
    const x = l.padL + localIndex * cw + cw / 2;
    const y = priceToY(ma, minP, maxP, l.padT, plotH);

    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function drawRightAxis(ctx, l, width, minP, maxP, plotH, theme) {
  ctx.fillStyle = theme.axis;
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const lines = 5;
  for (let i = 0; i <= lines; i++) {
    const y = l.padT + (i * plotH) / lines;
    const p = maxP - (i * (maxP - minP)) / lines;
    ctx.fillText(fmtPrice(p), width - l.padR + 8, y);
  }
}

function drawTimeAxis(ctx, l, width, height, visible, plotW, theme) {
  ctx.fillStyle = theme.axis;
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const n = visible.length;
  const ticks = 6;
  for (let i = 0; i <= ticks; i++) {
    const idx = Math.min(n - 1, Math.round((i * (n - 1)) / ticks));
    const x = l.padL + (idx + 0.5) * (plotW / n);
    const y = height - l.padB + 2;
    ctx.fillText(fmtDate(visible[idx].time), x, y);
  }
}

function drawCrosshair(ctx, l, width, height, visible, minP, maxP, plotW, plotH, cross, theme) {
  const n = visible.length;
  const cw = plotW / n;
  const i = clamp(cross.index, 0, n - 1);

  const x = l.padL + i * cw + cw / 2;
  const y = clamp(cross.y, l.padT, l.padT + plotH);

  ctx.strokeStyle = "#9ca3af";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, l.padT);
  ctx.lineTo(x, l.padT + plotH + l.volH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(l.padL, y);
  ctx.lineTo(l.padL + plotW, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tooltip
  const c = visible[i];
  const tooltipW = 190;
  const tooltipH = 66;
  const tx = width - l.padR + 6;
  const ty = l.padT + 8;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  roundRect(ctx, tx, ty, tooltipW, tooltipH, 8, true, true);

  ctx.fillStyle = theme.text;
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const line1 = `${fmtDate(c.time)}  O:${fmtPrice(c.open)} H:${fmtPrice(c.high)}`;
  const line2 = `L:${fmtPrice(c.low)}  C:${fmtPrice(c.close)}`;
  const v = typeof c.volume === "number" ? c.volume : 0;
  const line3 = `V:${v ? Math.round(v).toLocaleString("en-US") : "-"}`;

  ctx.fillText(line1, tx + 10, ty + 10);
  ctx.fillText(line2, tx + 10, ty + 28);
  ctx.fillText(line3, tx + 10, ty + 46);

  // Price label
  const priceAtY = maxP - ((y - l.padT) / plotH) * (maxP - minP);
  const label = fmtPrice(priceAtY);

  const lw = 58;
  const lh = 18;
  const lx = width - l.padR + 6;
  const ly = y - lh / 2;

  ctx.fillStyle = "#111827";
  roundRect(ctx, lx, ly, lw, lh, 6, true, false);
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, lx + lw / 2, ly + lh / 2);
}

function drawForecastOverlay(ctx, overlay, visible, l, minP, maxP, plotW, plotH, theme) {
  if (!overlay.points?.length || visible.length < 2) return;

  const n = visible.length;
  const cw = plotW / n;
  const now = visible[n - 1];
  const nowTime = now.time;
  const nowPrice = now.close;

  const pts = overlay.points
    .slice()
    .sort((a, b) => a.tDays - b.tDays)
    .map((p) => ({
      tDays: p.tDays,
      t: nowTime + p.tDays * 24 * 60 * 60 * 1000,
      price: p.tDays === 0 ? nowPrice : p.price,
      low: p.low,
      high: p.high,
      conf: p.conf,
    }));

  const x0 = l.padL + (n - 1) * cw + cw / 2;
  const pxPerDay = Math.max(2.4, (cw * 6) / 7);
  const xAt = (tDays) => x0 + tDays * pxPerDay;

  const stroke = overlay.color ?? theme.forecast;
  const bandFill = theme.forecastBand;

  // Band
  if (overlay.showBand !== false) {
    const bandPts = pts.filter((p) => Number.isFinite(p.low) && Number.isFinite(p.high));
    if (bandPts.length >= 2) {
      ctx.beginPath();
      for (let i = 0; i < bandPts.length; i++) {
        const p = bandPts[i];
        const px = xAt(p.tDays);
        const py = priceToY(p.high, minP, maxP, l.padT, plotH);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = bandPts.length - 1; i >= 0; i--) {
        const p = bandPts[i];
        const px = xAt(p.tDays);
        const py = priceToY(p.low, minP, maxP, l.padT, plotH);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = bandFill;
      ctx.fill();
    }
  }

  // Line
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const px = xAt(p.tDays);
    const py = priceToY(p.price, minP, maxP, l.padT, plotH);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Markers
  for (const p of pts) {
    const px = xAt(p.tDays);
    const py = priceToY(p.price, minP, maxP, l.padT, plotH);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#6b7280";
    ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(p.tDays === 0 ? "now" : `${p.tDays}d`, px, py + 8);
  }

  // Now line
  ctx.strokeStyle = "rgba(107,114,128,0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, l.padT);
  ctx.lineTo(x0, l.padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Legend
  const lbl = overlay.label ?? `Forecast (${overlay.horizon})`;
  const lx = l.padL + 10;
  const ly = l.padT + 10;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  roundRect(ctx, lx, ly, 168, 26, 8, true, true);

  ctx.fillStyle = stroke;
  ctx.fillRect(lx + 10, ly + 12, 22, 2);

  ctx.fillStyle = "#111827";
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(lbl, lx + 40, ly + 13);
}

function drawFractalOverlay(ctx, overlay, visible, allCandles, viewport, l, minP, maxP, plotW, plotH, theme) {
  if (!overlay.matches?.length) return;

  const n = visible.length;
  const cw = plotW / n;
  const { currentWindow, matches, activeMatchIndex } = overlay;
  const match = matches[activeMatchIndex];

  if (!match || !currentWindow) return;

  // Current window highlight
  const windowStartLocal = currentWindow.startIndex - viewport.start;
  const windowEndLocal = currentWindow.endIndex - viewport.start;

  if (windowStartLocal >= 0 && windowEndLocal <= n) {
    const wx1 = l.padL + windowStartLocal * cw;
    const wx2 = l.padL + windowEndLocal * cw;

    ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
    ctx.fillRect(wx1, l.padT, wx2 - wx1, plotH);

    ctx.strokeStyle = theme.fractalCurrent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(wx1, l.padT, wx2 - wx1, plotH);
    ctx.setLineDash([]);
  }

  const windowStartCandle = allCandles[currentWindow.startIndex];
  if (!windowStartCandle) return;
  const basePrice = windowStartCandle.close;

  // Historical match
  if (match.normalizedPattern?.length > 0) {
    const patternLen = match.normalizedPattern.length;

    ctx.strokeStyle = theme.fractalMatch;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();

    for (let i = 0; i < patternLen; i++) {
      const normalizedVal = match.normalizedPattern[i];
      const price = denormalizePrice(normalizedVal, basePrice);
      const x = l.padL + (windowStartLocal + i) * cw + cw / 2;
      const y = priceToY(price, minP, maxP, l.padT, plotH);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Continuation
  if (match.normalizedContinuation?.length > 0) {
    const contLen = match.normalizedContinuation.length;
    const lastWindowX = l.padL + windowEndLocal * cw;

    const lastPatternVal = match.normalizedPattern?.[match.normalizedPattern.length - 1] ?? 100;
    const lastPrice = denormalizePrice(lastPatternVal, basePrice);

    ctx.strokeStyle = theme.fractalContinuation;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();

    const startY = priceToY(lastPrice, minP, maxP, l.padT, plotH);
    ctx.moveTo(lastWindowX, startY);

    for (let i = 0; i < contLen; i++) {
      const normalizedVal = match.normalizedContinuation[i];
      const price = denormalizePrice(normalizedVal, basePrice);
      const x = lastWindowX + (i + 1) * cw;
      const y = priceToY(price, minP, maxP, l.padT, plotH);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Match info badge
  const badgeX = l.padL + 10;
  const badgeY = l.padT + 42;
  const badgeW = 200;
  const badgeH = 50;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = theme.fractalMatch;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8, true, true);

  ctx.fillStyle = "#111827";
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText(`Match: ${match.startDate}`, badgeX + 10, badgeY + 8);
  ctx.fillText(`Similarity: ${(match.similarity * 100).toFixed(1)}% | ${match.phase}`, badgeX + 10, badgeY + 24);
  ctx.fillStyle = "#6b7280";
  ctx.fillText(`PSS: ${match.stability.toFixed(2)} | Weight: ${(match.weight * 100).toFixed(0)}%`, badgeX + 10, badgeY + 38);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
