# Fractal Multi-Asset Platform PRD

## Original Problem Statement
Развернуть код из GitHub репозитория для работы с фракталами и индексами валютных пар. Поднять frontend, backend, админку. Модули: BTC Fractal, SPX, DXY Macro Engine V2. Реализовать Walk-Forward Simulation, Quantile Forecast, Brain Decision Layer, Cross-Asset Classifier.

## Architecture
- **Backend**: TypeScript (Fastify) на порту 8002 + Python proxy на 8001
- **Frontend**: React на порту 3000
- **Database**: MongoDB (fractal_db)
- **External APIs**: FRED API (ключ в backend/.env)

## Brain v2.1 Decision Flow
```
WorldState + CrossAsset → Quantile Forecast (MoE) → Scenario Engine → Risk Engine (+ CrossAsset overrides) → Directives → EngineGlobal
```

## What's Been Implemented

### P8.0-A: Feature Builder (53 features) ✅
### P8.0-B1: Forecast endpoint (baseline) ✅
### P8.0-B2: Train endpoint (MoE quantile regression) ✅
### P8.0-C: Brain Decision Rules Integration ✅
### P9.0: Cross-Asset Correlation Regime Classifier ✅ (2026-02-27)

#### P9.0 Implementation Details
- `cross_asset.contract.ts` — Types for CrossAssetPack, regime labels, thresholds
- `cross_asset_returns.service.ts` — Price loader for BTC/SPX/DXY/GOLD, log-return computation
- `rolling_corr.service.ts` — Rolling Pearson correlations (20d/60d/120d windows)
- `cross_asset_regime.service.ts` — Deterministic regime classifier (RISK_ON_SYNC, RISK_OFF_SYNC, FLIGHT_TO_QUALITY, DECOUPLED, MIXED)
- `cross_asset.routes.ts` — API endpoints
- Brain orchestrator updated with cross-asset overrides
- WorldState aggregator includes CrossAssetPack

### Endpoints Status
| Endpoint | Status |
|----------|--------|
| /api/brain/v2/cross-asset | Working |
| /api/brain/v2/cross-asset/schema | Working |
| /api/brain/v2/cross-asset/validate | Working |
| /api/brain/v2/cross-asset/timeline | Working |
| /api/brain/v2/decision | Working (MoE + CrossAsset) |
| /api/brain/v2/summary | Working |
| /api/brain/v2/status | Working |
| /api/brain/v2/apply-overrides | Working |
| /api/brain/v2/forecast | Working (MoE) |
| /api/brain/v2/forecast/train | Working |
| /api/brain/v2/forecast/status | Working |
| /api/brain/v2/forecast/compare | Working |

### Test Results
- P8.0-B2: 23/23 tests passed (iteration_9.json)
- P8.0-C: 25/25 tests passed (iteration_10.json)
- P9.0: 20/20 tests passed (iteration_11.json)

## Prioritized Backlog

### P1 (High) - NEXT
- [ ] P9.1: Brain ON vs OFF compare (API only)
- [ ] P9.2: Walk-forward with Brain (hit-rate + drawdown)

### P2 (Medium)
- [ ] Stress Simulation Mode (forceRegime=STRESS)
- [ ] Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks
- [ ] Feature Store for ML training

### P3 (Low)
- [ ] Model versioning UI
- [ ] Historical scenario backtest dashboard
- [ ] GOLD data integration from FRED (currently returning 0 correlations)
