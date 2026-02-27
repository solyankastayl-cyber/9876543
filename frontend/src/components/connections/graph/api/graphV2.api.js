const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export async function fetchGraphV2({ layer, anchors, minConfidence, minWeight }) {
  const qs = new URLSearchParams();
  qs.set('layer', layer);
  qs.set('anchors', anchors ? '1' : '0');
  if (minConfidence != null) qs.set('minConfidence', String(minConfidence));
  if (minWeight != null) qs.set('minWeight', String(minWeight));

  const r = await fetch(`${API_BASE}/api/connections/graph/v2?${qs.toString()}`);
  if (!r.ok) throw new Error(`graph_v2_failed_${r.status}`);
  return r.json();
}

export async function fetchHandshakePath({ fromId, toId, layer }) {
  const r = await fetch(`${API_BASE}/api/connections/handshake/v2`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fromId, toId, layer }),
  });
  if (!r.ok) throw new Error(`handshake_v2_failed_${r.status}`);
  return r.json();
}
