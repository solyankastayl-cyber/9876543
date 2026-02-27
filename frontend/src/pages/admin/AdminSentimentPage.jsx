/**
 * S3.8.2 + B1-B6 — Sentiment Admin Dashboard (FINAL SPEC)
 * ========================================================
 * 
 * Platform Admin page for Sentiment Engine control & diagnostics.
 * Uses AdminLayout (light theme) - part of ML & Intelligence section.
 * 
 * TABS:
 * 1. Overview - Engine status, health, version
 * 2. Decision Stack - MOCK → CNN → HYBRID → FINAL breakdown
 * 3. Hybrid Booster - Controls + Decision Preview
 * 4. CNN Bullish Panel - Mismatch analysis + candidates
 * 5. Manual Test Harness - Text input + full breakdown
 * 6. Dataset - Retrain data collection + validation
 * 7. Logs - Toggle history + mismatch log
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import {
  Activity,
  Settings,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Database,
  Server,
  BarChart3,
  FileText,
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  Layers,
  Eye,
  FlaskConical,
  History,
  Power,
  PowerOff,
  Lock,
  Unlock,
  ArrowRight,
  ArrowDown,
  Info,
  ChevronRight,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const HealthBadge = ({ health }) => {
  const styles = {
    HEALTHY: 'bg-green-100 text-green-700 border-green-300',
    DEGRADED: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    DISABLED: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <Badge className={`${styles[health] || styles.DISABLED} border`}>
      {health === 'HEALTHY' && <CheckCircle className="w-3 h-3 mr-1" />}
      {health === 'DEGRADED' && <AlertTriangle className="w-3 h-3 mr-1" />}
      {health === 'DISABLED' && <XCircle className="w-3 h-3 mr-1" />}
      {health}
    </Badge>
  );
};

const LabelBadge = ({ label }) => {
  const colors = {
    POSITIVE: 'bg-green-100 text-green-700 border-green-300',
    NEUTRAL: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    NEGATIVE: 'bg-red-100 text-red-700 border-red-300',
  };
  return <Badge className={`${colors[label] || 'bg-slate-100'} border`}>{label}</Badge>;
};

const SafetyBadges = () => (
  <div className="flex flex-wrap gap-2 mb-4">
    <Badge className="bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 flex items-center gap-2">
      <Shield className="w-4 h-4" />
      SAFE MODE — Label locked to MOCK
    </Badge>
    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 flex items-center gap-2">
      <Sparkles className="w-4 h-4" />
      BOOST ONLY — CNN affects confidence only
    </Badge>
    <Badge className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 flex items-center gap-2">
      <Lock className="w-4 h-4" />
      v1.6.0 FROZEN
    </Badge>
  </div>
);

// ============================================================
// Main Component
// ============================================================

export default function AdminSentimentPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Loading states
  const [loading, setLoading] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  
  // Data states
  const [status, setStatus] = useState(null);
  const [shadowStatus, setShadowStatus] = useState(null);
  const [boosterStatus, setBoosterStatus] = useState(null);
  const [datasetStats, setDatasetStats] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  
  // Test harness state
  const [testText, setTestText] = useState('');
  const [testMode, setTestMode] = useState('hybrid');
  const [testResult, setTestResult] = useState(null);
  
  // Toggle history (local for now)
  const [toggleHistory, setToggleHistory] = useState([]);
  
  // ============================================================
  // Data Fetching
  // ============================================================
  
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/status`);
      const data = await res.json();
      if (data.ok) setStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);
  
  const fetchShadowStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/shadow/status`);
      const data = await res.json();
      if (data.ok) setShadowStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch shadow status:', e);
    }
  }, []);
  
  const fetchBoosterStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/booster/status`);
      const data = await res.json();
      if (data.ok) setBoosterStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch booster status:', e);
    }
  }, []);
  
  const fetchDatasetStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/ml/retrain/stats`);
      const data = await res.json();
      if (data.ok) setDatasetStats(data.data);
    } catch (e) {
      console.error('Failed to fetch dataset stats:', e);
    }
  }, []);
  
  const fetchSessionStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/ml/data-session/summary`);
      const data = await res.json();
      if (data.ok) setSessionStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch session status:', e);
    }
  }, []);
  
  // ============================================================
  // Actions
  // ============================================================
  
  const toggleShadowMode = async (enabled) => {
    setActionLoading('shadow');
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/shadow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      await fetchShadowStatus();
      addToggleHistory('shadow', enabled);
    } catch (e) {
      console.error('Failed to toggle shadow:', e);
    } finally {
      setActionLoading(null);
    }
  };
  
  const toggleBooster = async (enabled) => {
    setActionLoading('booster');
    try {
      await fetch(`${API_URL}/api/v4/admin/sentiment/booster/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      await fetchBoosterStatus();
      addToggleHistory('booster', enabled);
    } catch (e) {
      console.error('Failed to toggle booster:', e);
    } finally {
      setActionLoading(null);
    }
  };
  
  const updateThreshold = async (threshold) => {
    setActionLoading('threshold');
    try {
      await fetch(`${API_URL}/api/v4/admin/sentiment/booster/threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold }),
      });
      await fetchBoosterStatus();
      addToggleHistory('threshold', threshold);
    } catch (e) {
      console.error('Failed to update threshold:', e);
    } finally {
      setActionLoading(null);
    }
  };
  
  const runTest = async () => {
    if (!testText.trim()) return;
    setActionLoading('test');
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/booster/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      });
      const data = await res.json();
      if (data.ok) setTestResult(data.data);
    } catch (e) {
      console.error('Failed to run test:', e);
    } finally {
      setActionLoading(null);
    }
  };
  
  const addToggleHistory = (type, value) => {
    setToggleHistory(prev => [{
      id: Date.now(),
      type,
      value,
      timestamp: new Date().toISOString(),
    }, ...prev.slice(0, 49)]);
  };
  
  // ============================================================
  // Effects
  // ============================================================
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (isAuthenticated) {
      fetchStatus();
      fetchShadowStatus();
      fetchBoosterStatus();
      fetchDatasetStats();
      fetchSessionStatus();
    }
  }, [authLoading, isAuthenticated, navigate, fetchStatus, fetchShadowStatus, fetchBoosterStatus, fetchDatasetStats, fetchSessionStatus]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus();
      fetchShadowStatus();
      fetchBoosterStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchShadowStatus, fetchBoosterStatus]);
  
  // ============================================================
  // Render
  // ============================================================
  
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="admin-sentiment-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Sentiment Engine v1.6.0
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ML Runtime Control & Diagnostics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status && <HealthBadge health={status.health} />}
            <Button variant="outline" size="sm" onClick={() => {
              fetchStatus();
              fetchShadowStatus();
              fetchBoosterStatus();
              fetchDatasetStats();
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Safety Badges */}
        <SafetyBadges />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 border border-slate-200 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="decision-stack" className="data-[state=active]:bg-white">
              <Layers className="w-4 h-4 mr-2" />
              Decision Stack
            </TabsTrigger>
            <TabsTrigger value="booster" className="data-[state=active]:bg-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Hybrid Booster
            </TabsTrigger>
            <TabsTrigger value="bullish" className="data-[state=active]:bg-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              CNN Bullish
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-white">
              <FlaskConical className="w-4 h-4 mr-2" />
              Test Harness
            </TabsTrigger>
            <TabsTrigger value="dataset" className="data-[state=active]:bg-white">
              <Database className="w-4 h-4 mr-2" />
              Dataset
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white">
              <History className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB: Overview */}
          {/* ============================================================ */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Engine Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Engine Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {status?.health || 'UNKNOWN'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Version: v1.6.0 (FROZEN)
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Decision Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {boosterStatus?.enabled ? 'HYBRID BOOST' : shadowStatus?.enabled ? 'SHADOW' : 'MOCK ONLY'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Label always from MOCK
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Kill Switch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    OFF
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    System operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Runtime Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Runtime Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Shadow Mode</p>
                    <p className="text-lg font-semibold">
                      {shadowStatus?.enabled ? (
                        <span className="text-green-600">ON</span>
                      ) : (
                        <span className="text-slate-400">OFF</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Comparisons</p>
                    <p className="text-lg font-semibold">{shadowStatus?.stats?.totalComparisons || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Label Match</p>
                    <p className="text-lg font-semibold">
                      {shadowStatus?.stats?.labelMatchRate ? `${Math.round(shadowStatus.stats.labelMatchRate * 100)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avg Latency</p>
                    <p className="text-lg font-semibold">
                      {shadowStatus?.stats?.avgLatencyMs ? `${Math.round(shadowStatus.stats.avgLatencyMs)}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Quick Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Shadow Mode</Label>
                    <Switch
                      checked={shadowStatus?.enabled || false}
                      onCheckedChange={toggleShadowMode}
                      disabled={actionLoading === 'shadow'}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Hybrid Booster</Label>
                    <Switch
                      checked={boosterStatus?.enabled || false}
                      onCheckedChange={toggleBooster}
                      disabled={actionLoading === 'booster' || !shadowStatus?.enabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Decision Stack */}
          {/* ============================================================ */}
          <TabsContent value="decision-stack" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Decision Stack — How Results Are Computed
                </CardTitle>
                <CardDescription>
                  Visual breakdown of MOCK → CNN → HYBRID → FINAL decision flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Decision Flow Diagram */}
                <div className="space-y-4">
                  {/* Step 1: MOCK */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">1</Badge>
                      <span className="font-semibold text-blue-800">MOCK RULES (Source of Truth)</span>
                      <Badge className="bg-green-100 text-green-700 border border-green-200 ml-auto">
                        <Lock className="w-3 h-3 mr-1" />
                        LABEL AUTHORITY
                      </Badge>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Rules-based analysis: lexicon + grammar + crypto patterns</p>
                      <p>• Outputs: Label, Score (0-1), Confidence, Reasons, Flags</p>
                      <p>• <strong>This label is FINAL</strong> — CNN cannot override</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  {/* Step 2: CNN Shadow */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-600 text-white">2</Badge>
                      <span className="font-semibold text-purple-800">CNN SHADOW (Observer)</span>
                      <Badge className="bg-slate-100 text-slate-600 border ml-auto">
                        <Eye className="w-3 h-3 mr-1" />
                        READ ONLY
                      </Badge>
                    </div>
                    <div className="text-sm text-purple-700 space-y-1">
                      <p>• Neural network runs in parallel</p>
                      <p>• Outputs: Label, Score, Confidence</p>
                      <p>• Status: {shadowStatus?.enabled ? <span className="text-green-600 font-semibold">ENABLED</span> : <span className="text-slate-400">DISABLED</span>}</p>
                      <p>• <strong>Cannot change final label</strong></p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  {/* Step 3: Hybrid Logic */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-600 text-white">3</Badge>
                      <span className="font-semibold text-amber-800">HYBRID LOGIC (ML1.4 Booster)</span>
                      <Badge className={`ml-auto ${boosterStatus?.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {boosterStatus?.enabled ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <div className="text-sm text-amber-700 space-y-1">
                      <p><strong>Conditions for boost (ALL required):</strong></p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>MOCK label = NEUTRAL</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>CNN label = POSITIVE</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>CNN confidence ≥ {boosterStatus?.config?.cnnConfidenceThreshold ? Math.round(boosterStatus.config.cnnConfidenceThreshold * 100) : 70}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>No conflict/question flags</span>
                        </div>
                      </div>
                      <p className="mt-2"><strong>Effect:</strong> Confidence +15% (max 85%), Label unchanged</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  {/* Step 4: Final Output */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-600 text-white">4</Badge>
                      <span className="font-semibold text-green-800">FINAL OUTPUT</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• <strong>Label:</strong> Always from MOCK (POSITIVE/NEUTRAL/NEGATIVE)</p>
                      <p>• <strong>Confidence:</strong> MOCK confidence (+boost if applied)</p>
                      <p>• <strong>Flags:</strong> Includes cnn_positive_boost if booster fired</p>
                      <p>• <strong>Reasons:</strong> Explainability from all stages</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Hybrid Booster */}
          {/* ============================================================ */}
          <TabsContent value="booster" className="mt-6 space-y-4">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Hybrid Booster Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">CNN Shadow Mode</Label>
                        <p className="text-xs text-slate-500 mt-1">Enable parallel CNN processing</p>
                      </div>
                      <Switch
                        checked={shadowStatus?.enabled || false}
                        onCheckedChange={toggleShadowMode}
                        disabled={actionLoading === 'shadow'}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Hybrid Booster</Label>
                        <p className="text-xs text-slate-500 mt-1">Enable confidence boosting</p>
                      </div>
                      <Switch
                        checked={boosterStatus?.enabled || false}
                        onCheckedChange={toggleBooster}
                        disabled={actionLoading === 'booster' || !shadowStatus?.enabled}
                      />
                    </div>
                    {!shadowStatus?.enabled && (
                      <p className="text-xs text-amber-600 mt-2">⚠️ Enable Shadow Mode first</p>
                    )}
                  </div>
                </div>
                
                {/* Threshold Slider */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Label className="font-medium text-purple-700">
                    CNN Confidence Threshold: {boosterStatus?.config?.cnnConfidenceThreshold ? Math.round(boosterStatus.config.cnnConfidenceThreshold * 100) : 70}%
                  </Label>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={boosterStatus?.config?.cnnConfidenceThreshold ? Math.round(boosterStatus.config.cnnConfidenceThreshold * 100) : 70}
                    onChange={(e) => updateThreshold(parseInt(e.target.value) / 100)}
                    disabled={actionLoading === 'threshold'}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-3"
                  />
                  <div className="flex justify-between text-xs text-purple-600 mt-1">
                    <span>50%</span>
                    <span>60%</span>
                    <span>70%</span>
                    <span>80%</span>
                    <span>90%</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Minimum CNN confidence required to apply boost
                  </p>
                </div>
                
                {/* Config Summary */}
                {boosterStatus && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded border text-center">
                      <p className="text-xs text-slate-500">Threshold</p>
                      <p className="text-lg font-semibold">{Math.round((boosterStatus.config?.cnnConfidenceThreshold || 0.7) * 100)}%</p>
                    </div>
                    <div className="p-3 bg-white rounded border text-center">
                      <p className="text-xs text-slate-500">Max Boost</p>
                      <p className="text-lg font-semibold">+{Math.round((boosterStatus.config?.maxBoost || 0.15) * 100)}%</p>
                    </div>
                    <div className="p-3 bg-white rounded border text-center">
                      <p className="text-xs text-slate-500">Confidence Cap</p>
                      <p className="text-lg font-semibold">{Math.round((boosterStatus.config?.confidenceCap || 0.85) * 100)}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: CNN Bullish Panel */}
          {/* ============================================================ */}
          <TabsContent value="bullish" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  CNN Bullish Analysis
                </CardTitle>
                <CardDescription>
                  Understanding where CNN sees positive signals that MOCK rules miss
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Explanation */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Why CNN is more bullish — and why that is OK</p>
                      <p className="text-sm text-blue-700 mt-1">
                        CNN was trained on general sentiment data and tends to detect positive signals in crypto news headlines,
                        bullish slang, and market optimism that rules-based MOCK conservatively marks as NEUTRAL.
                        This is not a bug — it is a feature we leverage through the Hybrid Booster.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Session Stats */}
                {sessionStatus && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Mismatch Rate</p>
                      <p className="text-2xl font-bold text-amber-600">{sessionStatus.labels?.mismatchRate || 0}%</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">CNN POSITIVE</p>
                      <p className="text-2xl font-bold text-green-600">{sessionStatus.labels?.cnn?.POSITIVE || 0}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">MOCK POSITIVE</p>
                      <p className="text-2xl font-bold text-blue-600">{sessionStatus.labels?.mock?.POSITIVE || 0}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Boost Candidates</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {datasetStats?.byMismatchType?.MOCK_NEUTRAL_CNN_POSITIVE || 0}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Label Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">MOCK Label Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionStatus?.labels?.mock && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">POSITIVE</div>
                            <Progress value={sessionStatus.labels.mock.POSITIVE / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.mock.POSITIVE}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">NEUTRAL</div>
                            <Progress value={sessionStatus.labels.mock.NEUTRAL / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.mock.NEUTRAL}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">NEGATIVE</div>
                            <Progress value={sessionStatus.labels.mock.NEGATIVE / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.mock.NEGATIVE}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">CNN Label Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionStatus?.labels?.cnn && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">POSITIVE</div>
                            <Progress value={sessionStatus.labels.cnn.POSITIVE / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.cnn.POSITIVE}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">NEUTRAL</div>
                            <Progress value={sessionStatus.labels.cnn.NEUTRAL / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.cnn.NEUTRAL}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">NEGATIVE</div>
                            <Progress value={sessionStatus.labels.cnn.NEGATIVE / (sessionStatus.collection?.tweetsProcessed || 1) * 100} className="flex-1 h-2" />
                            <div className="w-8 text-xs text-right">{sessionStatus.labels.cnn.NEGATIVE}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Main Pattern */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">Primary Mismatch Pattern</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="p-3 bg-white rounded border text-center">
                      <p className="text-xs text-slate-500">MOCK</p>
                      <LabelBadge label="NEUTRAL" />
                    </div>
                    <ArrowRight className="w-6 h-6 text-amber-500" />
                    <div className="p-3 bg-white rounded border text-center">
                      <p className="text-xs text-slate-500">CNN</p>
                      <LabelBadge label="POSITIVE" />
                    </div>
                    <div className="flex-1 p-3 bg-white rounded border">
                      <p className="text-xs text-slate-500">Count</p>
                      <p className="text-xl font-bold text-amber-600">
                        {datasetStats?.byMismatchType?.MOCK_NEUTRAL_CNN_POSITIVE || 0} cases
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 mt-3">
                    These are candidates for confidence boost — CNN sees early positive signals
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Manual Test Harness */}
          {/* ============================================================ */}
          <TabsContent value="test" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                  Manual Test Harness
                </CardTitle>
                <CardDescription>
                  Test any text through the full decision pipeline without Twitter or queue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input */}
                <div>
                  <Label className="mb-2 block">Test Text / Tweet</Label>
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Paste tweet, headline, or any text to analyze..."
                    className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="test-harness-input"
                  />
                </div>
                
                {/* Run Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={runTest}
                    disabled={!testText.trim() || actionLoading === 'test'}
                    className="flex-1"
                    data-testid="test-harness-run"
                  >
                    {actionLoading === 'test' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Run Full Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTestText('');
                      setTestResult(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                {/* Results */}
                {testResult && (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Analysis Results
                    </h3>
                    
                    {/* Decision Stack for this test */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* MOCK */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">1. MOCK (Authority)</p>
                        <LabelBadge label={testResult.label} />
                        <p className="text-xs text-slate-500 mt-1">
                          Score: {testResult.score?.toFixed(3)}
                        </p>
                      </div>
                      
                      {/* CNN */}
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 font-medium mb-1">2. CNN (Shadow)</p>
                        {testResult.hybridBooster?.cnnLabel ? (
                          <>
                            <LabelBadge label={testResult.hybridBooster.cnnLabel} />
                            <p className="text-xs text-slate-500 mt-1">
                              Conf: {Math.round((testResult.hybridBooster.cnnConfidence || 0) * 100)}%
                            </p>
                          </>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500">N/A</Badge>
                        )}
                      </div>
                      
                      {/* Hybrid */}
                      <div className={`p-3 rounded-lg border ${
                        testResult.hybridBooster?.applied 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <p className="text-xs text-slate-600 font-medium mb-1">3. Hybrid Booster</p>
                        <Badge className={
                          testResult.hybridBooster?.applied 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-500'
                        }>
                          {testResult.hybridBooster?.applied ? 'APPLIED' : 'NOT APPLIED'}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {testResult.hybridBooster?.reason}
                        </p>
                      </div>
                      
                      {/* Final */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-1">4. Final Output</p>
                        <LabelBadge label={testResult.label} />
                        <p className="text-xs text-slate-500 mt-1">
                          Conf: {Math.round((testResult.confidence || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Boost Details */}
                    {testResult.hybridBooster?.applied && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-700">
                          Confidence Boosted: {Math.round((testResult.hybridBooster.originalConfidence || 0) * 100)}% → {Math.round((testResult.hybridBooster.boostedConfidence || 0) * 100)}%
                        </p>
                      </div>
                    )}
                    
                    {/* Flags & Reasons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {testResult.flags?.length > 0 && (
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-slate-500 mb-2">Flags</p>
                          <div className="flex flex-wrap gap-1">
                            {testResult.flags.map((flag, i) => (
                              <Badge key={i} className="bg-purple-100 text-purple-700">{flag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {testResult.reasons?.length > 0 && (
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-slate-500 mb-2">Reasons</p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {testResult.reasons.map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Dataset */}
          {/* ============================================================ */}
          <TabsContent value="dataset" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Retrain Dataset
                </CardTitle>
                <CardDescription>
                  Collect and validate data for potential CNN retraining
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                {datasetStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Total Collected</p>
                      <p className="text-2xl font-bold">{datasetStats.total}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Valid for Retrain</p>
                      <p className="text-2xl font-bold text-green-600">{datasetStats.validForRetrain}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="text-2xl font-bold text-blue-600">500+</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-slate-500">Progress</p>
                      <p className="text-2xl font-bold">
                        {datasetStats.validForRetrain >= 500 ? '✓' : `${Math.round(datasetStats.validForRetrain / 500 * 100)}%`}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Balance */}
                {datasetStats && (
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <p className="text-sm font-medium mb-3">Label Balance (MOCK labels in dataset)</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">POSITIVE</p>
                        <p className="text-lg font-semibold text-green-600">
                          {Math.round(datasetStats.balance.positiveRatio * 100)}%
                        </p>
                        <p className="text-xs text-slate-400">target: 25-35%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">NEUTRAL</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {Math.round(datasetStats.balance.neutralRatio * 100)}%
                        </p>
                        <p className="text-xs text-slate-400">target: 35-45%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">NEGATIVE</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.round(datasetStats.balance.negativeRatio * 100)}%
                        </p>
                        <p className="text-xs text-slate-400">target: 25-35%</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <Badge className={datasetStats.balance.isBalanced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {datasetStats.balance.isBalanced ? 'BALANCED' : 'IMBALANCED'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Validation Status */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">Retrain Readiness</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {datasetStats?.validForRetrain >= 500 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">Minimum samples (500+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {datasetStats?.balance?.neutralRatio >= 0.3 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">NEUTRAL ratio ≥ 30%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {datasetStats?.balance?.isBalanced ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm">Class balance acceptable</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Logs */}
          {/* ============================================================ */}
          <TabsContent value="logs" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  Toggle History
                </CardTitle>
                <CardDescription>
                  Recent control changes (local session)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {toggleHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No changes recorded in this session
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {toggleHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{entry.type}</Badge>
                          <span className="text-slate-600">
                            {typeof entry.value === 'boolean' 
                              ? (entry.value ? 'ENABLED' : 'DISABLED')
                              : entry.value
                            }
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Shadow Log Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shadow Comparison Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {shadowStatus?.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Total Comparisons</p>
                      <p className="font-semibold">{shadowStatus.stats.totalComparisons}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Label Match Rate</p>
                      <p className="font-semibold">
                        {shadowStatus.stats.labelMatchRate ? `${Math.round(shadowStatus.stats.labelMatchRate * 100)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg Score Diff</p>
                      <p className="font-semibold">
                        {shadowStatus.stats.avgScoreDiff?.toFixed(3) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Error Rate</p>
                      <p className="font-semibold">
                        {shadowStatus.stats.errorRate ? `${Math.round(shadowStatus.stats.errorRate * 100)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}
