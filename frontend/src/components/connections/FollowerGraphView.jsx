/**
 * Follower Graph Visualization
 * 
 * Displays the follower micro-network with bot clusters highlighted.
 */

import React, { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function getLabelColor(label) {
  switch (label) {
    case 'REAL': return '#22c55e';
    case 'SUSPICIOUS': return '#eab308';
    case 'BOT': return '#ef4444';
    default: return '#6b7280';
  }
}

function ClusterCard({ cluster }) {
  return (
    <div className={`p-3 rounded-lg border ${
      cluster.suspicious 
        ? 'bg-red-900/30 border-red-700' 
        : 'bg-gray-800 border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-sm">{cluster.clusterId}</span>
        {cluster.suspicious && (
          <span className="px-2 py-0.5 bg-red-800 text-red-200 text-xs rounded">
            SUSPICIOUS
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Size:</span>
          <span className="ml-1 font-medium">{cluster.size}</span>
        </div>
        <div>
          <span className="text-gray-400">Bot Ratio:</span>
          <span className={`ml-1 font-medium ${
            cluster.botRatio > 0.5 ? 'text-red-400' : 'text-gray-300'
          }`}>
            {Math.round(cluster.botRatio * 100)}%
          </span>
        </div>
        <div>
          <span className="text-gray-400">Avg Weight:</span>
          <span className="ml-1">{cluster.avgWeight}</span>
        </div>
        <div>
          <span className="text-gray-400">Type:</span>
          <span className="ml-1">{cluster.dominantLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function FollowerGraphView({ actorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/connections/audience-quality/${actorId}/graph?sampleSize=150`);
        const json = await res.json();
        if (json.ok) {
          setData(json);
        } else {
          setError(json.error || 'Failed to load');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [actorId]);

  // Simple canvas-based graph rendering
  useEffect(() => {
    if (!data?.graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    const { nodes, edges } = data.graph;
    if (nodes.length === 0) return;

    // Simple force-directed layout (basic)
    const positions = new Map();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Position nodes in a circle, grouped by cluster
    const clusterGroups = new Map();
    nodes.forEach((node, i) => {
      const cluster = node.clusterId || 'none';
      if (!clusterGroups.has(cluster)) {
        clusterGroups.set(cluster, []);
      }
      clusterGroups.get(cluster).push({ node, index: i });
    });

    let angleOffset = 0;
    clusterGroups.forEach((members, cluster) => {
      const groupAngle = (members.length / nodes.length) * Math.PI * 2;
      members.forEach((m, i) => {
        const angle = angleOffset + (i / members.length) * groupAngle;
        const r = radius * (0.6 + Math.random() * 0.4);
        positions.set(m.node.id, {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      });
      angleOffset += groupAngle;
    });

    // Draw edges
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getLabelColor(node.label);
      ctx.fill();
    });

  }, [data]);

  if (loading) {
    return <div className="text-gray-400 p-4">Loading graph...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-4">Error: {error}</div>;
  }

  if (!data?.graph) {
    return <div className="text-gray-400 p-4">No graph data</div>;
  }

  const { graph, penalty } = data;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-2xl font-bold">{graph.nodesCount}</div>
          <div className="text-xs text-gray-400">Nodes</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-2xl font-bold">{graph.edgesCount}</div>
          <div className="text-xs text-gray-400">Edges</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className={`text-2xl font-bold ${
            graph.suspiciousClusters > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {graph.suspiciousClusters}
          </div>
          <div className="text-xs text-gray-400">Suspicious</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className={`text-2xl font-bold ${
            penalty.value < 0.8 ? 'text-red-400' : 'text-green-400'
          }`}>
            {penalty.value}
          </div>
          <div className="text-xs text-gray-400">Penalty</div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Follower Network</h3>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400}
          className="w-full rounded border border-gray-700"
        />
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Real</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Suspicious</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Bot</span>
          </div>
        </div>
      </div>

      {/* Clusters */}
      {graph.clusters.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Clusters ({graph.clusters.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {graph.clusters.slice(0, 6).map(cluster => (
              <ClusterCard key={cluster.clusterId} cluster={cluster} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
