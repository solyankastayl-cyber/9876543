/**
 * P2.4.2: PNG Renderer
 * 
 * Canvas-based rendering for graph export.
 * Produces deterministic PNG output matching Influence Graph style.
 * 
 * INVARIANTS:
 * - Color = Direction (IN green, OUT red)
 * - Width = Weight (calibrated)
 * - Size = sizeWeight
 * - NO arrows, animations, hover effects
 */

import { DIRECTION_COLORS, NODE_TYPE_COLORS, EDGE_WIDTH, NODE_SIZE } from '../calibrated.adapter';

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG = {
  scale: 2,
  padding: 60,
  background: '#0F0F0F',
  fontFamily: 'Inter, system-ui, sans-serif',
};

// ============================================
// Canvas Setup
// ============================================

/**
 * Create offscreen canvas for export
 */
export function createExportCanvas(width, height, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  
  return { canvas, ctx };
}

/**
 * Draw background
 */
export function drawBackground(ctx, width, height, color = DEFAULT_CONFIG.background) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

// ============================================
// Edge Rendering
// ============================================

/**
 * Draw single edge
 */
function drawEdge(ctx, edge, nodePositions) {
  const from = nodePositions.get(edge.fromNodeId);
  const to = nodePositions.get(edge.toNodeId);
  
  if (!from || !to) return;
  
  const isOut = edge.direction === 'OUT';
  const weight = edge.weight || 0.5;
  const confidence = edge.confidence || 0.5;
  
  // Calculate control point for curve
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const offset = Math.min(30, Math.sqrt(dx * dx + dy * dy) * 0.2);
  const controlX = midX - dy * 0.1;
  const controlY = midY + dx * 0.1;
  
  // Style
  ctx.strokeStyle = isOut ? DIRECTION_COLORS.OUT : DIRECTION_COLORS.IN;
  ctx.lineWidth = Math.max(EDGE_WIDTH.MIN, weight * EDGE_WIDTH.MAX);
  ctx.globalAlpha = confidence < 0.4 ? 0.35 : Math.max(0.5, 0.5 + weight * 0.5);
  ctx.lineCap = 'round';
  
  // Draw curved line
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
  ctx.stroke();
  
  ctx.globalAlpha = 1;
}

/**
 * Draw all edges
 */
export function drawEdges(ctx, edges, nodePositions) {
  edges.forEach(edge => {
    if (!edge.hidden) {
      drawEdge(ctx, edge, nodePositions);
    }
  });
}

// ============================================
// Corridor Rendering
// ============================================

/**
 * Draw corridor (bundled edges)
 */
function drawCorridor(ctx, corridor, nodePositions) {
  // For corridors, we draw a thicker, semi-transparent bundle
  const isOut = corridor.direction === 'OUT';
  const weight = corridor.weight || 0.5;
  
  ctx.strokeStyle = isOut ? DIRECTION_COLORS.OUT : DIRECTION_COLORS.IN;
  ctx.lineWidth = Math.max(3, weight * 8);
  ctx.globalAlpha = 0.15;
  ctx.lineCap = 'round';
  
  // Draw as background bundle (simplified - just indicate presence)
  // In full implementation, would trace actual corridor path
  ctx.globalAlpha = 1;
}

/**
 * Draw all corridors
 */
export function drawCorridors(ctx, corridors, nodePositions) {
  corridors.forEach(corridor => {
    if (corridor.renderMode !== 'hidden') {
      drawCorridor(ctx, corridor, nodePositions);
    }
  });
}

// ============================================
// Node Rendering
// ============================================

/**
 * Draw single node
 */
