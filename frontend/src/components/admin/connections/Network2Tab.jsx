/**
 * Network2Tab - Network v2 Admin Panel
 * 
 * Admin interface for Network v2 features:
 * - Status & Blend control
 * - Co-Engagement Engine
 * - Silent Authority Detector
 * - Follow-Graph stats
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { 
  RefreshCw, 
  Play, 
  Eye, 
  EyeOff,
  Network, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Users,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  Bell,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// API helper
async function fetchApi(endpoint, options) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  return res.json();
}

// Status Badge component
const StatusBadge = ({ status }) => {
  const variants = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-300',
    SHADOW: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    DISABLED: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  
  const icons = {
    ACTIVE: <CheckCircle className="w-4 h-4" />,
    SHADOW: <Eye className="w-4 h-4" />,
    DISABLED: <XCircle className="w-4 h-4" />,
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium text-sm ${variants[status] || variants.DISABLED}`}>
      {icons[status]}
      {status}
    </span>
  );
};

// Stat Card component
const StatCard = ({ label, value, icon, color = 'gray' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
};

// Section wrapper
const Section = ({ title, icon, badge, expanded = true, onToggle, children }) => (
  <Card>
    <CardHeader 
      className={`cursor-pointer ${onToggle ? 'hover:bg-gray-50' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </CardTitle>
        {onToggle && (
          expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </CardHeader>
    {expanded && <CardContent>{children}</CardContent>}
  </Card>
);

export default function Network2Tab({ token }) {
  // State
  const [status, setStatus] = useState(null);
  const [coEngConfig, setCoEngConfig] = useState(null);
  const [silentConfig, setSilentConfig] = useState(null);
  const [silentAlerts, setSilentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Section expand state
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    coEngagement: true,
    silentAuthority: true,
    graph: false,
  });
  
  // Silent Authority test state
  const [testInput, setTestInput] = useState({
    account_id: '',
    handle: '',
    authority_score: 0.85,
    authority_tier: 'HIGH',
    tweets_30d: 5,
    engagement_30d: 100,
    inbound_elite_count: 3,
    followers_count: 1000,
    followers_growth_30d: 2,
    confidence: 0.8,
  });
  const [testResult, setTestResult] = useState(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, coEngRes, silentRes, alertsRes] = await Promise.all([
        fetchApi('/api/admin/connections/network-v2/status'),
        fetchApi('/api/admin/connections/network-v2/co-engagement/config'),
        fetchApi('/api/admin/connections/network-v2/silent-authority/config'),
        fetchApi('/api/admin/connections/network-v2/silent-authority/alerts?limit=20'),
      ]);
      
      if (statusRes.ok) setStatus(statusRes.data);
      if (coEngRes.ok) setCoEngConfig(coEngRes.data);
      if (silentRes.ok) setSilentConfig(silentRes.data);
      if (alertsRes.ok) setSilentAlerts(alertsRes.data?.alerts || []);
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleEnableShadow = async () => {
    setActionLoading('shadow');
    const res = await fetchApi('/api/admin/connections/network-v2/enable-shadow', { method: 'POST' });
    if (res.ok) {
      setToast({ message: '👁️ Network v2 SHADOW mode enabled', type: 'success' });
      fetchData();
    } else {
      setToast({ message: res.message || res.error || 'Failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleActivate = async (weight = 0.10) => {
    setActionLoading('activate');
    const res = await fetchApi('/api/admin/connections/network-v2/activate', { 
      method: 'POST',
      body: JSON.stringify({ v2_weight: weight }),
    });
    if (res.ok) {
      setToast({ message: `🌐 Network v2 ACTIVATED at ${weight * 100}%`, type: 'success' });
      fetchData();
    } else {
      setToast({ message: res.message || res.error || 'Failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleDisable = async () => {
    setActionLoading('disable');
    const res = await fetchApi('/api/admin/connections/network-v2/disable', { method: 'POST' });
    if (res.ok) {
      setToast({ message: 'Network v2 DISABLED', type: 'success' });
      fetchData();
    } else {
      setToast({ message: res.message || res.error || 'Failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleBuildCoEngagement = async (dryRun = true) => {
    setActionLoading('build');
    const res = await fetchApi('/api/admin/connections/network-v2/co-engagement/build', {
      method: 'POST',
      body: JSON.stringify({ dry_run: dryRun }),
    });
    if (res.ok) {
      setToast({ message: dryRun ? 'Dry run complete' : 'Network built!', type: 'success' });
      fetchData();
    } else {
      setToast({ message: res.error || 'Build failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleTestSilentAuthority = async () => {
    setActionLoading('test');
    const res = await fetchApi('/api/admin/connections/network-v2/silent-authority/test', {
      method: 'POST',
      body: JSON.stringify(testInput),
    });
    if (res.ok) {
      setTestResult(res.data);
    } else {
      setToast({ message: res.error || 'Test failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
        <span className="text-gray-500">Loading Network v2...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-medium text-red-700">Failed to load Network v2</div>
            <div className="text-sm text-red-600">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-testid="network2-tab">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className={`w-6 h-6 ${status?.status === 'ACTIVE' ? 'text-green-500' : status?.status === 'SHADOW' ? 'text-yellow-500' : 'text-gray-400'}`} />
          <h2 className="text-xl font-bold">Network v2</h2>
          {status && <StatusBadge status={status.status} />}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} data-testid="refresh-network2">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Status & Controls */}
      <Section 
        title="Status & Controls" 
        icon={<Shield className="w-4 h-4" />}
        badge={status?.badge?.split(' ')[0]}
        expanded={expandedSections.status}
        onToggle={() => toggleSection('status')}
      >
        {status && (
          <div className="space-y-4">
            {/* Safety Checks */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Safety Prerequisites
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg border ${status.safety?.production_freeze_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">Production Freeze</div>
                  <div className={`font-medium ${status.safety?.production_freeze_active ? 'text-green-700' : 'text-red-700'}`}>
                    {status.safety?.production_freeze_active ? '✅ ACTIVE' : '❌ INACTIVE'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${!status.safety?.drift_blocks_v2 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">Drift Guard</div>
                  <div className={`font-medium ${!status.safety?.drift_blocks_v2 ? 'text-green-700' : 'text-yellow-700'}`}>
                    {!status.safety?.drift_blocks_v2 ? '✅ OK' : '⚠️ BLOCKED'}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Max v2 Weight</div>
                  <div className="font-medium text-gray-700">{((status.safety?.max_v2_weight || 0.15) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Confidence Gate</div>
                  <div className="font-medium text-gray-700">{((status.safety?.confidence_gate || 0.65) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            {/* Current Blend */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Current v1/v2 Blend
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-blue-600 mb-1">v1 Weight</div>
                  <div className="h-4 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(status.blend?.v1_weight || 0) * 100}%` }}
                    />
                  </div>
                  <div className="text-lg font-bold text-blue-700 mt-1">{((status.blend?.v1_weight || 0) * 100).toFixed(0)}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-purple-600 mb-1">v2 Weight</div>
                  <div className="h-4 bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${(status.blend?.v2_weight || 0) * 100}%` }}
                    />
                  </div>
                  <div className="text-lg font-bold text-purple-700 mt-1">{((status.blend?.v2_weight || 0) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={status.status === 'DISABLED' ? 'default' : 'outline'}
                size="sm"
                onClick={handleEnableShadow}
                disabled={actionLoading !== null || status.status !== 'DISABLED'}
                data-testid="enable-shadow-btn"
              >
                {actionLoading === 'shadow' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                Enable Shadow
              </Button>
              <Button
                variant={status.status === 'SHADOW' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleActivate(0.10)}
                disabled={actionLoading !== null || status.status === 'DISABLED'}
                data-testid="activate-btn"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {actionLoading === 'activate' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                Activate (10%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={actionLoading !== null || status.status === 'DISABLED'}
                data-testid="disable-btn"
              >
                {actionLoading === 'disable' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                Disable
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatCard 
                label="Profiles" 
                value={status.stats?.profiles_count || 0} 
                icon={<Users className="w-4 h-4 opacity-50" />}
                color="blue"
              />
              <StatCard 
                label="Smart No-Names" 
                value={status.stats?.smart_no_names || 0} 
                icon={<TrendingUp className="w-4 h-4 opacity-50" />}
                color="purple"
              />
              <StatCard 
                label="Graph Edges" 
                value={status.graph?.total_edges || status.graph?.total_relationships || 0} 
                icon={<Network className="w-4 h-4 opacity-50" />}
                color="green"
              />
              <StatCard 
                label="Processed" 
                value={status.stats?.accounts_processed || 0} 
                icon={<Activity className="w-4 h-4 opacity-50" />}
                color="gray"
              />
            </div>

            {/* Tier Distribution */}
            {status.stats?.by_tier && Object.keys(status.stats.by_tier).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Authority Tier Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(status.stats.by_tier).map(([tier, count]) => (
                    <Badge 
                      key={tier} 
                      variant="outline"
                      className={`${
                        tier === 'ELITE' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                        tier === 'HIGH' ? 'bg-green-100 text-green-700 border-green-300' :
                        tier === 'MEDIUM' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {tier}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Co-Engagement Engine */}
      <Section 
        title="Co-Engagement Engine" 
        icon={<Zap className="w-4 h-4" />}
        badge="A"
        expanded={expandedSections.coEngagement}
        onToggle={() => toggleSection('coEngagement')}
      >
        {coEngConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={coEngConfig.enabled !== false ? 'default' : 'secondary'}>
                  {coEngConfig.enabled !== false ? 'ENABLED' : 'DISABLED'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Builds network from interaction patterns (without follow data)
                </span>
              </div>
            </div>

            {/* Config */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Min Shared Interactions</div>
                <div className="font-medium">{coEngConfig.min_shared_interactions || coEngConfig.min_tweets || 2}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Similarity Threshold</div>
                <div className="font-medium">{((coEngConfig.min_similarity_threshold || coEngConfig.min_similarity || 0.3) * 100).toFixed(0)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Max Edges/Author</div>
                <div className="font-medium">{coEngConfig.max_edges_per_author || coEngConfig.top_k_per_node || 10}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Max Total Edges</div>
                <div className="font-medium">{coEngConfig.max_total_edges || coEngConfig.max_edges || 5000}</div>
              </div>
            </div>

            {/* Weights - show if available */}
            {coEngConfig.weights && Object.keys(coEngConfig.weights).length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700 mb-3">Similarity Weights</h4>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(coEngConfig.weights).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-blue-600 capitalize">{key}</div>
                      <div className="text-lg font-bold text-blue-700">{(val * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Config info if no weights */}
            {(!coEngConfig.weights || Object.keys(coEngConfig.weights).length === 0) && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700 mb-3">Configuration</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-blue-600">Similarity Method</div>
                    <div className="font-medium">{coEngConfig.similarity_method || 'cosine'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Window Days</div>
                    <div className="font-medium">{coEngConfig.window_days || 14}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Max Nodes</div>
                    <div className="font-medium">{coEngConfig.max_nodes || 1000}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBuildCoEngagement(true)}
                disabled={actionLoading !== null}
                data-testid="build-dry-run-btn"
              >
                {actionLoading === 'build' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                Dry Run
              </Button>
              <Button
                size="sm"
                onClick={() => handleBuildCoEngagement(false)}
                disabled={actionLoading !== null}
                data-testid="build-save-btn"
              >
                {actionLoading === 'build' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                Build & Save
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* Silent Authority Detector */}
      <Section 
        title="Silent Authority Detector" 
        icon={<Bell className="w-4 h-4" />}
        badge="B • KILLER"
        expanded={expandedSections.silentAuthority}
        onToggle={() => toggleSection('silentAuthority')}
      >
        {silentConfig && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={silentConfig.enabled ? 'default' : 'secondary'}>
                {silentConfig.enabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
              <span className="text-sm text-gray-500">
                Finds high-authority accounts with low activity
              </span>
            </div>

            {/* Thresholds */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <h4 className="text-sm font-medium text-purple-700 mb-3">Detection Thresholds</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-500 mb-1">Min Authority</div>
                  <div className="font-bold text-purple-700">≥{((silentConfig.thresholds?.min_authority_score || silentConfig.min_authority_score || 0.72) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-500 mb-1">Max Tweets/30d</div>
                  <div className="font-bold text-purple-700">≤{silentConfig.thresholds?.max_tweets_30d || silentConfig.max_tweets_30d || 10}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-500 mb-1">Max Engagement</div>
                  <div className="font-bold text-purple-700">≤{((silentConfig.thresholds?.max_engagement_rate || silentConfig.max_engagement_rate || 0.25) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-500 mb-1">Min Elite Inbound</div>
                  <div className="font-bold text-purple-700">≥{silentConfig.thresholds?.min_inbound_elite || silentConfig.min_inbound_elite || 3}</div>
                </div>
              </div>
            </div>

            {/* Weights */}
            {silentConfig.weights && Object.keys(silentConfig.weights).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Score Weights</h4>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(silentConfig.weights).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-gray-500 capitalize">{key}</div>
                      <div className="text-lg font-bold text-gray-700">{(val * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Detection */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-700 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" /> Test Detection
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Input
                  placeholder="account_id"
                  value={testInput.account_id}
                  onChange={(e) => setTestInput(prev => ({ ...prev, account_id: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  placeholder="handle"
                  value={testInput.handle}
                  onChange={(e) => setTestInput(prev => ({ ...prev, handle: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="authority_score"
                  value={testInput.authority_score}
                  onChange={(e) => setTestInput(prev => ({ ...prev, authority_score: parseFloat(e.target.value) }))}
                  className="text-sm"
                  step="0.05"
                  min="0"
                  max="1"
                />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <Input
                  type="number"
                  placeholder="tweets_30d"
                  value={testInput.tweets_30d}
                  onChange={(e) => setTestInput(prev => ({ ...prev, tweets_30d: parseInt(e.target.value) }))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="engagement_30d"
                  value={testInput.engagement_30d}
                  onChange={(e) => setTestInput(prev => ({ ...prev, engagement_30d: parseInt(e.target.value) }))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="inbound_elite"
                  value={testInput.inbound_elite_count}
                  onChange={(e) => setTestInput(prev => ({ ...prev, inbound_elite_count: parseInt(e.target.value) }))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="followers"
                  value={testInput.followers_count}
                  onChange={(e) => setTestInput(prev => ({ ...prev, followers_count: parseInt(e.target.value) }))}
                  className="text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={handleTestSilentAuthority}
                disabled={actionLoading !== null || !testInput.account_id || !testInput.handle}
                data-testid="test-silent-authority-btn"
              >
                {actionLoading === 'test' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
                Test
              </Button>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg ${
                  testResult.flag !== 'NONE' 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.flag !== 'NONE' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span className={`font-bold ${testResult.flag !== 'NONE' ? 'text-green-700' : 'text-gray-700'}`}>
                      {testResult.flag !== 'NONE' 
                        ? `🔔 ${testResult.flag}: @${testResult.handle}` 
                        : `❌ Not a Silent Authority`
                      }
                    </span>
                    {testResult.flag !== 'NONE' && (
                      <Badge className="bg-purple-100 text-purple-700">
                        Score: {(testResult.score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  {testResult.reasons.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {testResult.reasons.map((r, i) => (
                        <div key={i}>• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Alerts */}
            {silentAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Silent Authority Alerts</h4>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {silentAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          alert.flag === 'HIDDEN_ELITE' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                        }>
                          {alert.flag}
                        </Badge>
                        <span className="font-medium">@{alert.handle}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>Score: {(alert.score * 100).toFixed(0)}%</span>
                        <span>{new Date(alert.detected_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Follow-Graph Stats */}
      <Section 
        title="Follow-Graph" 
        icon={<Network className="w-4 h-4" />}
        badge="C"
        expanded={expandedSections.graph}
        onToggle={() => toggleSection('graph')}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                Follow-Graph Reader готов. Ожидаем данные от парсера.
              </span>
            </div>
            
            {status?.graph && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Total Edges</div>
                  <div className="text-2xl font-bold text-gray-700">{status.graph.total_edges}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Unique Followers</div>
                  <div className="text-2xl font-bold text-gray-700">{status.graph.unique_followers}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Unique Following</div>
                  <div className="text-2xl font-bold text-gray-700">{status.graph.unique_following}</div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-sm font-medium text-blue-700 mb-2">Контракт для парсера</h5>
              <pre className="text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-auto">
{`{
  from_id: string,      // follower
  to_id: string,        // following  
  parsed_at: Date,
  confidence: number    // 0-1
}`}
              </pre>
              <div className="text-xs text-blue-500 mt-2">
                Collection: <code className="bg-blue-100 px-1 rounded">twitter_follow_edges</code>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-4 text-xs text-purple-700 space-y-1">
          <div>🌐 <strong>Network v2</strong> = Follow Authority + Social Distance + Elite Exposure</div>
          <div>⚡ <strong>Co-Engagement</strong> строит граф из паттернов взаимодействия (без follow данных)</div>
          <div>🔔 <strong>Silent Authority</strong> находит тихих авторитетов (фонды, core devs, инсайдеры)</div>
          <div>📊 <strong>Follow-Graph</strong> усилит точность когда парсер начнёт писать данные</div>
        </CardContent>
      </Card>
    </div>
  );
}
