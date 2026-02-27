/**
 * Flow Layout Engine
 * 
 * Unified layout algorithm for Graph Intelligence and Influence Graph.
 * Corridor-first, flow-based layout.
 * 
 * INVARIANTS:
 * - Color = Direction (IN=green, OUT=red)
 * - Width = Weight (calibrated)
 * - Single edge = degenerate corridor
 * - Geometry = strand-first (multiple lines create bundle)
 */

// ============================================
// Constants
// ============================================

export const FLOW_CONSTANTS = {
  // Curve geometry
  BASE_CURVE: 12,        // px for 2 edges
  MAX_CURVE: 40,         // px for 4+ edges
  MIN_CURVE: 0,          // straight line
  
  // Node sizing (rank-based buckets)
  NODE_BUCKETS: [
    { max: 0.2, radius: 20, fontSize: 8 },
    { max: 0.4, radius: 24, fontSize: 9 },
    { max: 0.6, radius: 30, fontSize: 10 },
    { max: 0.8, radius: 36, fontSize: 11 },
    { max: 1.0, radius: 42, fontSize: 12 },
  ],
  
  // Edge width
  EDGE_WIDTH_MIN: 1.5,
  EDGE_WIDTH_MAX: 5,
  
  // Label fitting
  LABEL_MAX_CHARS: 9,
  LABEL_ELLIPSIS: '..',
  
  // Colors (Radix palette)
  COLORS: {
    IN: '#30A46C',       // Green (incoming)
    OUT: '#E5484D',      // Red (outgoing)
    NEUTRAL: '#6B7280',  // Gray
  },
};

// ============================================
// Node Sizing (Rank-based buckets)
// ============================================

/**
 * Get node visual properties using rank-based buckets
 * instead of linear interpolation
 * 
 * @param {number} sizeWeight - 0 to 1
 * @returns {{ radius: number, fontSize: number, bucket: number }}
 */
export function getNodeBucket(sizeWeight) {
  const weight = Math.max(0, Math.min(1, sizeWeight || 0.5));
  
  for (let i = 0; i < FLOW_CONSTANTS.NODE_BUCKETS.length; i++) {
    if (weight <= FLOW_CONSTANTS.NODE_BUCKETS[i].max) {
      return {
        ...FLOW_CONSTANTS.NODE_BUCKETS[i],
        bucket: i,
      };
    }
  }
  
  // Fallback to largest bucket
  return {
    ...FLOW_CONSTANTS.NODE_BUCKETS[FLOW_CONSTANTS.NODE_BUCKETS.length - 1],
    bucket: FLOW_CONSTANTS.NODE_BUCKETS.length - 1,
  };
}

/**
 * Get node radius with easing
 * Uses sqrt for subtle compression of large values
 */
export function getNodeRadius(sizeWeight) {
  const bucket = getNodeBucket(sizeWeight);
  return bucket.radius;
}

/**
 * Get node font size based on bucket
 */
export function getNodeFontSize(sizeWeight) {
  const bucket = getNodeBucket(sizeWeight);
  return bucket.fontSize;
}

// ============================================
// Label Fitting
// ============================================

/**
 * Fit label to node with ellipsis
 * 
 * @param {string} label - Full label text
 * @param {number} maxWidth - Available width in node
 * @returns {{ line1: string, line2?: string }}
 */
export function fitLabel(label, maxWidth) {
  if (!label) return { line1: '' };
  
  const maxChars = FLOW_CONSTANTS.LABEL_MAX_CHARS;
  
  if (label.length <= maxChars) {
    return { line1: label };
  }
  
  // Try to fit in one line with ellipsis
  return {
    line1: label.slice(0, maxChars - 2) + FLOW_CONSTANTS.LABEL_ELLIPSIS,
  };
}

/**
 * Smart label shortener for addresses
 * Shows prefix and suffix with ellipsis in middle
 */
export function shortenAddress(address, maxChars = 9) {
  if (!address) return '';
  if (address.length <= maxChars) return address;
  
  const prefixLen = Math.ceil(maxChars / 2);
  const suffixLen = Math.floor(maxChars / 2) - 2;
  
  return `${address.slice(0, prefixLen)}..${address.slice(-suffixLen)}`;
}

// ============================================
// Edge Geometry (Strand-first model)
// ============================================

/**
 * Calculate curve offset for edge based on index in pair
 * 
 * RULES:
 * - 1 edge  → straight line (offset = 0)
 * - 2 edges → symmetric arcs, opposite sides
 * - 3 edges → arc / straight / arc
 * - 4+ edges → all arcs, evenly distributed
 * 
 * @param {number} index - Position in pair (0-based)
 * @param {number} total - Total edges between this pair
 * @returns {number} Curve offset in pixels
 */
export function getCurveOffset(index, total) {
  const { BASE_CURVE, MAX_CURVE, MIN_CURVE } = FLOW_CONSTANTS;
  
  if (total === 1) {
    // Single edge → straight line
    return MIN_CURVE;
  }
  
  if (total === 2) {
    // 2 edges → symmetric arcs
    return index === 0 ? -BASE_CURVE : BASE_CURVE;
  }
  
  if (total === 3) {
    // 3 edges → arc / straight / arc
    if (index === 0) return -BASE_CURVE;
    if (index === 1) return MIN_CURVE;
    return BASE_CURVE;
  }
  
  // 4+ edges → evenly distributed arcs
  // Map index from 0→(total-1) to -MAX_CURVE→+MAX_CURVE
  const t = (index / (total - 1)) * 2 - 1; // -1 to +1
  return t * MAX_CURVE;
}

