/**
 * Graph Geometry Utils
 * 
 * Расчёт касательных к окружностям, corridor offsets
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Адрес формат: 0xABCD…1234 (4 символа + ... + 4 символа)
 * - НЕ: "69", "91", "A3", "BB"
 * - Если текст не влезает — уменьшаем font-size, НЕ меняем формат
 */
import { NODE_RADIUS, CORRIDOR_BASE_CURVE, CORRIDOR_MAX_CURVE } from '../core/constants.js';

/**
 * Сокращение адреса: СТРОГО 0xABCD…1234
 * 
 * ❌ Запрещено: "69", "91", "A3", "BB", "DF"
 * ✅ Разрешено: "0xABCD…1234", "Binance", "Coinbase"
 */
export function shortenAddress(address) {
  if (!address) return '0x????…????';
  
  // Известные имена (биржи, протоколы)
  const knownNames = {
    'Binance': 'Binance',
    'Coinbase': 'Coinbase',
    'Kraken': 'Kraken',
    'OKX': 'OKX',
    'Bybit': 'Bybit',
    'Wintermute': 'Winterm',
    'a16z Crypto': 'a16z',
    'a16z': 'a16z',
    'Jump Trading': 'Jump',
    'Circle': 'Circle',
    'Tether': 'Tether',
    'Uniswap': 'Uniswap',
    'Curve': 'Curve',
    'Aave': 'Aave',
    'Lido': 'Lido',
    'Compound': 'Compnd',
    'MakerDAO': 'Maker',
    'Chainlink': 'Chainlnk',
  };
  
  // Проверяем известные имена
  for (const [full, short] of Object.entries(knownNames)) {
    if (address.includes(full) || address === full) return short;
  }
  
  // Адрес: 0x1234567890...abcd → 0x1234…abcd
  if (address.startsWith('0x') && address.length >= 10) {
    return `0x${address.slice(2, 6)}…${address.slice(-4)}`;
  }
  
  // actor_0x12345... формат
  if (address.startsWith('actor_0x') && address.length > 15) {
    const addr = address.replace('actor_', '');
    return `0x${addr.slice(2, 6)}…${addr.slice(-4)}`;
  }
  
  // actor_xxx_N формат (например actor_binance_main)
  if (address.startsWith('actor_')) {
    const parts = address.replace('actor_', '').split('_');
    const name = parts[0];
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1, 7);
  }
  
  // ENS домен
  if (address.includes('.eth')) {
    return address.split('.')[0].slice(0, 8);
  }
  
  // Любой другой — первые 8 символов
  if (address.length > 10) {
    return address.slice(0, 8) + '…';
  }
  
  return address;
}

/**
 * Рассчитать точку на окружности по направлению к другой точке
 * Линия КАСАЕТСЯ круга, не входит внутрь
 */
export function clipToCircle(cx, cy, tx, ty, radius = NODE_RADIUS) {
  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist === 0) return { x: cx, y: cy };
  
  // Точка на границе круга
  return {
    x: cx + (dx / dist) * radius,
    y: cy + (dy / dist) * radius,
  };
}

/**
 * Рассчитать geometry для corridor (несколько связей между двумя узлами)
 */
export function getCorridorOffset(index, total) {
  if (total === 1) return 0;
  
  if (total === 2) {
    return (index === 0 ? -1 : 1) * CORRIDOR_BASE_CURVE;
  }
  
  if (total === 3) {
    return (index - 1) * CORRIDOR_BASE_CURVE;
  }
  
  // Более 3 — распределяем равномерно
  const t = (index / (total - 1)) * 2 - 1; // от -1 до 1
  return t * CORRIDOR_MAX_CURVE;
}

/**
 * Построить quadratic curve path для corridor
 */
export function buildCorridorPath(sx, sy, tx, ty, offset) {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  
  const dx = tx - sx;
  const dy = ty - sy;
  const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
  
  const cpx = mx + Math.cos(perpAngle) * offset;
  const cpy = my + Math.sin(perpAngle) * offset;
  
  return { mx, my, cpx, cpy };
}
