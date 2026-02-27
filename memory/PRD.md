# Fractal Multi-Asset Platform PRD

## Original Problem Statement
Развернуть код из GitHub для работы с фракталами валютных пар. Модули: BTC Fractal, SPX, DXY Macro Engine V2. Walk-Forward Simulation, Quantile Forecast, Brain Decision Layer, Cross-Asset Classifier, Brain Compare + Simulation. Добавить Stress Simulation Mode + Platform Crash-Test для институционального аудита.

## Architecture
- **Backend**: TypeScript (Fastify) 8002 + Python proxy 8001
- **Frontend**: React 3000 | **Database**: MongoDB (fractal_db)
- **External APIs**: FRED API (key: 2c0bf55cfd182a3a4d2e4fd017a622f7)

## Brain v2.1 Full Pipeline
```
WorldState + CrossAsset → Quantile Forecast (MoE) → Scenario Engine → Risk Engine → Directives → EngineGlobal
                                                                     ↕
                                                         Brain Compare (ON vs OFF)
                                                         Brain Simulation (Walk-Forward)
                                                         Stress Simulation + Crash-Test
```

## Implemented Features (2026-02-27)

| Phase | Feature | Status | Tests |
|-------|---------|--------|-------|
| P8.0-A | Feature Builder (53 features) | ✅ | — |
| P8.0-B1 | Forecast endpoint (baseline) | ✅ | 23/23 |
| P8.0-B2 | Train endpoint (MoE) | ✅ | 23/23 |
| P8.0-C | Brain Decision Rules | ✅ | 25/25 |
| P9.0 | Cross-Asset Regime Classifier | ✅ | 20/20 |
| P9.1 | Brain ON vs OFF Compare | ✅ | 22/22 |
| P9.2 | Walk-Forward Simulation | ✅ | 22/22 |
| P10 | **Stress Simulation Mode** | ✅ NEW | — |
| P11 | **Platform Crash-Test** | ✅ NEW | PRODUCTION Grade |

## Stress Simulation + Crash-Test (NEW)

### Black Swan Library Presets
| Preset | Description | Key Overrides |
|--------|-------------|---------------|
| COVID_CRASH | March 2020-style pandemic | tailRisk=0.65, volSpike=0.8 |
| 2008_STYLE | GFC systemic crisis | tailRisk=0.8, contagion=0.9 |
| USD_SPIKE | Dollar spike event | tailRisk=0.45, corrDxySpx=-0.7 |
| LIQUIDITY_FREEZE | Liquidity contraction | tailRisk=0.5, liquidityImpulse=-0.9 |

### Crash-Test Results (2026-02-27)
- **Resilience Score**: 1.0 (100%)
- **Grade**: PRODUCTION
- **All checks passed**
  - NaN Count: 0
  - Flip Storm: False
  - Cap Violations: 0
  - Override Explosions: 0
  - Determinism Fail: False

### API Endpoints

#### Stress Simulation
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/brain/v2/stress/presets | GET | List black swan presets |
| /api/brain/v2/stress/run | POST | Run stress (sync) |
| /api/brain/v2/stress/run-async | POST | Run stress (async) |
| /api/brain/v2/stress/status | GET | Get latest result |

#### Platform Crash-Test
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/platform/crash-test/run | POST | Run full test (sync) |
| /api/platform/crash-test/run-async | POST | Run full test (async) |
| /api/platform/crash-test/status | GET | Get latest result |

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

### Engine Global
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/engine/global | GET | Working |

## Frontend Routes
| Route | Terminal | Status |
|-------|----------|--------|
| / | BTC Fractal | ✅ |
| /spx | SPX Terminal | ✅ |
| /dxy | DXY Fractal | ✅ |
| /admin | Admin Panel | ✅ |
| /engine/compare | Compare Dashboard | ✅ |

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Stress Simulation Mode (forceRegime=STRESS + black swan library)
- [x] Platform crash-test on full system
- [x] Async endpoints for long-running operations

### P1 (High) - NEXT
- [ ] Meta-Regime Memory Layer (how long in regime affects aggression)
- [ ] Capital Allocation Optimizer (dynamic)

### P2 (Medium)
- [ ] Telegram/Slack alerts for production
- [ ] Daily cron for divergence checks
- [ ] Stress test UI in Admin panel

### P3 (Low)
- [ ] Model versioning UI
- [ ] Historical scenario backtest dashboard
- [ ] Compare page UI improvements

---
Last Updated: 2026-02-27

## P10.1 — Regime Memory State (IMPLEMENTED 2026-02-27)

### Architecture
```
WorldState → extractMacro/Guard/CrossAsset → updateScope → MongoDB
                                                            ↓
                                              regime_memory_state (current)
                                              regime_history (daily records)
```

### Contracts
- `RegimeMemoryState`: scope, current, since, daysInState, flips30d, stability
- `RegimeMemoryPack`: macro + guard + crossAsset states
- `RegimeTimelinePack`: points[] + summary

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/brain/v2/regime-memory/schema | GET | Schema docs |
| /api/brain/v2/regime-memory/current | GET | Current state |
| /api/brain/v2/regime-memory/timeline | GET | Historical |
| /api/brain/v2/regime-memory/recompute | POST | Admin rebuild |

### Test Results
- **Determinism**: ✅ PASS (same asOf → same hash)
- **NoLookahead**: ✅ PASS (historical days < current)
- **Flip counting**: ✅ PASS (correct 30d window)
- **Stability formula**: ✅ PASS (0.5*(days/90) + 0.5*(1-flips/10))

### Current State (2026-02-27)
| Scope | Current | Days | Stability |
|-------|---------|------|-----------|
| macro | NEUTRAL | 57 | 0.817 |
| guard | NONE | 57 | 0.817 |
| crossAsset | RISK_ON_SYNC | 57 | 0.817 |

### Next: P10.2 — MetaRisk Scale
