import React, { useMemo, useRef, useEffect } from "react";

/**
 * BLOCK 53.2 — Overlay Canvas with Distribution Fan (Institutional Grade)
 * 
 * Features:
 * - Current window (solid black line)
 * - Historical match window + aftermath (dashed gray line)
 * - Distribution fan: P10-P90 (outer), P25-P75 (inner)
 * - P50 median line (dashed)
 * - NOW separator
 */

export function OverlayCanvas({ data, matchIndex, width = 980, height = 360, horizonDays = 30 }) {
  const ref = useRef(null);

  const payload = useMemo(() => {
    if (!data || !data.matches?.length) return null;
    const m = data.matches[Math.max(0, Math.min(matchIndex, data.matches.length - 1))];
    // FIXED: Use actual aftermath length from data or horizonDays prop
    const actualAftermathDays = m.aftermathNormalized?.length || horizonDays || 30;
    return {
      windowLen: data.windowLen || 60,
      aftermathDays: actualAftermathDays,
      cur: data.currentWindow?.normalized || [],
      match: m.windowNormalized || [],
      aft: m.aftermathNormalized || [],
      // New: distribution series for fan
      distributionSeries: data.distributionSeries ?? null,
      distributionMeta: data.distributionMeta ?? null,
      // Legacy single-value distribution
      dist: data.distribution ?? null
    };
  }, [data, matchIndex, horizonDays]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // hiDPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    if (!payload || !payload.cur.length) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.font = "12px system-ui";
      ctx.fillText("No overlay data", 14, 20);
      return;
    }

    const M = { l: 56, r: 18, t: 20, b: 32 };
    const plotW = width - M.l - M.r;
    const plotH = height - M.t - M.b;

    const totalLen = payload.windowLen + payload.aftermathDays;
    const xAt = (i) => M.l + (i / (totalLen - 1)) * plotW;

    // build full series for match = window + aftermath
    const matchFull = payload.match.concat(payload.aft);
    const curFull = payload.cur.concat(Array(payload.aftermathDays).fill(null));

    // y scale - include distribution series in calculation
    const values = [];
    for (const v of payload.cur) if (v != null) values.push(v);
    for (const v of matchFull) if (v != null) values.push(v);
    
    // Include distribution series values for proper Y scaling
    // FIXED: Only include distribution series if they are in returns format (not price)
    // Returns are typically -1 to +1, prices are > 50
    const ds = payload.distributionSeries;
    if (ds?.p10?.length && Math.abs(ds.p10[0]) < 5) {
      for (const v of ds.p10) if (v != null) values.push(v);
    }
    if (ds?.p90?.length && Math.abs(ds.p90[0]) < 5) {
      for (const v of ds.p90) if (v != null) values.push(v);
    }

    if (!values.length) values.push(100);

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const pad = (maxV - minV) * 0.1 || 5;

    const yAt = (v) => {
      const vv = Math.max(minV - pad, Math.min(maxV + pad, v));
      const t = (vv - (minV - pad)) / ((maxV + pad) - (minV - pad));
      return M.t + (1 - t) * plotH;
    };

    // Grid - for Replay we show returns as percentage
    drawGrid(ctx, width, height, M, minV - pad, maxV + pad, yAt, true);
    
    // X-axis with dates (fixed overlap)
    drawXAxisDates(ctx, width, height, M, payload.windowLen, payload.aftermathDays, xAt, horizonDays);

    // REMOVED: Distribution fan - only show single match line for clarity
    // Match window + aftermath (dashed, gray)
    drawLine(ctx, matchFull, xAt, yAt, {
      dash: [6, 4],
      stroke: "rgba(100,100,100,0.65)",
      width: 2
    });

    // Current window (solid, black)
    drawLine(ctx, payload.cur, xAt, yAt, {
      dash: [],
      stroke: "rgba(0,0,0,0.95)",
      width: 2.5
    });

    // Split marker (NOW)
    const splitX = xAt(payload.windowLen - 1);
    ctx.save();
    ctx.strokeStyle = "rgba(180,0,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, M.t);
    ctx.lineTo(splitX, height - M.b);
    ctx.stroke();
    ctx.restore();

    // "NOW" label
    ctx.save();
    ctx.fillStyle = "rgba(220,38,38,0.9)";
    ctx.font = "bold 11px system-ui";
    ctx.fillText("NOW", splitX - 14, M.t - 6);
    ctx.restore();
    
    // REMOVED: Y-axis label "Indexed (Start=100)" - unnecessary for users

    // Low sample warning if applicable
    if (payload.distributionMeta?.lowSampleWarning) {
      ctx.save();
      ctx.fillStyle = "rgba(234,179,8,0.9)";
      ctx.font = "10px system-ui";
      ctx.fillText("⚠ Low statistical depth", width - M.r - 120, M.t + 12);
      ctx.restore();
    }

    // REMOVED: Legend "— Current --- Match" - unnecessary clutter

  }, [payload, width, height, horizonDays]);

  return <canvas ref={ref} data-testid="overlay-canvas" />;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function drawGrid(ctx, W, H, M, minV, maxV, yAt, isReturns = false) {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;

  const rows = 5;
  for (let i = 0; i <= rows; i++) {
    const v = minV + (i / rows) * (maxV - minV);
    const y = yAt(v);
    ctx.beginPath();
    ctx.moveTo(M.l, y);
    ctx.lineTo(W - M.r, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.font = "11px system-ui";
    // Format as percentage if returns, otherwise as value
    const label = isReturns ? `${(v * 100).toFixed(1)}%` : v.toFixed(1);
    ctx.fillText(label, 8, y + 4);
  }
  ctx.restore();
}

/**
 * Draw X-axis with calendar dates
 * Shows dates for window + aftermath period
 */
function drawXAxisDates(ctx, W, H, M, windowLen, aftermathDays, xAt, horizonDays) {
  const totalLen = windowLen + aftermathDays;
  const now = Date.now();
  const ONE_DAY = 86400000;
  
  // Calculate start date (windowLen days before NOW)
  const startTs = now - (windowLen * ONE_DAY);
  
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  
  // Calculate tick interval based on total span
  let tickInterval;
  if (totalLen <= 30) {
    tickInterval = 7; // Weekly
  } else if (totalLen <= 90) {
    tickInterval = 14; // Bi-weekly
  } else {
    tickInterval = 30; // Monthly
  }
  
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  
  // NOW position
  const nowX = xAt(windowLen - 1);
  
  for (let i = 0; i < totalLen; i += tickInterval) {
    const x = xAt(i);
    const ts = startTs + (i * ONE_DAY);
    const date = new Date(ts);
    
    // Skip labels that would overlap with NOW marker (within 40px)
    if (Math.abs(x - nowX) < 40) continue;
    
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(x, H - M.b);
    ctx.lineTo(x, H - M.b + 4);
    ctx.stroke();
    
    // Date label
    const label = totalLen > 90 
      ? `${months[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`
      : `${date.getDate()} ${months[date.getMonth()]}`;
    
    ctx.fillText(label, x, H - M.b + 14);
  }
  
  // NOW marker date at windowLen-1 (always show, in red)
  const nowDate = new Date(now);
  ctx.fillStyle = "rgba(220,38,38,0.8)";
  ctx.font = "bold 10px system-ui";
  const nowLabel = `${nowDate.getDate()} ${months[nowDate.getMonth()]}`;
  ctx.fillText(nowLabel, nowX - 15, H - M.b + 14);
  
  ctx.restore();
}

function drawLine(ctx, series, xAt, yAt, style) {
  ctx.save();
  ctx.setLineDash(style.dash);
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.width;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v == null) continue;
    const x = xAt(i);
    const y = yAt(v);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  if (started) ctx.stroke();
  ctx.restore();
}

