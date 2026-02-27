/**
 * FRACTAL UI — Unified components for Fractal Platform
 * 
 * These components are asset-agnostic.
 * BTC/SPX/DXY use the same components.
 */

// Core shell
export { FractalShell } from './FractalShell';

// Chart adapter
export { ChartAdapter, ChartWrapper } from './ChartAdapter';

// Tabs and modes
export { FractalTabs, FractalTabsCompact } from './FractalTabs';

// Panels
export { PredictionPanel } from './PredictionPanel';
export { AdjustedPanel, GuardBanner } from './AdjustedPanel';
export { EvidencePanel } from './EvidencePanel';

// Stats
export { StatBlock, StatInline, StatRow } from './StatBlock';
