/**
 * S7.6 — ADMIN UI: Onchain Validation
 * ====================================
 * 
 * Validation & Contradiction Layer visualization.
 * Shows how on-chain reality validates ObservationModel decisions.
 * 
 * KEY METRICS (S7.7):
 * - use_confirm_rate: % of USE signals confirmed by on-chain
 * - use_contradict_rate: % of USE signals contradicted
 * - miss_confirm_rate: % of MISS_ALERT confirmed
 * - false_positive_reduced: avg confidence reduction
 * 
 * TABS:
 * 1. Overview — Health & Key KPIs
 * 2. Contradictions — USE signals that on-chain disagrees with
 * 3. Snapshots — On-chain data browser
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Link2,
  Loader2,
  Eye,
  TrendingDown,
  Zap,
  Database,
  AlertCircle,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const VerdictBadge = ({ verdict }) => {
  const config = {
    CONFIRMS: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
    CONTRADICTS: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    NO_DATA: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircle },
  };
  const { color, icon: Icon } = config[verdict] || config.NO_DATA;
  
  return (
    <Badge className={`${color} border text-xs flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {verdict}
    </Badge>
  );
};

const ImpactBadge = ({ impact }) => {
  const config = {
    NONE: { color: 'bg-gray-500/20 text-gray-400', label: 'None' },
    DOWNGRADE: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Downgrade' },
    STRONG_ALERT: { color: 'bg-red-500/20 text-red-400', label: 'Strong Alert' },
  };
  const { color, label } = config[impact] || config.NONE;
  
  return <Badge className={`${color} text-xs`}>{label}</Badge>;
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <Card className={`bg-gradient-to-br ${colors[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {Icon && <Icon className="w-8 h-8 text-gray-500" />}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Overview Tab
// ============================================================

const OverviewTab = ({ stats, snapshotStats, loading, onRunValidation }) => {
  const [running, setRunning] = useState(false);
  
  const handleRunValidation = async () => {
    setRunning(true);
    await onRunValidation();
    setRunning(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const validation = stats?.validation || {};
  const kpis = stats?.kpis || {};
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">S7 Validation Layer</h2>
          <p className="text-sm text-gray-400">On-chain reality check for ObservationModel decisions</p>
        </div>
        <Button 
          onClick={handleRunValidation} 
          disabled={running}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {running ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Run Batch Validation</>
          )}
        </Button>
      </div>
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="USE Confirm Rate"
          value={kpis.use_confirm_rate || '0%'}
          subtitle="Signals validated by on-chain"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="USE Contradict Rate"
          value={kpis.use_contradict_rate || '0%'}
          subtitle="Signals disputed by on-chain"
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="MISS Confirm Rate"
          value={kpis.miss_confirm_rate || '0%'}
          subtitle="Blind spots confirmed"
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Confidence Reduction"
          value={kpis.false_positive_reduced || '0%'}
          subtitle="Avg downgrade from validation"
          icon={TrendingDown}
          color="yellow"
        />
      </div>
      
      {/* Verdict Distribution */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Validation Verdicts
          </CardTitle>
          <CardDescription>How on-chain data validates each observation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['CONFIRMS', 'CONTRADICTS', 'NO_DATA'].map(verdict => {
              const count = validation.by_verdict?.[verdict] || 0;
              const total = validation.total || 1;
              const pct = Math.round((count / total) * 100);
              const colors = {
                CONFIRMS: 'bg-green-500',
                CONTRADICTS: 'bg-red-500',
                NO_DATA: 'bg-gray-500',
              };
              
              return (
                <div key={verdict} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <Progress 
                    value={pct} 
                    className="h-2 mb-2"
                  />
                  <VerdictBadge verdict={verdict} />
                  <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Impact Distribution */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Impact Distribution
          </CardTitle>
          <CardDescription>How validation affects signal confidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['NONE', 'DOWNGRADE', 'STRONG_ALERT'].map(impact => {
              const count = validation.by_impact?.[impact] || 0;
              const total = validation.total || 1;
              const pct = Math.round((count / total) * 100);
              
              return (
                <div key={impact} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <ImpactBadge impact={impact} />
                  <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Snapshot Stats */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            On-Chain Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">{snapshotStats?.total || 0}</div>
              <div className="text-xs text-gray-400">Total Snapshots</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{snapshotStats?.data_available_rate || 0}%</div>
              <div className="text-xs text-gray-400">Data Available Rate</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{snapshotStats?.avg_confidence?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-gray-400">Avg Confidence</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {Object.keys(snapshotStats?.by_source || {}).length}
              </div>
              <div className="text-xs text-gray-400">Data Sources</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Contradictions Tab
// ============================================================

const ContradictionsTab = ({ contradictions, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const items = contradictions?.contradictions || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Contradicted USE Signals</h2>
          <p className="text-sm text-gray-400">
            Signals where on-chain data disagrees with ObservationModel
          </p>
        </div>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-4 py-2">
          {contradictions?.count || 0} Contradictions
        </Badge>
      </div>
      
      {items.length === 0 ? (
        <Card className="bg-white/50 border-gray-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-400">No contradictions found. On-chain agrees with all USE signals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={idx} className="bg-white/50 border-gray-200 hover:border-red-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        {item.observation_id?.slice(-8)}
                      </Badge>
                      <ImpactBadge impact={item.impact} />
                      <span className="text-xs text-gray-500">
                        {item.validated_at ? new Date(item.validated_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{item.explanation}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {(item.flags || []).map((flag, i) => (
                        <Badge key={i} className="bg-gray-700 text-gray-700 text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-red-400 text-lg font-bold">
                      {item.confidence_delta}
                    </div>
                    <div className="text-xs text-gray-500">confidence delta</div>
                    <div className="text-xs text-gray-400 mt-1">
                      via {item.onchain_source}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Snapshots Tab
// ============================================================

const SnapshotsTab = ({ snapshots, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const items = snapshots?.snapshots || [];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">On-Chain Snapshots</h2>
        <p className="text-sm text-gray-400">Point-in-time on-chain state at signal time (t0)</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-gray-400">Signal ID</th>
              <th className="text-left p-3 text-gray-400">Asset</th>
              <th className="text-left p-3 text-gray-400">Time (t0)</th>
              <th className="text-center p-3 text-gray-400">Exchange Signal</th>
              <th className="text-center p-3 text-gray-400">Pressure</th>
              <th className="text-center p-3 text-gray-400">Whale Activity</th>
              <th className="text-center p-3 text-gray-400">Confidence</th>
              <th className="text-center p-3 text-gray-400">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100/50">
                <td className="p-3 font-mono text-xs text-gray-700">
                  {s.signal_id?.slice(-12)}
                </td>
                <td className="p-3">
                  <Badge className="bg-blue-500/20 text-blue-400">{s.asset}</Badge>
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {s.t0_timestamp ? new Date(s.t0_timestamp).toLocaleString() : 'N/A'}
                </td>
                <td className="p-3 text-center">
                  <Badge className={
                    s.exchange_signal?.includes('BUY') ? 'bg-green-500/20 text-green-400' :
                    s.exchange_signal?.includes('SELL') ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }>
                    {s.exchange_signal || 'N/A'}
                  </Badge>
                </td>
                <td className="p-3 text-center">
                  <span className={
                    s.exchange_pressure > 0 ? 'text-red-400' :
                    s.exchange_pressure < 0 ? 'text-green-400' : 'text-gray-400'
                  }>
                    {s.exchange_pressure?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {s.whale_activity_flag ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400">Active</Badge>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className={
                    s.confidence >= 0.7 ? 'text-green-400' :
                    s.confidence >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {(s.confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <Badge className={
                    s.source === 'mock' ? 'bg-gray-500/20 text-gray-400' : 'bg-purple-500/20 text-purple-400'
                  }>
                    {s.source}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No snapshots found. Run batch validation to create snapshots.
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function AdminOnchainValidationPage() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [contradictions, setContradictions] = useState(null);
  const [snapshots, setSnapshots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, contradictionsRes, snapshotsRes] = await Promise.all([
        fetch(`${API_URL}/api/v7/validation/stats`).then(r => r.json()),
        fetch(`${API_URL}/api/v7/validation/contradictions?limit=50`).then(r => r.json()),
        fetch(`${API_URL}/api/v7/validation/snapshots?limit=100`).then(r => r.json()),
      ]);
      
      if (statsRes.ok) setStats(statsRes.data);
      if (contradictionsRes.ok) setContradictions(contradictionsRes.data);
      if (snapshotsRes.ok) setSnapshots(snapshotsRes.data);
    } catch (error) {
      console.error('Failed to fetch validation data:', error);
    }
    setLoading(false);
  }, []);
  
  const handleRunValidation = async () => {
    try {
      await fetch(`${API_URL}/api/v7/validation/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 500 }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to run validation:', error);
    }
  };
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, fetchData]);
  
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">S7: On-Chain Validation</h1>
              <p className="text-sm text-gray-400">Reality check for sentiment signals</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="border-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Architecture Note */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">Golden Rule: On-chain CANNOT improve signals</p>
              <p className="text-blue-200/70">
                On-chain validation can only <span className="text-yellow-400">DOWNGRADE</span> confidence 
                or raise <span className="text-red-400">ALERTS</span>. It never upgrades or changes decisions.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contradictions" className="data-[state=active]:bg-gray-700">
              <XCircle className="w-4 h-4 mr-2" />
              Contradictions
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="data-[state=active]:bg-gray-700">
              <Database className="w-4 h-4 mr-2" />
              Snapshots
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              stats={stats}
              snapshotStats={stats?.snapshots}
              loading={loading}
              onRunValidation={handleRunValidation}
            />
          </TabsContent>
          
          <TabsContent value="contradictions" className="mt-6">
            <ContradictionsTab 
              contradictions={contradictions}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="snapshots" className="mt-6">
            <SnapshotsTab 
              snapshots={snapshots}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
