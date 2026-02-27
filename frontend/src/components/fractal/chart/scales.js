/**
 * FRACTAL RESEARCH TERMINAL — Coordinate transforms
 */

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function priceToY(price, minP, maxP, top, height) {
  const span = maxP - minP || 1;
  const t = (maxP - price) / span;
  return top + t * height;
}

export function yToPrice(y, minP, maxP, top, height) {
  const span = maxP - minP || 1;
  const t = clamp((y - top) / height, 0, 1);
  return maxP - t * span;
}

export function indexToX(index, visibleCount, padL, plotW) {
  const cw = plotW / visibleCount;
  return padL + index * cw + cw / 2;
}

export function xToIndex(x, visibleCount, padL, plotW) {
  const t = clamp((x - padL) / plotW, 0, 1);
  return Math.round(t * (visibleCount - 1));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function normalizePrice(price, basePrice) {
  if (!basePrice || !Number.isFinite(basePrice)) return 100;
  return (price / basePrice) * 100;
}

export function denormalizePrice(normalizedValue, basePrice) {
  return (normalizedValue / 100) * basePrice;
}
