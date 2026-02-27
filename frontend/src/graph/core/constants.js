/**
 * Graph Core Constants - ИНВАРИАНТЫ (НЕ МЕНЯТЬ)
 * 
 * Единый визуальный контракт для всех графов
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Только 2 цвета рёбер: INFLOW (зелёный), OUTFLOW (красный)
 * - НЕТ серого/нейтрального цвета
 * - Адрес внутри ноды: 0xABCD…1234 (4+...+4)
 */

// ============ УЗЛЫ ============
export const NODE_RADIUS = 28;
export const NODE_FILL = '#F9FAFB';        // Светлый фон
export const NODE_STROKE = '#374151';       // Нейтральная граница (gray-700)
export const NODE_STROKE_WIDTH = 2;
export const NODE_STROKE_SELECTED = '#1F2937';
export const NODE_STROKE_WIDTH_SELECTED = 3;

// ============ ТЕКСТ ============
export const TEXT_COLOR = '#111827';
export const TEXT_FONT = 'Inter, system-ui, sans-serif';
export const TEXT_SIZE = 9;
export const TEXT_WEIGHT = 600;

// ============ СВЯЗИ (ТОЛЬКО 2 ЦВЕТА) ============
export const EDGE_INFLOW_COLOR = '#22c55e';   // Зелёный = INFLOW (green-500)
export const EDGE_OUTFLOW_COLOR = '#ef4444';  // Красный = OUTFLOW (red-500)
// ❌ EDGE_NEUTRAL_COLOR УДАЛЁН — нет серых рёбер
export const EDGE_WIDTH_BASE = 1.5;
export const EDGE_WIDTH_MAX = 5;

// ❌ СТРЕЛКИ ЗАПРЕЩЕНЫ
export const ARROW_LENGTH = 0;

// ============ CORRIDOR GEOMETRY ============
export const CORRIDOR_BASE_CURVE = 12;
export const CORRIDOR_MAX_CURVE = 40;

// ============ FORCE CONFIG ============
export const FORCE_CHARGE = -180;
export const FORCE_LINK_DISTANCE = 100;
export const FORCE_LINK_STRENGTH = 0.3;
export const FORCE_CENTER_STRENGTH = 0.25;
export const COOLDOWN_TICKS = 50;
export const D3_ALPHA_DECAY = 0.02;
export const D3_VELOCITY_DECAY = 0.3;
