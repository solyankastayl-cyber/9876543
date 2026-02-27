/**
 * ENGINE GLOBAL + BRAIN BRIDGE — P7.0
 * 
 * Integration layer between EngineGlobal and Brain v2.
 * Supports three modes:
 * - off: Return base engine output (no brain)
 * - shadow: Return base output + what brain WOULD do
 * - on: Apply brain overrides to allocations
 */

import { buildEngineGlobal } from './engine_global.service.js';
import { getBrainOrchestratorService } from '../brain/services/brain_orchestrator.service.js';
import { getBrainOverrideApplyService } from '../brain/services/brain_override_apply.service.js';
import type { EngineGlobalResponse, EngineAllocation } from './engine_global.contract.js';
import type { BrainOutputPack } from '../brain/contracts/brain_output.contract.js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type BrainMode = 'on' | 'off' | 'shadow';

export interface BrainWouldApply {
  spxDelta: number;
  btcDelta: number;
  dxyDelta: number;
  cashDelta: number;
  reasons: string[];
}

export interface BrainSection {
  mode: BrainMode;
  decision?: BrainOutputPack;
  wouldApply?: BrainWouldApply;
}

export interface EngineGlobalWithBrainResponse extends EngineGlobalResponse {
  brain: BrainSection;
}

// ═══════════════════════════════════════════════════════════════
// MAIN BRIDGE FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function getEngineGlobalWithBrain(params: {
  asOf?: string;
  brain?: boolean;
  brainMode?: BrainMode;
}): Promise<EngineGlobalWithBrainResponse> {
  const { asOf, brain = false, brainMode = 'off' } = params;
  
  // 1. Get base engine output
  const engineOut = await buildEngineGlobal(asOf);
  
  // 2. If brain disabled, return base with brain.mode = 'off'
  if (!brain || brainMode === 'off') {
    return {
      ...engineOut,
      brain: { mode: 'off' },
    };
  }
  
  // 3. Get brain decision
  const brainService = getBrainOrchestratorService();
  const brainDecision = await brainService.computeDecision(
    asOf || new Date().toISOString().split('T')[0]
  );
  
  // 4. Convert engine allocations to format brain expects
  const engineAllocationsForBrain = {
    allocations: {
      spx: { size: engineOut.allocations.spxSize, direction: 'LONG' },
      btc: { size: engineOut.allocations.btcSize, direction: 'LONG' },
      dxy: { size: engineOut.allocations.dxySize, direction: 'LONG' },
    },
    cash: engineOut.allocations.cashSize,
  };
  
  // 5. Apply brain overrides
  const applyService = getBrainOverrideApplyService();
  const applied = applyService.applyOverrides(engineAllocationsForBrain, brainDecision);
  
  // 6. Shadow mode: return base allocations + what brain would do
  if (brainMode === 'shadow') {
    const wouldApply = computeDiff(engineOut.allocations, applied);
    
    return {
      ...engineOut,
      brain: {
        mode: 'shadow',
        decision: brainDecision,
        wouldApply,
      },
    };
  }
  
  // 7. On mode: return modified allocations
  const modifiedAllocations = applyToEngineFormat(applied);
  
  // Update evidence with brain info
  const enhancedEvidence = {
    ...engineOut.evidence,
    headline: `${engineOut.evidence.headline} | Brain: ${brainDecision.scenario.name}`,
    brainOverrides: applied.brainEvidence || [],
  };
  
  return {
    ...engineOut,
    allocations: modifiedAllocations,
    evidence: enhancedEvidence as any,
    brain: {
      mode: 'on',
      decision: brainDecision,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function computeDiff(
  base: EngineAllocation,
  applied: any
): BrainWouldApply {
  const spxApplied = applied.allocations?.spx?.size ?? base.spxSize;
  const btcApplied = applied.allocations?.btc?.size ?? base.btcSize;
  const dxyApplied = applied.allocations?.dxy?.size ?? base.dxySize;
  
  // Calculate cash from remaining
  const totalRisk = spxApplied + btcApplied + dxyApplied;
  const cashApplied = Math.max(0, 1 - totalRisk);
  
  return {
    spxDelta: Math.round((spxApplied - base.spxSize) * 1000) / 1000,
    btcDelta: Math.round((btcApplied - base.btcSize) * 1000) / 1000,
    dxyDelta: Math.round((dxyApplied - base.dxySize) * 1000) / 1000,
    cashDelta: Math.round((cashApplied - base.cashSize) * 1000) / 1000,
    reasons: applied.brainEvidence || [],
  };
}

function applyToEngineFormat(applied: any): EngineAllocation {
  const spxSize = applied.allocations?.spx?.size ?? 0;
  const btcSize = applied.allocations?.btc?.size ?? 0;
  const dxySize = applied.allocations?.dxy?.size ?? 0;
  
  // Clamp all to [0, 1]
  const clampedSpx = Math.max(0, Math.min(1, spxSize));
  const clampedBtc = Math.max(0, Math.min(1, btcSize));
  const clampedDxy = Math.max(0, Math.min(1, dxySize));
  
  // Calculate cash
  const totalRisk = clampedSpx + clampedBtc + clampedDxy;
  const cashSize = Math.max(0, 1 - totalRisk);
  
  return {
    spxSize: clampedSpx,
    btcSize: clampedBtc,
    dxySize: clampedDxy,
    cashSize,
  };
}

// ═══════════════════════════════════════════════════════════════
// TESTING HELPER
// ═══════════════════════════════════════════════════════════════

export function wouldBrainChangeAllocations(
  engineOut: EngineGlobalResponse,
  brainDecision: BrainOutputPack
): boolean {
  const applyService = getBrainOverrideApplyService();
  
  const engineAllocationsForBrain = {
    allocations: {
      spx: { size: engineOut.allocations.spxSize, direction: 'LONG' },
      btc: { size: engineOut.allocations.btcSize, direction: 'LONG' },
      dxy: { size: engineOut.allocations.dxySize, direction: 'LONG' },
    },
    cash: engineOut.allocations.cashSize,
  };
  
  return applyService.wouldChangeAnything(engineAllocationsForBrain, brainDecision);
}
