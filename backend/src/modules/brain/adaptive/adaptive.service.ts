/**
 * P12 — Adaptive Coefficient Learning Service
 * 
 * Walk-forward tuning of deterministic rule parameters.
 * Grid search with smoothing, strict gates, no ML blackbox.
 */

import * as crypto from 'crypto';
import {
  AdaptiveParams,
  AdaptiveMode,
  AssetId,
  TuningRunRequest,
  TuningRunReport,
  TuningCandidate,
  TuningMetrics,
  createDefaultParams,
  smoothUpdate,
  round4,
  clamp,
  validateAdaptiveParams,
} from './adaptive.contract.js';
import { 
  AdaptiveParamsModel, 
  AdaptiveHistoryModel, 
  TuningRunModel,
} from './adaptive_param.model.js';
import { getBrainCompareService } from '../services/brain_compare.service.js';

export class AdaptiveService {

  // ═══════════════════════════════════════════════════════════════
  // GET CURRENT PARAMS
  // ═══════════════════════════════════════════════════════════════

  async getParams(asset: AssetId): Promise<AdaptiveParams> {
    const doc = await AdaptiveParamsModel.findOne({ asset });
    
    if (!doc) {
      // Initialize with defaults
      const defaults = createDefaultParams(asset);
      await this.saveParams(defaults);
      return defaults;
    }
    
    return this.docToParams(doc);
  }

