/**
 * Edge Renderer - ЕДИНЫЙ для всех графов
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - ТОЛЬКО 2 цвета: INFLOW (зелёный), OUTFLOW (красный)
 * - ❌ НЕТ серого/нейтрального цвета
 * - Цвет определяется по netFlow: outflow > inflow → RED, иначе GREEN
 * - Линия КАСАЕТСЯ окружности узла
 * - ❌ СТРЕЛОК НЕТ
 */
import {
  NODE_RADIUS,
  EDGE_INFLOW_COLOR,
  EDGE_OUTFLOW_COLOR,
  EDGE_WIDTH_BASE,
  EDGE_WIDTH_MAX,
} from '../core/constants.js';
import { clipToCircle, getCorridorOffset, buildCorridorPath } from './geometry.js';

// ETAP B2: Exit edge color (amber для cross-chain)
const EDGE_EXIT_COLOR = '#F59E0B';

/**
 * Получить цвет связи по направлению потока
 * 
 * ПРАВИЛО: direction определяется по netFlow
 * - outflowUsd > inflowUsd → RED (OUTFLOW)
 * - иначе → GREEN (INFLOW)
 * 
 * ❌ НЕТ СЕРОГО
 */
function getEdgeColor(edge, type) {
  // EXIT edges → amber
  if (type === 'EXIT') return EDGE_EXIT_COLOR;
  
  // Определяем по netFlow
  const outflow = edge.rawEvidence?.outflowUsd || edge.outflowUsd || 0;
  const inflow = edge.rawEvidence?.inflowUsd || edge.inflowUsd || 0;
  const netFlow = edge.rawEvidence?.netFlowUsd ?? edge.netFlowUsd ?? (outflow - inflow);
  
  // Также проверяем direction флаг если есть
  const direction = edge.direction || '';
  
  // netFlow > 0 означает outflow доминирует → RED
  // netFlow < 0 означает inflow доминирует → GREEN
  // Если netFlow == 0, используем direction
  if (netFlow > 0) return EDGE_OUTFLOW_COLOR;
  if (netFlow < 0) return EDGE_INFLOW_COLOR;
  
  // Fallback на direction
  if (direction === 'OUT' || direction === 'out') return EDGE_OUTFLOW_COLOR;
  if (direction === 'IN' || direction === 'in') return EDGE_INFLOW_COLOR;
  
  // Последний fallback — если вообще нет данных, считаем INFLOW
  // (лучше зелёный чем серый)
  return EDGE_INFLOW_COLOR;
}

/**
 * Стиль ребра на основе состояния (PRESSURE/DOMINANT/NORMAL)
 */
function getEdgeStateStyle(state, baseWeight = 0.5, isSelected = false) {
  const baseThickness = EDGE_WIDTH_BASE + (baseWeight * (EDGE_WIDTH_MAX - EDGE_WIDTH_BASE));
  
  switch (state) {
    case 'DOMINANT':
      return {
        thickness: isSelected ? baseThickness * 2 : baseThickness * 1.5,
        opacity: 1.0,
        glow: true,
      };
      
    case 'PRESSURE':
      return {
        thickness: isSelected ? baseThickness * 1.8 : baseThickness * 1.2,
        opacity: 0.9,
        glow: false,
      };
      
    case 'NORMAL':
    default:
      return {
        thickness: isSelected ? baseThickness * 1.5 : baseThickness,
        opacity: isSelected ? 1 : 0.8,
        glow: false,
      };
  }
}

/**
 * Получить толщину связи по весу (legacy, now uses getEdgeStateStyle)
 */
function getEdgeWidth(weight = 0.5, isSelected = false) {
  const base = EDGE_WIDTH_BASE + (weight * (EDGE_WIDTH_MAX - EDGE_WIDTH_BASE));
  return isSelected ? base * 1.5 : base;
}

/**
 * Отрисовка связи на canvas
 * 
 * ETAP H3: Edge states (NORMAL, PRESSURE, DOMINANT)
 * 
 * @param {Object} link - данные связи { source, target, direction, weight, index, total, type, state }
 * @param {CanvasRenderingContext2D} ctx - canvas context
 * @param {Object} options - { isSelected, isDimmed, isHidden }
 */
export function drawEdge(link, ctx, options = {}) {
  const { isSelected = false, isDimmed = false, isHidden = false } = options;
  
  if (isHidden) return;
  
  const source = link.source;
  const target = link.target;
  
  if (!source?.x || !target?.x) return;
  
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;
  
  // ETAP B2: Check if this is an exit edge
  const isExitEdge = link.type === 'EXIT' || target.id?.startsWith('exit:');
  
  // ETAP H1: Clip to circle edges (линия касается окружности, не входит внутрь)
  // Use node radius from node data if available
  const sourceRadius = source.radius || NODE_RADIUS;
  const targetRadius = target.radius || NODE_RADIUS;
  const start = clipToCircle(sx, sy, tx, ty, sourceRadius);
  const end = clipToCircle(tx, ty, sx, sy, targetRadius);
  
  // ETAP H3: Get edge style based on state
  const edgeState = link.state || link.originalEdge?.state || 'NORMAL';
  const style = getEdgeStateStyle(edgeState, link.weight, isSelected);
  
  // Dimmed mode
  ctx.globalAlpha = isDimmed ? 0.15 : style.opacity;
  
  // Color based on netFlow (NO GRAY!)
  const color = getEdgeColor(link, isExitEdge ? 'EXIT' : null);
  
  // Corridor offset
  const offset = getCorridorOffset(link.index || 0, link.total || 1);
  
  // ETAP H3: Draw glow for DOMINANT edges
  if (style.glow && !isDimmed) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = style.thickness + 4;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    if (offset === 0) {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    } else {
      const { cpx, cpy } = buildCorridorPath(start.x, start.y, end.x, end.y, offset);
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(cpx, cpy, end.x, end.y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = isDimmed ? 0.15 : style.opacity;
  }
  
  // Main edge
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = style.thickness;
  ctx.lineCap = 'round';
  
  // ETAP B2: Dashed line for exit edges
  if (isExitEdge) {
    ctx.setLineDash([8, 4]);
  } else {
    ctx.setLineDash([]);
  }
  
  if (offset === 0) {
    // Прямая линия
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  } else {
    // Curved line для corridor
    const { cpx, cpy } = buildCorridorPath(start.x, start.y, end.x, end.y, offset);
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cpx, cpy, end.x, end.y);
  }
  
  ctx.stroke();
  
  // Reset
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * Область клика для связи
 */
export function drawEdgePointerArea(link, color, ctx) {
  const source = link.source;
  const target = link.target;
  
  if (!source?.x || !target?.x) return;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 10; // Широкая область для клика
  ctx.beginPath();
  ctx.moveTo(source.x, source.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
}
