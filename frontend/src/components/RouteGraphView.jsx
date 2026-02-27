/**
 * RouteGraphView - ETAP A Refactor
 * 
 * Теперь использует ForceGraphCore - ТOЖЕ ЧТО И ActorsGraphPage
 * 
 * УБРАНО:
 * - Кастомные renderers
 * - Собственная логика отрисовки
 * 
 * ОСТАВЛЕНО:
 * - Highlighting
 * - Focus modes
 * - Export
 */
import { useState, useCallback, useRef, memo } from 'react';
import { 
  Network, Loader2, AlertTriangle, Eye, 
  Download, Share2
} from 'lucide-react';
import ForceGraphCore from '../graph/core/ForceGraphCore.jsx';
import { EDGE_INFLOW_COLOR, EDGE_OUTFLOW_COLOR } from '../graph/core/constants.js';
import useGraphIntelligence from '../hooks/useGraphIntelligence';
import { applyHighlighting } from '../graph/graphHighlight.adapter';
import { applyFocusMode, deriveHighlightedSets, FOCUS_MODES, getFocusModeLabel } from '../graph/graphFocus.selector';
import GraphExplainPanel from './GraphExplainPanel';
import { downloadGraphPNG } from '../graph/export/png_exporter';

// ============ LEGEND ============
const GraphLegend = memo(function GraphLegend({ highlightedPath }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl text-[10px]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-500 uppercase">Direction:</span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: EDGE_INFLOW_COLOR }} />
            <span className="text-gray-600">Inflow</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: EDGE_OUTFLOW_COLOR }} />
            <span className="text-gray-600">Outflow</span>
          </span>
        </div>
      </div>
      
      <div className="text-gray-400">
        {highlightedPath?.length || 0} steps
      </div>
    </div>
  );
});

// ============ MAIN COMPONENT ============
export default function RouteGraphView({ 
  address, 
  onExplainOpen,
  onShareClick,
  initialGraph,
  showRoutePanel = false,
}) {
  const [highlightedPath, setHighlightedPath] = useState(null);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState(FOCUS_MODES.ALL);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showExplainPanel, setShowExplainPanel] = useState(false);
  const containerRef = useRef();
  
  // Fetch graph data
  const { graph, loading, error, refetch } = useGraphIntelligence(address);
  
  // Use initial graph if provided
  const rawGraph = initialGraph || graph;
  
  // Process graph with highlighting and focus
  const processedGraph = useProcessedGraph(rawGraph, highlightedPath, highlightEnabled, focusMode);
  
  // Handle edge click
  const handleEdgeClick = useCallback((edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowExplainPanel(true);
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);
  
  // Handle export
  const handleExport = useCallback(() => {
    if (containerRef.current) {
      downloadGraphPNG(containerRef.current, `routes-${address || 'graph'}`);
    }
  }, [address]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading routes...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
        <span className="text-sm text-red-600">{error}</span>
        <button 
          onClick={refetch}
          className="mt-3 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Empty state
  if (!processedGraph?.nodes?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
        <Network className="w-8 h-8 text-gray-700 mb-2" />
        <span className="text-sm text-gray-500">No route data available</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Routes Graph</span>
          <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
            {processedGraph.nodes.length} nodes • {processedGraph.edges.length} edges
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Focus Mode */}
          <select
            value={focusMode}
            onChange={(e) => setFocusMode(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
          >
            {Object.values(FOCUS_MODES).map(mode => (
              <option key={mode} value={mode}>{getFocusModeLabel(mode)}</option>
            ))}
          </select>
          
          {/* Highlight Toggle */}
          <button
            onClick={() => setHighlightEnabled(!highlightEnabled)}
            className={`p-1.5 rounded-lg border ${highlightEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
            title="Toggle highlighting"
          >
            <Eye className={`w-4 h-4 ${highlightEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
          
          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            title="Export PNG"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Share */}
          {onShareClick && (
            <button
              onClick={onShareClick}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Share"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <GraphLegend highlightedPath={highlightedPath} />
      
      {/* Graph - ИСПОЛЬЗУЕМ ForceGraphCore */}
      <div ref={containerRef} className="bg-[#0a0e1a] rounded-xl overflow-hidden" style={{ height: 520 }}>
        <ForceGraphCore
          data={{ nodes: processedGraph.nodes, links: processedGraph.edges }}
          width={1200}
          height={520}
          onNodeClick={handleNodeClick}
          onLinkHover={(link) => link && setSelectedEdge(link)}
          onBackgroundClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
          selectedNodeId={selectedNode?.id}
          activePathIds={processedGraph.highlightedNodeIds ? new Set([...processedGraph.highlightedNodeIds, ...(processedGraph.highlightedEdgeIds || [])]) : null}
          fitOnLoad={true}
        />
      </div>
      
      {/* Explain Panel */}
      {showExplainPanel && selectedEdge && (
        <div className="mt-4">
          <GraphExplainPanel
            edge={selectedEdge}
            nodes={processedGraph.nodes}
            onClose={() => {
              setShowExplainPanel(false);
              setSelectedEdge(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook для обработки графа с highlighting и focus
 */
function useProcessedGraph(rawGraph, highlightedPath, highlightEnabled, focusMode) {
  if (!rawGraph?.nodes) return null;
  
  // Derive highlighted sets
  const highlightedSets = deriveHighlightedSets(highlightedPath, rawGraph.edges || []);
  
  // Apply highlighting
  const highlightedData = applyHighlighting({
    nodes: rawGraph.nodes,
    edges: rawGraph.edges || [],
    highlightedPath,
    enabled: highlightEnabled,
  });
  
  // Apply focus mode
  const { nodes, edges } = applyFocusMode(highlightedData, focusMode, highlightedSets);
  
  // Transform nodes
  const transformedNodes = nodes.map(n => ({
    id: n.id,
    label: n.displayName || n.label || n.id,
    address: n.address || n.id,
    ...n,
  }));
  
  // Создаём Set валидных node IDs
  const nodeIds = new Set(transformedNodes.map(n => n.id));
  
  // Transform edges для ForceGraphCore
  // ФИЛЬТРУЕМ edges с несуществующими узлами!
  const transformedEdges = edges
    .filter(e => {
      const fromId = e.fromNodeId || e.from || e.source;
      const toId = e.toNodeId || e.to || e.target;
      return fromId && toId && nodeIds.has(fromId) && nodeIds.has(toId);
    })
    .map(e => {
      const fromId = e.fromNodeId || e.from || e.source;
      const toId = e.toNodeId || e.to || e.target;
      return {
        id: e.id,
        source: fromId,  // ForceGraph использует source/target
        target: toId,
        from: fromId,
        to: toId,
        direction: e.direction || 'OUT',
        weight: e.weight || 0.5,
        netFlowUsd: e.netFlowUsd || 0,
      };
    });
  
  return {
    nodes: transformedNodes,
    edges: transformedEdges,
    highlightedNodeIds: highlightedSets.nodeIds,
    highlightedEdgeIds: highlightedSets.edgeIds,
  };
}