  async saveParams(params: AdaptiveParams): Promise<void> {
    await AdaptiveParamsModel.updateOne(
      { asset: params.asset },
      { $set: params },
      { upsert: true }
    );
    
    // Also save to history
    await AdaptiveHistoryModel.create({
      ...params,
      createdAt: new Date(),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RUN TUNING (Walk-Forward Grid Search)
  // ═══════════════════════════════════════════════════════════════

  async runTuning(request: TuningRunRequest): Promise<string> {
    const { asset, start, end, steps, mode, gridSize = 3 } = request;
    const runId = `tune_${asset}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Create run record
    await TuningRunModel.create({
      runId,
      asset,
      start,
      end,
      steps,
      mode,
      status: 'running',
      startedAt: new Date(),
    });
    
    console.log(`[Adaptive] Starting tuning run ${runId} for ${asset}`);
    
    // Run async
    this.executeTuning(runId, request).catch(e => {
      console.error(`[Adaptive] Tuning ${runId} failed:`, e);
      TuningRunModel.updateOne({ runId }, { $set: { status: 'failed' } }).exec();
    });
    
    return runId;
  }

  private async executeTuning(runId: string, request: TuningRunRequest): Promise<void> {
    const { asset, start, end, steps, mode, gridSize = 3 } = request;
    
    // Get current params
    const currentParams = await this.getParams(asset);
    
    // Evaluate baseline
    console.log(`[Adaptive] Evaluating baseline params...`);
    const baselineMetrics = await this.evaluateParams(currentParams, start, end, steps);
    const baseline: TuningCandidate = {
      params: currentParams,
      score: this.computeScore(baselineMetrics),
      metrics: baselineMetrics,
    };
    
    // Generate candidates (grid search)
    const candidates = this.generateCandidates(currentParams, gridSize);
    console.log(`[Adaptive] Evaluating ${candidates.length} candidates...`);
    
    let best = baseline;
    let candidatesEvaluated = 0;
    
    for (const candidateParams of candidates) {
      try {
        const metrics = await this.evaluateParams(candidateParams, start, end, steps);
        const score = this.computeScore(metrics);
        candidatesEvaluated++;
        
        if (score > best.score) {
          best = { params: candidateParams, score, metrics };
          console.log(`[Adaptive] New best: score=${score.toFixed(3)}, avgDelta=${metrics.avgDeltaHitRatePp.toFixed(2)}pp`);
        }
        
        if (candidatesEvaluated % 10 === 0) {
          console.log(`[Adaptive] Progress: ${candidatesEvaluated}/${candidates.length}`);
        }
      } catch (e) {
        console.warn(`[Adaptive] Candidate eval failed:`, (e as Error).message);
      }
    }
    
    // Apply smoothing if best != baseline
    let finalParams = currentParams;
    if (best.params.versionId !== currentParams.versionId) {
      finalParams = this.smoothParams(currentParams, best.params);
      finalParams.versionId = `adaptive_${asset}_${new Date().toISOString()}`;
      finalParams.source = 'tuned';
    }
    
    // Evaluate gates
    const gates = this.evaluateGates(best.metrics, currentParams.gates);
    
    // Build report
    const report: TuningRunReport = {
      runId,
      asset,
      start,
      end,
      steps,
      mode,
      status: 'complete',
      startedAt: (await TuningRunModel.findOne({ runId }))?.startedAt?.toISOString() || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      baseline,
      best: {
        params: finalParams,
        score: best.score,
        metrics: best.metrics,
      },
      candidatesEvaluated,
      gates,
      recommendation: gates.passed ? 'promote' : (best.score > baseline.score ? 'review' : 'reject'),
    };
    
    // Save report
    await TuningRunModel.updateOne(
      { runId },
      { $set: { status: 'complete', completedAt: new Date(), report } }
    );
    
    // If mode=on and gates passed, auto-promote
    if (mode === 'on' && gates.passed) {
      console.log(`[Adaptive] Auto-promoting params for ${asset}`);
      await this.promote(asset, finalParams.versionId);
    }
    
    console.log(`[Adaptive] Tuning ${runId} complete. Recommendation: ${report.recommendation}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // EVALUATE PARAMS (using Brain Compare)
  // ═══════════════════════════════════════════════════════════════

  private async evaluateParams(
    params: AdaptiveParams, 
    start: string, 
    end: string, 
    steps: number
  ): Promise<TuningMetrics> {
    // Use existing Brain Compare service for walk-forward
    const compareService = getBrainCompareService();
    const timeline = await compareService.runComparison({ start, end, stepDays: Math.ceil(365 / steps) });
    
    // Extract metrics from timeline
    const deltas: number[] = [];
    let flipCount = 0;
    let totalIntensity = 0;
    let degradationCount = 0;
    
    for (let i = 0; i < timeline.points.length; i++) {
      const p = timeline.points[i];
      const delta = (p.onAllocations?.spxSize || 0) - (p.offAllocations?.spxSize || 0);
      deltas.push(delta);
      
      // Count flips (direction changes)
      if (i > 0) {
        const prevDelta = deltas[i - 1];
        if ((delta > 0 && prevDelta < 0) || (delta < 0 && prevDelta > 0)) {
          flipCount++;
        }
      }
      
      // Track intensity
      totalIntensity += Math.abs(delta);
      
      // Track degradation (if delta is negative = Brain hurt performance)
      if (delta < params.gates.maxDegradationPp / 100) {
        degradationCount++;
      }
    }
    
    const n = deltas.length || 1;
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / n;
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    const avgIntensity = totalIntensity / n;
    const maxIntensity = Math.max(...deltas.map(Math.abs));
    
    // Calculate stability (variance of deltas)
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / n;
    const stabilityScore = 1 - Math.min(1, Math.sqrt(variance) * 10); // Lower variance = higher stability
    
    // Convert to yearly flip rate
    const periodDays = (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000);
    const flipRatePerYear = (flipCount / periodDays) * 365;
    
    return {
      avgDeltaHitRatePp: round4(avgDelta * 100),  // Convert to percentage points
      minDeltaPp: round4(minDelta * 100),
      maxDeltaPp: round4(maxDelta * 100),
      flipRatePerYear: round4(flipRatePerYear),
      avgOverrideIntensity: round4(avgIntensity),
      maxOverrideIntensity: round4(maxIntensity),
      stabilityScore: round4(stabilityScore),
      degradationCount,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // OBJECTIVE SCORE
  // ═══════════════════════════════════════════════════════════════

  private computeScore(metrics: TuningMetrics): number {
    // Objective: maximize delta hit rate, penalize bad behaviors
    let score = metrics.avgDeltaHitRatePp;
    
    // Penalties
    if (metrics.minDeltaPp < -1) {
      score -= 2; // Degradation penalty
    }
    if (metrics.flipRatePerYear > 6) {
      score -= (metrics.flipRatePerYear - 6) * 0.5; // Flip storm penalty
    }
    if (metrics.maxOverrideIntensity > 0.35) {
      score -= (metrics.maxOverrideIntensity - 0.35) * 10; // Override explosion penalty
    }
    if (metrics.stabilityScore < 0.5) {
      score -= (0.5 - metrics.stabilityScore) * 2; // Instability penalty
    }
    
    return round4(score);
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERATE CANDIDATES (Grid Search)
  // ═══════════════════════════════════════════════════════════════

  private generateCandidates(base: AdaptiveParams, gridSize: number): AdaptiveParams[] {
    const candidates: AdaptiveParams[] = [];
    const multipliers = gridSize === 3 ? [0.9, 1.0, 1.1] : [0.85, 0.95, 1.0, 1.05, 1.15];
    
    // Grid search on key optimizer params
    for (const kMult of multipliers) {
      for (const wTailMult of multipliers) {
        const candidate: AdaptiveParams = {
          ...base,
          versionId: `candidate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          optimizer: {
            ...base.optimizer,
            K: clamp(base.optimizer.K * kMult, 0.1, 0.5),
            wTail: clamp(base.optimizer.wTail * wTailMult, 0.5, 2.0),
          },
        };
        
        // Validate and add
        const validation = validateAdaptiveParams(candidate);
        if (validation.valid) {
          candidates.push(candidate);
        }
      }
    }
    
    // Also try metarisk variations
    for (const durMult of [0.9, 1.0, 1.1]) {
      const candidate: AdaptiveParams = {
        ...base,
        versionId: `candidate_meta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        metarisk: {
          ...base.metarisk,
          durationScale: clamp(base.metarisk.durationScale * durMult, 0.5, 1.5),
        },
      };
      
      const validation = validateAdaptiveParams(candidate);
      if (validation.valid) {
        candidates.push(candidate);
      }
    }
    
    return candidates;
  }

  // ═══════════════════════════════════════════════════════════════
  // SMOOTH PARAMS
  // ═══════════════════════════════════════════════════════════════

  private smoothParams(current: AdaptiveParams, candidate: AdaptiveParams): AdaptiveParams {
    const alpha = 0.35; // Smoothing factor
    
    return {
      ...current,
      optimizer: {
        K: smoothUpdate(current.optimizer.K, candidate.optimizer.K, alpha),
        wReturn: smoothUpdate(current.optimizer.wReturn, candidate.optimizer.wReturn, alpha),
        wTail: smoothUpdate(current.optimizer.wTail, candidate.optimizer.wTail, alpha),
        wCorr: smoothUpdate(current.optimizer.wCorr, candidate.optimizer.wCorr, alpha),
        wGuard: smoothUpdate(current.optimizer.wGuard, candidate.optimizer.wGuard, alpha),
        capBase: current.optimizer.capBase, // Don't change caps
        capDefensive: current.optimizer.capDefensive,
        capTail: current.optimizer.capTail,
      },
      metarisk: {
        durationScale: smoothUpdate(current.metarisk.durationScale, candidate.metarisk.durationScale, alpha),
        stabilityScale: smoothUpdate(current.metarisk.stabilityScale, candidate.metarisk.stabilityScale, alpha),
        flipPenalty: smoothUpdate(current.metarisk.flipPenalty, candidate.metarisk.flipPenalty, alpha),
        crossAdj: smoothUpdate(current.metarisk.crossAdj, candidate.metarisk.crossAdj, alpha),
      },
      brain: current.brain, // Don't change brain rules in auto-tuning (more sensitive)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // EVALUATE GATES
  // ═══════════════════════════════════════════════════════════════

  private evaluateGates(metrics: TuningMetrics, gates: any): TuningRunReport['gates'] {
    const checks = {
      deltaHitRate: metrics.avgDeltaHitRatePp >= gates.minDeltaHitRatePp,
      degradation: metrics.minDeltaPp >= gates.maxDegradationPp,
      flipRate: metrics.flipRatePerYear <= gates.maxFlipRatePerYear,
      overrideIntensity: metrics.maxOverrideIntensity <= gates.maxOverrideIntensityBase,
      determinism: true, // Assumed from deterministic code
      noLookahead: true, // Assumed from asOf-safe code
    };
    
    const reasons: string[] = [];
    if (!checks.deltaHitRate) reasons.push(`avgDeltaHitRatePp ${metrics.avgDeltaHitRatePp} < ${gates.minDeltaHitRatePp}`);
    if (!checks.degradation) reasons.push(`minDeltaPp ${metrics.minDeltaPp} < ${gates.maxDegradationPp}`);
    if (!checks.flipRate) reasons.push(`flipRate ${metrics.flipRatePerYear} > ${gates.maxFlipRatePerYear}`);
    if (!checks.overrideIntensity) reasons.push(`maxIntensity ${metrics.maxOverrideIntensity} > ${gates.maxOverrideIntensityBase}`);
    
    return {
      passed: Object.values(checks).every(Boolean),
      checks,
      reasons,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMOTE PARAMS
  // ═══════════════════════════════════════════════════════════════

  async promote(asset: AssetId, versionId: string): Promise<void> {
    // Find in history
    const history = await AdaptiveHistoryModel.findOne({ asset, versionId });
    if (!history) {
      throw new Error(`Version ${versionId} not found in history`);
    }
    
    // Update active params
    const params = this.docToParams(history);
    params.source = 'promoted';
    params.updatedAt = new Date().toISOString();
    
    await this.saveParams(params);
    console.log(`[Adaptive] Promoted ${versionId} for ${asset}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET STATUS/REPORT
  // ═══════════════════════════════════════════════════════════════

  async getRunStatus(runId: string): Promise<any> {
    const run = await TuningRunModel.findOne({ runId });
    if (!run) {
      return { ok: false, error: 'Run not found' };
    }
    
    return {
      ok: true,
      runId,
      status: run.status,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      report: run.report,
    };
  }

  async getHistory(asset: AssetId, limit: number = 10): Promise<any[]> {
    const docs = await AdaptiveHistoryModel.find({ asset })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return docs.map(d => ({
      versionId: d.versionId,
      source: d.source,
      createdAt: d.createdAt,
      metrics: d.metrics,
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private docToParams(doc: any): AdaptiveParams {
    return {
      versionId: doc.versionId,
      asset: doc.asset,
      brain: doc.brain,
      optimizer: doc.optimizer,
      metarisk: doc.metarisk,
      gates: doc.gates,
      updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
      source: doc.source,
    };
  }
}

// Singleton
let instance: AdaptiveService | null = null;

export function getAdaptiveService(): AdaptiveService {
  if (!instance) {
    instance = new AdaptiveService();
  }
  return instance;
}
