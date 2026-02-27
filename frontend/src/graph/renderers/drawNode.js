/**
 * Node Renderer - ЕДИНЫЙ для всех графов
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Адрес внутри ноды: 0xABCD…1234 (4+…+4)
 * - НЕ: "69", "91", "A3"
 * - Если текст не влезает → уменьшаем font-size, НЕ меняем формат
 * 
 * H2 - Shapes by Semantics:
 * - exchange/CEX: Double circle
 * - bridge: Diamond
 * - contract: Rounded square
 * - protocol: Hexagon
 * - default: Circle
 * 
 * H3 - Visual Semantics (states):
 * - ACCUMULATION: Green halo
 * - DISTRIBUTION: Red halo
 * - ROUTER: Dashed stroke
 */
import {
  NODE_RADIUS,
  NODE_FILL,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  NODE_STROKE_SELECTED,
  NODE_STROKE_WIDTH_SELECTED,
  TEXT_COLOR,
  TEXT_FONT,
  TEXT_SIZE,
  TEXT_WEIGHT,
} from '../core/constants.js';
import { shortenAddress } from './geometry.js';

// Exit node colors (amber)
const EXIT_NODE_FILL = '#F59E0B';
const EXIT_NODE_STROKE = '#D97706';

// State colors (для halo)
const STATE_COLORS = {
  ACCUMULATION: '#22c55e',   // green-500
  DISTRIBUTION: '#ef4444',    // red-500
  ROUTER: '#6b7280',          // gray-500 (только для dashed stroke)
};

// Node size range based on influence
const MIN_RADIUS = 14;
const MAX_RADIUS = 34;

/**
 * Calculate node radius based on influence score
 * 
 * @param {number} influenceScore - 0-1
 * @returns {number} radius
 */
function getNodeRadius(influenceScore = 0.3) {
  // Linear interpolation between min and max
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.min(1, Math.max(0, influenceScore));
}

// ============================================
// ETAP H2: Shape Drawing Functions
// ============================================

/**
 * Draw hexagon shape (for protocols/others)
 */
function drawHexagon(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * Draw rounded rectangle (for contracts)
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const left = x - width / 2;
  const top = y - height / 2;
  ctx.beginPath();
  ctx.moveTo(left + radius, top);
  ctx.lineTo(left + width - radius, top);
  ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
  ctx.lineTo(left + width, top + height - radius);
  ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
  ctx.lineTo(left + radius, top + height);
  ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
  ctx.lineTo(left, top + radius);
  ctx.quadraticCurveTo(left, top, left + radius, top);
  ctx.closePath();
}

/**
 * Draw diamond shape (for bridges/exits)
 */
function drawDiamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);      // Top
  ctx.lineTo(x + r, y);      // Right
  ctx.lineTo(x, y + r);      // Bottom
  ctx.lineTo(x - r, y);      // Left
  ctx.closePath();
}

/**
 * Draw double circle (for exchanges/CEX)
 */