function drawNode(ctx, node) {
  const { x, y } = node;
  const sizeWeight = node.sizeWeight || 0.5;
  const confidence = node.confidence || 1;
  const type = node.type?.toUpperCase() || 'WALLET';
  
  const radius = NODE_SIZE.MIN + sizeWeight * (NODE_SIZE.MAX - NODE_SIZE.MIN);
  const color = NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.WALLET;
  
  ctx.globalAlpha = Math.max(0.7, confidence);
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(x, y + 2, radius + 1, 0, Math.PI * 2);
  ctx.fill();
  
  // Node circle (white fill)
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Type indicator (small circle top-right)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + radius - 4, y - radius + 4, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
}

/**
 * Draw all nodes
 */
export function drawNodes(ctx, nodes) {
  nodes.forEach(node => {
    drawNode(ctx, node);
  });
}

// ============================================
// Label Rendering
// ============================================

/**
 * Draw node label
 */
function drawLabel(ctx, node) {
  const { x, y } = node;
  const sizeWeight = node.sizeWeight || 0.5;
  const type = node.type?.toUpperCase() || 'WALLET';
  const label = node.displayName || node.label || '';
  
  const radius = NODE_SIZE.MIN + sizeWeight * (NODE_SIZE.MAX - NODE_SIZE.MIN);
  const fontSize = sizeWeight > 0.7 ? 11 : sizeWeight > 0.4 ? 10 : 9;
  const color = NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.WALLET;
  
  // Main label (inside node)
  ctx.font = `600 ${fontSize}px ${DEFAULT_CONFIG.fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const displayLabel = label.length > 10 ? label.slice(0, 9) + '..' : label;
  ctx.fillText(displayLabel, x, y);
  
  // Type label (below node)
  ctx.font = `400 8px ${DEFAULT_CONFIG.fontFamily}`;
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText(node.type || '', x, y + radius + 10);
}

/**
 * Draw all labels
 */
export function drawLabels(ctx, nodes) {
  nodes.forEach(node => {
    drawLabel(ctx, node);
  });
}

// ============================================
// Legend Rendering
// ============================================

/**
 * Draw export legend
 */
export function drawLegend(ctx, width, height, isCalibrated = true) {
  const legendY = height - 30;
  const legendX = 20;
  
  ctx.font = `500 10px ${DEFAULT_CONFIG.fontFamily}`;
  
  // Direction legend
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'left';
  ctx.fillText('FLOW:', legendX, legendY);
  
  // Incoming
  ctx.fillStyle = DIRECTION_COLORS.IN;
  ctx.fillRect(legendX + 40, legendY - 5, 16, 3);
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('In', legendX + 60, legendY);
  
  // Outgoing
  ctx.fillStyle = DIRECTION_COLORS.OUT;
  ctx.fillRect(legendX + 85, legendY - 5, 16, 3);
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('Out', legendX + 105, legendY);
  
  // Calibrated badge
  if (isCalibrated) {
    ctx.fillStyle = '#30A46C';
    ctx.font = `500 9px ${DEFAULT_CONFIG.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.fillText('P2.2 Calibrated', width - 20, legendY);
  }
}

// ============================================
// Main Render Function
// ============================================

/**
 * Render complete graph to canvas
 * 
 * @param {object} params
 * @param {CanvasRenderingContext2D} params.ctx
 * @param {number} params.width
 * @param {number} params.height
 * @param {Array} params.nodes - Positioned nodes with x, y
 * @param {Array} params.edges - Edges with fromNodeId, toNodeId
 * @param {Array} params.corridors - Optional corridors
 * @param {boolean} params.isCalibrated
 */
export function renderGraph({ ctx, width, height, nodes, edges, corridors = [], isCalibrated = true }) {
  // Create node position lookup
  const nodePositions = new Map();
  nodes.forEach(node => {
    nodePositions.set(node.id, { x: node.x, y: node.y });
  });
  
  // Clear and draw background
  drawBackground(ctx, width, height);
  
  // Render pipeline (order matters!)
  drawCorridors(ctx, corridors, nodePositions);
  drawEdges(ctx, edges, nodePositions);
  drawNodes(ctx, nodes);
  drawLabels(ctx, nodes);
  drawLegend(ctx, width, height, isCalibrated);
}
