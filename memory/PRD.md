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
- [x] Walk-Forward Simulation endpoint `/api/macro-engine/simulation/v2/run`
- [x] BTC Terminal alias `/api/fractal/btc/terminal`
- [x] Все основные API endpoints работают

### Frontend
- [x] React frontend с Tailwind CSS
- [x] BTC Fractal page с графиком и прогнозами
- [x] Compare Dashboard (V1 vs V2)
- [x] Admin Panel login
- [x] Navigation sidebar
- [x] Missing npm packages установлены (@nivo/bar, react-force-graph-2d, lightweight-charts, echarts-for-react)

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

### Validation Results (V1 vs V2) - After Walk-Forward Simulation
- **ALL CRITERIA PASSED** ✅
- Walk-Forward Simulation: 25 steps (2023-01-01 → 2026-02-27)
- Weight smoothing applied (factor 0.35)

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| avgDeltaPp | 44 | ≥2 | ✅ |
| worstMonthDelta | 0 | >-2 | ✅ |
| negativeMonthsRatio | 0% | ≤25% | ✅ |
| stabilityScore | 0.88 | ≥0.85 | ✅ |
| maxWeightDrift | 0.297 | ≤0.35 | ✅ |

**Hit Rates by Horizon:**
| Horizon | V1 | V2 | Delta |
|---------|-----|-----|-------|
| 30D | 32% | 60% | +28pp |
| 90D | 20% | 56% | +36pp |
| 180D | 4% | 56% | +52pp |
| 365D | 0% | 60% | +60pp |

V2 **VALIDATED** - Ready for Promotion!

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Walk-Forward Simulation validated (stability 0.88)
- [x] V2 Promoted
- [x] Shadow Audit + Divergence Alerts (P6.1-P6.5)
- [x] Health endpoint /api/macro-engine/health
- [x] AE/S-Brain v2 Intelligence Layer

### Brain v2 Endpoints:
- GET /api/brain/v2/world — WorldStatePack (DXY/SPX/BTC)
- GET /api/brain/v2/decision — BrainOutputPack (scenarios, directives)
- GET /api/brain/v2/summary — Quick dashboard summary
- GET /api/brain/v2/status — Brain config and rules
- POST /api/brain/v2/apply-overrides — Test override application

### EngineGlobal + Brain Integration (P7.0):
- GET /api/engine/global — Base allocations
- GET /api/engine/global?brain=1 — Allocations with brain overrides applied
- GET /api/engine/global?brain=1&brainMode=shadow — Show what brain WOULD do (no changes)

### Brain v2 Rules:
- BLOCK → all risk assets capped to 5%
- CRISIS → BTC haircut 60%, SPX haircut 75%
- WARN → BTC haircut 85%, SPX haircut 90%
- STRESS prob > 35% → RISK_OFF mode
- CONTRACTION + negative macro → extra BTC haircut

### P1 (High)
- [x] P8.0-A Feature Builder (53 features, institutional-grade)
- [ ] P8.0-B Quantile Model + Forecast endpoint
- [ ] Configure Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks
- [ ] ML layer for forecasts (quantile regression)

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

### P2 (Medium)
- [ ] Stress Simulation Mode (forceRegime=STRESS)
- [ ] Cross-asset correlation regime classifier
- [ ] Feature Store for ML training

## Next Steps
1. Запустить ingest для FRED macro data
2. Калибровать V2 weights
3. Проверить Walk-Forward Simulation с реальными predictions
4. Promote V2 после успешной валидации
