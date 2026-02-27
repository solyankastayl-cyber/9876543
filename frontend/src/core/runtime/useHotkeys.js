/**
 * HOTKEYS — Keyboard shortcuts for navigation
 * 
 * B → /btc
 * S → /spx
 * D → /dxy
 * E → /engine
 * 
 * Only active when focus is NOT in input/textarea
 */

import { useEffect, useCallback } from 'react';

/**
 * Default key mappings
 */
const DEFAULT_KEYMAP = {
  b: '/fractal/btc',
  s: '/fractal/spx',
  d: '/fractal/dxy',
  e: '/engine',
};

/**
 * useHotkeys — Keyboard navigation
 * 
 * @param {Object} options
 * @param {Object} options.keymap - Custom key mappings
 * @param {function} options.navigate - Navigation function (e.g., from react-router)
 * @param {boolean} options.enabled - Enable/disable hotkeys
 */
export function useHotkeys(options = {}) {
  const {
    keymap = DEFAULT_KEYMAP,
    navigate,
    enabled = true,
  } = options;
  
  const handleKeyDown = useCallback((event) => {
    // Ignore if disabled
    if (!enabled) return;
    
    // Ignore if modifier keys pressed
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    
    // Ignore if focus is in input/textarea/contenteditable
    const target = event.target;
    const tagName = target.tagName?.toLowerCase();
    if (
      tagName === 'input' ||
      tagName === 'textarea' ||
      target.isContentEditable
    ) {
      return;
    }
    
    // Check for matching key
    const key = event.key.toLowerCase();
    const path = keymap[key];
    
    if (path && navigate) {
      event.preventDefault();
      navigate(path);
    }
  }, [keymap, navigate, enabled]);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
  
  return {
    keymap,
  };
}

/**
 * Helper to show available shortcuts
 */
export function getHotkeyHelp(keymap = DEFAULT_KEYMAP) {
  return Object.entries(keymap).map(([key, path]) => ({
    key: key.toUpperCase(),
    path,
    label: path.replace('/fractal/', '').replace('/', '').toUpperCase(),
  }));
}

export default useHotkeys;
