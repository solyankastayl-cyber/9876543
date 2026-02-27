export function selectDefaultMatchIndex(d) {
  if (!d?.matches?.length) return 0;
  let best = 0;
  let bestSim = -Infinity;
  for (let i = 0; i < d.matches.length; i++) {
    const s = d.matches[i]?.similarity ?? 0;
    if (s > bestSim) {
      bestSim = s;
      best = i;
    }
  }
  return best;
}
