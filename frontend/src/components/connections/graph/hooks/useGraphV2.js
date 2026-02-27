import { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchGraphV2, fetchHandshakePath } from '../api/graphV2.api';
import { normalizeGraph } from '../utils/graphNormalize';

const DEFAULTS = {
  layer: 'BLENDED',
  anchors: true,
  minConfidence: 0.65,
  minWeight: 0.12,
};

export function useGraphV2() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [data, setData] = useState({ nodes: [], edges: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [selected, setSelected] = useState([]);
  const [path, setPath] = useState(null);
  const [pathLocked, setPathLocked] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const raw = await fetchGraphV2(cfg);
      setData(normalizeGraph(raw));
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => {
    reload();
  }, [cfg.layer, cfg.anchors, cfg.minConfidence, cfg.minWeight]);

  const selectNode = useCallback(async (nodeId) => {
    if (pathLocked) return;
    setPath(null);

    setSelected((prev) => {
      if (prev.includes(nodeId)) return prev.filter((x) => x !== nodeId);
      if (prev.length >= 2) return [prev[1], nodeId];
      return [...prev, nodeId];
    });
  }, [pathLocked]);

  useEffect(() => {
    const run = async () => {
      if (pathLocked) return;
      if (selected.length !== 2) return;
      try {
        const res = await fetchHandshakePath({ fromId: selected[0], toId: selected[1], layer: cfg.layer });
        setPath(res);
      } catch {
        setPath({ ok: false, reason: 'NO_PATH' });
      }
    };
    run();
  }, [selected.join('|'), cfg.layer, pathLocked]);

  const actions = useMemo(() => ({
    setLayer: (layer) => setCfg((p) => ({ ...p, layer })),
    setAnchors: (anchors) => setCfg((p) => ({ ...p, anchors })),
    setMinConfidence: (minConfidence) => setCfg((p) => ({ ...p, minConfidence })),
    setMinWeight: (minWeight) => setCfg((p) => ({ ...p, minWeight })),
    clearSelection: () => { if (!pathLocked) { setSelected([]); setPath(null); } },
    lockPath: () => setPathLocked(true),
    unlockPath: () => setPathLocked(false),
    reload,
  }), [pathLocked, reload]);

  return { cfg, data, loading, err, selected, path, pathLocked, selectNode, actions };
}