/**
 * Draw distribution fan using series data (P10-P90, P25-P75, P50 median)
 * Institutional-grade visualization
 */
function drawDistributionFan(ctx, payload, xAt, yAt, M, plotH) {
  const { windowLen, distributionSeries: ds, aftermathDays } = payload;
  
  if (!ds?.p10?.length || !ds?.p90?.length) return;
  
  const fanStartIdx = windowLen - 1;
  
  // Helper to get x coordinate for fan day
  const fanX = (dayIdx) => xAt(fanStartIdx + dayIdx + 1);
  
  // Get last valid values from current window for anchor point
  const anchorY = yAt(payload.cur[payload.cur.length - 1] || 100);
  const anchorX = xAt(fanStartIdx);
  
  // ═══════════════════════════════════════════════════════════
  // 1. OUTER FAN (P10 - P90) — lightest
  // ═══════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  
  // Start from anchor
  ctx.moveTo(anchorX, anchorY);
  
  // Upper boundary (P90) - forward
  for (let i = 0; i < ds.p90.length; i++) {
    const v = ds.p90[i];
    if (v == null) continue;
    ctx.lineTo(fanX(i), yAt(v));
  }
  
  // Lower boundary (P10) - backward
  for (let i = ds.p10.length - 1; i >= 0; i--) {
    const v = ds.p10[i];
    if (v == null) continue;
    ctx.lineTo(fanX(i), yAt(v));
  }
  
  // Close back to anchor
  ctx.lineTo(anchorX, anchorY);
  ctx.closePath();
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fill();
  ctx.restore();
  
  // ═══════════════════════════════════════════════════════════
  // 2. INNER FAN (P25 - P75) — slightly darker
  // ═══════════════════════════════════════════════════════════
  if (ds.p25?.length && ds.p75?.length) {
    ctx.save();
    ctx.beginPath();
    
    ctx.moveTo(anchorX, anchorY);
    
    // Upper boundary (P75) - forward
    for (let i = 0; i < ds.p75.length; i++) {
      const v = ds.p75[i];
      if (v == null) continue;
      ctx.lineTo(fanX(i), yAt(v));
    }
    
    // Lower boundary (P25) - backward
    for (let i = ds.p25.length - 1; i >= 0; i--) {
      const v = ds.p25[i];
      if (v == null) continue;
      ctx.lineTo(fanX(i), yAt(v));
    }
    
    ctx.lineTo(anchorX, anchorY);
    ctx.closePath();
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fill();
    ctx.restore();
  }
  
  // ═══════════════════════════════════════════════════════════
  // 3. MEDIAN LINE (P50) — dashed
  // ═══════════════════════════════════════════════════════════
  if (ds.p50?.length) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    
    ctx.moveTo(anchorX, anchorY);
    
    for (let i = 0; i < ds.p50.length; i++) {
      const v = ds.p50[i];
      if (v == null) continue;
      ctx.lineTo(fanX(i), yAt(v));
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  // ═══════════════════════════════════════════════════════════
  // 4. FAN EDGE MARKERS (subtle)
  // ═══════════════════════════════════════════════════════════
  // Draw subtle dashed lines for P10 and P90 edges
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  
  // P90 edge
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  for (let i = 0; i < ds.p90.length; i++) {
    const v = ds.p90[i];
    if (v == null) continue;
    ctx.lineTo(fanX(i), yAt(v));
  }
  ctx.stroke();
  
  // P10 edge
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  for (let i = 0; i < ds.p10.length; i++) {
    const v = ds.p10[i];
    if (v == null) continue;
    ctx.lineTo(fanX(i), yAt(v));
  }
  ctx.stroke();
  ctx.restore();
}
