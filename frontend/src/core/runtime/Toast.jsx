/**
 * TOAST SYSTEM — Light theme notifications
 * 
 * - Subtle, non-blocking
 * - Auto-dismiss
 * - No modal
 * - Stack support
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { theme } from '../theme';

const ToastContext = createContext(null);

/**
 * Toast Types
 */
const TOAST_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

const TOAST_STYLES = {
  [TOAST_TYPES.INFO]: {
    background: theme.accentLight,
    border: theme.accent,
    icon: 'ℹ️',
  },
  [TOAST_TYPES.SUCCESS]: {
    background: theme.positiveLight,
    border: theme.positive,
    icon: '✓',
  },
  [TOAST_TYPES.WARNING]: {
    background: theme.warningLight,
    border: theme.warning,
    icon: '⚠️',
  },
  [TOAST_TYPES.ERROR]: {
    background: theme.negativeLight,
    border: theme.negative,
    icon: '✕',
  },
};

/**
 * Toast Provider
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Convenience methods
  const toast = {
    info: (msg, duration) => addToast(msg, TOAST_TYPES.INFO, duration),
    success: (msg, duration) => addToast(msg, TOAST_TYPES.SUCCESS, duration),
    warning: (msg, duration) => addToast(msg, TOAST_TYPES.WARNING, duration),
    error: (msg, duration) => addToast(msg, TOAST_TYPES.ERROR, duration),
    dismiss: removeToast,
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container
 */
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      data-testid="toast-container"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Single Toast Item
 */
function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES[TOAST_TYPES.INFO];
  
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in"
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        minWidth: '250px',
        maxWidth: '400px',
      }}
      data-testid={`toast-${toast.type}`}
    >
      <span className="text-lg">{style.icon}</span>
      <span className="flex-1 text-sm" style={{ color: theme.textPrimary }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: theme.textSecondary }}
      >
        ✕
      </button>
    </div>
  );
}

/**
 * useToast hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return no-op if provider not found (graceful fallback)
    return {
      info: () => {},
      success: () => {},
      warning: () => {},
      error: () => {},
      dismiss: () => {},
    };
  }
  return context;
}

// Export types
export { TOAST_TYPES };

export default ToastProvider;
