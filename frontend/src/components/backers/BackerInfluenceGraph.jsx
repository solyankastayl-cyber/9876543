/**
 * Backer Influence Graph Component
 * 
 * Network visualization showing:
 * - Projects (portfolio)
 * - Co-investors
 * - Key Accounts
 * 
 * Uses existing react-force-graph-2d
 */
import { useState, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Building2, Users, Layers, Eye, EyeOff } from 'lucide-react';

const NODE_COLORS = {
  BACKER: '#8B5CF6',   // Purple
  PROJECT: '#3B82F6',  // Blue
  ACCOUNT: '#10B981',  // Green
};

const NODE_SIZES = {
  lg: 12,
  md: 8,
  sm: 5,
};

const EDGE_COLORS = {
  INVESTS_IN: '#3B82F6',
  CO_INVESTS: '#F59E0B',
  ADVOCATES: '#10B981',
};

export default function BackerInfluenceGraph({ graph }) {
  const graphRef = useRef();
  const [showProjects, setShowProjects] = useState(true);
  const [showAccounts, setShowAccounts] = useState(true);
  const [showCoInvestors, setShowCoInvestors] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Filter nodes based on toggles
  const filteredData = useMemo(() => {
    if (!graph) return { nodes: [], links: [] };
    
    const visibleTypes = new Set(['BACKER']); // Always show center backer
    if (showProjects) visibleTypes.add('PROJECT');
    if (showAccounts) visibleTypes.add('ACCOUNT');
    
    const filteredNodes = graph.nodes.filter(n => {
      if (n.isCenter) return true;
      if (n.type === 'BACKER' && !showCoInvestors) return false;
      return visibleTypes.has(n.type);
    });
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    const filteredEdges = graph.edges.filter(e => 
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    
    return {
      nodes: filteredNodes,
      links: filteredEdges.map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
        label: e.label,
      })),
    };
  }, [graph, showProjects, showAccounts, showCoInvestors]);

  // Node rendering
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const size = NODE_SIZES[node.size] || NODE_SIZES.md;
    const fontSize = Math.max(10 / globalScale, 3);
    const color = NODE_COLORS[node.type] || '#9CA3AF';
    
    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.isCenter ? '#4C1D95' : color;
    ctx.fill();
    
    // Border for center
    if (node.isCenter) {
      ctx.strokeStyle = '#DDD6FE';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Label
    if (globalScale > 0.5 || node.isCenter) {
      ctx.font = `${node.isCenter ? 'bold ' : ''}${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hoveredNode === node.id ? '#111' : '#666';
      ctx.fillText(node.name, node.x, node.y + size + fontSize);
    }
  }, [hoveredNode]);

  // Link rendering
  const linkCanvasObject = useCallback((link, ctx) => {
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = EDGE_COLORS[link.type] || '#E5E7EB';
    ctx.lineWidth = link.weight * 2;
    
    if (link.type === 'CO_INVESTS') {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.stroke();
  }, []);

  if (!graph || !graph.nodes?.length) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
        No network data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Influence Network
        </h3>
        <div className="text-xs text-gray-400">
          {filteredData.nodes.length} nodes • {filteredData.links.length} edges
        </div>
      </div>
      
      {/* Toggles */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
        <span className="text-xs text-gray-500">Show:</span>
        
        <button
          onClick={() => setShowProjects(!showProjects)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition
            ${showProjects ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
        >
          {showProjects ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Projects ({graph.stats?.projectCount || 0})
        </button>
        
        <button
          onClick={() => setShowCoInvestors(!showCoInvestors)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition
            ${showCoInvestors ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}
        >
          {showCoInvestors ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Co-Investors ({graph.stats?.coInvestorCount || 0})
        </button>
        
        <button
          onClick={() => setShowAccounts(!showAccounts)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition
            ${showAccounts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
        >
          {showAccounts ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Accounts ({graph.stats?.accountCount || 0})
        </button>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
        <span className="text-xs text-gray-400">Legend:</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-3 h-3 rounded-full bg-purple-600" /> Backer
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-3 h-3 rounded-full bg-blue-500" /> Project
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Account
        </span>
        <span className="text-gray-300 mx-2">|</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-4 border-t-2 border-blue-500" /> Invests
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-4 border-t-2 border-yellow-500 border-dashed" /> Co-Invests
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="w-4 border-t-2 border-green-500" /> Advocates
        </span>
      </div>
      
      {/* Graph */}
      <div className="h-[400px] bg-gray-50">
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredData}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          width={800}
          height={400}
          backgroundColor="transparent"
          onNodeHover={node => setHoveredNode(node?.id)}
          cooldownTicks={100}
          d3VelocityDecay={0.3}
        />
      </div>
      
      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 text-center text-xs text-gray-400">
        Capital flow and influence relationships
      </div>
    </div>
  );
}
