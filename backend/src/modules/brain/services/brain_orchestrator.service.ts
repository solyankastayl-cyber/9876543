/**
 * AE/S-Brain v2 — Brain Orchestrator
 * 
 * Main intelligence layer. Reads WorldState, outputs BrainOutputPack.
 * 
 * Rules v0 (institutional, deterministic):
 * - If guard=BLOCK → caps all risk assets to 0
 * - If guard=CRISIS → BTC haircut stronger than SPX
 * - If STRESS prob > 0.35 → riskMode = RISK_OFF
 * - If liquidity CONTRACTION + negative macro → additional BTC haircut
 * - Scenario probs derived from regime posterior + guard
 */

import { WorldStatePack } from '../contracts/world_state.contract.js';
import {
  BrainOutputPack,
  BrainDirectives,
  BrainEvidence,
  ScenarioPack,
  createNeutralBrainOutput,
} from '../contracts/brain_output.contract.js';
import { getWorldStateService } from './world_state.service.js';

// ═══════════════════════════════════════════════════════════════
// THRESHOLDS (institutional)
// ═══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  STRESS_PROB_RISK_OFF: 0.35,
  CRISIS_BTC_HAIRCUT: 0.60,
  CRISIS_SPX_HAIRCUT: 0.75,
  WARN_BTC_HAIRCUT: 0.85,
  WARN_SPX_HAIRCUT: 0.90,
  CONTRACTION_HAIRCUT: 0.90,
  BLOCK_MAX_SIZE: 0.05,
};

export class BrainOrchestratorService {
  
  /**
   * Main entry: compute Brain decision
   */
  async computeDecision(asOf: string): Promise<BrainOutputPack> {
    const startTime = Date.now();
    
    // Get world state
    const worldService = getWorldStateService();
    const world = await worldService.buildWorldState(asOf);
    
    // Run decision logic
    const scenario = this.computeScenario(world);
    const directives = this.computeDirectives(world, scenario);
    const evidence = this.buildEvidence(world, scenario, directives);
    
    return {
      asOf,
      scenario,
      directives,
      evidence,
      meta: {
        engineVersion: 'v2',
        brainVersion: 'v2.0.0',
        computeTimeMs: Date.now() - startTime,
        inputsHash: world.meta.inputsHash,
      },
    };
  }
  
  /**
   * Compute scenario (BASE/RISK/TAIL) from world state
   */
  private computeScenario(world: WorldStatePack): ScenarioPack {
    const dxy = world.assets.dxy;
    const regimePosterior = dxy?.macroV2?.regime.probs || {};
    const guardLevel = dxy?.guard?.level || 'NONE';
    
    // Base probabilities from regime
    let stressProb = regimePosterior['STRESS'] || 0;
    let tailProb = 0.05; // baseline
    
    // Adjust based on guard
    if (guardLevel === 'CRISIS') {
      stressProb = Math.max(stressProb, 0.4);
      tailProb = 0.25;
    } else if (guardLevel === 'BLOCK') {
      stressProb = 0.6;
      tailProb = 0.35;
    } else if (guardLevel === 'WARN') {
      stressProb = Math.max(stressProb, 0.25);
      tailProb = 0.15;
    }
    
    // Liquidity contraction adds to stress
    if (world.assets.dxy?.liquidity?.regime === 'CONTRACTION') {
      stressProb += 0.10;
    }
    
    // Clamp
    stressProb = Math.min(stressProb, 0.7);
    tailProb = Math.min(tailProb, 0.4);
    
    const baseProb = Math.max(0, 1 - stressProb - tailProb);
    
    // Determine dominant scenario
    let name: ScenarioPack['name'] = 'BASE';
    if (tailProb >= 0.25) {
      name = 'TAIL';
    } else if (stressProb >= 0.35) {
      name = 'RISK';
    }
    
    return {
      name,
      probs: {
        BASE: Math.round(baseProb * 100) / 100,
        RISK: Math.round(stressProb * 100) / 100,
        TAIL: Math.round(tailProb * 100) / 100,
      },
      confidence: dxy?.macroV2?.confidence || 0.5,
      description: this.getScenarioDescription(name, world),
    };
  }
  
