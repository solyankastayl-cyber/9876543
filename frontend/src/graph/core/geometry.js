/**
 * Graph Geometry Utils - ЕДИНОЕ ЯДРО
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Рёбра КАСАЮТСЯ окружности узла, не входят в центр
 * - Используем единую математику для Influence и Routers
 */

/**
 * Snap line endpoints to circle boundaries
 * 
 * Вместо рисования линии от центра к центру,
 * обрезаем на радиусе каждой окружности
 * 
 * @param {number} ax - x центра первого узла
 * @param {number} ay - y центра первого узла  
 * @param {number} ar - радиус первого узла
 * @param {number} bx - x центра второго узла
 * @param {number} by - y центра второго узла
 * @param {number} br - радиус второго узла
 * @param {number} pad - дополнительный отступ (default 2)
 * @returns {{ sx, sy, ex, ey }} - координаты начала и конца линии
 */
export function snapLineToCircles(ax, ay, ar, bx, by, br, pad = 2) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Единичный вектор направления
  const ux = dx / dist;
  const uy = dy / dist;
  
  // Точка начала (на границе первой окружности)
  const sx = ax + ux * (ar + pad);
  const sy = ay + uy * (ar + pad);
  
  // Точка конца (на границе второй окружности)
  const ex = bx - ux * (br + pad);
  const ey = by - uy * (br + pad);
  
  return { sx, sy, ex, ey };
}

/**
 * Calculate corridor offset for multiple links between same nodes
 * 
 * @param {number} index - индекс линка (0, 1, 2...)
 * @param {number} total - всего линков между этими узлами
 * @returns {number} - смещение перпендикулярно линии
 */
export function getCorridorOffset(index, total) {
  if (total <= 1) return 0;
  
  // Alternating sides: 1, -1, 2, -2, 3, -3...
  const side = index % 2 === 0 ? 1 : -1;
  const level = Math.ceil((index + 1) / 2);
  
  return side * level * 8; // 8px между линиями
}

/**
 * Build control point for curved corridor path
 * 
 * @param {number} sx - start x
 * @param {number} sy - start y
 * @param {number} ex - end x
 * @param {number} ey - end y
 * @param {number} offset - corridor offset
 * @returns {{ cpx, cpy }} - control point для quadraticCurveTo
 */
export function buildCorridorPath(sx, sy, ex, ey, offset) {
  if (offset === 0) {
    // Прямая линия — control point в середине
    return {
      cpx: (sx + ex) / 2,
      cpy: (sy + ey) / 2,
    };
  }
  
  // Вычисляем перпендикуляр
  const dx = ex - sx;
  const dy = ey - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Нормаль (перпендикуляр)
  const nx = -dy / dist;
  const ny = dx / dist;
  
  // Середина линии
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  
  // Control point смещён по нормали
  return {
    cpx: mx + nx * offset,
    cpy: my + ny * offset,
  };
}

export default { snapLineToCircles, getCorridorOffset, buildCorridorPath };