/**
 * Generate SVG path for a curved edge
 * 
 * @param {object} params
 * @param {number} params.sx - Source X
 * @param {number} params.sy - Source Y
 * @param {number} params.tx - Target X
 * @param {number} params.ty - Target Y
 * @param {number} params.index - Edge index in pair
 * @param {number} params.total - Total edges in pair
 * @returns {string} SVG path d attribute
 */
export function getEdgePath({ sx, sy, tx, ty, index = 0, total = 1 }) {
  // Calculate midpoint and perpendicular angle
  const dx = tx - sx;
  const dy = ty - sy;
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  
  // Get curve offset
  const offset = getCurveOffset(index, total);
  
  if (offset === 0) {
    // Straight line
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }
  
  // Curved line with control point
  const cpx = mx + Math.cos(perpAngle) * offset;
  const cpy = my + Math.sin(perpAngle) * offset;
  
  return `M ${sx} ${sy} Q ${cpx} ${cpy} ${tx} ${ty}`;
}

// ============================================
// Edge Width
// ============================================

/**
 * Get edge stroke width based on weight
 * Uses sqrt for subtle compression
 */
export function getEdgeStrokeWidth(weight) {
  const w = Math.max(0, Math.min(1, weight || 0.5));
  const { EDGE_WIDTH_MIN, EDGE_WIDTH_MAX } = FLOW_CONSTANTS;
  
  // Use sqrt for subtle easing
  const eased = Math.sqrt(w);
  return EDGE_WIDTH_MIN + eased * (EDGE_WIDTH_MAX - EDGE_WIDTH_MIN);
}

// ============================================
// Corridor Aggregation
// ============================================

/**
 * Group edges into corridors (pairs between same nodes)
 * 
 * @param {Array} edges - Array of edges with fromNodeId, toNodeId
 * @returns {Map<string, object>} Map of pairKey → corridor data
 */
export function buildCorridors(edges) {
  const corridors = new Map();
  
  edges.forEach((edge, i) => {
    // Create sorted pair key to group A→B and B→A
    const pairKey = [edge.fromNodeId, edge.toNodeId].sort().join('|');
    
    if (!corridors.has(pairKey)) {
      corridors.set(pairKey, {
        pairKey,
        edges: [],
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
      });
    }
    
    corridors.get(pairKey).edges.push({
      ...edge,
      corridorIndex: corridors.get(pairKey).edges.length,
    });
  });
  
  // Assign total count to each edge
  corridors.forEach(corridor => {
    const total = corridor.edges.length;
    corridor.edges.forEach((edge, index) => {
      edge.corridorIndex = index;
      edge.corridorTotal = total;
    });
  });
  
  return corridors;
}

/**
 * Flatten corridors back to edges with index/total for rendering
 */
export function flattenCorridors(corridors) {
  const edges = [];
  
  corridors.forEach(corridor => {
    corridor.edges.forEach(edge => {
      edges.push(edge);
    });
  });
  
  return edges;
}

// ============================================
// Layout Positions (Circular as default)
// ============================================

/**
 * Calculate circular layout positions for nodes
 * 
 * @param {Array} nodes - Array of nodes
 * @param {number} width - Container width
 * @param {number} height - Container height
 * @param {object} options - Layout options
 * @returns {Array} Nodes with x, y positions
 */
export function calculateCircularLayout(nodes, width, height, options = {}) {
  const {
    centerX = width / 2,
    centerY = height / 2,
    radiusRatio = 0.35,
    startAngle = -Math.PI / 2,
  } = options;
  
  const radius = Math.min(width, height) * radiusRatio;
  
  return nodes.map((node, i) => {
    const angle = startAngle + (2 * Math.PI * i) / nodes.length;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

// ============================================
// Full Processing Pipeline
// ============================================

/**
 * Process raw graph data for flow-based rendering
 * 
 * @param {object} graphData - { nodes, edges }
 * @param {number} width - Container width
 * @param {number} height - Container height
 * @returns {object} { nodes, edges, corridors }
 */
export function processGraphForFlow(graphData, width, height) {
  const { nodes = [], edges = [] } = graphData;
  
  // 1. Build corridors from edges
  const corridors = buildCorridors(edges);
  
  // 2. Flatten back with index/total
  const processedEdges = flattenCorridors(corridors);
  
  // 3. Calculate node positions (circular layout as default)
  const positionedNodes = calculateCircularLayout(nodes, width, height);
  
  // 4. Apply rank-based sizing to nodes
  const styledNodes = positionedNodes.map(node => {
    const bucket = getNodeBucket(node.sizeWeight);
    const label = fitLabel(node.displayName || node.label || '', bucket.radius * 2);
    
    return {
      ...node,
      radius: bucket.radius,
      fontSize: bucket.fontSize,
      bucket: bucket.bucket,
      labelLines: label,
    };
  });
  
  return {
    nodes: styledNodes,
    edges: processedEdges,
    corridors: Array.from(corridors.values()),
  };
}

// ============================================
// Export Default
// ============================================

export default {
  FLOW_CONSTANTS,
  getNodeBucket,
  getNodeRadius,
  getNodeFontSize,
  fitLabel,
  shortenAddress,
  getCurveOffset,
  getEdgePath,
  getEdgeStrokeWidth,
  buildCorridors,
  flattenCorridors,
  calculateCircularLayout,
  processGraphForFlow,
};