  /**
   * Compute directives based on world state and scenario
   */
  private computeDirectives(world: WorldStatePack, scenario: ScenarioPack): BrainDirectives {
    const directives: BrainDirectives = {
      caps: {},
      scales: {},
      haircuts: {},
      warnings: [],
    };
    
    const dxy = world.assets.dxy;
    const guardLevel = dxy?.guard?.level || 'NONE';
    const liquidityRegime = dxy?.liquidity?.regime || 'NEUTRAL';
    const macroScore = dxy?.macroV2?.scoreSigned || 0;
    
    // Rule 1: BLOCK → zero all risk
    if (guardLevel === 'BLOCK') {
      directives.caps = {
        spx: { maxSize: THRESHOLDS.BLOCK_MAX_SIZE },
        btc: { maxSize: THRESHOLDS.BLOCK_MAX_SIZE },
      };
      directives.riskMode = 'RISK_OFF';
      directives.warnings?.push('GUARD BLOCK: All risk assets capped to near-zero');
    }
    
    // Rule 2: CRISIS → strong haircuts
    else if (guardLevel === 'CRISIS') {
      directives.haircuts = {
        btc: THRESHOLDS.CRISIS_BTC_HAIRCUT,
        spx: THRESHOLDS.CRISIS_SPX_HAIRCUT,
      };
      directives.riskMode = 'RISK_OFF';
      directives.warnings?.push('GUARD CRISIS: BTC haircut stronger than SPX');
    }
    
    // Rule 3: WARN → light haircuts
    else if (guardLevel === 'WARN') {
      directives.haircuts = {
        btc: THRESHOLDS.WARN_BTC_HAIRCUT,
        spx: THRESHOLDS.WARN_SPX_HAIRCUT,
      };
      directives.warnings?.push('GUARD WARN: Moderate risk reduction');
    }
    
    // Rule 4: STRESS regime high prob → RISK_OFF
    if (scenario.probs.RISK >= THRESHOLDS.STRESS_PROB_RISK_OFF) {
      directives.riskMode = 'RISK_OFF';
      if (!directives.warnings?.some(w => w.includes('RISK_OFF'))) {
        directives.warnings?.push(`STRESS probability ${(scenario.probs.RISK * 100).toFixed(0)}% → RISK_OFF mode`);
      }
    }
    
    // Rule 5: Liquidity CONTRACTION + negative macro → extra BTC haircut
    if (liquidityRegime === 'CONTRACTION' && macroScore < 0) {
      const existingBtcHaircut = directives.haircuts?.btc || 1;
      directives.haircuts = {
        ...directives.haircuts,
        btc: Math.min(existingBtcHaircut, THRESHOLDS.CONTRACTION_HAIRCUT),
      };
      directives.warnings?.push('Liquidity CONTRACTION + negative macro: Extra BTC haircut');
    }
    
    // Rule 6: If everything is fine → RISK_ON potential
    if (guardLevel === 'NONE' && 
        scenario.name === 'BASE' && 
        liquidityRegime === 'EXPANSION' &&
        macroScore > 0.3) {
      directives.riskMode = 'RISK_ON';
      directives.scales = {
        spx: { sizeScale: 1.1 },
        btc: { sizeScale: 1.15 },
      };
    }
    
    // Default to NEUTRAL if not set
    if (!directives.riskMode) {
      directives.riskMode = 'NEUTRAL';
    }
    
    return directives;
  }
  
  /**
   * Build evidence pack
   */
  private buildEvidence(
    world: WorldStatePack,
    scenario: ScenarioPack,
    directives: BrainDirectives
  ): BrainEvidence {
    const dxy = world.assets.dxy;
    const drivers: string[] = [];
    const conflicts: string[] = [];
    const whatWouldFlip: string[] = [];
    
    // Add regime driver
    if (dxy?.macroV2?.regime.name) {
      drivers.push(`Macro Regime: ${dxy.macroV2.regime.name}`);
    }
    
    // Add guard driver
    if (dxy?.guard?.level && dxy.guard.level !== 'NONE') {
      drivers.push(`Guard Level: ${dxy.guard.level}`);
    }
    
    // Add liquidity driver
    if (dxy?.liquidity?.regime) {
      drivers.push(`Liquidity: ${dxy.liquidity.regime}`);
    }
    
    // Add macro score driver
    if (dxy?.macroV2?.scoreSigned !== undefined) {
      const scoreStr = dxy.macroV2.scoreSigned > 0 
        ? `+${dxy.macroV2.scoreSigned.toFixed(2)}` 
        : dxy.macroV2.scoreSigned.toFixed(2);
      drivers.push(`Macro Score: ${scoreStr}`);
    }
    
    // Add key macro drivers
    const topDrivers = dxy?.macroV2?.keyDrivers?.slice(0, 3) || [];
    for (const d of topDrivers) {
      drivers.push(`${d.key}: ${d.direction} (${(d.strength * 100).toFixed(0)}%)`);
    }
    
    // Detect conflicts
    if (dxy?.liquidity?.regime === 'EXPANSION' && dxy?.macroV2?.regime.name === 'TIGHTENING') {
      conflicts.push('Liquidity expanding but Fed tightening — may reverse');
    }
    if (dxy?.guard?.level === 'CRISIS' && scenario.name === 'BASE') {
      conflicts.push('Guard CRISIS but scenario BASE — anomaly');
    }
    
    // What would flip
    if (scenario.name === 'BASE') {
      whatWouldFlip.push('Guard escalation to CRISIS/BLOCK');
      whatWouldFlip.push('STRESS probability spike above 35%');
    }
    if (scenario.name === 'RISK') {
      whatWouldFlip.push('STRESS probability drop below 25%');
      whatWouldFlip.push('Liquidity shift to EXPANSION');
    }
    if (directives.riskMode === 'RISK_OFF') {
      whatWouldFlip.push('Guard deescalation to NONE/WARN');
    }
    
    // Build headline
    const headline = `${scenario.name} scenario (${(scenario.confidence * 100).toFixed(0)}% conf) | ${directives.riskMode} mode`;
    
    return {
      headline,
      drivers,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      whatWouldFlip: whatWouldFlip.length > 0 ? whatWouldFlip : undefined,
      confidenceFactors: [
        `Regime confidence: ${((dxy?.macroV2?.confidence || 0) * 100).toFixed(0)}%`,
        `System health: ${world.global.systemHealth?.status || 'UNKNOWN'}`,
      ],
    };
  }
  
  /**
   * Get scenario description
   */
  private getScenarioDescription(name: ScenarioPack['name'], world: WorldStatePack): string {
    const regime = world.assets.dxy?.macroV2?.regime.name;
    
    switch (name) {
      case 'BASE':
        return `Normal market conditions. ${regime} regime continues. Risk assets maintain allocation.`;
      case 'RISK':
        return `Elevated stress signals. ${regime} regime with potential deterioration. Reduce risk exposure.`;
      case 'TAIL':
        return `Crisis conditions detected. Severe risk-off required. Preserve capital priority.`;
      default:
        return 'Unknown scenario';
    }
  }
}

// Singleton
let instance: BrainOrchestratorService | null = null;

export function getBrainOrchestratorService(): BrainOrchestratorService {
  if (!instance) {
    instance = new BrainOrchestratorService();
  }
  return instance;
}
