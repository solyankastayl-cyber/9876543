/**
 * P2.2 + P2.3.3: Calibrated Graph Adapter
 * 
 * Transforms calibrated graph data for visualization.
 * 
 * P2.2 INVARIANTS:
 * - Color = DIRECTION (green=incoming, red=outgoing)
 * - Width = WEIGHT (from calibration)
 * - No arrows, animations, or rainbow colors
 * 
 * P2.3.3 OPTIMIZATIONS:
 * - versionKey for stable memoization
 * - Pre-computed visual properties (no calculations in render)
 * - Ready-to-draw format for graph engine
 */

// ============================================
// Constants - P2.2 Visual Invariants
// ============================================

/** 
 * Edge colors based on direction ONLY
 * Per GRAPH_INVARIANTS.md - color encodes direction
 */
export const DIRECTION_COLORS = {
  IN: '#30A46C',   // Green for incoming (Radix green)
  OUT: '#E5484D',  // Red for outgoing (Radix red)
};

/**
 * Edge width range
 * Maps calibrated weight [0.1, 1.0] to pixel width
 */
export const EDGE_WIDTH = {
  MIN: 1.5,
  MAX: 6,
};

/**
 * Node size range
 * Maps calibrated sizeWeight [0.1, 1.0] to pixel radius
 */
export const NODE_SIZE = {
  MIN: 16,
  MAX: 42,
};

/**
 * Node type colors (category-based, system-wide consistent)
 */
export const NODE_TYPE_COLORS = {
  CEX: '#E5484D',
  DEX: '#30A46C',
  Bridge: '#F59E0B',
  Wallet: '#6366F1',
  WALLET: '#6366F1',
  TOKEN: '#6366F1',
  CONTRACT: '#8B5CF6',
  CROSS_CHAIN_EXIT: '#F59E0B', // ETAP B2: Amber for exit nodes
};

// ============================================
// P2.3.3: Version Key (CRITICAL for memoization)
// ============================================

/**
 * Generate stable version key for graph snapshot
 * 
 * Used by useMemo/useEffect to prevent unnecessary re-renders.
 * Changes ONLY when actual graph data changes.
 * 
 * @param {object} snapshot - Graph snapshot from API
 * @returns {string} Stable version key
 */
export function getVersionKey(snapshot) {
  if (!snapshot) return 'empty';
  
  const sid = snapshot.snapshotId || snapshot.id || 'na';
  const mode = snapshot.calibrationMeta ? 'calibrated' : 'raw';
  const version = snapshot.calibrationMeta?.version || 'none';
  const nodeCount = snapshot.nodes?.length || 0;
  const edgeCount = snapshot.edges?.length || 0;
  
  return `${sid}:${mode}:${version}:${nodeCount}:${edgeCount}`;
}

// ============================================
// Edge Processing
// ============================================

/**
 * Get edge color based on direction
 * 
 * INVARIANT: Color = Direction ONLY
 * - Green (#30A46C) = Incoming
 * - Red (#E5484D) = Outgoing
 * 
 * @param {object} edge - Edge with direction info
 * @returns {string} Hex color
 */
export function getEdgeColor(edge) {
  if (edge.direction === 'IN') return DIRECTION_COLORS.IN;
  if (edge.direction === 'OUT') return DIRECTION_COLORS.OUT;
  return DIRECTION_COLORS.OUT;
}

/**
 * Get edge width from calibrated weight
 * 
 * INVARIANT: Width = Weight (from calibration)
 * 
 * @param {object} edge - Edge with weight property
 * @returns {number} Pixel width
 */
export function getEdgeWidth(edge) {
  const weight = edge.weight || 0.5;
  const normalized = Math.max(0.1, Math.min(1.0, weight));
  return EDGE_WIDTH.MIN + normalized * (EDGE_WIDTH.MAX - EDGE_WIDTH.MIN);
}

/**
 * Get edge opacity from confidence + weight
 * 
 * P2.3.3: Pre-computed, not calculated in render
 * - Low confidence (< 0.4) → faded
 * - Low weight → slightly transparent
 * 
 * @param {object} edge - Edge with confidence/weight
 * @returns {number} Opacity [0.15, 1.0]
 */
export function getEdgeOpacity(edge) {
  const confidence = edge.confidence || 0.5;
  const weight = edge.weight || 0.5;
  
  // Low confidence = faded
  if (confidence < 0.4) return 0.35;
  
  // Weight affects opacity slightly
  return Math.max(0.5, 0.5 + weight * 0.5);
}

