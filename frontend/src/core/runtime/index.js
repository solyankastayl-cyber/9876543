/**
 * RUNTIME — Centralized runtime utilities
 */

export { useEngineMonitor } from './useEngineMonitor';
export { ToastProvider, useToast, TOAST_TYPES } from './Toast';
export { useHotkeys, getHotkeyHelp } from './useHotkeys';
export { GlobalStatusBar } from './GlobalStatusBar';
export { HealthDashboard } from './HealthDashboard';

// Dev utilities (tree-shaken in production)
export { simulateGuardTransition, testToastDeduplication, validateGuardAllocationPolicy } from './guardSimulator';
