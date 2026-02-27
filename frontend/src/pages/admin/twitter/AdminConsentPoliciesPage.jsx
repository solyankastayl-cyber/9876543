/**
 * Admin Consent Policies Page
 * 
 * Management of versioned data usage policies (consent policies):
 * - List all policy versions
 * - Create new draft
 * - Edit draft
 * - Publish new version
 * - View consent statistics
 * - Force re-consent for all users
 */

import { useState, useEffect, useCallback } from 'react';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  FileText, Plus, RefreshCw, Edit3, Trash2, Send, Eye,
  Users, Clock, CheckCircle, AlertTriangle, ChevronRight,
  X, Save, RotateCcw
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ============================================
// API Functions
// ============================================

async function fetchPolicies(slug = 'twitter-data-usage') {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies?slug=${slug}`);
  return res.json();
}

async function fetchPolicy(policyId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/${policyId}`);
  return res.json();
}

async function createPolicy(data) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updatePolicy(policyId, data) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/${policyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deletePolicy(policyId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/${policyId}`, {
    method: 'DELETE',
  });
  return res.json();
}

async function publishPolicy(policyId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/${policyId}/publish`, {
    method: 'POST',
  });
  return res.json();
}

async function forceReconsent(reason) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/force-reconsent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

async function fetchStats(slug = 'twitter-data-usage') {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/stats?slug=${slug}`);
  return res.json();
}

async function fetchLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/consent-policies/logs?${query}`);
  return res.json();
}

// ============================================
// Sub-components
// ============================================

