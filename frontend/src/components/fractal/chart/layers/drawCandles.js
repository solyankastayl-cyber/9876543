import { Candle } from "../types";
import type { Scale } from "../math/scale";

export function drawCandles(
  ctx: CanvasRenderingContext2D,
  candles: Candle[],
  x: (i: number) => number,
  y: Scale,
  step: number
) {
  ctx.save();
  const bodyW = Math.max(1, Math.floor(step * 0.6));
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const xi = x(i);

    const yO = y(c.o);
    const yC = y(c.c);
    const yH = y(c.h);
    const yL = y(c.l);

    const up = c.c >= c.o;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;

    // wick
    ctx.beginPath();
    ctx.moveTo(xi, yH);
    ctx.lineTo(xi, yL);
    ctx.stroke();

    // body
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const h = Math.max(1, bot - top);
    ctx.fillStyle = up ? "rgba(34,197,94,0.75)" : "rgba(239,68,68,0.75)";
    ctx.fillRect(xi - bodyW / 2, top, bodyW, h);
    ctx.strokeStyle = up ? "rgba(34,197,94,1)" : "rgba(239,68,68,1)";
    ctx.strokeRect(xi - bodyW / 2, top, bodyW, h);
  }
  ctx.restore();
}
