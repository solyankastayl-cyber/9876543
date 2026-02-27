# Fractal Multi-Asset Platform PRD

## Original Problem Statement
Развернуть код из GitHub для работы с фракталами валютных пар. Модули: BTC Fractal, SPX, DXY Macro Engine V2. Walk-Forward Simulation, Quantile Forecast, Brain Decision Layer, Cross-Asset Classifier, Brain Compare + Simulation.

## Architecture
- **Backend**: TypeScript (Fastify) 8002 + Python proxy 8001
- **Frontend**: React 3000 | **Database**: MongoDB (fractal_db)
- **External APIs**: FRED API (key in backend/.env)

## Brain v2.1 Full Pipeline
```
WorldState + CrossAsset → Quantile Forecast (MoE) → Scenario Engine → Risk Engine → Directives → EngineGlobal
                                                                     ↕
                                                         Brain Compare (ON vs OFF)
                                                         Brain Simulation (Walk-Forward)
```

## Implemented Features

| Phase | Feature | Status | Tests |
|-------|---------|--------|-------|
| P8.0-A | Feature Builder (53 features) | ✅ | — |
| P8.0-B1 | Forecast endpoint (baseline) | ✅ | 23/23 |
| P8.0-B2 | Train endpoint (MoE) | ✅ | 23/23 |
| P8.0-C | Brain Decision Rules | ✅ | 25/25 |
| P9.0 | Cross-Asset Regime Classifier | ✅ | 20/20 |
| P9.1 | Brain ON vs OFF Compare | ✅ | 22/22 |
| P9.2 | Walk-Forward Simulation | ✅ | 22/22 |

## All API Endpoints

### Brain Core
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/brain/v2/decision | GET | Working (MoE + CrossAsset) |
| /api/brain/v2/summary | GET | Working |
| /api/brain/v2/status | GET | Working |
| /api/brain/v2/apply-overrides | POST | Working |

### Forecast (P8.0)
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/brain/v2/forecast | GET | Working (MoE) |
| /api/brain/v2/forecast/train | POST | Working |
| /api/brain/v2/forecast/status | GET | Working |
| /api/brain/v2/forecast/compare | GET | Working |

### Cross-Asset (P9.0)
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/brain/v2/cross-asset | GET | Working |
| /api/brain/v2/cross-asset/schema | GET | Working |
| /api/brain/v2/cross-asset/validate | POST | Working |
| /api/brain/v2/cross-asset/timeline | GET | Working |

### Compare + Sim (P9.1 + P9.2)
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/brain/v2/compare | GET | Working |
| /api/brain/v2/compare/timeline | GET | Working |
| /api/brain/v2/sim/run | POST | Working |
| /api/brain/v2/sim/status | GET | Working |
| /api/brain/v2/sim/report | GET | Working |

## Prioritized Backlog

### P1 (High) - NEXT
- [ ] Stress Simulation Mode (forceRegime=STRESS + black swan library)
- [ ] Platform crash-test on full system

### P2 (Medium)
- [ ] Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks
- [ ] GOLD data fix from FRED API

### P3 (Low)
- [ ] Model versioning UI
- [ ] Historical scenario backtest dashboard
- [ ] Compare page UI
- [ ] Simulation page UI
