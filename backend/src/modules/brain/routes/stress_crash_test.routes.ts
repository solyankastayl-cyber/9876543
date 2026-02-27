/**
 * Stress Simulation + Platform Crash-Test Routes
 * 
 * POST /api/brain/v2/stress/run          — Run stress scenario
 * GET  /api/brain/v2/stress/presets       — List available presets
 * POST /api/platform/crash-test/run       — Run full crash-test
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getStressSimulationService } from '../services/stress_simulation.service.js';
import { getCrashTestService } from '../services/crash_test.service.js';
import { BLACK_SWAN_LIBRARY, getPresetNames } from '../stress/black_swan_library.js';

export async function stressCrashTestRoutes(fastify: FastifyInstance): Promise<void> {

  // ─────────────────────────────────────────────────────────
  // POST /api/brain/v2/stress/run — Run stress scenario
  // ─────────────────────────────────────────────────────────

  fastify.post('/api/brain/v2/stress/run', async (
    request: FastifyRequest<{
      Body: {
        asset?: string;
        start?: string;
        end?: string;
        stepDays?: number;
        scenarioPreset?: string;
      }
    }>,
    reply: FastifyReply
  ) => {
    const body = request.body || {};
    const asset = body.asset || 'dxy';
    const start = body.start || '2020-01-01';
    const end = body.end || '2020-06-01';
    const stepDays = body.stepDays || 7;
    const scenarioPreset = body.scenarioPreset || 'COVID_CRASH';

    try {
      const service = getStressSimulationService();
      const report = await service.runStress({
        asset, start, end, stepDays, scenarioPreset,
      });

      return reply.send({ ok: true, ...report });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'STRESS_ERROR',
        message: (e as Error).message,
      });
    }
  });

  // ─────────────────────────────────────────────────────────
  // GET /api/brain/v2/stress/presets — List presets
  // ─────────────────────────────────────────────────────────

  fastify.get('/api/brain/v2/stress/presets', async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const presets = Object.entries(BLACK_SWAN_LIBRARY).map(([key, val]) => ({
      name: key,
      description: val.description,
      overrides: val.overrides,
    }));

    return reply.send({ ok: true, presets });
  });

  // ─────────────────────────────────────────────────────────
  // POST /api/platform/crash-test/run — Full crash-test
  // ─────────────────────────────────────────────────────────

  fastify.post('/api/platform/crash-test/run', async (
    request: FastifyRequest<{
      Body: {
        start?: string;
        end?: string;
        stepDays?: number;
        asset?: string;
      }
    }>,
    reply: FastifyReply
  ) => {
    const body = request.body || {};
    const start = body.start || '2024-01-01';
    const end = body.end || '2025-12-01';
    const stepDays = body.stepDays || 30;
    const asset = body.asset || 'dxy';

    try {
      console.log(`[CrashTest] Starting platform crash-test: ${start}→${end}, step=${stepDays}d`);
      const service = getCrashTestService();
      const report = await service.runCrashTest({ start, end, stepDays, asset });

      console.log(`[CrashTest] Complete: resilience=${report.resilienceScore}, grade=${report.verdict.grade}`);

      return reply.send({ ok: true, ...report });
    } catch (e) {
      console.error('[CrashTest] Error:', e);
      return reply.status(500).send({
        ok: false,
        error: 'CRASH_TEST_ERROR',
        message: (e as Error).message,
      });
    }
  });

  console.log('[Stress+CrashTest] Routes registered at /api/brain/v2/stress, /api/platform/crash-test');
}
