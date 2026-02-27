export type Pt = { x: number; y: number };

export function catmullRom(points: Pt[], samplesPerSeg = 24): Pt[] {
  if (points.length < 2) return points;
  const out: Pt[] = [];
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);

    for (let s = 0; s <= samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      out.push({ x, y });
    }
  }
  return out;
}
