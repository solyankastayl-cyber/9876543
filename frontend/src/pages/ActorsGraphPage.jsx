/**
 * Actors Graph Page - ETAP A Refactor
 * 
 * Теперь использует ForceGraphCore (react-force-graph-2d)
 * 
 * УБРАНО:
 * - SVG calculatePositions
 * - Кастомная геометрия
 * - Разные цвета/размеры нод
 * 
 * ДОБАВЛЕНО:
 * - Drag/Zoom/Pan
 * - Единый renderer с RouteGraphView
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, Users, Loader2, Info, ChevronDown, ChevronUp,
  X, ExternalLink, ArrowLeftRight, Filter, Eye, EyeOff
} from 'lucide-react';
import ForceGraphCore from '../graph/core/ForceGraphCore.jsx';
import GraphLogicToggle from '../components/GraphLogicToggle';
import { EDGE_INFLOW_COLOR, EDGE_OUTFLOW_COLOR } from '../graph/core/constants.js';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============ LEGEND ============
function GraphLegend({ nodesCount, edgesCount }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between gap-6">
        {/* Direction Legend */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Direction:</span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: EDGE_INFLOW_COLOR }} />
            <span className="text-gray-600">Inflow</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: EDGE_OUTFLOW_COLOR }} />
            <span className="text-gray-600">Outflow</span>
          </span>
        </div>
        
        <div className="text-[10px] text-gray-400">
          {nodesCount} nodes • {edgesCount} edges
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 text-[9px] text-gray-400 italic">
        Graph shows structural relationships. Not predictive. Not a trading signal.
      </div>
    </div>
  );
}

