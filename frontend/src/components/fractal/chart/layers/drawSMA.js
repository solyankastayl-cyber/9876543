import { SMAPoint } from "../types";
import type { Scale } from "../math/scale";

export function drawSMA(
  ctx: CanvasRenderingContext2D,
  sma: SMAPoint[] | undefined,
  candleTs: number[],
  x: (i: number) => number,
  y: Scale
) {
  if (!sma?.length) return;
  ctx.save();
  ctx.strokeStyle = "rgba(59,130,246,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  let started = false;
  let j = 0;
  for (let i = 0; i < candleTs.length; i++) {
    const t = candleTs[i];
    while (j + 1 < sma.length && sma[j + 1].t <= t) j++;
    const p = sma[j];
    if (!p) continue;

    const xi = x(i);
    const yi = y(p.value);
    if (!started) {
      ctx.moveTo(xi, yi);
      started = true;
    } else {
      ctx.lineTo(xi, yi);
    }
  }
  ctx.stroke();
  ctx.restore();
}
