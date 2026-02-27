/**
 * SPX CONSENSUS ENGINE — Main Service
 * 
 * BLOCK B5.5 — Complete consensus computation
 * 
 * Combines weights, conflict detection, and decision resolution
 * into a single SPX consensus result.
 */

import { buildSpxWeights, getTierForHorizon } from './spx-consensus.weights.js';
import { detectConflict } from './spx-consensus.conflict.js';
import { resolveDecision } from './spx-consensus.resolver.js';
import type { 
  SpxConsensus, 
  SpxConsensusInput, 
  HorizonVote,
  Direction,
  SpxHorizon
} from './spx-consensus.types.js';

// ═══════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class SpxConsensusService {
  /**
   * Build complete SPX consensus from horizon stack
   */
  build(input: SpxConsensusInput): SpxConsensus {
    const { horizonStack, phaseNow, preset = 'BALANCED' } = input;
    
    if (horizonStack.length === 0) {
      return this.emptyConsensus();
    }
    
    // 1) Compute weights with modifiers
    const volShock = phaseNow?.flags?.includes('VOL_SHOCK') ?? false;
    const bearDrawdown = phaseNow?.phase === 'BEAR_DRAWDOWN';
    
    const divergenceGrades: Record<SpxHorizon, string> = {} as any;
    for (const h of horizonStack) {
      divergenceGrades[h.horizon] = h.divergenceGrade;
    }
    
    const weights = buildSpxWeights(horizonStack, {
      volShock,
      bearDrawdown,
      divergenceGrades,
    });
    
    // 2) Build votes
    const votes: HorizonVote[] = horizonStack.map(h => {
      const w = weights[h.horizon] || 0;
      const sign = h.direction === 'BULL' ? 1 : h.direction === 'BEAR' ? -1 : 0;
      
      const divergencePenalty = gradePenalty(h.divergenceGrade);
      const blockerPenalty = h.blockers?.length ? 0.0 : 1.0;
      
      const voteScore = sign * h.confidence * w * divergencePenalty * blockerPenalty;
      
      return {
        horizon: h.horizon,
        tier: getTierForHorizon(h.horizon),
        direction: h.direction,
        confidence: h.confidence,
        divergenceGrade: h.divergenceGrade,
        blockers: h.blockers ?? [],
        weight: w,
        voteScore: Math.round(voteScore * 10000) / 10000,
      };
    });
    
    // 3) Detect conflict + dominance + structural lock
    const conflict = detectConflict(votes);
    
    // 4) Compute consensus index
    const sumAbs = votes.reduce((a, v) => a + Math.abs(v.voteScore), 0) || 1;
    const net = votes.reduce((a, v) => a + v.voteScore, 0);
    const consensusIndex = Math.max(0, Math.min(100, Math.round((Math.abs(net) / sumAbs) * 100)));
    
    // 5) Determine overall direction
    let direction: Direction = 'NEUTRAL';
    if (net > 0.05) direction = 'BULL';
    else if (net < -0.05) direction = 'BEAR';
    
    // 6) Resolve final decision
    const resolved = resolveDecision({
      direction,
      votes,
      conflict,
      consensusIndex,
      preset,
      phaseNow: phaseNow ? {
        phase: phaseNow.phase,
        flags: phaseNow.flags,
      } : undefined,
    });
    
    return {
      consensusIndex,
      direction,
      dominance: conflict.dominance,
      structuralLock: conflict.structuralLock,
      conflictLevel: conflict.level,
      votes,
      resolved,
      phaseType: phaseNow?.phase,
      phaseFlags: phaseNow?.flags,
      computedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Empty consensus for insufficient data
   */
  private emptyConsensus(): SpxConsensus {
    return {
      consensusIndex: 50,
      direction: 'NEUTRAL',
      dominance: 'STRUCTURE',
      structuralLock: false,
      conflictLevel: 'LOW',
      votes: [],
      resolved: {
        action: 'HOLD',
        mode: 'NO_TRADE',
        sizeMultiplier: 0,
        reasons: ['Insufficient horizon data'],
        penalties: [],
      },
      computedAt: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function gradePenalty(g: string): number {
  switch (g) {
    case 'A': return 1.05;
    case 'B': return 1.00;
    case 'C': return 0.95;
    case 'D': return 0.85;
    case 'F': return 0.70;
    default: return 1.00;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

export const spxConsensusService = new SpxConsensusService();

export default SpxConsensusService;
