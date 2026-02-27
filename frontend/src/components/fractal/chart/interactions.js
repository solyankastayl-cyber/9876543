/**
 * FRACTAL RESEARCH TERMINAL — Interaction handlers
 */

import { clamp } from "./scales";

export function zoomViewport(v, total, anchorIndex, zoomFactor, minWindow, maxWindow) {
  const cur = v.end - v.start;
  const nextWin = clamp(Math.round(cur * zoomFactor), minWindow, maxWindow);

  const a = clamp(anchorIndex, 0, total - 1);

  const leftFrac = (a - v.start) / Math.max(1, cur);
  const nextStart = Math.round(a - leftFrac * nextWin);
  const start = clamp(nextStart, 0, Math.max(0, total - nextWin));
  
  return { 
    start, 
    end: clamp(start + nextWin, 0, total) 
  };
}

export function panViewport(v, total, deltaBars) {
  const win = v.end - v.start;
  const start = clamp(v.start + deltaBars, 0, Math.max(0, total - win));
  return { start, end: start + win };
}

export function resetViewport(total, defaultWindow = 220) {
  const end = total;
  const start = Math.max(0, end - defaultWindow);
  return { start, end };
}
