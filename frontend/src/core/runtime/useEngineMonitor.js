/**
 * ENGINE MONITOR — Centralized runtime state monitor
 * 
 * NOT just polling.
 * Centralized state comparison with:
 * - No UI re-render without changes
 * - No race conditions (ref for previous state)
 * - Callbacks only on actual changes
 * 
 * Usage:
 *   useEngineMonitor({
 *     interval: 60000,
 *     onGuardChange: (prev, next) => showToast(...),
 *     onRegimeChange: (prev, next) => showToast(...)
 *   })
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * @typedef {Object} EngineMonitorState
 * @property {string} guardLevel - NONE | WARN | CRISIS | BLOCK
 * @property {string} regime - RISK_ON | RISK_OFF | NEUTRAL | DEFENSIVE
 * @property {string} updatedAt - ISO timestamp
 * @property {Object} allocations - { spx, btc, cash }
 */

/**
 * @typedef {Object} EngineMonitorOptions
 * @property {number} interval - Polling interval in ms (default: 60000)
 * @property {boolean} enabled - Enable/disable polling (default: true)
 * @property {function} onGuardChange - (prev, next) => void
 * @property {function} onRegimeChange - (prev, next) => void
 * @property {function} onAllocationChange - (prev, next) => void
 */

/**
 * useEngineMonitor - Centralized runtime state monitor
 */
export function useEngineMonitor(options = {}) {
  const {
    interval = 60000,
    enabled = true,
    onGuardChange,
    onRegimeChange,
    onAllocationChange,
  } = options;
  
  // Current state (for UI consumption if needed)
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Previous state ref (for comparison without re-render)
  const prevStateRef = useRef(null);
  
  // Abort controller ref
  const abortRef = useRef(null);
  
  // Is mounted ref (prevent state updates after unmount)
  const mountedRef = useRef(true);
  
  /**
   * Fetch current engine state
   */
  const fetchState = useCallback(async () => {
    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    abortRef.current = new AbortController();
    
    try {
      const res = await fetch(`${API_BASE}/api/engine/global`, {
        signal: abortRef.current.signal,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!mountedRef.current) return;
      
      // Extract relevant state
      const newState = {
        guardLevel: data.global?.guard?.level || 'NONE',
        regime: data.global?.regime?.current || 'NEUTRAL',
        updatedAt: data.meta?.computedAt || new Date().toISOString(),
        allocations: data.global?.allocations || {},
      };
      
      // Compare with previous state
      const prevState = prevStateRef.current;
      
      if (prevState) {
        // Guard change detection
        if (prevState.guardLevel !== newState.guardLevel) {
          onGuardChange?.(prevState.guardLevel, newState.guardLevel);
        }
        
        // Regime change detection
        if (prevState.regime !== newState.regime) {
          onRegimeChange?.(prevState.regime, newState.regime);
        }
        
        // Allocation change detection (significant changes only)
        const allocChanged = ['spx', 'btc'].some(asset => {
          const prev = prevState.allocations?.[asset] || 0;
          const next = newState.allocations?.[asset] || 0;
          return Math.abs(prev - next) > 0.05; // >5% change
        });
        
        if (allocChanged) {
          onAllocationChange?.(prevState.allocations, newState.allocations);
        }
      }
      
      // Update refs and state
      prevStateRef.current = newState;
      setState(newState);
      setLastUpdate(new Date());
      setError(null);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error('[EngineMonitor] Fetch error:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    }
  }, [onGuardChange, onRegimeChange, onAllocationChange]);
  
  // Initial fetch + interval setup
  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) return;
    
    // Initial fetch
    fetchState();
    
    // Set up interval
    const intervalId = setInterval(fetchState, interval);
    
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchState, interval, enabled]);
  
  // Manual refresh function
  const refresh = useCallback(() => {
    fetchState();
  }, [fetchState]);
  
  return {
    // Current state
    state,
    guardLevel: state?.guardLevel || 'NONE',
    regime: state?.regime || 'NEUTRAL',
    allocations: state?.allocations || {},
    
    // Status
    error,
    lastUpdate,
    
    // Actions
    refresh,
  };
}

export default useEngineMonitor;
