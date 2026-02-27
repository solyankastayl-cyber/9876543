export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  yTicks = 6
) {
  ctx.save();
  const plotW = w - left - right;
  const plotH = h - top - bottom;

  // vertical border
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, plotW, plotH);

  // horizontal grid
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  for (let i = 1; i < yTicks; i++) {
    const y = top + (plotH * i) / yTicks;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + plotW, y);
    ctx.stroke();
  }
  ctx.restore();
}
