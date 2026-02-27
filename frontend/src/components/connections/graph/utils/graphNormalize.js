export function normalizeGraph(raw) {
  const nodes = (raw.nodes || []).map((n) => ({
    ...n,
    id: String(n.id),
    kind: n.kind || 'TWITTER',
    label: n.label || n.title || n.username || n.name || n.id,
    confidence: n.confidence?.score ?? n.confidence ?? 0.75,
    seedAuthority: n.seedAuthority ?? 0,
  }));

  const edges = (raw.edges || []).map((e) => ({
    ...e,
    id: e.id ? String(e.id) : `${e.source}->${e.target}:${e.layer || '?'}`,
    source: String(e.source),
    target: String(e.target),
    layer: e.layer || raw.meta?.layer || 'BLENDED',
    weight: e.weight ?? 0.1,
    confidence: e.confidence ?? 0.75,
    overlay: e.overlay || null,
  }));

  return { nodes, edges, meta: raw.meta || {} };
}
