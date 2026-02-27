import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fetchGraphV2 } from '../../api/connectionsGraphV2.api';

export default function BackerNetworkPanel({ backerId }) {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backerId) return;
    
    setLoading(true);
    fetchGraphV2({
      layer: 'CO_INVESTMENT',
      anchors: '1',
      minConfidence: 0.5,
      minWeight: 0.1
    })
      .then(result => {
        setData({
          nodes: result.nodes || [],
          edges: result.edges || []
        });
      })
      .finally(() => setLoading(false));
  }, [backerId]);

  const graphData = {
    nodes: data.nodes,
    links: data.edges.map(e => ({ ...e, source: e.source, target: e.target }))
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Influence Network</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {loading ? 'Loading...' : 'Co-investment layer'}
        </span>
      </div>
      <div style={{ height: '400px' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeId="id"
          nodeLabel={(n) => n.label || n.id}
          nodeColor={(n) => n.kind === 'BACKER' ? '#8B5CF6' : '#6B7280'}
          linkColor={() => 'rgba(156, 163, 175, 0.5)'}
          cooldownTicks={50}
        />
      </div>
    </div>
  );
}
