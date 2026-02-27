/**
 * Graph Intelligence Types (P1.8)
 * 
 * Types for Graph Intelligence API responses.
 * Strict typing for frontend consumption.
 */

// ============================================
// Node Types
// ============================================

export type GraphNodeType = 
  | 'WALLET' 
  | 'TOKEN' 
  | 'BRIDGE' 
  | 'DEX' 
  | 'CEX' 
  | 'CONTRACT';

export interface GraphNode {
  id: string;                    // Deterministic: type:chain:address
  type: GraphNodeType;
  address: string;
  chain: string;
  displayName: string;
  labels: string[];
  metadata?: {
    protocol?: string;
    isKnown?: boolean;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    [key: string]: any;
  };
}

// ============================================
// Edge Types
// ============================================

export type GraphEdgeType = 
  | 'TRANSFER' 
  | 'SWAP' 
  | 'BRIDGE' 
  | 'DEPOSIT' 
  | 'WITHDRAW' 
  | 'CONTRACT_CALL';

export interface GraphEdge {
  id: string;                    // Deterministic: type:from:to:txHash
  type: GraphEdgeType;
  fromNodeId: string;
  toNodeId: string;
  
  chain: string;
  chainFrom?: string;            // For BRIDGE
  chainTo?: string;              // For BRIDGE
  
  timestamp: number;
  txHash?: string;
  
  meta?: {
    amount?: number;
    amountUsd?: number;
    token?: string;
    protocol?: string;
    confidence?: number;
    routeId?: string;
    segmentIndex?: number;
  };
}

// ============================================
// Highlighted Path
// ============================================

export type HighlightReason = 
  | 'origin_of_route'
  | 'cross_chain_migration'
  | 'pre_exit_swap'
  | 'exit_to_cex'
  | 'mixing_pattern'
  | 'high_value_transfer'
  | 'suspicious_timing'
  | 'known_risk_address';

export interface HighlightedStep {
  edgeId: string;
  reason: HighlightReason;
  riskContribution: number;      // 0..1
  order: number;
}

// ============================================
// Risk Summary
// ============================================

export type MarketRegime = 'STABLE' | 'VOLATILE' | 'STRESSED';

export interface RiskSummary {
  // From P0.5
  exitProbability: number;
  dumpRiskScore: number;
  pathEntropy: number;
  
  // From P1.6
  contextualRiskScore: number;
  marketAmplifier: number;
  confidenceImpact: number;
  contextTags: string[];
  
  // Market regime
  marketRegime?: MarketRegime;
}

// ============================================
// Explain Block
// ============================================

export type ExplainSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExplainReason {
  code: string;
  title: string;
  description: string;
  severity: ExplainSeverity;
  evidence?: string[];
}

export interface ExplainAmplifier {
  tag: string;
  multiplier: number;
  source: 'MARKET' | 'ROUTE' | 'ACTOR';
}

export interface ExplainBlock {
  reasons: ExplainReason[];
  amplifiers: ExplainAmplifier[];
  suppressors: ExplainAmplifier[];
}

// ============================================
// Graph Intelligence Payload (API Response)
// ============================================

export interface GraphIntelligencePayload {
  snapshotId: string;
  kind: 'ADDRESS' | 'ROUTE';
  address?: string;
  routeId?: string;
  
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedPath: HighlightedStep[];
  
  riskSummary: RiskSummary;
  explain: ExplainBlock;
  
  generatedAt: number;
  expiresAt: number;
  buildTimeMs: number;
}

// ============================================
// API Response Wrapper
// ============================================

export interface GraphIntelligenceResponse {
  ok: boolean;
  data?: GraphIntelligencePayload;
  error?: string;
  details?: string;
}

export interface GraphStatsResponse {
  ok: boolean;
  stats?: {
    total: number;
    byKind: Record<string, number>;
    avgBuildTimeMs: number;
    expired: number;
  };
  error?: string;
}

// ============================================
// Query Options
// ============================================

export interface GraphQueryOptions {
  maxRoutes?: number;
  maxEdges?: number;
  timeWindowHours?: number;
  chains?: string[];
}

// ============================================
// Highlighted Path (derived for UI)
// ============================================

export interface HighlightedPath {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  steps: HighlightedStep[];
}

export function deriveHighlightedPath(
  highlightedSteps: HighlightedStep[],
  edges: GraphEdge[]
): HighlightedPath {
  const edgeIds = new Set(highlightedSteps.map(s => s.edgeId));
  const nodeIds = new Set<string>();
  
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      nodeIds.add(edge.fromNodeId);
      nodeIds.add(edge.toNodeId);
    }
  }
  
  return {
    nodeIds,
    edgeIds,
    steps: highlightedSteps,
  };
}
