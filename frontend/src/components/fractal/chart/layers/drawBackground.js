export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
