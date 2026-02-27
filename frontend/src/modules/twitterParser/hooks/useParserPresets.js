// B4.2 - Parser Presets Hook
// Saved filters in localStorage

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'twitter-parser-presets';

export function useParserPresets() {
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPresets(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('[Presets] Failed to load:', e);
    }
  }, []);

  function savePreset(label, payload) {
    const newPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      label,
      payload,
    };
    const next = [newPreset, ...presets].slice(0, 10); // max 10 presets
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return newPreset;
  }

  function removePreset(id) {
    const next = presets.filter(p => p.id !== id);
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearPresets() {
    setPresets([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { presets, savePreset, removePreset, clearPresets };
}
