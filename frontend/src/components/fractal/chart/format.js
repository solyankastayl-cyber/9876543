/**
 * FRACTAL RESEARCH TERMINAL — Formatting utilities
 */

export function fmtPrice(v) {
  if (!Number.isFinite(v)) return "-";
  if (v >= 10000) return v.toFixed(0);
  if (v >= 1000) return v.toFixed(1);
  if (v >= 100) return v.toFixed(2);
  if (v >= 1) return v.toFixed(3);
  return v.toFixed(6);
}

export function fmtDate(ts) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDateShort(ts) {
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtPercent(v, decimals = 1) {
  if (!Number.isFinite(v)) return "-";
  return `${(v * 100).toFixed(decimals)}%`;
}

export function fmtNumber(v) {
  if (!Number.isFinite(v)) return "-";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}
