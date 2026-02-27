/**
 * Link Renderer - ЕДИНЫЙ для Influence и Routers
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - ТОЛЬКО 2 цвета: IN = зелёный (#30A46C), OUT = красный (#E5484D)
 * - ❌ НЕТ серого/нейтрального цвета
 * - Линия КАСАЕТСЯ окружности узла (snapping)
 * - Direction определяется по netFlow или from/to относительно subject
 */

import { snapLineToCircles, getCorridorOffset, buildCorridorPath } from '../core/geometry.js';
import { getNodeRadius } from './drawNode.js';

// ============ ЦВЕТА (ТОЛЬКО 2!) ============
const COLORS = {
  inflow: '#30A46C',   // Зелёный = IN
  outflow: '#E5484D',  // Красный = OUT
};

/**
 * Определить цвет ребра по direction
 * 
 * ПРАВИЛО:
 * - direction === 'IN' → зелёный
 * - direction === 'OUT' → красный
 * - Если direction нет → вычисляем по netFlow
 * - Fallback: зелёный (лучше чем серый)
 * 
 * @param {Object} link - данные ребра
 * @returns {string} - hex цвет
 */
function getLinkColor(link) {
  // Явный direction
  const dir = (link.direction || '').toUpperCase();
  if (dir === 'IN') return COLORS.inflow;
  if (dir === 'OUT') return COLORS.outflow;
  
  // Вычисляем по netFlow
  const netFlow = link.netFlowUsd ?? link.rawEvidence?.netFlowUsd ?? null;
  if (netFlow !== null) {
    // netFlow > 0 → outflow доминирует → RED
    // netFlow < 0 → inflow доминирует → GREEN
    return netFlow > 0 ? COLORS.outflow : COLORS.inflow;
  }
  
  // Вычисляем по inflow/outflow
  const inflow = link.inflowUsd ?? link.rawEvidence?.inflowUsd ?? 0;
  const outflow = link.outflowUsd ?? link.rawEvidence?.outflowUsd ?? 0;
  if (inflow > 0 || outflow > 0) {
    return outflow > inflow ? COLORS.outflow : COLORS.inflow;
  }
  
  // Fallback по value (как в референсе)
  if (typeof link.value === 'number') {
    return link.value < 0 ? COLORS.outflow : COLORS.inflow;
  }
  
  // Последний fallback — зелёный (лучше чем серый!)
  return COLORS.inflow;
}

/**
 * Получить толщину линии на основе weight/state
 */
function getLinkWidth(link, globalScale, opts = {}) {
  const { active = false } = opts;
  
  const base = Math.max(0.8, 1.2 / globalScale);
  const weight = link.weight ?? 0.3;
  
  let width = base + weight * 2;
  
  // State модификаторы
  if (link.state === 'DOMINANT') {
    width *= 1.5;
  } else if (link.state === 'PRESSURE') {
    width *= 1.2;
  }
  
  // Active path
  if (active) {
    width *= 1.3;
  }
  
  return width;
}

/**
 * Отрисовка ребра на canvas
 * 
 * @param {Object} link - данные ребра { source, target, direction, weight, state, ... }
 * @param {CanvasRenderingContext2D} ctx - canvas context
 * @param {number} globalScale - текущий zoom scale
 * @param {Object} opts - { active, dimmed }
 */
export function drawLink(link, ctx, globalScale, opts = {}) {
  const { active = false, dimmed = false } = opts;
  
  const source = link.source;
  const target = link.target;
  
  // Проверяем что source и target — объекты с координатами
  if (!source || !target) return;
  if (typeof source !== 'object' || typeof target !== 'object') return;
  if (source.x === undefined || target.x === undefined) return;
  
  ctx.save();
  
  // ============ SNAPPING К ОКРУЖНОСТЯМ ============
  const sr = getNodeRadius(source);
  const tr = getNodeRadius(target);
  
  const { sx, sy, ex, ey } = snapLineToCircles(
    source.x, source.y, sr,
    target.x, target.y, tr,
    4 // padding — линия начинается на 4px от границы круга
  );
  
  // ============ CORRIDOR OFFSET ============
  const corridorOffset = getCorridorOffset(
    link.connectionIndex || link.index || 0,
    link.total || 1
  );
  
  // ============ ЦВЕТ И ТОЛЩИНА ============
  const color = getLinkColor(link);
  const width = getLinkWidth(link, globalScale, { active });
  
  // ============ OPACITY ============
  let opacity = dimmed ? 0.12 : 0.85;
  if (active) opacity = 1.0;
  
  // Если есть weight, модулируем opacity
  if (!dimmed && !active && link.weight !== undefined) {
    opacity = 0.4 + link.weight * 0.5;
  }
  
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  
  // ============ GLOW для DOMINANT/PRESSURE ============
  if ((link.state === 'DOMINANT' || link.state === 'PRESSURE') && !dimmed) {
    ctx.shadowBlur = 10 / globalScale;
    ctx.shadowColor = color;
  }
  
  // ============ РИСУЕМ ЛИНИЮ ============
  ctx.beginPath();
  
  if (corridorOffset === 0) {
    // Прямая линия
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
  } else {
    // Кривая для corridor
    const { cpx, cpy } = buildCorridorPath(sx, sy, ex, ey, corridorOffset);
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
  }
  
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

/**
 * Map direction относительно subject address
 * 
 * ПРАВИЛО:
 * - edge.from === subject → OUT
 * - edge.to === subject → IN
 * - иначе → null (скрывать или показывать отдельно)
 * 
 * @param {Object} edge - { from, to, source, target }
 * @param {string} subject - адрес, относительно которого определяем direction
 * @returns {'IN'|'OUT'|null}
 */
export function mapDirection(edge, subject) {
  if (!subject) return null;
  
  const s = subject.toLowerCase();
  const from = (edge.from ?? edge.source?.id ?? edge.source ?? '').toLowerCase();
  const to = (edge.to ?? edge.target?.id ?? edge.target ?? '').toLowerCase();
  
  if (from === s) return 'OUT';
  if (to === s) return 'IN';
  
  return null;
}

export default { drawLink, mapDirection, getLinkColor };
