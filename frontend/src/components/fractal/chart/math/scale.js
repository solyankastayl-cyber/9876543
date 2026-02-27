/**
 * Chart scales - index-based and timestamp-based
 * @typedef {(v: number) => number} Scale
 */

/**
 * Create index-based X scale (legacy)
 * @param {number} n - Number of points
 * @param {number} left - Left margin
 * @param {number} right - Right margin
 * @param {number} width - Canvas width
 */
export function makeIndexXScale(n, left, right, width) {
  const plotW = Math.max(1, width - left - right);
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const x = (i) => left + i * step;
  return { x, step, plotW };
}

/**
 * Create Y scale
 * @param {number} minY
 * @param {number} maxY
 * @param {number} top
 * @param {number} bottom
 * @param {number} height
 * @returns {{ y: Scale, minY: number, maxY: number }}
 */
export function makeYScale(minY, maxY, top, bottom, height) {
  const plotH = Math.max(1, height - top - bottom);
  const span = Math.max(1e-9, maxY - minY);
  const y = (price) => top + ((maxY - price) / span) * plotH;
  return { y, minY, maxY };
}

/**
 * Add padding to Y range
 * @param {number} minY
 * @param {number} maxY
 * @param {number} padPct
 */
export function paddedMinMax(minY, maxY, padPct = 0.08) {
  const span = Math.max(1e-9, maxY - minY);
  const pad = span * padPct;
  return { minY: minY - pad, maxY: maxY + pad };
}

/**
 * A2 — Timestamp-based X scale
 * Maps timestamp (ms) to pixel position
 * @param {number} domainMin - Start timestamp (ms)
 * @param {number} domainMax - End timestamp (ms)
 * @param {number} rangeMin - Left pixel position
 * @param {number} rangeMax - Right pixel position
 * @returns {Function} Scale function with domain/range properties
 */
export function createTimeScale(domainMin, domainMax, rangeMin, rangeMax) {
  const domainSpan = Math.max(1, domainMax - domainMin);
  const rangeSpan = rangeMax - rangeMin;
  
  const scale = (ts) => {
    return rangeMin + ((ts - domainMin) / domainSpan) * rangeSpan;
  };
  
  // Expose domain for tick generation
  scale.domain = [domainMin, domainMax];
  scale.range = [rangeMin, rangeMax];
  
  return scale;
}

/**
 * A5 — Generate adaptive time ticks based on horizon
 * FIXED: Increased spacing to prevent label overlap
 * @param {number} domainMin - Start timestamp (ms)
 * @param {number} domainMax - End timestamp (ms)  
 * @param {number} horizonDays - Horizon in days (7, 14, 30, 90, 180, 365)
 * @param {number} chartWidth - Available width for ticks (pixels)
 * @returns {number[]} Array of tick timestamps
 */
export function generateTimeTicks(domainMin, domainMax, horizonDays, chartWidth = 800) {
  const ticks = [];
  const ONE_DAY = 86400000;
  const domainSpan = domainMax - domainMin;
  const totalDays = domainSpan / ONE_DAY;
  
  // Calculate optimal tick count based on width (min 60px between labels)
  const maxTicks = Math.floor(chartWidth / 80);
  
  let step;
  
  // For short horizons with small history, use day ticks
  if (totalDays <= 14) {
    step = ONE_DAY * 2; // Every 2 days
  } else if (totalDays <= 45) {
    step = ONE_DAY * 7; // Weekly
  } else if (totalDays <= 120) {
    step = ONE_DAY * 14; // Bi-weekly
  } else if (totalDays <= 200) {
    step = ONE_DAY * 30; // Monthly
  } else {
    // For large ranges (365d history + forecast), use ~2 month intervals
    step = ONE_DAY * Math.ceil(totalDays / maxTicks);
  }
  
  // Start from first tick aligned to step
  let t = Math.ceil(domainMin / step) * step;
  
  while (t <= domainMax) {
    ticks.push(t);
    t += step;
  }
  
  return ticks;
  
  return ticks;
}

/**
 * Format tick label based on total domain span (not just horizon)
 * @param {Date} date 
 * @param {number} horizonDays - forecast horizon
 * @param {number} totalDays - total domain span in days (optional)
 * @returns {string}
 */
export function formatTickLabel(date, horizonDays, totalDays = null) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const shortMonth = months[date.getMonth()];
  const year = `'${String(date.getFullYear()).slice(2)}`;
  
  // For very short spans (< 30 days), show day + month
  if (totalDays && totalDays <= 30) {
    return `${date.getDate()} ${shortMonth}`;
  }
  
  // For medium spans or horizons, show month + day
  if (totalDays && totalDays <= 90) {
    return `${shortMonth} ${date.getDate()}`;
  }
  
  // For long spans (180D+), show month + year (like "Mar '25")
  return `${shortMonth} ${year}`;
}