/**
 * P2.3.3: Map edge to render-ready format
 * 
 * All visual properties pre-computed.
 * Graph engine just draws, no calculations.
 * 
 * @param {object} edge - Raw edge from API
 * @returns {object} Edge with pre-computed visual properties
 */
function mapEdgeForRender(edge) {
  const isOut = edge.direction === 'OUT';
  const weight = edge.weight || 0.5;
  const confidence = edge.confidence || 0.5;
  
  return {
    // Identity
    id: edge.id,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    
    // Data (for tooltips)
    type: edge.type,
    chain: edge.chain,
    meta: edge.meta,
    
    // P2.3.3: Pre-computed visual properties
    stroke: isOut ? DIRECTION_COLORS.OUT : DIRECTION_COLORS.IN,
    strokeWidth: Math.max(EDGE_WIDTH.MIN, weight * EDGE_WIDTH.MAX),
    opacity: confidence < 0.4 ? 0.35 : Math.max(0.5, 0.5 + weight * 0.5),
    
    // Original values (for hover enhancement)
    weight,
    confidence,
    direction: edge.direction || 'OUT',
    
    // Flags
    hidden: edge.hidden || false,
  };
}

/**
 * Transform edge for P2.2 rendering (legacy API)
 */
export function transformEdge(edge) {
  return {
    ...edge,
    _visual: {
      color: getEdgeColor(edge),
      width: getEdgeWidth(edge),
      opacity: getEdgeOpacity(edge),
      hidden: edge.hidden || false,
    },
  };
}

/**
 * Check if edge should be rendered
 */
export function shouldRenderEdge(edge) {
  return !edge._visual?.hidden && !edge.hidden;
}

// ============================================
// Node Processing
// ============================================

/**
 * Get node size from calibrated sizeWeight
 * 
 * INVARIANT: Size = Aggregated Activity Weight
 * 
 * @param {object} node - Node with sizeWeight property
 * @returns {number} Pixel radius
 */
export function getNodeSize(node) {
  const sizeWeight = node.sizeWeight || 0.5;
  const normalized = Math.max(0.1, Math.min(1.0, sizeWeight));
  return NODE_SIZE.MIN + normalized * (NODE_SIZE.MAX - NODE_SIZE.MIN);
}

/**
 * Get node color from type
 */
export function getNodeColor(node) {
  const type = node.type?.toUpperCase() || 'WALLET';
  return NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.WALLET;
}

/**
 * P2.3.3: Map node to render-ready format
 * 
 * All visual properties pre-computed.
 * ETAP B2: Special handling for CROSS_CHAIN_EXIT nodes
 * 
 * @param {object} node - Raw node from API
 * @returns {object} Node with pre-computed visual properties
 */
function mapNodeForRender(node) {
  const sizeWeight = node.sizeWeight || 0.5;
  const confidence = node.confidence || 1.0;
  const type = node.type?.toUpperCase() || 'WALLET';
  
  // ETAP B2: Special handling for exit nodes
  const isCrossChainExit = type === 'CROSS_CHAIN_EXIT';
  
  return {
    // Identity
    id: node.id,
    type: node.type,
    
    // Display
    label: node.label || node.displayName,
    displayName: node.displayName,
    
    // P2.3.3: Pre-computed visual properties
    radius: isCrossChainExit ? 20 : NODE_SIZE.MIN + sizeWeight * (NODE_SIZE.MAX - NODE_SIZE.MIN),
    fontSize: isCrossChainExit ? 11 : sizeWeight > 0.7 ? 12 : sizeWeight > 0.4 ? 10 : 9,
    color: NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.WALLET,
    opacity: Math.max(0.7, confidence),
    
    // ETAP B2: Exit node specific props
    isCrossChainExit,
    targetNetwork: node.meta?.targetNetwork || null,
    exitProtocol: node.meta?.protocol || null,
    shape: isCrossChainExit ? 'diamond' : 'circle',
    
    // Original values
    sizeWeight,
    confidence,
  };
}

/**
 * Transform node for P2.2 rendering (legacy API)
 */
export function transformNode(node) {
  return {
    ...node,
    _visual: {
      size: getNodeSize(node),
      color: getNodeColor(node),
      opacity: node.confidence || 1.0,
    },
  };
}

