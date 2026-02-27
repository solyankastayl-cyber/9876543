// ==================== EPIC C2: Graph UI v2 - Muted Professional ====================

// BASE PALETTE (только 3 основных цвета)
export const PALETTE = {
  primary: '#1F2937',     // Graphite / Slate
  positive: '#10B981',    // Muted Green (inflow)
  negative: '#EF4444',    // Muted Red (outflow)
  neutral: '#6B7280',     // Gray
};

// NODE COLORS - форма и обводка, не заливка
export const NODE_FILL = '#F9FAFB';
export const TEXT_COLOR = '#111827';

// SOURCE LEVEL → Border Style (не цвет!)
export const SOURCE_STYLES = {
  verified: { borderStyle: 'solid', borderWidth: 2 },
  attributed: { borderStyle: 'dashed', borderWidth: 2 },
  behavioral: { borderStyle: 'dotted', borderWidth: 1.5 },
};

// COVERAGE → Node Opacity
export const getCoverageOpacity = (coverage) => {
  if (coverage >= 0.7) return 1.0;     // High
  if (coverage >= 0.4) return 0.75;    // Medium
  return 0.45;                          // Low
};

// EDGE TYPE → COLOR (ограниченная палитра из 5 цветов)
export const EDGE_COLORS = {
  FLOW_CORRELATION: '#4C6EF5',      // Muted blue - движение денег
  TEMPORAL_SYNC: '#40C057',          // Muted green - синхронность
  TOKEN_OVERLAP: '#868E96',          // Neutral gray - общие токены
  BRIDGE_ACTIVITY: '#FAB005',        // Muted amber - cross-chain
  BEHAVIORAL_SIMILARITY: '#7950F2',  // Soft violet - поведение
  // Legacy compatibility
  incoming: '#40C057',
  outgoing: '#EF4444',
  correlation: '#868E96',
};

// CONFIDENCE → Edge Opacity
export const getConfidenceOpacity = (confidence) => {
  if (confidence === 'high') return 0.9;
  if (confidence === 'medium') return 0.6;
  return 0.3;  // low
};

// WEIGHT → Edge Thickness (log scale, max 3px)
export const getEdgeWidth = (weight, isSelected = false) => {
  const base = Math.max(0.5, Math.min(3, Math.log(1 + weight * 10)));
  return isSelected ? base + 1.5 : base;
};

// NODE SIZE - фиксированный
export const NODE_RADIUS = 16;
export const getNodeRadius = () => NODE_RADIUS;
export const NODE_BASE_SIZE = 32;
export const FONT_SIZE_BASE = 10;

// LEGACY LINK COLORS (backwards compatibility)
export const LINK_COLORS = EDGE_COLORS;

// CORRIDOR THRESHOLDS
export const CORRIDOR_THRESHOLD = {
  minEdges: 5,
  clickable: 2,
};

// ZOOM LIMITS
export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 4;

// NODE TYPE → SHAPE
export const NODE_SHAPES = {
  actor: 'circle',
  wallet: 'square',
  entity: 'hexagon',
};

// RATING BORDER (legacy compatibility + new muted style)
export const getRatingBorder = (score) => {
  if (score >= 70) return PALETTE.positive;
  if (score >= 40) return '#F59E0B';  // Amber
  return PALETTE.negative;
};

// ==================== NAME ABBREVIATION ====================
export const abbreviate = (name) => {
  if (!name) return '??';
  const map = {
    'a16z Crypto': 'a16z', 'a16z': 'a16z',
    'Alameda Research': 'ALM', 'Pantera Capital': 'PAN',
    'Jump Trading': 'JMP', 'DWF Labs': 'DWF',
    'Wintermute': 'WMT', 'Vitalik.eth': 'VIT', 'vitalik.eth': 'VIT',
    'Smart Whale #4721': 'SW',
  };
  if (map[name]) return map[name];
  if (name.startsWith('0x')) return name.slice(2, 4).toUpperCase();
  if (name.includes('.eth')) return name.split('.')[0].slice(0, 3).toUpperCase();
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// ==================== UTILS ====================
export const normalize = (v, min, max) => max === min ? 0.5 : Math.max(0, Math.min(1, (v - min) / (max - min)));

export const calcScore = (actor, all) => {
  const maxF = Math.max(...all.map(a => a.followers_count || 0));
  const maxL = Math.max(...all.map(a => a.avg_follower_lag || 24));
  return Math.round((normalize(actor.followers_count || 0, 0, maxF) * 0.35 + (actor.avg_follower_lag > 0 ? 1 - normalize(actor.avg_follower_lag, 0, maxL) : 0) * 0.25 + (actor.consistency || 0.5) * 0.25 + (actor.market_impact || 0.5) * 0.15) * 100);
};

export const getRole = (a) => a.followers_count >= 3 ? 'Leader' : a.followedBy?.length >= 2 ? 'Follower' : 'Neutral';

export const hasDegree = (actor, all) => {
  if (actor.frontRuns?.length > 0 || actor.followedBy?.length > 0) return true;
  return all.some(o => {
    const frontRunIds = o.frontRuns?.map(f => typeof f === 'object' ? f.id : f) || [];
    const followedByIds = o.followedBy?.map(f => typeof f === 'object' ? f.id : f) || [];
    return frontRunIds.includes(actor.id) || followedByIds.includes(actor.id);
  });
};

export const getLinkId = (link) => typeof link === 'object' ? link.id : link;
export const getLinkCount = (link) => typeof link === 'object' ? (link.count || 1) : 1;

export const isConnectedTo = (nodeId, targetId, actors) => {
  if (nodeId === targetId) return true;
  const t = actors.find(a => a.id === targetId);
  if (!t) return false;
  const frontRunIds = t.frontRuns?.map(f => getLinkId(f)) || [];
  const followedByIds = t.followedBy?.map(f => getLinkId(f)) || [];
  return frontRunIds.includes(nodeId) || followedByIds.includes(nodeId) || t.correlations?.some(c => c.id === nodeId);
};

// ==================== EPIC C2: EDGE TYPE HELPERS ====================
export const getEdgeTypeLabel = (type) => {
  const labels = {
    FLOW_CORRELATION: 'Flow Correlation',
    TEMPORAL_SYNC: 'Temporal Sync',
    TOKEN_OVERLAP: 'Token Overlap',
    BRIDGE_ACTIVITY: 'Bridge Activity',
    BEHAVIORAL_SIMILARITY: 'Behavioral Similarity',
    flow_correlation: 'Flow Correlation',
    temporal_sync: 'Temporal Sync',
    token_overlap: 'Token Overlap',
    direct_transfer: 'Direct Transfer',
  };
  return labels[type] || type;
};

export const getEdgeColor = (edgeType) => {
  const upperType = edgeType?.toUpperCase?.() || '';
  return EDGE_COLORS[upperType] || EDGE_COLORS[edgeType] || PALETTE.neutral;
};

// Format USD helper
export const formatUSD = (value) => {
  if (!value) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};