function StatsCard({ icon: Icon, label, value, subtext, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-50 text-gray-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  
  return (
    <div className={cn('rounded-lg p-4', colors[color])} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-xs opacity-75 mt-1">{subtext}</div>}
    </div>
  );
}

function PolicyCard({ policy, onView, onEdit, onDelete, onPublish }) {
  return (
    <div 
      className={cn(
        'bg-white rounded-lg border p-4 transition-colors',
        policy.isActive ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
      )}
      data-testid={`policy-card-${policy.version}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">v{policy.version}</span>
            {policy.isActive && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ACTIVE
              </span>
            )}
            {!policy.isActive && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                DRAFT
              </span>
            )}
          </div>
          <h3 className="font-medium text-gray-900 mt-1">{policy.title}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onView(policy)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          {!policy.isActive && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(policy)} title="Edit">
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(policy)} title="Delete" className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {policy.contentPreview}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {policy.stats?.activeConsents || 0} consents
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(policy.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {!policy.isActive && (
          <Button 
            size="sm" 
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50"
            onClick={() => onPublish(policy)}
          >
            <Send className="w-3 h-3 mr-1" />
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

function PolicyModal({ policy, onClose, mode = 'view', onSave }) {
  const [title, setTitle] = useState(policy?.title || '');
  const [version, setVersion] = useState(policy?.version || '');
  const [content, setContent] = useState(policy?.contentMarkdown || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  
  const isNew = mode === 'create';
  const isEditable = mode === 'edit' || mode === 'create';
  
  // Load full policy content for view/edit mode
  useEffect(() => {
    async function loadPolicy() {
      if (!policy?.id || isNew) return;
      if (policy.contentMarkdown && policy.contentMarkdown.length > 200) return; // Already has full content
      
      setLoading(true);
      try {
        const res = await fetchPolicy(policy.id);
        if (res.ok && res.data) {
          setContent(res.data.contentMarkdown || '');
          setTitle(res.data.title || '');
        }
      } catch (err) {
        console.error('Failed to load policy:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, [policy?.id, isNew]);
  
  const handleSave = async () => {
    if (!title.trim() || !content.trim() || (isNew && !version.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({ title, version, contentMarkdown: content });
      onClose();
    } catch (err) {
      toast.error('Failed to save policy');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="policy-modal">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isNew ? 'Create New Policy' : isEditable ? 'Edit Policy' : 'View Policy'}
            </h2>
            {policy?.version && !isNew && (
              <span className="text-sm text-gray-500">Version {policy.version}</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {isEditable && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {isNew && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.1.0"
                    data-testid="policy-version-input"
                  />
                </div>
              )}
              <div className={isNew ? '' : 'col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Twitter Data Usage Policy"
                  data-testid="policy-title-input"
                />
              </div>
            </div>
          )}
          
          {/* Tabs for edit/preview */}
          {isEditable && (
            <div className="flex gap-2 mb-3">
              <Button
                variant={activeTab === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('edit')}
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                variant={activeTab === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="w-3 h-3 mr-1" /> Preview
              </Button>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : isEditable && activeTab === 'edit' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[400px] font-mono text-sm p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="# Policy Title

Write your policy content in Markdown..."
                data-testid="policy-content-textarea"
              />
            ) : (
              <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg overflow-auto min-h-[400px]">
                <ReactMarkdown>{content || policy?.contentMarkdown || ''}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditable && (
            <Button onClick={handleSave} disabled={saving} data-testid="save-policy-btn">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isNew ? 'Create Draft' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsentLogTable({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No consent logs found
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User ID</th>
            <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Version</th>
            <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Accepted At</th>
            <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-sm font-mono text-gray-900">{log.userId}</td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  v{log.policyVersion}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(log.acceptedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                {log.revokedAt ? (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Revoked</span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function AdminConsentPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');
  
  // Modal state
  const [modalPolicy, setModalPolicy] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [policiesRes, statsRes, logsRes] = await Promise.all([
        fetchPolicies(),
        fetchStats(),
        fetchLogs({ limit: '30' }),
      ]);
      
      if (policiesRes.ok) setPolicies(policiesRes.data);
      if (statsRes.ok) setStats(statsRes.data);
      if (logsRes.ok) setLogs(logsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleCreatePolicy = async (data) => {
    const res = await createPolicy(data);
    if (res.ok) {
      toast.success('Policy draft created');
      loadData();
    } else {
      toast.error(res.message || 'Failed to create policy');
      throw new Error(res.message);
    }
  };
  
  const handleUpdatePolicy = async (data) => {
    const res = await updatePolicy(modalPolicy.id, data);
    if (res.ok) {
      toast.success('Policy updated');
      loadData();
    } else {
      toast.error(res.message || 'Failed to update policy');
      throw new Error(res.message);
    }
  };
  
  const handleDeletePolicy = async (policy) => {
    if (!window.confirm(`Delete draft v${policy.version}?`)) return;
    
    const res = await deletePolicy(policy.id);
    if (res.ok) {
      toast.success('Policy draft deleted');
      loadData();
    } else {
      toast.error(res.message || 'Failed to delete');
    }
  };
  
  const handlePublishPolicy = async (policy) => {
    if (!window.confirm(`Publish v${policy.version}? This will require all users to re-consent.`)) return;
    
    const res = await publishPolicy(policy.id);
    if (res.ok) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message || 'Failed to publish');
    }
  };
  
  const handleForceReconsent = async () => {
    const reason = window.prompt('Enter reason for forcing re-consent (optional):');
    if (reason === null) return; // User cancelled
    
    const res = await forceReconsent(reason);
    if (res.ok) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message || 'Failed to force re-consent');
    }
  };
  
  const openModal = (policy, mode) => {
    setModalPolicy(policy);
    setModalMode(mode);
  };
  
  const closeModal = () => {
    setModalPolicy(null);
    setModalMode('view');
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
  
  const activePolicy = policies.find(p => p.isActive);
  const draftPolicies = policies.filter(p => !p.isActive);
  
  return (
    <TwitterAdminLayout>
      <div data-testid="admin-consent-policies-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Data Usage Policies
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage versioned consent policies for Twitter integration
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => openModal({}, 'create')} data-testid="create-policy-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats?.hasActivePolicy && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <StatsCard
              icon={CheckCircle}
              label="Active Version"
              value={`v${stats.activePolicy.version}`}
              color="green"
            />
            <StatsCard
              icon={Users}
              label="Current Consents"
              value={stats.stats.consentsForCurrentVersion}
              subtext="On latest version"
              color="blue"
            />
            <StatsCard
              icon={AlertTriangle}
              label="Outdated Consents"
              value={stats.stats.outdatedConsents}
              subtext="Need re-consent"
              color={stats.stats.outdatedConsents > 0 ? 'amber' : 'gray'}
            />
            <StatsCard
              icon={RotateCcw}
              label="Revoked"
              value={stats.stats.revokedConsents}
              color="gray"
            />
            <StatsCard
              icon={Clock}
              label="Last 7 Days"
              value={stats.stats.recentConsents7d}
              subtext="New consents"
              color="gray"
            />
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'policies' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            onClick={() => setActiveTab('policies')}
          >
            Policy Versions
          </button>
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'logs' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            onClick={() => setActiveTab('logs')}
          >
            Consent Logs
          </button>
        </div>
        
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Active Policy */}
            {activePolicy && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Active Policy
                </h2>
                <PolicyCard
                  policy={activePolicy}
                  onView={(p) => openModal(p, 'view')}
                  onEdit={(p) => openModal(p, 'edit')}
                  onDelete={handleDeletePolicy}
                  onPublish={handlePublishPolicy}
                />
              </div>
            )}
            
            {/* Draft Policies */}
            {draftPolicies.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                  Draft Versions ({draftPolicies.length})
                </h2>
                <div className="grid gap-4">
                  {draftPolicies.map(p => (
                    <PolicyCard
                      key={p.id}
                      policy={p}
                      onView={(p) => openModal(p, 'view')}
                      onEdit={(p) => openModal(p, 'edit')}
                      onDelete={handleDeletePolicy}
                      onPublish={handlePublishPolicy}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Force Re-consent Button */}
            {activePolicy && (
              <div className="border-t pt-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Admin Actions</h2>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleForceReconsent}
                  data-testid="force-reconsent-btn"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Force Re-consent for All Users
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will revoke all existing consents and require all users to re-accept the current policy.
                </p>
              </div>
            )}
            
            {/* Empty state */}
            {policies.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Policies Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first data usage policy to start collecting user consent.
                </p>
                <Button onClick={() => openModal({}, 'create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Policy
                </Button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Recent Consent Activity</h3>
              <span className="text-xs text-gray-500">{logs.length} entries</span>
            </div>
            <ConsentLogTable logs={logs} />
          </div>
        )}
        
        {/* Modal */}
        {(modalPolicy !== null || modalMode === 'create') && (
          <PolicyModal
            policy={modalMode === 'create' ? null : modalPolicy}
            onClose={closeModal}
            mode={modalMode}
            onSave={modalMode === 'create' ? handleCreatePolicy : handleUpdatePolicy}
          />
        )}
      </div>
    </TwitterAdminLayout>
  );
}
