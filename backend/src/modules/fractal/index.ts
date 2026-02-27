/**
 * Fractal Module Public API
 * V2.1 Final Architecture
 */

export { registerFractalModule, type FractalHostDeps, type Logger, type Clock, type Db, type Settings } from './runtime/fractal.module.js';
export { FractalEngine } from './engine/fractal.engine.js';
export { FractalBootstrapService } from './bootstrap/fractal.bootstrap.service.js';
export * from './contracts/fractal.contracts.js';
export * from './domain/constants.js';

// BLOCK 41.x — Certification Suite
export * from './cert/index.js';

// BLOCK 43.x — Storage & Persistence
export * from './storage/index.js';

// BLOCK 47.x-48.x — Governance (Guard + Playbooks)
export * from './governance/index.js';

// BLOCK B — Module Isolation
export * from './isolation/index.js';
