/**
 * ML Approvals Store (Zustand)
 * 
 * State management for ML Governance:
 * - Pending approvals
 * - Active models
 * - History
 * - Actions: approve, reject, rollback
 */

import { create } from 'zustand';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Helper to get auth token
const getToken = () => localStorage.getItem('admin_token');

// Helper for API calls
const apiFetch = async (url, options = {}) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn('[API] Non-JSON response:', text.slice(0, 100));
      return { ok: false, error: 'Invalid response' };
    }
  } catch (err) {
    console.error('[API] Fetch error:', err);
    return { ok: false, error: err.message };
  }
};

export const useMlApprovalsStore = create((set, get) => ({
  // Initial state
  pending: [],
  active: [],
  history: [],
  rollbackTargets: [],
  loading: false,
  pendingLoading: false,
  activeLoading: false,
  historyLoading: false,
  actionLoading: false,
  error: null,
  selectedTask: 'market',
  selectedNetwork: 'ethereum',

  // Setters
  setSelectedTask: (task) => set({ selectedTask: task }),
  setSelectedNetwork: (network) => set({ selectedNetwork: network }),
  clearError: () => set({ error: null }),

  // Fetch pending approvals
  fetchPending: async () => {
    const { selectedTask, selectedNetwork } = get();
    set({ pendingLoading: true, error: null });
    try {
      const data = await apiFetch(
        `/api/admin/ml/approvals/candidates?task=${selectedTask}&network=${selectedNetwork}`
      );
      if (data.ok) {
        set({ pending: data.data?.items || [] });
      } else {
        set({ error: data.error || 'Failed to load pending' });
      }
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ pendingLoading: false });
    }
  },

  // Fetch active models
  fetchActive: async () => {
    set({ activeLoading: true, error: null });
    try {
      const data = await apiFetch('/api/admin/ml/approvals/active-models');
      if (data.ok) {
        set({ active: data.data?.items || [] });
      } else {
        set({ error: data.error || 'Failed to load active models' });
      }
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ activeLoading: false });
    }
  },

  // Fetch history
  fetchHistory: async () => {
    const { selectedTask } = get();
    set({ historyLoading: true, error: null });
    try {
      const data = await apiFetch(
        `/api/admin/ml/approvals/history?task=${selectedTask}&limit=50`
      );
      if (data.ok) {
        set({ history: data.data?.items || [] });
      } else {
        set({ error: data.error || 'Failed to load history' });
      }
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ historyLoading: false });
    }
  },

  // Fetch rollback targets
  fetchRollbackTargets: async (task) => {
    try {
      const data = await apiFetch(`/api/admin/ml/approvals/rollback-targets/${task}`);
      if (data.ok) {
        set({ rollbackTargets: data.data?.items || [] });
      }
    } catch (err) {
      console.error('Failed to fetch rollback targets:', err);
    }
  },

  // Approve model
  approve: async (modelId, comment) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await apiFetch('/api/admin/ml/approvals/approve', {
        method: 'POST',
        body: JSON.stringify({ modelId, note: comment }),
      });
      if (data.ok) {
        // Refresh data
        get().fetchPending();
        get().fetchHistory();
        return true;
      } else {
        set({ error: data.error || 'Failed to approve' });
        return false;
      }
    } catch (err) {
      set({ error: err.message });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // Reject model
  reject: async (modelId, comment) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await apiFetch('/api/admin/ml/approvals/reject', {
        method: 'POST',
        body: JSON.stringify({ modelId, note: comment }),
      });
      if (data.ok) {
        get().fetchPending();
        get().fetchHistory();
        return true;
      } else {
        set({ error: data.error || 'Failed to reject' });
        return false;
      }
    } catch (err) {
      set({ error: err.message });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // Promote model
  promote: async (task, modelVersion) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await apiFetch('/api/admin/ml/promote', {
        method: 'POST',
        body: JSON.stringify({ task, modelVersion }),
      });
      if (data.ok) {
        get().fetchPending();
        get().fetchActive();
        get().fetchHistory();
        return true;
      } else {
        set({ error: data.error || 'Failed to promote' });
        return false;
      }
    } catch (err) {
      set({ error: err.message });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // Rollback
  rollback: async (task, targetVersion, comment) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await apiFetch('/api/admin/ml/rollback', {
        method: 'POST',
        body: JSON.stringify({ task, toVersion: targetVersion }),
      });
      if (data.ok) {
        get().fetchActive();
        get().fetchHistory();
        return true;
      } else {
        set({ error: data.error || 'Failed to rollback' });
        return false;
      }
    } catch (err) {
      set({ error: err.message });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },
}));
