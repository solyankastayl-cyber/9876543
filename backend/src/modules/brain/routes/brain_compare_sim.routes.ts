/**
 * P9.1 + P9.2 — Brain Compare & Simulation Routes
 * 
 * P9.1: GET /api/brain/v2/compare
 * P9.1: GET /api/brain/v2/compare/timeline
 * P9.2: POST /api/brain/v2/sim/run
 * P9.2: GET /api/brain/v2/sim/report
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getBrainCompareService } from '../services/brain_compare.service.js';
import { getBrainSimulationService } from '../services/brain_simulation.service.js';

// In-memory store for sim reports (could be MongoDB)
const simReports = new Map<string, any>();

export async function brainCompareSimRoutes(fastify: FastifyInstance): Promise<void> {

  // ─────────────────────────────────────────────────────────
  // P9.1: GET /api/brain/v2/compare
  // ─────────────────────────────────────────────────────────

  fastify.get('/api/brain/v2/compare', async (
    request: FastifyRequest<{ Querystring: { asOf?: string } }>,
    reply: FastifyReply
  ) => {
    const asOf = request.query.asOf || new Date().toISOString().split('T')[0];

    try {
      const service = getBrainCompareService();
      const pack = await service.compare(asOf);
      return reply.send({ ok: true, ...pack });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'COMPARE_ERROR',
        message: (e as Error).message,
      });
    }
  });

  // ─────────────────────────────────────────────────────────
  // P9.1: GET /api/brain/v2/compare/timeline
  // ─────────────────────────────────────────────────────────

  fastify.get('/api/brain/v2/compare/timeline', async (
    request: FastifyRequest<{
      Querystring: { start?: string; end?: string; step?: string }
    }>,
    reply: FastifyReply
  ) => {
    const end = request.query.end || new Date().toISOString().split('T')[0];
    const start = request.query.start || subtractDays(end, 180);
    const stepDays = parseInt(request.query.step || '7', 10);

    try {
      const service = getBrainCompareService();
      const timeline: {
        asOf: string;
        scenario: string;
        severity: string;
        delta: { spx: number; btc: number; cash: number };
        crossAssetLabel?: string;
      }[] = [];

      let current = new Date(start);
      const endDate = new Date(end);
      const maxPoints = 200;

      while (current <= endDate && timeline.length < maxPoints) {
        const dateStr = current.toISOString().split('T')[0];

        try {
          const pack = await service.compare(dateStr);
          timeline.push({
            asOf: dateStr,
            scenario: pack.brain.decision.scenario,
            severity: pack.diff.severity,
            delta: pack.diff.allocationsDelta,
            crossAssetLabel: pack.context.crossAsset?.label,
          });
        } catch {
          // Skip dates with errors
        }

        current.setDate(current.getDate() + stepDays);
      }

      return reply.send({
        ok: true,
        start,
        end,
        stepDays,
        count: timeline.length,
        timeline,
      });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: 'COMPARE_TIMELINE_ERROR',
        message: (e as Error).message,
      });
    }
  });

  // ─────────────────────────────────────────────────────────
  // P9.2: POST /api/brain/v2/sim/run
  // ─────────────────────────────────────────────────────────

  fastify.post('/api/brain/v2/sim/run', async (
    request: FastifyRequest<{
      Body: {
        asset?: string;
        start?: string;
        end?: string;
        stepDays?: number;
        horizons?: number[];
        mode?: string;
        seed?: number;
      }
    }>,
    reply: FastifyReply
  ) => {
    const body = request.body || {};
    const asset = (body.asset || 'dxy') as 'dxy' | 'spx' | 'btc';
    const start = body.start || '2024-01-01';
    const end = body.end || new Date().toISOString().split('T')[0];
    const stepDays = body.stepDays || 14;
    const horizons = (body.horizons || [30, 90, 180, 365]) as Array<30 | 90 | 180 | 365>;
    const mode = (body.mode || 'compare') as 'compare' | 'brain_only';
    const seed = body.seed || 42;

    try {
      console.log(`[BrainSim] Starting: ${asset} ${start}→${end}, step=${stepDays}d`);
      const service = getBrainSimulationService();
      const report = await service.runSimulation({
        asset, start, end, stepDays, horizons, mode, seed,
      });

      // Store for later retrieval
      simReports.set(report.id, report);

      return reply.send({ ok: true, ...report });
    } catch (e) {
      console.error('[BrainSim] Error:', e);
      return reply.status(500).send({
        ok: false,
        error: 'SIM_RUN_ERROR',
        message: (e as Error).message,
      });
    }
  });

  // ─────────────────────────────────────────────────────────
  // P9.2: GET /api/brain/v2/sim/status
  // ─────────────────────────────────────────────────────────

  fastify.get('/api/brain/v2/sim/status', async (
    request: FastifyRequest<{ Querystring: { id?: string } }>,
    reply: FastifyReply
  ) => {
    const id = request.query.id;
    if (!id) {
      return reply.send({
        ok: true,
        storedReports: Array.from(simReports.keys()),
      });
    }

    const report = simReports.get(id);
    if (!report) {
      return reply.status(404).send({ ok: false, error: 'Report not found' });
    }

    return reply.send({
      ok: true,
      id,
      status: 'COMPLETED',
      window: report.window,
      verdict: report.verdict,
    });
  });

  // ─────────────────────────────────────────────────────────
  // P9.2: GET /api/brain/v2/sim/report
  // ─────────────────────────────────────────────────────────

  fastify.get('/api/brain/v2/sim/report', async (
    request: FastifyRequest<{ Querystring: { id?: string } }>,
    reply: FastifyReply
  ) => {
    const id = request.query.id;
    if (!id) {
      return reply.status(400).send({ ok: false, error: 'Missing id parameter' });
    }

    const report = simReports.get(id);
    if (!report) {
      return reply.status(404).send({ ok: false, error: 'Report not found' });
    }

    return reply.send({ ok: true, ...report });
  });

  console.log('[Brain Compare+Sim] Routes registered at /api/brain/v2/compare, /api/brain/v2/sim');
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