// ============ CORRIDOR MODAL ============
function CorridorModal({ edge, nodes, onClose, onNavigate }) {
  if (!edge) return null;
  
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900">{fromNode?.label || edge.from}</span>
            <ArrowLeftRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-900">{toNode?.label || edge.to}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-500">Weight</span>
            <span className="font-bold">{((edge.weight || 0.5) * 100).toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-500">Direction</span>
            <span className={`font-bold ${edge.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
              {edge.direction || 'OUT'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onNavigate(`/actors/${edge.from}`)}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            {fromNode?.label || edge.from}
          </button>
          <button
            onClick={() => onNavigate(`/actors/${edge.to}`)}
            className="flex-1 px-4 py-2.5 bg-white text-white rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            {toNode?.label || edge.to}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ RANKING PANEL ============
function RankingPanel({ nodes, onNodeClick, selectedNodeId }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">Network Ranking</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] text-gray-500 mb-3">Ranked by structural position</p>
          {nodes.slice(0, 10).map((node, i) => (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                selectedNodeId === node.id ? 'bg-white text-white' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedNodeId === node.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>{i + 1}</span>
                <span className="font-medium text-sm">{node.label}</span>
              </div>
              <span className={`text-sm font-semibold ${selectedNodeId === node.id ? 'text-white' : 'text-gray-700'}`}>
                {node.metrics?.centralityScore || 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ NODE DETAILS PANEL ============
function NodeDetails({ node, onClose, onNavigate }) {
  if (!node) return null;
  
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{node.label}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Category</span>
          <span className="font-medium text-sm capitalize">{node.category || 'unknown'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Centrality Score</span>
          <span className="font-bold text-xl">{node.metrics?.centralityScore || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Connections</span>
          <span className="font-semibold">{(node.metrics?.inDegree || 0) + (node.metrics?.outDegree || 0)}</span>
        </div>
        
        <button
          onClick={() => onNavigate(`/actors/${node.id}`)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-white rounded-lg hover:bg-gray-100"
        >
          <ExternalLink className="w-4 h-4" />View Actor Profile
        </button>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function ActorsGraphPage() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], metadata: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [window, setWindow] = useState('7d');
  
  // Load graph data - uses /api/graph which pulls from ActorModel
  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/graph?window=${window}`);
      const data = await res.json();
      
      if (data.ok) {
        // Transform nodes for ForceGraphCore
        const nodes = (data.data.nodes || []).map(n => ({
          id: n.id,
          label: n.label,
          address: n.id, // для formatLabel
          category: n.actorType || n.nodeType || 'unknown',
          // Размер на основе edgeScore
          size: 12 + (n.metrics?.edgeScore || 0) * 0.3,
          // H3 State
          state: n.state,
          // Метрики для tooltip
          metrics: {
            edgeScore: n.metrics?.edgeScore || 0,
            inDegree: n.metrics?.inDegree || 0,
            outDegree: n.metrics?.outDegree || 0,
            volumeUsd: n.metrics?.volumeUsd || 0,
            inflowUsd: n.metrics?.inflowUsd || 0,
            outflowUsd: n.metrics?.outflowUsd || 0,
            netFlowUsd: n.metrics?.netFlowUsd || 0,
          },
          coverage: n.coverage || 0,
          flowRole: n.flowRole,
        }));
        
        // Создаём Set валидных node IDs
        const nodeIds = new Set(nodes.map(n => n.id));
        
        // Transform edges - ТОЛЬКО те, у которых source и target существуют!
        // ПРАВИЛО: netFlow > 0 → OUT (красный), netFlow < 0 → IN (зелёный)
        const edges = (data.data.edges || [])
          .filter(e => {
            // Проверяем что оба узла существуют
            const fromId = e.from;
            const toId = e.to;
            return fromId && toId && nodeIds.has(fromId) && nodeIds.has(toId);
          })
          .map(e => {
            const netFlow = e.rawEvidence?.netFlowUsd ?? e.netFlowUsd ?? 0;
            const direction = netFlow >= 0 ? 'OUT' : 'IN';
            
            return {
              id: e.id,
              source: e.from,  // ForceGraph использует source/target
              target: e.to,
              from: e.from,
              to: e.to,
              direction,
              weight: e.weight || 0.3,
              state: e.state,
              // Метрики для tooltip
              netFlowUsd: netFlow,
              volumeUsd: e.rawEvidence?.directTransfer?.volumeUsd || 0,
              txCount: e.rawEvidence?.directTransfer?.txCount || 0,
              confidence: e.confidence,
            };
          });
        
        console.log(`[ActorsGraph] Loaded ${nodes.length} nodes, ${edges.length} valid edges`);
        
        setGraphData({ 
          nodes, 
          links: edges, // ForceGraph использует links, не edges
          edges,
          metadata: data.data.metadata,
          interpretation: data.data.interpretation,
        });
      } else {
        setError(data.error || 'Failed to load graph');
      }
    } catch (err) {
      console.error('[ActorsGraph] Load error:', err);
      setError('Failed to load graph data');
    }
    setLoading(false);
  }, [window]);
  
  useEffect(() => { loadGraph(); }, [loadGraph]);
  
  // Handlers
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
    setSelectedEdge(null);
  }, [selectedNode]);
  
  const handleEdgeClick = useCallback((edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Actors Graph</h1>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">v2</span>
                  <GraphLogicToggle />
                </div>
                <p className="text-sm text-gray-500">Click nodes for details • Click edges for evidence</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time Controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Time:</span>
            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
              {['24h', '7d', '30d'].map(w => (
                <button 
                  key={w} 
                  onClick={() => setWindow(w)} 
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    window === w ? 'bg-white text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          
          {graphData.metadata && (
            <span className="text-xs text-gray-400">
              {graphData.metadata.totalNodes} actors • {graphData.metadata.totalEdges} edges
            </span>
          )}
        </div>
        
        {/* Legend */}
        <GraphLegend 
          nodesCount={graphData.metadata?.totalNodes || graphData.nodes.length} 
          edgesCount={graphData.metadata?.totalEdges || graphData.edges.length} 
        />
        
        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <div className="text-red-500 mb-2">{error}</div>
            <button onClick={loadGraph} className="text-gray-600 underline">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Ranking */}
            <div className="col-span-3 space-y-4">
              <RankingPanel 
                nodes={graphData.nodes} 
                onNodeClick={handleNodeClick} 
                selectedNodeId={selectedNode?.id} 
              />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Structural analysis</p>
                    <p>Drag nodes to rearrange. Click edges for details.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center - Graph */}
            <div className="col-span-6">
              <div className="bg-[#0a0e1a] rounded-xl overflow-hidden" style={{ height: 500 }}>
                <ForceGraphCore
                  data={{ nodes: graphData.nodes, links: graphData.links || graphData.edges }}
                  width={700}
                  height={500}
                  onNodeClick={handleNodeClick}
                  onLinkHover={(link) => link && setSelectedEdge(link)}
                  onBackgroundClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                  selectedNodeId={selectedNode?.id}
                  fitOnLoad={true}
                />
              </div>
              
              {graphData.interpretation && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{graphData.interpretation.headline}</p>
                  <p className="text-xs text-gray-500 mt-1">{graphData.interpretation.description}</p>
                </div>
              )}
            </div>
            
            {/* Right Panel - Details */}
            <div className="col-span-3">
              {selectedNode ? (
                <NodeDetails 
                  node={selectedNode} 
                  onClose={() => setSelectedNode(null)} 
                  onNavigate={navigate} 
                />
              ) : (
                <div className="bg-white/80 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                  <p className="text-sm text-gray-500">Click on a node to see details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Edge Modal */}
      {selectedEdge && (
        <CorridorModal 
          edge={selectedEdge} 
          nodes={graphData.nodes} 
          onClose={() => setSelectedEdge(null)} 
          onNavigate={(path) => { setSelectedEdge(null); navigate(path); }} 
        />
      )}
    </div>
  );
}
