# Fractal Multi-Asset Platform PRD

## Original Problem Statement
Развернуть код из GitHub репозитория для работы с фракталами и индексами валютных пар. Поднять frontend, backend, админку. Модули: BTC Fractal, SPX, DXY Macro Engine V2. Реализовать Walk-Forward Simulation для валидации V2.

## Architecture
- **Backend**: TypeScript (Fastify) на порту 8002 + Python proxy на 8001
- **Frontend**: React на порту 3000
- **Database**: MongoDB (fractal_db)
- **External APIs**: FRED API (ключ в backend/.env)

## Brain v2.1 Decision Flow (P8.0-C)
```
WorldState → Quantile Forecast (MoE) → Scenario Engine → Risk Engine → Directives → EngineGlobal
```

## What's Been Implemented

### P8.0-A: Feature Builder (53 features) ✅
### P8.0-B1: Forecast endpoint (baseline) ✅
### P8.0-B2: Train endpoint (MoE quantile regression) ✅
### P8.0-C: Brain Decision Rules Integration ✅ (2026-02-27)
- `brain_quantile_rules.service.ts` — Scenario engine + override logic
- Scenario posterior: P(TAIL), P(RISK), P(BASE) from tailRisk, regime probs, vol_spike
- Tail amplification: q05 < threshold → amplify haircut
- Bull extension: mean > 0 AND tailRisk < 0.2 AND guard=NONE → sizeScale 1.1
- Neutral dampening: spread > threshold → allocations × 0.9
- Guard has absolute priority over forecast-driven rules
- `?withForecast=1` debug mode shows full forecast + overrideReasoning

### Endpoints Status
| Endpoint | Status |
|----------|--------|
| /api/health | Working |
| /api/brain/v2/decision | Working (MoE) |
| /api/brain/v2/decision?withForecast=1 | Working (debug) |
| /api/brain/v2/summary | Working |
| /api/brain/v2/status | Working |
| /api/brain/v2/apply-overrides | Working |
| /api/brain/v2/forecast | Working (MoE) |
| /api/brain/v2/forecast/train | Working |
| /api/brain/v2/forecast/status | Working |
| /api/brain/v2/forecast/compare | Working |

### Acceptance Tests (P8.0-C): 25/25 passed ✅
1. Scenario probs sum to ~1.0, all >= 0
2. Determinism confirmed (same asOf → same inputsHash)
3. withForecast=1 includes forecasts + overrideReasoning + forecastMeta
4. Guard has absolute priority
5. Regression: all P8.0-B endpoints still work

## Prioritized Backlog

### P1 (High) - NEXT
- [ ] P8.0-D: Brain ON vs Brain OFF comparison (replaces V1/V2 compare)
- [ ] Walk-forward with Brain hit-rate + drawdown control
- [ ] Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks

### P2 (Medium)
- [ ] P9.0: Cross-Asset Correlation Regime Classifier
- [ ] Stress Simulation Mode (forceRegime=STRESS)
- [ ] Feature Store for ML training

### P3 (Low)
- [ ] Model versioning UI
- [ ] Historical scenario backtest dashboard
