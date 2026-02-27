/**
 * P8.0-B1 — Forecast Pipeline Service
 * 
 * Main entry point for quantile forecasting.
 * Pipeline: Features → Model → Postprocess → Response
 */

import * as crypto from 'crypto';
import {
  QuantileForecastResponse,
  Horizon,
  HORIZONS,
  MODEL_VERSION,
  validateForecast,
} from '../contracts/quantile_forecast.contract.js';
import { FEATURES_VERSION } from '../contracts/feature_vector.contract.js';
import { getFeatureBuilderService } from './feature_builder.service.js';
import { getBaselineQuantileModelService } from './quantile_model.service.js';
import { getMacroEnginePack } from '../../adapters/sources.adapter.js';

// ═══════════════════════════════════════════════════════════════
// FORECAST PIPELINE SERVICE
// ═══════════════════════════════════════════════════════════════

export class ForecastPipelineService {
  
  /**
   * Main entry: generate quantile forecast for asset
   */
  async generateForecast(asset: string, asOf: string): Promise<QuantileForecastResponse> {
    const startTime = Date.now();
    
    // 1. Build feature vector
    const featureService = getFeatureBuilderService();
    const features = await featureService.buildFeatures(asset, asOf);
    
    // 2. Get regime probabilities from macro engine
    const macroPack = await getMacroEnginePack(asset as any, asOf);
    const regimeProbs = this.extractRegimeProbs(macroPack);
    const dominantRegime = this.getDominantRegime(regimeProbs);
    
    // 3. Get quantile forecasts from model
    const modelService = getBaselineQuantileModelService();
    const byHorizon = modelService.getForecast(regimeProbs, features.vector);
    
    // 4. Get model info
    const modelInfo = modelService.getModelInfo();
    
    // 5. Compute integrity hash
    const inputsHash = this.computeInputsHash(features.integrity.inputsHash, regimeProbs, asOf);
    
    // 6. Build response
    const response: QuantileForecastResponse = {
      asset,
      asOf,
      featuresVersion: FEATURES_VERSION,
      model: {
        modelVersion: modelInfo.version,
        activeWeightsId: null,
        trainedAt: modelInfo.trainedAt,
        isBaseline: modelInfo.isBaseline,
      },
      regime: {
        dominant: dominantRegime,
        p: regimeProbs,
      },
      byHorizon,
      integrity: {
        inputsHash,
        noLookahead: true,
        computeTimeMs: Date.now() - startTime,
      },
    };
    
    // 7. Validate
    const validation = validateForecast(response);
    if (!validation.valid) {
      console.warn('[Forecast] Validation warnings:', validation.errors);
    }
    
    return response;
  }
  
  /**
   * Extract regime probabilities from macro pack
   */
  private extractRegimeProbs(macroPack: any): Record<string, number> {
    const posterior = macroPack?.regime?.posterior || {};
    
    return {
      EASING: posterior['EASING'] || 0,
      TIGHTENING: posterior['TIGHTENING'] || 0,
      STRESS: posterior['STRESS'] || 0,
      NEUTRAL: posterior['NEUTRAL'] || 0,
      NEUTRAL_MIXED: posterior['MIXED'] || posterior['NEUTRAL_MIXED'] || 0,
    };
  }
  
  /**
   * Get dominant regime (highest probability)
   */
  private getDominantRegime(probs: Record<string, number>): string {
    let maxProb = 0;
    let dominant = 'NEUTRAL';
    
    for (const [regime, prob] of Object.entries(probs)) {
      if (prob > maxProb) {
        maxProb = prob;
        dominant = regime;
      }
    }
    
    // If no clear winner, check macro pack dominant
    if (maxProb < 0.3) {
      return 'NEUTRAL';
    }
    
    return dominant;
  }
  
  /**
   * Compute integrity hash
   */
  private computeInputsHash(
    featuresHash: string,
    regimeProbs: Record<string, number>,
    asOf: string
  ): string {
    const serialized = JSON.stringify({
      featuresHash,
      regimeProbs,
      asOf,
    });
    
    return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  }
  
  /**
   * Get forecast status
   */
  async getStatus(asset: string): Promise<{
    asset: string;
    modelVersion: string;
    available: boolean;
    trainedAt: string | null;
    featuresVersion: string;
    isBaseline: boolean;
    coverage: Record<string, boolean>;
  }> {
    const modelService = getBaselineQuantileModelService();
    const modelInfo = modelService.getModelInfo();
    
    return {
      asset,
      modelVersion: modelInfo.version,
      available: modelService.isAvailable(),
      trainedAt: modelInfo.trainedAt,
      featuresVersion: FEATURES_VERSION,
      isBaseline: modelInfo.isBaseline,
      coverage: {
        EASING: true,
        TIGHTENING: true,
        STRESS: true,
        NEUTRAL: true,
        NEUTRAL_MIXED: false, // Will be enabled after training
      },
    };
  }
}

// Singleton
let instance: ForecastPipelineService | null = null;

export function getForecastPipelineService(): ForecastPipelineService {
  if (!instance) {
    instance = new ForecastPipelineService();
  }
  return instance;
}
