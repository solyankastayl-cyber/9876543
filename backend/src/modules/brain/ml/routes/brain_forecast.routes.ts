/**
 * P8.0-B — Brain Forecast Routes
 * 
 * Endpoints:
 * - GET /api/brain/v2/forecast — Quantile forecasts
 * - GET /api/brain/v2/forecast/status — Model status
 * - POST /api/brain/v2/forecast/train — Train MoE model (P8.0-B2)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getForecastPipelineService } from '../services/forecast_pipeline.service.js';
import { validateForecast } from '../contracts/quantile_forecast.contract.js';

export async function brainForecastRoutes(fastify: FastifyInstance): Promise<void> {
  
  // ─────────────────────────────────────────────────────────────
  // GET /api/brain/v2/forecast — Quantile forecasts
  // ─────────────────────────────────────────────────────────────
  
  fastify.get('/api/brain/v2/forecast', async (
    request: FastifyRequest<{
      Querystring: {
        asset?: string;
        asOf?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const asset = request.query.asset || 'dxy';
    const asOf = request.query.asOf || new Date().toISOString().split('T')[0];
    
    try {
      const pipelineService = getForecastPipelineService();
      const forecast = await pipelineService.generateForecast(asset, asOf);
      
      // Validate
      const validation = validateForecast(forecast);
      
      return reply.send({
        ok: true,
        ...forecast,
        _validation: validation.valid ? undefined : validation.errors,
      });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'FORECAST_ERROR',
        message: (e as Error).message,
      });
    }
  });
  
  // ─────────────────────────────────────────────────────────────
  // GET /api/brain/v2/forecast/status — Model status
  // ─────────────────────────────────────────────────────────────
  
  fastify.get('/api/brain/v2/forecast/status', async (
    request: FastifyRequest<{
      Querystring: {
        asset?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const asset = request.query.asset || 'dxy';
    
    try {
      const pipelineService = getForecastPipelineService();
      const status = await pipelineService.getStatus(asset);
      
      return reply.send({
        ok: true,
        ...status,
      });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'STATUS_ERROR',
        message: (e as Error).message,
      });
    }
  });
  
  // ─────────────────────────────────────────────────────────────
  // POST /api/brain/v2/forecast/train — Train MoE model (P8.0-B2)
  // ─────────────────────────────────────────────────────────────
  
  fastify.post('/api/brain/v2/forecast/train', async (
    request: FastifyRequest<{
      Body: {
        asset?: string;
        start?: string;
        end?: string;
        step?: string;
        horizons?: string[];
        quantiles?: number[];
        regimeExperts?: string[];
        minSamplesPerExpert?: number;
        smoothing?: number;
        seed?: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    // P8.0-B2: Training not implemented yet
    return reply.status(501).send({
      ok: false,
      error: 'NOT_IMPLEMENTED',
      message: 'MoE training will be implemented in P8.0-B2. Currently using baseline model.',
      baseline: {
        version: 'baseline_v1',
        description: 'Using empirical quantiles with regime adjustments',
        horizons: ['30D', '90D', '180D', '365D'],
        regimes: ['EASING', 'TIGHTENING', 'STRESS', 'NEUTRAL', 'NEUTRAL_MIXED'],
      },
    });
  });
  
  // ─────────────────────────────────────────────────────────────
  // GET /api/brain/v2/forecast/compare — Compare horizons
  // ─────────────────────────────────────────────────────────────
  
  fastify.get('/api/brain/v2/forecast/compare', async (
    request: FastifyRequest<{
      Querystring: {
        asset?: string;
        asOf?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const asset = request.query.asset || 'dxy';
    const asOf = request.query.asOf || new Date().toISOString().split('T')[0];
    
    try {
      const pipelineService = getForecastPipelineService();
      const forecast = await pipelineService.generateForecast(asset, asOf);
      
      // Build comparison view
      const comparison = Object.entries(forecast.byHorizon).map(([horizon, data]) => ({
        horizon,
        direction: data.mean > 0 ? 'UP' : 'DOWN',
        mean: `${(data.mean * 100).toFixed(2)}%`,
        range: `[${(data.q05 * 100).toFixed(2)}%, ${(data.q95 * 100).toFixed(2)}%]`,
        tailRisk: data.tailRisk,
        riskLevel: data.tailRisk > 0.5 ? 'HIGH' : data.tailRisk > 0.25 ? 'MEDIUM' : 'LOW',
      }));
      
      return reply.send({
        ok: true,
        asset,
        asOf,
        regime: forecast.regime.dominant,
        comparison,
        summary: {
          shortTermBias: forecast.byHorizon['30D'].mean > 0 ? 'BULLISH' : 'BEARISH',
          longTermBias: forecast.byHorizon['365D'].mean > 0 ? 'BULLISH' : 'BEARISH',
          avgTailRisk: (
            (forecast.byHorizon['30D'].tailRisk +
              forecast.byHorizon['90D'].tailRisk +
              forecast.byHorizon['180D'].tailRisk +
              forecast.byHorizon['365D'].tailRisk) / 4
          ).toFixed(2),
        },
      });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'COMPARE_ERROR',
        message: (e as Error).message,
      });
    }
  });
  
  console.log('[Brain Forecast] Routes registered at /api/brain/v2/forecast');
}
