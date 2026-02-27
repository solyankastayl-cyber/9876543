# Fractal Multi-Asset Platform PRD

## Original Problem Statement
Развернуть код из GitHub репозитория для работы с фракталами и индексами валютных пар. Поднять frontend, backend, админку. Модули: BTC Fractal, SPX, DXY Macro Engine V2. Реализовать Walk-Forward Simulation для валидации V2.

## Architecture
- **Backend**: TypeScript (Fastify) на порту 8002 + Python proxy на 8001
- **Frontend**: React на порту 3000
- **Database**: MongoDB (fractal_db)
- **External APIs**: FRED API (ключ: 2c0bf55cfd182a3a4d2e4fd017a622f7)

## Core Requirements
1. BTC Fractal Terminal с прогнозами по горизонтам (7d, 14d, 30d, 90d, 180d, 365d)
2. SPX Consensus Engine с hierarchical resolver
3. DXY Macro Engine V1/V2 с режимами EASING/TIGHTENING/STRESS/NEUTRAL
4. Walk-Forward Simulation для Production Emulation
5. Compare Dashboard для V1 vs V2 валидации
6. Admin Panel с авторизацией

## User Personas
- **Трейдер**: Использует BTC/SPX/DXY terminals для принятия торговых решений
- **Quant**: Анализирует Compare Dashboard, запускает Backtest, проверяет V2 валидацию
- **Admin**: Управляет engine switching, promotion, rollback через Admin Panel

## What's Been Implemented (2026-02-27)

### Backend
- [x] TypeScript Fastify backend запущен и работает
- [x] Python proxy для routing
- [x] MongoDB подключение настроено
- [x] FRED API ключ установлен в .env
- [x] Walk-Forward Simulation endpoint
- [x] BTC Terminal alias
- [x] Все основные API endpoints работают
- [x] **P8.0-A** Feature Builder (53 features)
- [x] **P8.0-B1** Forecast endpoint (baseline quantiles)
- [x] **P8.0-B2** Train endpoint (MoE quantile regression) ✅ NEW

### P8.0-B2 Implementation Details
- `dataset_builder.service.ts` — Builds asOf-safe (X, y) training dataset from DXY candles
- `quantile_mixture.service.ts` — MoE with linear quantile regression (pinball loss SGD)
- `tail_risk.service.ts` — Computes tailRisk from quantile spread
- `quantile_model.repo.ts` — MongoDB persistence for trained model weights
- `quantile_train.contract.ts` — Type contracts for training data and weights
- Updated `forecast_pipeline.service.ts` — Uses trained MoE if available, baseline fallback
- Updated `brain_forecast.routes.ts` — Full train endpoint implementation

### Frontend
- [x] React frontend с Tailwind CSS
- [x] BTC Fractal page с графиком и прогнозами
- [x] Compare Dashboard (V1 vs V2)
- [x] Admin Panel login
- [x] Navigation sidebar

### Endpoints Status
| Endpoint | Status |
|----------|--------|
| /api/health | Working |
| /api/macro-engine/status | Working |
| /api/macro-engine/dxy/pack | Working |
| /api/fractal/btc/terminal | Working |
| /api/fractal/dxy/terminal | Working |
| /api/fractal/spx/terminal | Working |
| /api/spx/v2.1/consensus | Working |
| /api/macro-engine/simulation/v2/run | Working |
| /api/macro-engine/admin/active | Working |
| /api/brain/v2/forecast | Working (MoE) |
| /api/brain/v2/forecast/status | Working |
| /api/brain/v2/forecast/train | Working |
| /api/brain/v2/forecast/compare | Working |

### Brain v2 Forecast API (P8.0-B):
- GET /api/brain/v2/forecast?asset=dxy&asOf=YYYY-MM-DD — Quantile forecasts (MoE)
- POST /api/brain/v2/forecast/train — Train MoE model
- GET /api/brain/v2/forecast/status?asset=dxy — Model status
- GET /api/brain/v2/forecast/compare?asset=dxy — Horizon comparison

### Acceptance Tests Passed (P8.0-B):
1. ✅ byHorizon contains 4 horizons (30D, 90D, 180D, 365D)
2. ✅ q05 ≤ q50 ≤ q95 (monotonicity enforced)
3. ✅ All values finite
4. ✅ Determinism: same asOf → same inputsHash + output
5. ✅ noLookahead: true
6. ✅ Dropped experts (< minSamples) redistributed proportionally
7. ✅ 23/23 tests passed (100%)

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Walk-Forward Simulation validated
- [x] V2 Promoted
- [x] Shadow Audit + Divergence Alerts
- [x] AE/S-Brain v2 Intelligence Layer

### P1 (High) - COMPLETED
- [x] P8.0-A Feature Builder (53 features)
- [x] P8.0-B Quantile Model + Forecast endpoint (MoE)

### P1 (High) - PENDING
- [ ] P8.0-C: Integration quantile forecasts into Brain decision rules (scenario BASE/RISK/TAIL + overrides)
- [ ] Configure Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks

### P2 (Medium)
- [ ] Stress Simulation Mode (forceRegime=STRESS)
- [ ] Cross-asset correlation regime classifier
- [ ] Feature Store for ML training

### P8.0 Feature Vector (53 features):
| Group | Indices | Features |
|-------|---------|----------|
| macro | 0-3 | scoreSigned, confidence, concentration, entropy |
| regime | 4-10 | p_easing, p_tightening, p_stress, p_neutral, p_mixed, persistence, flip_risk |
| liquidity | 11-15 | impulse, confidence, regime one-hot |
| guard | 16-22 | level, one-hot, days_in_state, cooldown |
| returns | 23-26 | ret_5d, ret_20d, ret_60d, ret_120d |
| volatility | 27-29 | vol_20d, vol_60d, vol_ratio |
| trend | 30-32 | slope_50d, ema_gap, breakout_60d |
| drawdown | 33-35 | dd_90d, dd_180d, vol_spike |
| cross_asset | 36-40 | correlations, relative volatility |
| drivers | 41-52 | top 3 drivers (weight, corr, lag, z) |