function drawDoubleCircle(ctx, x, y, r, fillStyle, strokeStyle, lineWidth) {
  // Inner circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ============================================
// ETAP H3: State Rendering
// ============================================

/**
 * Apply node state visual (halo, dashed stroke, etc.)
 */
function applyNodeState(ctx, x, y, r, state) {
  if (!state || state === 'NEUTRAL') return;
  
  switch (state) {
    case 'ACCUMULATION':
      // Green halo
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = STATE_COLORS.ACCUMULATION;
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
      
    case 'DISTRIBUTION':
      // Red halo
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = STATE_COLORS.DISTRIBUTION;
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
      
    case 'ROUTER':
      // Dashed outer stroke
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = STATE_COLORS.ROUTER;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      break;
  }
}

/**
 * Get node shape type based on category/type
 */
function getNodeShape(node) {
  const category = (node.category || node.actorType || node.nodeType || '').toLowerCase();
  
  if (category.includes('exchange') || category.includes('cex')) return 'exchange';
  if (category.includes('bridge')) return 'bridge';
  if (category.includes('contract')) return 'contract';
  if (category.includes('protocol') || category.includes('infra') || category === 'others') return 'hexagon';
  if (node.type === 'CROSS_CHAIN_EXIT' || node.id?.startsWith('exit:')) return 'diamond';
  
  return 'circle';
}

/**
 * Отрисовка узла на canvas
 * 
 * ETAP H2: Different shapes for different node types
 * ETAP H3: Visual states (ACCUMULATION, DISTRIBUTION, ROUTER)
 * 
 * @param {Object} node - данные узла
 * @param {CanvasRenderingContext2D} ctx - canvas context
 * @param {Object} options - { isSelected, isHovered, isDimmed }
 */
export function drawNode(node, ctx, options = {}) {
  const { isSelected = false, isHovered = false, isDimmed = false } = options;
  const x = node.x;
  const y = node.y;
  
  if (x === undefined || y === undefined) return;
  
  // ETAP H2: Get node shape based on category
  const shape = getNodeShape(node);
  
  // ETAP D2: Calculate radius based on influence
  const influenceScore = node.influenceScore || node.sizeWeight || 
    (node.metrics?.edgeScore ? node.metrics.edgeScore / 100 : 0.3);
  const r = getNodeRadius(influenceScore);
  
  // Dimmed mode
  ctx.globalAlpha = isDimmed ? 0.2 : 1;
  
  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  
  const strokeStyle = isSelected ? NODE_STROKE_SELECTED : NODE_STROKE;
  const lineWidth = isSelected ? NODE_STROKE_WIDTH_SELECTED : NODE_STROKE_WIDTH;
  
  // Draw based on shape
  switch (shape) {
    case 'exchange':
      // ETAP H2: Double circle for exchanges/CEX
      drawDoubleCircle(ctx, x, y, r, NODE_FILL, strokeStyle, lineWidth);
      break;
      
    case 'diamond':
    case 'bridge':
      // ETAP H2: Diamond for bridges/exits
      const size = r * 1.1;
      drawDiamond(ctx, x, y, size);
      ctx.fillStyle = shape === 'diamond' ? EXIT_NODE_FILL : NODE_FILL;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      drawDiamond(ctx, x, y, size);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      if (shape === 'diamond') ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
      
    case 'contract':
      // ETAP H2: Rounded square for contracts
      drawRoundedRect(ctx, x, y, r * 2, r * 2, r * 0.2);
      ctx.fillStyle = NODE_FILL;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      drawRoundedRect(ctx, x, y, r * 2, r * 2, r * 0.2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      break;
      
    case 'hexagon':
      // ETAP H2: Hexagon for protocols/infra
      drawHexagon(ctx, x, y, r);
      ctx.fillStyle = NODE_FILL;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      drawHexagon(ctx, x, y, r);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      break;
      
    default:
      // Standard circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = NODE_FILL;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
  }
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // ETAP H3: Apply state visual (halo for ACCUMULATION/DISTRIBUTION, dashed for ROUTER)
  if (node.state && shape !== 'diamond') {
    applyNodeState(ctx, x, y, r, node.state);
  }
  
  // Selection/Hover ring
  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = isSelected ? NODE_STROKE_SELECTED : '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.globalAlpha = isDimmed ? 0.2 : 0.5;
    ctx.stroke();
    ctx.globalAlpha = isDimmed ? 0.2 : 1;
  }
  
  // Label - inside node
  const label = shortenAddress(node.label || node.id || '');
  
  // Auto-fit font size
  const maxWidth = r * 1.7;
  let fontSize = TEXT_SIZE;
  
  ctx.font = `${TEXT_WEIGHT} ${fontSize}px ${TEXT_FONT}`;
  let textWidth = ctx.measureText(label).width;
  
  while (textWidth > maxWidth && fontSize > 6) {
    fontSize -= 0.5;
    ctx.font = `${TEXT_WEIGHT} ${fontSize}px ${TEXT_FONT}`;
    textWidth = ctx.measureText(label).width;
  }
  
  ctx.fillStyle = shape === 'diamond' ? '#FFFFFF' : TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  
  // Reset
  ctx.globalAlpha = 1;
}

/**
 * Область клика для узла (чуть больше чем сам узел)
 * ETAP B2: Работает для обоих типов нод
 * ETAP D2: Учитывает динамический размер ноды
 */
export function drawNodePointerArea(node, color, ctx) {
  if (node.x === undefined || node.y === undefined) return;
  
  const isExitNode = node.type === 'CROSS_CHAIN_EXIT' || node.id?.startsWith('exit:');
  
  // ETAP D2: Calculate radius based on influence
  const influenceScore = node.influenceScore || node.sizeWeight || 0.3;
  const baseRadius = isExitNode ? NODE_RADIUS * 1.1 : getNodeRadius(influenceScore);
  
  if (isExitNode) {
    // Diamond hit area
    const size = baseRadius * 1.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(node.x, node.y - size);
    ctx.lineTo(node.x + size, node.y);
    ctx.lineTo(node.x, node.y + size);
    ctx.lineTo(node.x - size, node.y);
    ctx.closePath();
    ctx.fill();
  } else {
    // Circle hit area
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, baseRadius + 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}
