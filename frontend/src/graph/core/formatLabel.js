/**
 * Address Label Formatting - ЕДИНЫЙ СТАНДАРТ
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Формат: 0xABCD…1234 (4 символа + … + 4 символа)
 * - ❌ ЗАПРЕЩЕНО: "69", "91", "A3", "BB", "DF"
 * - Если не влезает — уменьшаем font-size, НЕ меняем формат
 */

/**
 * Сокращение адреса: 0xABCD…1234
 * @param {string} addr - полный адрес или имя
 * @param {number} head - символов в начале (default 6 для 0x + 4)
 * @param {number} tail - символов в конце (default 4)
 */
export function formatAddressLabel(addr, head = 6, tail = 4) {
  if (!addr) return '';
  
  const a = addr.toLowerCase();
  
  // Короткие строки возвращаем как есть
  if (a.length <= head + tail + 3) return addr;
  
  // Формат: 0xABCD…1234
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/**
 * Известные имена (биржи, протоколы, фонды)
 * Возвращает короткое имя если известно, иначе null
 */
const KNOWN_NAMES = {
  'binance': 'Binance',
  'coinbase': 'Coinbase',
  'kraken': 'Kraken',
  'okx': 'OKX',
  'bybit': 'Bybit',
  'wintermute': 'Winterm',
  'a16z crypto': 'a16z',
  'a16z': 'a16z',
  'jump trading': 'Jump',
  'jump': 'Jump',
  'circle': 'Circle',
  'tether': 'Tether',
  'uniswap': 'Uniswap',
  'curve': 'Curve',
  'aave': 'Aave',
  'lido': 'Lido',
  'compound': 'Compound',
  'makerdao': 'Maker',
  'chainlink': 'Chainlink',
  'ftx': 'FTX',
  'gemini': 'Gemini',
  'huobi': 'Huobi',
  'kucoin': 'KuCoin',
};

/**
 * Получить label для ноды графа
 * - Известные имена → короткое имя
 * - Адрес 0x... → 0xABCD…1234
 * - actor_xxx → парсим
 */
export function getNodeLabel(node) {
  if (!node) return '';
  
  // Используем label если есть
  const raw = node.label || node.name || node.id || '';
  
  // Проверяем известные имена
  const lower = raw.toLowerCase();
  for (const [key, short] of Object.entries(KNOWN_NAMES)) {
    if (lower.includes(key)) return short;
  }
  
  // Адрес: 0x...
  if (raw.startsWith('0x') && raw.length >= 10) {
    return formatAddressLabel(raw, 6, 4);
  }
  
  // actor_0x... формат
  if (raw.startsWith('actor_0x') && raw.length > 15) {
    const addr = raw.replace('actor_', '');
    return formatAddressLabel(addr, 6, 4);
  }
  
  // actor_xxx_N формат (например actor_binance_main)
  if (raw.startsWith('actor_')) {
    const parts = raw.replace('actor_', '').split('_');
    const name = parts[0];
    // Проверяем известные имена
    const knownShort = KNOWN_NAMES[name.toLowerCase()];
    if (knownShort) return knownShort;
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1, 7);
  }
  
  // ENS домен
  if (raw.includes('.eth')) {
    return raw.split('.')[0].slice(0, 8);
  }
  
  // Длинная строка — обрезаем
  if (raw.length > 12) {
    return raw.slice(0, 8) + '…';
  }
  
  return raw;
}

export default { formatAddressLabel, getNodeLabel };