// ============================================
// Corridor Processing (Visual Bundling)
// ============================================

/**
 * Get corridor color based on dominant direction
 */
export function getCorridorColor(corridor) {
  return corridor.direction === 'IN' ? DIRECTION_COLORS.IN : DIRECTION_COLORS.OUT;
}

/**
 * Get corridor width from aggregated weight
 */
export function getCorridorWidth(corridor) {
  const weight = corridor.weight || 0.5;
  // Corridors are wider (bundle multiple edges)
  return Math.max(3, weight * 8);
}

/**
 * P2.3.3: Map corridor to render-ready format
 */
function mapCorridorForRender(corridor) {
  const weight = corridor.weight || 0.5;
  const isOut = corridor.direction === 'OUT';
  
  return {
    key: corridor.key,
    edgeIds: corridor.edgeIds || [],
    
    // Pre-computed visual
    stroke: isOut ? DIRECTION_COLORS.OUT : DIRECTION_COLORS.IN,
    strokeWidth: Math.max(3, weight * 8),
    opacity: 0.25,
    
    // State
    renderMode: corridor.renderMode || 'collapsed',
    expanded: corridor.expanded || false,
    
    // Data
    weight,
    direction: corridor.direction || 'OUT',
    edgeCount: corridor.edgeCount || 0,
  };
}

/**
 * Transform corridor for P2.2 rendering (legacy API)
 */
export function transformCorridor(corridor) {
  return {
    ...corridor,
    _visual: {
      color: getCorridorColor(corridor),
      width: getCorridorWidth(corridor),
      opacity: 0.3 + (corridor.confidence || 0.5) * 0.5,
    },
  };
}

// ============================================
// P2.3.3: Full Graph Adaptation (MAIN API)
// ============================================

/**
 * Adapt calibrated graph for rendering
 * 
 * P2.3.3 CRITICAL: This is the ONLY function that should be called.
 * Returns fully pre-computed data ready for graph engine.
 * 
 * useMemo dependency: [getVersionKey(snapshot)]
 * 
 * @param {object} snapshot - Raw graph snapshot from API
 * @returns {object} Render-ready graph data
 */
export function adaptCalibratedGraph(snapshot) {
  if (!snapshot) return null;
  
  return {
    // P2.3.3: Stable version key for memoization
    versionKey: getVersionKey(snapshot),
    
    // Pre-computed render data
    nodes: (snapshot.nodes || []).map(mapNodeForRender),
    edges: (snapshot.edges || []).map(mapEdgeForRender),
    corridors: (snapshot.corridors || []).map(mapCorridorForRender),
    
    // Metadata
    snapshotId: snapshot.snapshotId,
    isCalibrated: !!snapshot.calibrationMeta,
    calibrationVersion: snapshot.calibrationMeta?.version || null,
    
    // Stats
    nodeCount: snapshot.nodes?.length || 0,
    edgeCount: snapshot.edges?.length || 0,
    corridorCount: snapshot.corridors?.length || 0,
  };
}

// ============================================
// Full Graph Transformation (Legacy API)
// ============================================

/**
 * Transform entire graph for P2.2 rendering
 * @deprecated Use adaptCalibratedGraph instead
 */
export function transformGraphForRendering(graph) {
  if (!graph) return null;
  
  return {
    ...graph,
    nodes: (graph.nodes || []).map(transformNode),
    edges: (graph.edges || []).map(transformEdge),
    corridors: (graph.corridors || []).map(transformCorridor),
    _isCalibrated: !!graph.calibrationMeta,
  };
}

/**
 * Check if graph has calibration data
 */
export function isGraphCalibrated(graph) {
  return !!(graph?.calibrationMeta);
}

// ============================================
// Legend Data
// ============================================

/**
 * Get legend items for P2.2 style
 * 
 * @returns {object} Legend configuration
 */
export function getP22Legend() {
  return {
    direction: [
      { label: 'Incoming', color: DIRECTION_COLORS.IN },
      { label: 'Outgoing', color: DIRECTION_COLORS.OUT },
    ],
    nodeTypes: Object.entries(NODE_TYPE_COLORS).map(([type, color]) => ({
      label: type,
      color,
    })),
    help: [
      'Line color = flow direction',
      'Line thickness = transaction weight',
      'Node size = activity volume',
    ],
  };
}
