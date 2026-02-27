/**
 * Graph Explain Mapper (P1.8.D)
 * 
 * Maps raw graph intelligence data to UI-friendly format.
 * Pure data transformation, no side effects.
 */

/**
 * Map explain data for UI consumption
 * 
 * @param {Object} graphData - Full graph intelligence payload
 * @returns {Object} - Mapped explain data
 */
export function mapExplainData(graphData) {
  if (!graphData) {
    return {
      riskScore: 0,
      exitProbability: 0,
      entropy: 0,
      marketAmplifier: 1,
      marketRegime: 'UNKNOWN',
      segments: [],
      reasons: [],
      amplifiers: [],
      suppressors: [],
      contextTags: [],
    };
  }
  
  const { riskSummary, explain, highlightedPath, edges } = graphData;
  
  return {
    // Core metrics
    riskScore: riskSummary?.contextualRiskScore || riskSummary?.dumpRiskScore || 0,
    exitProbability: riskSummary?.exitProbability || 0,
    entropy: riskSummary?.pathEntropy || 0,
    marketAmplifier: riskSummary?.marketAmplifier || 1,
    marketRegime: riskSummary?.marketRegime || 'STABLE',
    confidenceImpact: riskSummary?.confidenceImpact || 0,
    
    // Context tags
    contextTags: riskSummary?.contextTags || [],
    
    // Segments from highlighted path
    segments: mapSegments(highlightedPath, edges),
    
    // Explain reasons
    reasons: explain?.reasons || [],
    
    // Amplifiers and suppressors
    amplifiers: explain?.amplifiers || [],
    suppressors: explain?.suppressors || [],
  };
}

/**
 * Map highlighted path to segments
 */
function mapSegments(highlightedPath, edges) {
  if (!highlightedPath || !edges) return [];
  
  // Create edge lookup
  const edgeMap = new Map(edges.map(e => [e.id, e]));
  
  return highlightedPath.map((step, index) => {
    const edge = edgeMap.get(step.edgeId);
    
    return {
      index,
      edgeId: step.edgeId,
      reason: step.reason,
      riskContribution: step.riskContribution,
      order: step.order,
      
      // Edge data
      type: edge?.type || 'UNKNOWN',
      chain: edge?.chain || 'unknown',
      chainFrom: edge?.chainFrom,
      chainTo: edge?.chainTo,
      fromNodeId: edge?.fromNodeId,
      toNodeId: edge?.toNodeId,
      
      // Meta
      protocol: edge?.meta?.protocol,
      amount: edge?.meta?.amount,
      amountUsd: edge?.meta?.amountUsd,
      token: edge?.meta?.token,
      
      // Labels
      label: getSegmentLabel(step, edge),
      shortLabel: getSegmentShortLabel(step),
    };
  });
}

/**
 * Get human-readable segment label
 */
function getSegmentLabel(step, edge) {
  if (!edge) return 'Unknown Step';
  
  const typeLabels = {
    TRANSFER: 'Token Transfer',
    SWAP: 'DEX Swap',
    BRIDGE: 'Cross-chain Bridge',
    DEPOSIT: 'CEX Deposit',
    WITHDRAW: 'CEX Withdrawal',
    CONTRACT_CALL: 'Contract Interaction',
  };
  
  const typeLabel = typeLabels[edge.type] || edge.type;
  
  if (edge.chainFrom && edge.chainTo) {
    return `${typeLabel}: ${edge.chainFrom} → ${edge.chainTo}`;
  }
  
  if (edge.meta?.protocol) {
    return `${typeLabel} via ${edge.meta.protocol}`;
  }
  
  return `${typeLabel} on ${edge.chain}`;
}

/**
 * Get short label for segment
 */
function getSegmentShortLabel(step) {
  const labels = {
    'origin_of_route': 'Origin',
    'cross_chain_migration': 'Bridge',
    'pre_exit_swap': 'Pre-Exit Swap',
    'exit_to_cex': 'CEX Exit',
    'high_value_transfer': 'High Value',
    'mixing_pattern': 'Mixing',
    'suspicious_timing': 'Suspicious',
    'known_risk_address': 'Known Risk',
  };
  return labels[step.reason] || step.reason;
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level) {
  const colors = {
    CRITICAL: '#DC2626',
    HIGH: '#EF4444',
    MEDIUM: '#F59E0B',
    LOW: '#22C55E',
  };
  return colors[level] || '#6B7280';
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format multiplier
 */
export function formatMultiplier(value) {
  return `${value.toFixed(2)}x`;
}

/**
 * Get reason severity color
 */
export function getReasonSeverityColor(severity) {
  const colors = {
    CRITICAL: '#DC2626',
    HIGH: '#EF4444',
    MEDIUM: '#F59E0B',
    LOW: '#6B7280',
  };
  return colors[severity] || '#6B7280';
}

/**
 * Sort reasons by severity
 */
export function sortReasonsBySeverity(reasons) {
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...reasons].sort((a, b) => {
    const aVal = severityOrder[a.severity] ?? 4;
    const bVal = severityOrder[b.severity] ?? 4;
    return aVal - bVal;
  });
}

/**
 * Get segment type color
 */
export function getSegmentTypeColor(type) {
  const colors = {
    TRANSFER: '#6B7280',
    SWAP: '#10B981',
    BRIDGE: '#F59E0B',
    DEPOSIT: '#EF4444',
    WITHDRAW: '#3B82F6',
    CONTRACT_CALL: '#8B5CF6',
  };
  return colors[type] || '#6B7280';
}

export default {
  mapExplainData,
  getRiskLevel,
  getRiskLevelColor,
  formatPercent,
  formatMultiplier,
  getReasonSeverityColor,
  sortReasonsBySeverity,
  getSegmentTypeColor,
};
