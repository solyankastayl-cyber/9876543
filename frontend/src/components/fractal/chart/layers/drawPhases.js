import { PhaseZone, Phase } from "../types";

function phaseColor(phase: Phase): string {
  switch (phase) {
    case "MARKUP": return "rgba(34,197,94,0.06)";
    case "MARKDOWN": return "rgba(239,68,68,0.08)";
    case "ACCUMULATION": return "rgba(156,163,175,0.05)";
    case "DISTRIBUTION": return "rgba(251,146,60,0.06)";
    case "RECOVERY": return "rgba(59,130,246,0.05)";
    case "CAPITULATION": return "rgba(168,85,247,0.10)";
    default: return "rgba(0,0,0,0.03)";
  }
}

function findIndexByTime(ts: number[], t: number): number {
  let lo = 0, hi = ts.length - 1, ans = ts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] >= t) { ans = mid; hi = mid - 1; }
    else lo = mid + 1;
  }
  return ans;
}

export function drawPhases(
  ctx: CanvasRenderingContext2D,
  zones: PhaseZone[] | undefined,
  candleTs: number[],
  x: (i: number) => number,
  top: number,
  height: number,
  bottom: number
) {
  if (!zones?.length || candleTs.length < 2) return;

  const plotH = height - top - bottom;
  ctx.save();
  for (const z of zones) {
    const i0 = findIndexByTime(candleTs, z.from);
    const i1 = findIndexByTime(candleTs, z.to);
    const x0 = x(Math.max(0, Math.min(candleTs.length - 1, i0)));
    const x1 = x(Math.max(0, Math.min(candleTs.length - 1, i1)));

    ctx.fillStyle = phaseColor(z.phase);
    const w = Math.max(0, x1 - x0);
    ctx.fillRect(x0, top, w, plotH);
  }
  ctx.restore();
}
