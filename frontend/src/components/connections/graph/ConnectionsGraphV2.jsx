import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphV2 } from './hooks/useGraphV2';
import GraphTopBar from './GraphTopBar';
import GraphSidePanel from './GraphSidePanel';

export default function ConnectionsGraphV2() {
  const { cfg, data, loading, err, selected, path, pathLocked, selectNode, actions } = useGraphV2();
  const graphRef = useRef();

  const graphData = useMemo(() => ({
    nodes: data.nodes.map(n => ({ ...n })),
    links: data.edges.map((e) => ({ ...e, source: e.source, target: e.target })),
  }), [data.nodes, data.edges]);

  const handleNodeClick = useCallback((node) => {
    selectNode(String(node.id));
  }, [selectNode]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const id = String(node.id);
    const isSel = selected.includes(id);
    const label = node.label || id;
    const fontSize = 10 / globalScale;

    // Node size based on type
    const radius = node.kind === 'BACKER' ? 8 : 5;

    // Node color based on type and selection
    let fillColor = '#3B82F6'; // blue for twitter
    if (node.kind === 'BACKER') fillColor = '#8B5CF6'; // purple for backers
    if (isSel) fillColor = '#1F2937'; // dark for selected

    // Draw node
    ctx.beginPath();
    ctx.arc(node.x, node.y, isSel ? radius + 3 : radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Selection ring
    if (isSel) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Label
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';
    ctx.fillText(label, node.x + radius + 4, node.y);
  }, [selected]);

  // Highlight path edges
  const linkColor = useCallback((link) => {
    if (path?.pathIds && path.pathIds.length > 1) {
      for (let i = 0; i < path.pathIds.length - 1; i++) {
        const src = path.pathIds[i];
        const tgt = path.pathIds[i + 1];
        if ((link.source.id === src && link.target.id === tgt) ||
            (link.source.id === tgt && link.target.id === src)) {
          return '#EF4444'; // red for path
        }
      }
    }
    return '#CBD5E1'; // gray default
  }, [path]);

  return (
    <div className="space-y-4">
      <GraphTopBar cfg={cfg} actions={actions} selected={selected} pathLocked={pathLocked} />

      {loading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-blue-700 dark:text-blue-300">
          Loading graph...
        </div>
      )}
      
      {err && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-700 dark:text-red-300">
          Error: {String(err.message || err)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '70vh' }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={(n) => `${n.label}\nConfidence: ${Math.round((n.confidence || 0) * 100)}%`}
            onNodeClick={handleNodeClick}
            nodeCanvasObject={nodeCanvasObject}
            linkColor={linkColor}
            linkWidth={(l) => Math.max(1, (l.weight || 0.1) * 4)}
            linkDirectionalParticles={0}
            cooldownTicks={100}
            d3VelocityDecay={0.3}
          />
        </div>

        <div className="lg:col-span-1">
          <GraphSidePanel selected={selected} path={path} data={data} />
        </div>
      </div>
    </div>
  );
}
