/**
 * BLOCK 57.2 — Shadow State Manager
 * 
 * Single source of truth for Shadow Divergence UI.
 * URL-driven state for sharable links.
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

export const PRESETS = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
export const HORIZONS = [7, 14, 30];
export const ROLES = ['ACTIVE', 'SHADOW'];

const DEFAULTS = {
  preset: 'BALANCED',
  horizon: 7,
  role: 'ACTIVE',
  symbol: 'BTC'
};

export function useShadowState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const preset = searchParams.get('preset')?.toUpperCase() || DEFAULTS.preset;
    const horizon = Number(searchParams.get('h')) || DEFAULTS.horizon;
    const role = searchParams.get('role')?.toUpperCase() || DEFAULTS.role;
    const symbol = searchParams.get('symbol') || DEFAULTS.symbol;

    // Validate
    const validPreset = PRESETS.includes(preset) ? preset : DEFAULTS.preset;
    const validHorizon = HORIZONS.includes(horizon) ? horizon : DEFAULTS.horizon;
    const validRole = ROLES.includes(role) ? role : DEFAULTS.role;

    return { 
      preset: validPreset, 
      horizon: validHorizon, 
      role: validRole, 
      symbol,
      horizonKey: `${validHorizon}d`
    };
  }, [searchParams]);

  const updateState = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Always keep tab=shadow
      params.set('tab', 'shadow');

      if (next.preset) params.set('preset', next.preset.toLowerCase());
      if (next.horizon) params.set('h', String(next.horizon));
      if (next.role) params.set('role', next.role.toLowerCase());
      if (next.symbol) params.set('symbol', next.symbol);

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const selectCell = useCallback(
    (preset, horizon) => {
      updateState({ preset, horizon });
    },
    [updateState]
  );

  return { state, updateState, selectCell };
}
