/**
 * EPIC C2: Graph UI v2 - Muted Professional Visual Language
 * 
 * Principles:
 * - Color = edge type (not importance)
 * - Opacity = confidence
 * - Thickness = weight
 * - Shape = node type
 * - No rainbow, max 5 edge colors
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Target, X, Loader2, Info, Filter } from 'lucide-react';
import { TooltipProvider } from '../components/ui/tooltip';
import GraphLogicToggle from '../components/GraphLogicToggle';

import {
  ModeSelector,
  GraphControls,
  Leaderboard,
  ActorPanel,
  LinkTooltip,
  FlowTable,
  actorsData as fallbackActorsData,
  PALETTE,
  NODE_FILL,
  TEXT_COLOR,
  NODE_RADIUS,
  FONT_SIZE_BASE,
  EDGE_COLORS,
  CORRIDOR_THRESHOLD,
  ZOOM_MIN,
  ZOOM_MAX,
  SOURCE_STYLES,
  getCoverageOpacity,
  getConfidenceOpacity,
  getEdgeWidth,
  getEdgeColor,
  getEdgeTypeLabel,
  getRatingBorder,
  abbreviate,
  calcScore,
  getRole,
  hasDegree,
  getLinkId,
  getLinkCount,
  isConnectedTo,
  formatUSD,
} from '../components/correlation';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== EPIC C3.1 FINAL: GRAPH v3.1 LEGEND ====================
const GraphLegendV3 = ({ actorsCount }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* PRIMARY: Direction = Color (MOST IMPORTANT) */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          Direction
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: '#3BA272' }}></span>
            <span className="font-medium text-emerald-700">Inflow</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-[2px] rounded" style={{ backgroundColor: '#C94A4A' }}></span>
            <span className="font-medium text-red-600">Outflow</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-[2px] rounded bg-gray-400"></span>
            <span className="text-gray-500">Neutral</span>
          </span>
        </div>
      </div>
      
      {/* Density */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Density</div>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-[1px] bg-gray-600"></span>
            <span className="text-gray-600">1-2</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="flex gap-[1px]">
              <span className="w-1 h-[1px] bg-gray-600"></span>
              <span className="w-1 h-[1px] bg-gray-600"></span>
              <span className="w-1 h-[1px] bg-gray-600"></span>
            </span>
            <span className="text-gray-600">3-6</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-gray-200 rounded-sm"></span>
            <span className="text-gray-600">&gt;6</span>
          </span>
        </div>
      </div>
      
      {/* Confidence (opacity) */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Confidence</div>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 rounded bg-gray-800"></span>
            <span className="text-gray-600">High</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 rounded bg-gray-400"></span>
            <span className="text-gray-600">Med</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 rounded bg-gray-200"></span>
            <span className="text-gray-600">Low</span>
          </span>
        </div>
      </div>
      
      <div className="text-[10px] text-gray-400 text-right">
        <span className="font-medium">{actorsCount}</span> actors
      </div>
    </div>
    
    {/* Disclaimer */}
    <div className="mt-3 pt-3 border-t border-gray-100 text-[9px] text-gray-400 italic">
      Structural relationships based on on-chain data. Not predictive. Not a trading signal.
    </div>
  </div>
);

// ==================== EPIC C2: FILTER PANEL ====================
const FilterPanel = ({ filters, setFilters, edgeTypes }) => {
  const toggleEdgeType = (type) => {
    setFilters(prev => ({
      ...prev,
      edgeTypes: prev.edgeTypes.includes(type)
        ? prev.edgeTypes.filter(t => t !== type)
        : [...prev.edgeTypes, type]
    }));
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Filters</span>
        </div>
        
        {/* Edge Type Filter */}
        <div className="flex items-center gap-1">
          {edgeTypes.map(type => (
            <button
              key={type}
              onClick={() => toggleEdgeType(type)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                filters.edgeTypes.includes(type)
                  ? 'bg-white text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {getEdgeTypeLabel(type).split(' ')[0]}
            </button>
          ))}
        </div>
        
        <div className="h-4 w-px bg-gray-200" />
        
        {/* Confidence Filter */}
        <div className="flex items-center gap-1">
          {['high', 'medium', 'low'].map(level => (
            <button
              key={level}
              onClick={() => setFilters(prev => ({
                ...prev,
                confidence: prev.confidence === level ? null : level
              }))}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                filters.confidence === level
                  ? 'bg-white text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== EPIC C2: EVIDENCE TOOLTIP ====================
const EvidenceTooltip = ({ edge, position, actors }) => {
  if (!edge || !position) return null;
  
  const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
  const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
  const sourceActor = actors.find(a => a.id === sourceId);
  const targetActor = actors.find(a => a.id === targetId);
  
  return (
    <div
      className="fixed z-50 bg-white text-white rounded-lg shadow-xl p-3 text-[11px] max-w-xs pointer-events-none"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
        <span className="font-semibold">{getEdgeTypeLabel(edge.edgeType || edge.type)}</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ 
          backgroundColor: getEdgeColor(edge.edgeType || edge.type) + '30',
          color: getEdgeColor(edge.edgeType || edge.type)
        }}>
          {edge.confidence || 'medium'}
        </span>
      </div>
      
      {/* Metrics */}
      <div className="space-y-1.5 text-gray-700">
        <div className="flex justify-between">
          <span>Weight:</span>
          <span className="font-medium text-white">{((edge.weight || 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence:</span>
          <span className="font-medium text-white capitalize">{edge.confidence || 'medium'}</span>
        </div>
        {edge.evidence?.flowCorrelation && (
          <div className="flex justify-between">
            <span>Shared Volume:</span>
            <span className="font-medium text-white">{formatUSD(edge.evidence.flowCorrelation.sharedVolumeUsd)}</span>
          </div>
        )}
        {edge.count && (
          <div className="flex justify-between">
            <span>Interactions:</span>
            <span className="font-medium text-white">{edge.count}</span>
          </div>
        )}
      </div>
      
      {/* Disclaimer */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-[9px] text-gray-500 italic">
        Structural correlation, not a trading signal
      </div>
    </div>
  );
};

// ==================== FOCUS BADGE ====================
const FocusBadge = ({ actor, onClear }) => {
  if (!actor) return null;
  return (
    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-white text-[11px] rounded-lg shadow-lg">
      <Target className="w-3.5 h-3.5" />
      <span className="font-medium">{abbreviate(actor.real_name)}</span>
      <button onClick={onClear} className="hover:bg-gray-100 rounded p-0.5 ml-1" data-testid="focus-badge-clear">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// ==================== HOOKS ====================
const usePreventBrowserZoom = (containerRef) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventBrowserZoom = (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    
    container.addEventListener('wheel', preventBrowserZoom, { passive: false });
    return () => container.removeEventListener('wheel', preventBrowserZoom);
  }, [containerRef]);
};

const useActorsFromAPI = (window = '7d') => {
  const [apiActors, setApiActors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/graph?window=${window}`);
        const data = await res.json();
        
        if (data.ok && data.data?.nodes?.length > 0) {
          // Add mock bidirectional edges to demonstrate two-bundle model
          // In real data, API should return both directions when they exist
          // NOTE: a16z -> WMT is left WITHOUT reverse to show straight line case
          const mockBidirectionalEdges = [
            { from: 'actor_wintermute_mm', to: 'actor_binance_main', primaryType: 'FLOW_CORRELATION', confidence: 'high', weight: 0.6 },
            { from: 'actor_coinbase_main', to: 'actor_binance_main', primaryType: 'FLOW_CORRELATION', confidence: 'medium', weight: 0.5 },
            { from: 'actor_wintermute_mm', to: 'actor_coinbase_main', primaryType: 'FLOW_CORRELATION', confidence: 'medium', weight: 0.4 },
            // NO reverse for a16z -> BIN to show straight line
          ];
          const edgesWithBidirectional = [...data.data.edges, ...mockBidirectionalEdges];
          
          const transformedActors = data.data.nodes.map(node => {
            const incomingEdges = edgesWithBidirectional.filter(e => e.to === node.id);
            const outgoingEdges = edgesWithBidirectional.filter(e => e.from === node.id);
            
            return {
              id: node.id,
              real_name: node.label || node.id,
              strategy_name: node.flowRole || 'Unknown',
              strategy: node.type || 'Unknown',
              edgeScore: node.edgeScore || 0,
              influenceScore: node.edgeScore || 0,
              sourceLevel: node.sourceLevel || 'behavioral',
              coverage: node.coverage || 0.5,
              nodeType: node.type || 'actor',
              followers_count: incomingEdges.length,
              avg_follower_lag: 5,
              consistency: node.edgeScore / 100,
              market_impact: node.metrics?.centralityScore / 100 || 0.5,
              frontRuns: outgoingEdges.map(e => ({ 
                id: e.to, 
                count: Math.ceil((e.weight || 0.1) * 10),
                edgeType: e.primaryType?.toUpperCase() || 'FLOW_CORRELATION',
                confidence: e.confidence || 'medium',
                weight: e.weight || 0.5,
              })),
              followedBy: incomingEdges.map(e => ({ 
                id: e.from, 
                count: Math.ceil((e.weight || 0.1) * 10),
                edgeType: e.primaryType?.toUpperCase() || 'FLOW_CORRELATION',
                confidence: e.confidence || 'medium',
                weight: e.weight || 0.5,
              })),
              correlations: [...incomingEdges, ...outgoingEdges].map(e => ({
                id: e.from === node.id ? e.to : e.from,
                strength: e.weight || 0.5
              })),
            };
          });
          
          setApiActors(transformedActors);
        } else {
          setApiActors(null);
        }
      } catch (err) {
        console.error('Failed to load graph from API:', err);
        setError(err.message);
        setApiActors(null);
      }
      setLoading(false);
    };
    
    loadData();
  }, [window]);
  
  return { apiActors, loading, error };
};

const useGraphData = (connected, mode, focusId, filters) => {
  return useMemo(() => {
    const nodes = connected
      .filter(a => !filters.hideLowCoverage || (a.coverage || 0.5) >= 0.4)
      .map(a => ({
        id: a.id,
        label: abbreviate(a.real_name),
        score: a.influenceScore,
        radius: NODE_RADIUS,
        ratingColor: getRatingBorder(a.influenceScore),
        role: a.role,
        isFocused: focusId === a.id,
        sourceLevel: a.sourceLevel || 'behavioral',
        coverage: a.coverage || 0.5,
        nodeType: a.nodeType || 'actor',
        ...a,
      }));
    
    const links = [];
    const ids = new Set(nodes.map(n => n.id));
    
    // ============================================================
    // STRAND-FIRST MODEL (per Arkham spec)
    // All edges between A↔B form ONE corridor
    // Direction affects COLOR only, not geometry
    // ============================================================
    
    if (mode !== 'clusters') {
      // Step 1: Collect ALL edges (both directions) into pair groups
      const pairMap = new Map(); // key: sorted "A|B" -> array of edges
      
      connected.forEach(a => {
        // Outgoing edges (a → target)
        a.frontRuns?.forEach(link => {
          const targetId = getLinkId(link);
          if (!ids.has(targetId)) return;
          
          const edgeType = link.edgeType || 'FLOW_CORRELATION';
          const confidence = link.confidence || 'medium';
          
          if (filters.edgeTypes.length > 0 && !filters.edgeTypes.includes(edgeType)) return;
          if (filters.confidence && filters.confidence !== confidence) return;
          
          // Pair key is sorted to group A→B and B→A together
          const pairKey = [a.id, targetId].sort().join('|');
          
          if (!pairMap.has(pairKey)) {
            pairMap.set(pairKey, []);
          }
          
          pairMap.get(pairKey).push({
            source: a.id,
            target: targetId,
            direction: 'OUT', // RED
            edgeType,
            confidence,
            weight: link.weight || 0.5,
            count: getLinkCount(link),
          });
        });
        
        // Incoming edges (source → a)
        a.followedBy?.forEach(link => {
          const sourceId = getLinkId(link);
          if (!ids.has(sourceId)) return;
          
          const edgeType = link.edgeType || 'FLOW_CORRELATION';
          const confidence = link.confidence || 'medium';
          
          if (filters.edgeTypes.length > 0 && !filters.edgeTypes.includes(edgeType)) return;
          if (filters.confidence && filters.confidence !== confidence) return;
          
          const pairKey = [sourceId, a.id].sort().join('|');
          
          if (!pairMap.has(pairKey)) {
            pairMap.set(pairKey, []);
          }
          
          pairMap.get(pairKey).push({
            source: sourceId,
            target: a.id,
            direction: 'IN', // GREEN
            edgeType,
            confidence,
            weight: link.weight || 0.5,
            count: getLinkCount(link),
          });
        });
      });
      
      // Step 2: Deduplicate and assign index/total for geometry
      const processedPairs = new Set();
      
      pairMap.forEach((edges, pairKey) => {
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);
        
        // Deduplicate edges (same source→target)
        const uniqueEdges = [];
        const seenKeys = new Set();
        
        edges.forEach(e => {
          const edgeKey = `${e.source}|${e.target}`;
          if (!seenKeys.has(edgeKey)) {
            seenKeys.add(edgeKey);
            uniqueEdges.push(e);
          }
        });
        
        const total = uniqueEdges.length;
        
        // Assign index and total to each edge for geometry calculation
        uniqueEdges.forEach((edge, index) => {
          links.push({
            ...edge,
            index,        // position in the pair set
            total,        // total edges between this pair
            type: edge.direction === 'IN' ? 'incoming' : 'outgoing',
            color: getEdgeColor(edge.edgeType),
          });
        });
      });
      
    } else {
      // Clusters mode - unchanged
      const added = new Set();
      connected.forEach(a => a.correlations?.forEach(c => {
        if (ids.has(c.id) && c.strength > 0.3) {
          const k = [a.id, c.id].sort().join('-');
          if (!added.has(k)) { 
            added.add(k); 
            links.push({ 
              source: a.id, 
              target: c.id, 
              type: 'correlation',
              direction: 'NEUTRAL',
              index: 0,
              total: 1,
              edgeType: 'TOKEN_OVERLAP',
              confidence: c.strength > 0.7 ? 'high' : c.strength > 0.4 ? 'medium' : 'low',
              weight: c.strength,
              color: EDGE_COLORS.TOKEN_OVERLAP,
              count: Math.ceil(c.strength * 10)
            }); 
          }
        }
      }));
    }
    
    return { nodes, links };
  }, [connected, mode, focusId, filters]);
};

// ==================== MAIN COMPONENT ====================
export default function CorrelationPage() {
  // State
  const [mode, setMode] = useState('influence');
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredRowRel, setHoveredRowRel] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [timeWindow, setTimeWindow] = useState('7d');
  
  // EPIC C2: Filters state
  const [filters, setFilters] = useState({
    edgeTypes: [],
    confidence: null,
    hideLowCoverage: false,
  });
  
  // Refs
  const graphRef = useRef();
  const containerRef = useRef();
  const initialLayoutDone = useRef(false);
  
  // Load from API
  const { apiActors, loading: apiLoading } = useActorsFromAPI(timeWindow);
  const actorsData = apiActors || fallbackActorsData;
  
  usePreventBrowserZoom(containerRef);
  
  // Process actors
  const actors = useMemo(() => 
    actorsData.map(a => ({ ...a, influenceScore: a.influenceScore || calcScore(a, actorsData), role: a.role || getRole(a) })), 
  [actorsData]);
  const connected = useMemo(() => actors.filter(a => hasDegree(a, actors)), [actors]);
  
  // Available edge types
  const availableEdgeTypes = useMemo(() => {
    const types = new Set();
    connected.forEach(a => {
      a.frontRuns?.forEach(l => types.add(l.edgeType || 'FLOW_CORRELATION'));
      a.followedBy?.forEach(l => types.add(l.edgeType || 'FLOW_CORRELATION'));
    });
    return Array.from(types);
  }, [connected]);
  
  // Graph data with filters
  const graphData = useGraphData(connected, mode, focusId, filters);
  
  // Initial layout
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0 && !initialLayoutDone.current) {
      const fg = graphRef.current;
      fg.d3Force('charge').strength(-180);
      fg.d3Force('link').distance(100).strength(0.3);
      fg.d3Force('center').strength(0.25);
      
      setTimeout(() => {
        fg.pauseAnimation();
        graphData.nodes.forEach(n => { n.fx = n.x; n.fy = n.y; });
        fg.zoomToFit(200, 50);
        setTimeout(() => {
          const currentZoom = fg.zoom();
          if (currentZoom > 1.5) fg.zoom(1.2, 100);
          else if (currentZoom < 0.5) fg.zoom(0.8, 100);
        }, 250);
        fg.resumeAnimation();
        initialLayoutDone.current = true;
      }, 600);
    }
  }, [graphData.nodes.length, graphData.nodes]);
  
  // Handlers
  const handleClick = useCallback((node) => setSelected(actors.find(a => a.id === node.id)), [actors]);
  const handleDragStart = useCallback(() => { if (graphRef.current) graphRef.current.pauseAnimation(); }, []);
  const handleDrag = useCallback((node) => { node.fx = node.x; node.fy = node.y; }, []);
  const handleDragEnd = useCallback((node) => { node.fx = node.x; node.fy = node.y; if (graphRef.current) graphRef.current.resumeAnimation(); }, []);
  
  const handleLinkClick = useCallback((link) => {
    if (link && (link.count || 1) >= CORRIDOR_THRESHOLD.clickable) {
      setSelectedEdge(link);
    }
  }, []);
  
  const handleLinkHover = useCallback((link, event) => {
    setHoveredEdge(link);
    if (link && event) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    } else {
      setTooltipPos(null);
    }
  }, []);
  
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom();
      if (z < ZOOM_MAX) graphRef.current.zoom(Math.min(z * 1.25, ZOOM_MAX), 200);
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom();
      if (z > ZOOM_MIN) graphRef.current.zoom(Math.max(z * 0.8, ZOOM_MIN), 200);
    }
  }, []);
  
  const handleReset = useCallback(() => {
    initialLayoutDone.current = false;
    graphData.nodes.forEach(n => { n.fx = undefined; n.fy = undefined; });
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
      setTimeout(() => {
        graphRef.current.pauseAnimation();
        graphData.nodes.forEach(n => { n.fx = n.x; n.fy = n.y; });
        graphRef.current.zoomToFit(200, 40);
        graphRef.current.resumeAnimation();
        initialLayoutDone.current = true;
      }, 600);
    }
    setSelected(null);
    setFocusId(null);
    setSelectedEdge(null);
  }, [graphData.nodes]);
  
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);
  
  // EPIC C3: Node Renderer with shapes and source styles
  // NOTE: Node Ring REMOVED per user feedback (v3.2) - direction info is ONLY in edges
  const renderNode = useCallback((node, ctx) => {
    const x = node.x, y = node.y;
    const isSelected = selected?.id === node.id;
    const isHovered = hovered?.id === node.id;
    const isHighlightedFromTable = hoveredRowRel && (hoveredRowRel.fromId === node.id || hoveredRowRel.toId === node.id);
    const dimmed = focusId && !node.isFocused && !isConnectedTo(node.id, focusId, connected);
    
    // Coverage-based opacity
    const coverageOpacity = getCoverageOpacity(node.coverage || 0.5);
    ctx.globalAlpha = dimmed ? 0.2 : coverageOpacity;
    
    const r = NODE_RADIUS;
    const sourceStyle = SOURCE_STYLES[node.sourceLevel] || SOURCE_STYLES.behavioral;
    
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    
    // Draw shape based on nodeType
    ctx.beginPath();
    if (node.nodeType === 'wallet') {
      // Square
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (node.nodeType === 'entity') {
      // Hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      // Circle (default for actor)
      ctx.arc(x, y, r, 0, 2 * Math.PI);
    }
    
    ctx.fillStyle = isHighlightedFromTable ? '#E0F2FE' : NODE_FILL;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Border with source-level style
    ctx.beginPath();
    if (node.nodeType === 'wallet') {
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (node.nodeType === 'entity') {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.arc(x, y, r, 0, 2 * Math.PI);
    }
    
    // Border style based on source level
    ctx.strokeStyle = isSelected ? PALETTE.primary : (isHighlightedFromTable ? '#0EA5E9' : PALETTE.primary);
    ctx.lineWidth = isSelected ? 2.5 : sourceStyle.borderWidth;
    
    if (sourceStyle.borderStyle === 'dashed') {
      ctx.setLineDash([4, 3]);
    } else if (sourceStyle.borderStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Selection ring
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, r + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? PALETTE.primary : '#9CA3AF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Label
    const fontSize = FONT_SIZE_BASE;
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label || '', x, y - 1);
    
    // Score
    ctx.font = `500 ${fontSize * 0.7}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = node.ratingColor;
    ctx.fillText(node.score || '', x, y + fontSize * 0.7);
    
    ctx.globalAlpha = 1;
  }, [selected, hovered, focusId, connected, hoveredRowRel]);
  
  // ============================================================
  // CANONICAL GRAPH GEOMETRY SPEC (STRAND-FIRST MODEL)
  // ============================================================
  // We don't draw bundles. We draw MANY LINES. Bundle emerges.
  // 
  // RULES:
  // - 1 edge  → 1 straight line
  // - 2 edges → 2 arcs, symmetric, opposite sides
  // - 3 edges → arc / straight / arc
  // - 4+ edges → all arcs, evenly distributed
  //
  // Direction (IN/OUT) affects COLOR ONLY, not geometry
  // 🟢 IN  = green
  // 🔴 OUT = red
  // ============================================================
  
  const BASE_CURVE = 12;   // px
  const MAX_CURVE = 40;    // px
  const LINE_WIDTH = 1;    // px base
  
  const renderLink = useCallback((link, ctx) => {
    if (!link.source.x || !link.target.x) return;
    
    const sx = link.source.x, sy = link.source.y;
    const tx = link.target.x, ty = link.target.y;
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const dimmed = focusId && sourceId !== focusId && targetId !== focusId;
    const isSelectedEdge = selectedEdge && 
      ((typeof selectedEdge.source === 'object' ? selectedEdge.source.id : selectedEdge.source) === sourceId) &&
      ((typeof selectedEdge.target === 'object' ? selectedEdge.target.id : selectedEdge.target) === targetId);
    const isHighlightedFromTable = hoveredRowRel && 
      ((hoveredRowRel.fromId === sourceId && hoveredRowRel.toId === targetId) ||
       (hoveredRowRel.fromId === targetId && hoveredRowRel.toId === sourceId));
    
    // Opacity by confidence (color stays constant)
    const confidenceOpacity = getConfidenceOpacity(link.confidence || 'medium');
    ctx.globalAlpha = dimmed ? 0.15 : (isSelectedEdge || isHighlightedFromTable ? 1 : confidenceOpacity);
    
    // COLOR = DIRECTION (ALWAYS VISIBLE, NEVER CHANGES ON HOVER)
    const OUTFLOW_COLOR = '#C94A4A';  // RED
    const INFLOW_COLOR = '#3BA272';   // GREEN
    const NEUTRAL_COLOR = '#6B7280';
    
    let edgeColor;
    if (isHighlightedFromTable) {
      edgeColor = '#0EA5E9';
    } else if (link.type === 'correlation' || link.direction === 'NEUTRAL') {
      edgeColor = NEUTRAL_COLOR;
    } else if (link.type === 'incoming' || link.direction === 'IN') {
      edgeColor = INFLOW_COLOR;
    } else {
      edgeColor = OUTFLOW_COLOR;
    }
    
    // Geometry calculation
    const dx = tx - sx;
    const dy = ty - sy;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    
    const index = link.index || 0;
    const total = link.total || 1;
    
    // Line width
    const strokeWidth = isSelectedEdge || isHighlightedFromTable ? LINE_WIDTH * 1.5 : LINE_WIDTH;
    
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    
    // ============================================================
    // GEOMETRY RULES
    // ============================================================
    
    if (total === 1) {
      // CASE: 1 edge → STRAIGHT LINE
      ctx.lineTo(tx, ty);
      
    } else if (total === 2) {
      // CASE: 2 edges → 2 symmetric arcs
      // index 0 → curve one side, index 1 → curve other side
      const curvature = (index === 0 ? -1 : 1) * BASE_CURVE;
      const cpx = mx + Math.cos(perpAngle) * curvature;
      const cpy = my + Math.sin(perpAngle) * curvature;
      ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      
    } else if (total === 3) {
      // CASE: 3 edges → arc / straight / arc
      if (index === 0) {
        // First → curve left
        const cpx = mx + Math.cos(perpAngle) * (-BASE_CURVE);
        const cpy = my + Math.sin(perpAngle) * (-BASE_CURVE);
        ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      } else if (index === 1) {
        // Second → straight (center)
        ctx.lineTo(tx, ty);
      } else {
        // Third → curve right
        const cpx = mx + Math.cos(perpAngle) * BASE_CURVE;
        const cpy = my + Math.sin(perpAngle) * BASE_CURVE;
        ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      }
      
    } else {
      // CASE: 4+ edges → all arcs, evenly distributed
      // Map index from 0→total to -MAX_CURVE→+MAX_CURVE
      const t = (index / (total - 1)) * 2 - 1; // -1 to +1
      const curvature = t * MAX_CURVE;
      const cpx = mx + Math.cos(perpAngle) * curvature;
      const cpy = my + Math.sin(perpAngle) * curvature;
      ctx.quadraticCurveTo(cpx, cpy, tx, ty);
    }
    
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }, [focusId, selectedEdge, hoveredRowRel]);
  
  const focusedActor = focusId ? actors.find(a => a.id === focusId) : null;
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="correlation-page">
        <main className="max-w-[1600px] mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">Influence Graph</h1>
                  {/* Graph Mode Toggle - Influence ↔ Routes */}
                  <GraphLogicToggle />
                  {apiActors && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">LIVE</span>
                  )}
                  {apiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                </div>
                <p className="text-[11px] text-gray-500">Structural relationships • Drag nodes • Click edges for details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Window */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                {['24h', '7d', '30d'].map(w => (
                  <button
                    key={w}
                    onClick={() => { setTimeWindow(w); initialLayoutDone.current = false; }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      timeWindow === w ? 'bg-white text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              
              {/* Focus Selector */}
              <select
                value={focusId || ''}
                onChange={(e) => setFocusId(e.target.value || null)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                data-testid="focus-selector"
              >
                <option value="">All actors</option>
                {actors.filter(a => a.role === 'Leader').map(a => (
                  <option key={a.id} value={a.id}>{abbreviate(a.real_name)} ({a.influenceScore})</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Mode + Filter Controls */}
          <div className="flex items-center justify-between mb-3">
            <ModeSelector mode={mode} setMode={setMode} />
          </div>
          
          {/* EPIC C2: Filter Panel */}
          {availableEdgeTypes.length > 0 && (
            <FilterPanel filters={filters} setFilters={setFilters} edgeTypes={availableEdgeTypes} />
          )}
          
          {/* EPIC C2: Professional Legend */}
          <GraphLegendV3 actorsCount={connected.length} />
          
          {/* Panels */}
          <div className={`grid gap-3 mb-4 ${selectedEdge ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <ActorPanel 
              actor={selected} 
              onClose={() => setSelected(null)} 
              onSelectEdge={setSelectedEdge}
              graphLinks={graphData.links}
            />
            <Leaderboard
              actors={actors}
              onSelect={setSelected}
              selectedId={selected?.id}
              focusId={focusId}
              setFocusId={setFocusId}
            />
            {/* Strategy Flow - Coming in Engine L1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Strategy Flow</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-medium rounded">
                  Coming in Engine (L1)
                </span>
              </div>
            </div>
            {selectedEdge && (
              <FlowTable 
                edge={selectedEdge} 
                onClose={() => setSelectedEdge(null)} 
                actors={actors}
                onHoverRow={setHoveredRowRel}
                hoveredRowId={hoveredRowRel?.id}
              />
            )}
          </div>
          
          {/* Graph Canvas */}
          <div
            ref={containerRef}
            className={`w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
            style={{ height: isFullscreen ? '100vh' : '520px' }}
            data-testid="graph-container"
          >
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
                backgroundSize: '16px 16px',
                opacity: 0.3
              }}
            />
            
            <GraphControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              onFullscreen={handleFullscreen}
            />
            
            {/* EPIC C2: Evidence Tooltip */}
            {hoveredEdge && tooltipPos && (
              <EvidenceTooltip edge={hoveredEdge} position={tooltipPos} actors={actors} />
            )}
            
            {graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeCanvasObject={renderNode}
                linkCanvasObject={renderLink}
                linkWidth={link => getEdgeWidth(link.weight || 0.5) * 3}
                linkCurvature={0}
                nodeRelSize={NODE_RADIUS}
                nodeVal={() => 1}
                onNodeClick={handleClick}
                onNodeHover={setHovered}
                onNodeDragStart={handleDragStart}
                onNodeDrag={handleDrag}
                onNodeDragEnd={handleDragEnd}
                onLinkClick={handleLinkClick}
                onLinkHover={handleLinkHover}
                linkHoverPrecision={10}
                onBackgroundClick={() => setSelected(null)}
                enableNodeDrag={true}
                enablePanInteraction={true}
                enableZoomInteraction={true}
                minZoom={ZOOM_MIN}
                maxZoom={ZOOM_MAX}
                linkDirectionalParticles={0}
                backgroundColor="transparent"
                width={isFullscreen ? window.innerWidth : 1200}
                height={isFullscreen ? window.innerHeight : 520}
                cooldownTime={50}
                warmupTicks={20}
                d3AlphaDecay={0.35}
                d3VelocityDecay={0.4}
              />
            )}
            
            <FocusBadge actor={focusedActor} onClear={() => setFocusId(null)} />
            
            {/* Hint */}
            <div className="absolute bottom-3 left-3 text-[9px] text-gray-400 bg-white/90 px-2 py-1 rounded border border-gray-100">
              Drag nodes • Scroll zoom • Click edges for details
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
