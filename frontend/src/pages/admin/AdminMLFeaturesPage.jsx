/**
 * Admin ML v2.3 Features Page - LIGHT THEME
 * 
 * Feature analysis and visualization for ML v2.3 models:
 * - View kept/dropped features
 * - Feature importance visualization
 * - Pruning/weighting configuration
 */

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Scissors, RefreshCw, Loader2, CheckCircle, XCircle,
  BarChart3, TrendingUp, TrendingDown, AlertTriangle,
  Layers, Scale, Filter, Eye, EyeOff, Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ============ FEATURE BAR ============
function FeatureBar({ name, importance, maxImportance, status = 'kept' }) {
  const percentage = maxImportance > 0 ? (importance / maxImportance) * 100 : 0;
  const isDropped = status === 'dropped';
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDropped ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <div className="w-48 flex items-center gap-2 shrink-0">
        {isDropped ? (
          <EyeOff className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-green-600" />
        )}
        <span className={`text-sm font-mono truncate ${isDropped ? 'text-red-700' : 'text-slate-700'}`}>
          {name}
        </span>
      </div>
      <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
        <div 
          className={`h-full rounded transition-all ${
            isDropped ? 'bg-red-300' : 
            percentage > 10 ? 'bg-green-500' : 
            percentage > 5 ? 'bg-blue-500' : 
            'bg-slate-400'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="w-20 text-right">
        <span className={`text-sm font-mono ${isDropped ? 'text-red-700' : 'text-slate-700'}`}>
          {(importance * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ============ DROPPED FEATURE CARD ============
function DroppedFeatureCard({ feature }) {
  const reasonColors = {
    'LOW_VARIANCE': 'bg-slate-100 text-slate-600 border-slate-200',
    'CORR>': 'bg-amber-100 text-amber-700 border-amber-200',
    'LOW_IMPORTANCE': 'bg-red-100 text-red-700 border-red-200',
    'EXCEEDED_MAX_FEATURES': 'bg-purple-100 text-purple-700 border-purple-200',
  };
  
  const getReasonColor = (reason) => {
    for (const [key, color] of Object.entries(reasonColors)) {
      if (reason.includes(key)) return color;
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
      <span className="text-sm font-mono text-slate-700">{feature.name}</span>
      <Badge className={`border ${getReasonColor(feature.reason)}`}>
        {feature.reason}
      </Badge>
    </div>
  );
}

// ============ STATUS CARD ============
function StatusCard({ label, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminMLFeaturesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [features, setFeatures] = useState(null);
  const [selectedTask, setSelectedTask] = useState('market');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');

  const networks = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc'];

  // Fetch v2.3 status
  const fetchStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/ml/v23/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  // Fetch features for task/network
  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/ml/v23/features/${selectedTask}/${selectedNetwork}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.ok) {
        setFeatures(data);
      } else {
        setFeatures(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTask, selectedNetwork]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Calculate stats
  const keptCount = features?.features?.kept?.length || 0;
  const droppedCount = features?.features?.dropped?.length || 0;
  const totalCount = keptCount + droppedCount;
  const dropRate = totalCount > 0 ? ((droppedCount / totalCount) * 100).toFixed(1) : 0;

  // Get max importance for scaling
  const importances = features?.features?.importances || {};
  const maxImportance = Math.max(...Object.values(importances), 0.01);

  // Sort features by importance
  const sortedKeptFeatures = features?.features?.kept
    ?.map(name => ({ name, importance: importances[name] || 0 }))
    .sort((a, b) => b.importance - a.importance) || [];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-ml-features-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scissors className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ML v2.3 Features</h1>
              <p className="text-sm text-slate-500">Feature pruning analysis and importance visualization</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchFeatures}
            disabled={loading}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* System Status */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status?.pythonService === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-slate-600">Python Service:</span>
              <span className={`text-sm font-medium ${status?.pythonService === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                {status?.pythonService === 'healthy' ? 'HEALTHY' : 'UNAVAILABLE'}
              </span>
            </div>
            <div className="text-slate-300">|</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Recent v2.3 Models:</span>
              <span className="text-sm font-medium text-slate-900">{status?.recentModels?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Task:</span>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="w-32 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Network:</span>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-40 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {networks.map(net => (
                  <SelectItem key={net} value={net}>{net}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* No Model */}
        {!loading && !features?.features && (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No v2.3 Model Found</h3>
            <p className="text-sm text-slate-500 mt-2">
              No v2.3 model has been trained for {selectedTask}/{selectedNetwork} yet.
            </p>
          </div>
        )}

        {/* Features Content */}
        {!loading && features?.features && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatusCard 
                label="Kept Features" 
                value={keptCount} 
                icon={CheckCircle} 
                color="green" 
              />
              <StatusCard 
                label="Dropped Features" 
                value={droppedCount} 
                icon={XCircle} 
                color="red" 
              />
              <StatusCard 
                label="Drop Rate" 
                value={`${dropRate}%`} 
                icon={TrendingDown} 
                color="amber" 
              />
              <StatusCard 
                label="Total Features" 
                value={totalCount} 
                icon={Layers} 
                color="blue" 
              />
            </div>

            {/* Feature Importance */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Kept Features (by importance)
                </h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {sortedKeptFeatures.map(feature => (
                  <FeatureBar
                    key={feature.name}
                    name={feature.name}
                    importance={feature.importance}
                    maxImportance={maxImportance}
                    status="kept"
                  />
                ))}
              </div>
            </div>

            {/* Dropped Features */}
            {features?.features?.droppedWithReasons?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-red-50">
                  <h3 className="font-semibold text-red-900 flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-red-600" />
                    Dropped Features ({droppedCount})
                  </h3>
                </div>
                <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                  {features.features.droppedWithReasons.map(feature => (
                    <DroppedFeatureCard key={feature.name} feature={feature} />
                  ))}
                </div>
              </div>
            )}

            {/* Model Info */}
            {features?.modelVersion && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>Model: <span className="font-mono font-medium text-slate-900">{features.modelVersion}</span></span>
                  {features.trainedAt && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>Trained: {new Date(features.trainedAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
