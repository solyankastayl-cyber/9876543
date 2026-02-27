/**
 * A.3.3 - Admin Policies Page
 * 
 * Policy management UI:
 * - Global policy settings
 * - User overrides table
 * - Recent violations log
 */

import { useState, useEffect, useCallback } from 'react';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Shield, Settings, Users, AlertTriangle, Save,
  RefreshCw, Trash2, Plus, Clock, Zap, Ban
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// API Functions
async function fetchGlobalPolicy() {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/policies/global`);
  return res.json();
}

async function updateGlobalPolicy(data) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/policies/global`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fetchOverrides() {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/policies/overrides`);
  return res.json();
}

async function fetchViolations(limit = 20) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/policies/violations?limit=${limit}`);
  return res.json();
}

async function removeUserOverride(userId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/policies/users/${userId}`, {
    method: 'DELETE',
  });
  return res.json();
}

const ACTION_COLORS = {
  WARN: 'bg-amber-100 text-amber-700',
  COOLDOWN: 'bg-blue-100 text-blue-700',
  DISABLE: 'bg-red-100 text-red-700',
};

const VIOLATION_LABELS = {
  MAX_ACCOUNTS_EXCEEDED: 'Max Accounts',
  MAX_TASKS_EXCEEDED: 'Max Tasks/Hour',
  MAX_POSTS_EXCEEDED: 'Max Posts/Day',
  HIGH_ABORT_RATE: 'High Abort Rate',
  REPEATED_COOLDOWNS: 'Repeated Cooldowns',
};

export default function AdminPoliciesPage() {
  const [globalPolicy, setGlobalPolicy] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState(null);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [policyRes, overridesRes, violationsRes] = await Promise.all([
        fetchGlobalPolicy(),
        fetchOverrides(),
        fetchViolations(),
      ]);
      
      if (policyRes.ok) {
        setGlobalPolicy(policyRes.data);
        setEditedPolicy(policyRes.data);
      }
      if (overridesRes.ok) setOverrides(overridesRes.data);
      if (violationsRes.ok) setViolations(violationsRes.data);
    } catch (err) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSaveGlobal = async () => {
    setSaving(true);
    try {
      const res = await updateGlobalPolicy({
        maxAccounts: editedPolicy.limits.maxAccounts,
        maxTasksPerHour: editedPolicy.limits.maxTasksPerHour,
        maxPostsPerDay: editedPolicy.limits.maxPostsPerDay,
        maxAbortRatePct: editedPolicy.limits.maxAbortRatePct,
        actions: editedPolicy.actions,
        enabled: editedPolicy.enabled,
      });
      
      if (res.ok) {
        setGlobalPolicy(res.data);
        toast.success('Global policy saved');
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleRemoveOverride = async (userId) => {
    if (!window.confirm(`Remove override for ${userId}?`)) return;
    
    try {
      const res = await removeUserOverride(userId);
      if (res.ok) {
        toast.success('Override removed');
        loadData();
      } else {
        toast.error(res.message || 'Failed to remove');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </TwitterAdminLayout>
    );
  }
  
  return (
    <TwitterAdminLayout>
      <div data-testid="admin-policies-page">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          Policies & Fair-Use
        </h1>
        
        {/* Global Policy Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Global Policy
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Enabled</span>
              <Switch
                checked={editedPolicy?.enabled ?? true}
                onCheckedChange={(v) => setEditedPolicy(prev => ({ ...prev, enabled: v }))}
                data-testid="policy-enabled-switch"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Accounts
              </label>
              <Input
                type="number"
                value={editedPolicy?.limits?.maxAccounts ?? 3}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxAccounts: parseInt(e.target.value) || 0 }
                }))}
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tasks/Hour
              </label>
              <Input
                type="number"
                value={editedPolicy?.limits?.maxTasksPerHour ?? 20}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxTasksPerHour: parseInt(e.target.value) || 0 }
                }))}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Posts/Day
              </label>
              <Input
                type="number"
                value={editedPolicy?.limits?.maxPostsPerDay ?? 1000}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxPostsPerDay: parseInt(e.target.value) || 0 }
                }))}
                min={100}
                max={10000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Abort Rate %
              </label>
              <Input
                type="number"
                value={editedPolicy?.limits?.maxAbortRatePct ?? 30}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxAbortRatePct: parseInt(e.target.value) || 0 }
                }))}
                min={10}
                max={100}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                On Limit Exceeded
              </label>
              <select
                value={editedPolicy?.actions?.onLimitExceeded ?? 'COOLDOWN'}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  actions: { ...prev.actions, onLimitExceeded: e.target.value }
                }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="WARN">Warn (Telegram only)</option>
                <option value="COOLDOWN">Cooldown (Pause sessions)</option>
                <option value="DISABLE">Disable (Full stop)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooldown Minutes
              </label>
              <Input
                type="number"
                value={editedPolicy?.actions?.cooldownMinutes ?? 30}
                onChange={(e) => setEditedPolicy(prev => ({
                  ...prev,
                  actions: { ...prev.actions, cooldownMinutes: parseInt(e.target.value) || 0 }
                }))}
                min={5}
                max={1440}
              />
            </div>
          </div>
          
          <Button
            onClick={handleSaveGlobal}
            disabled={saving}
            data-testid="save-global-policy"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Global Policy
          </Button>
        </div>
        
        {/* User Overrides */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              User Overrides ({overrides.length})
            </h2>
          </div>
          
          {overrides.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No user-specific overrides. All users follow global policy.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Max Accounts</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Tasks/Hour</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Posts/Day</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Abort Rate</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Action</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Enabled</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {overrides.map((override) => (
                    <tr key={override.userId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{override.userId}</td>
                      <td className="px-4 py-3 text-center text-sm">{override.limits.maxAccounts}</td>
                      <td className="px-4 py-3 text-center text-sm">{override.limits.maxTasksPerHour}</td>
                      <td className="px-4 py-3 text-center text-sm">{override.limits.maxPostsPerDay}</td>
                      <td className="px-4 py-3 text-center text-sm">{override.limits.maxAbortRatePct}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2 py-1 rounded', ACTION_COLORS[override.actions.onLimitExceeded])}>
                          {override.actions.onLimitExceeded}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {override.enabled ? '✓' : '✗'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOverride(override.userId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Recent Violations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Recent Violations
            </h2>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          {violations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No policy violations recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Time</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Violation</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Current</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Limit</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Action</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cooldown Until</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {violations.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{v.userId}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{VIOLATION_LABELS[v.type] || v.type}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{v.currentValue}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{v.limitValue}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2 py-1 rounded', ACTION_COLORS[v.action])}>
                          {v.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {v.cooldownUntil ? formatDate(v.cooldownUntil) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TwitterAdminLayout>
  );
}
