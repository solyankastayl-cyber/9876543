/**
 * S8 — ADMIN UI: Meta-Brain
 * ==========================
 * 
 * Final orchestration layer visualization.
 * Shows STRONG / WEAK / NO_ACTION verdicts.
 * 
 * TABS:
 * 1. Overview — Health & Key KPIs
 * 2. Decision Explorer — Browse all decisions
 * 3. Why Engine — Top reasons for NO_ACTION
 * 4. Strong Signals — Action-ready signals
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
  Brain,
  Zap,
  Loader2,
  Target,
  TrendingUp,
  Shield,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  BarChart3,
  ArrowDownRight,
  Gauge,
  ShieldAlert,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const VerdictBadge = ({ verdict }) => {
  const config = {
    STRONG: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
    WEAK: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
    NO_ACTION: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
  };
  const { color, icon: Icon } = config[verdict] || config.NO_ACTION;
  
  return (
    <Badge className={`${color} border text-xs flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {verdict?.replace('_', ' ')}
    </Badge>
  );
};

const RiskBadge = ({ level }) => {
  const config = {
    LOW: 'bg-green-500/20 text-green-400',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    HIGH: 'bg-red-500/20 text-red-400',
  };
  return <Badge className={`${config[level] || config.LOW} text-xs`}>{level}</Badge>;
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
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

const OverviewTab = ({ stats, loading, onRunEvaluation }) => {
  const [running, setRunning] = useState(false);
  
  const handleRunEvaluation = async () => {
    setRunning(true);
    await onRunEvaluation();
    setRunning(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const overview = stats?.overview || {};
  const byVerdict = stats?.by_verdict || {};
  const byRisk = stats?.by_risk || {};
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Meta-Brain Overview</h2>
          <p className="text-sm text-gray-400">Final orchestration verdicts</p>
        </div>
        <Button 
          onClick={handleRunEvaluation} 
          disabled={running}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {running ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Brain className="w-4 h-4 mr-2" /> Run Batch Evaluation</>
          )}
        </Button>
      </div>
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Decisions"
          value={overview.total || 0}
          subtitle="All processed signals"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Strong Rate"
          value={overview.strong_rate || '0%'}
          subtitle="Action-ready signals"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="No Action Rate"
          value={overview.no_action_rate || '0%'}
          subtitle="Filtered out"
          icon={XCircle}
          color="gray"
        />
        <StatCard
          title="Avg Confidence"
          value={(overview.avg_confidence * 100 || 0).toFixed(0) + '%'}
          subtitle="Decision confidence"
          icon={Target}
          color="purple"
        />
      </div>
      
      {/* Verdict Distribution */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Final Verdicts
          </CardTitle>
          <CardDescription>Meta-Brain decision distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['STRONG', 'WEAK', 'NO_ACTION'].map(verdict => {
              const count = byVerdict[verdict] || 0;
              const total = overview.total || 1;
              const pct = Math.round((count / total) * 100);
              
              return (
                <div key={verdict} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <VerdictBadge verdict={verdict} />
                  <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Risk Distribution */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['LOW', 'MEDIUM', 'HIGH'].map(risk => {
              const count = byRisk[risk] || 0;
              const total = overview.total || 1;
              const pct = Math.round((count / total) * 100);
              
              return (
                <div key={risk} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <RiskBadge level={risk} />
                  <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Why Engine Tab
// ============================================================

const WhyEngineTab = ({ whyData, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const noActionReasons = whyData?.top_no_action_reasons || [];
  const strongReasons = whyData?.top_strong_reasons || [];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          Why Engine
        </h2>
        <p className="text-sm text-gray-400">Understanding Meta-Brain decisions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NO_ACTION Reasons */}
        <Card className="bg-white/50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-400" />
              Top NO_ACTION Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {noActionReasons.length === 0 ? (
                <p className="text-gray-500 text-sm">No data yet</p>
              ) : (
                noActionReasons.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-700 flex-1">{item.reason}</span>
                    <Badge className="bg-gray-600 text-white ml-2">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* STRONG Reasons */}
        <Card className="bg-white/50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Top STRONG Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strongReasons.length === 0 ? (
                <p className="text-gray-500 text-sm">No data yet</p>
              ) : (
                strongReasons.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-700 flex-1">{item.reason}</span>
                    <Badge className="bg-green-600 text-white ml-2">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Onchain Impact */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white">On-Chain Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">
              {whyData?.onchain_impact_rate || 0}%
            </div>
            <p className="text-sm text-gray-400 mt-2">
              of USE signals were influenced by on-chain validation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Strong Signals Tab
// ============================================================

const StrongSignalsTab = ({ signals, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const items = signals?.signals || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            Strong Signals
          </h2>
          <p className="text-sm text-gray-400">Action-ready signals with high confidence</p>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
          {signals?.count || 0} Signals
        </Badge>
      </div>
      
      {items.length === 0 ? (
        <Card className="bg-white/50 border-gray-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No strong signals found. Run batch evaluation to generate decisions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((signal, idx) => (
            <Card key={idx} className="bg-white/50 border-gray-200 hover:border-green-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        {signal.asset}
                      </Badge>
                      <RiskBadge level={signal.risk_level} />
                      <span className="text-xs text-gray-500">
                        {signal.horizon}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{signal.reason}</p>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {signal.created_at ? new Date(signal.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-green-400 text-lg font-bold">
                      {(signal.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">confidence</div>
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
// Exchange Impact Tab (S10.8)
// ============================================================

const ExchangeImpactTab = ({ impactData, loading, onReset }) => {
  const [resetting, setResetting] = useState(false);
  
  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }
  
  const metrics = impactData?.metrics || {};
  const rules = impactData?.rules || {};
  const downgrades = impactData?.downgrades || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            Exchange Impact Panel
          </h2>
          <p className="text-sm text-gray-400">S10.8 — Exchange Intelligence → Meta-Brain Hook</p>
        </div>
        <Button 
          onClick={handleReset} 
          disabled={resetting}
          variant="outline"
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
        >
          {resetting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Reset Metrics</>
          )}
        </Button>
      </div>
      
      {/* Golden Rule Banner */}
      <Card className="bg-orange-500/10 border-orange-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-orange-300 font-medium">Golden Rule: Read-Only Safety Gate</p>
            <p className="text-orange-200/70">
              Exchange Intelligence can only <span className="text-red-400 font-semibold">DOWNGRADE</span> confidence or block STRONG → WEAK. 
              It <span className="text-red-400 font-semibold">CANNOT</span> upgrade or initiate signals.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Decisions"
          value={metrics.totalDecisions || 0}
          subtitle={`Since ${metrics.since ? new Date(metrics.since).toLocaleDateString() : 'start'}`}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Downgraded"
          value={metrics.downgraded || 0}
          subtitle={`${((metrics.downgradedRate || 0) * 100).toFixed(1)}% rate`}
          icon={ArrowDownRight}
          color="yellow"
        />
        <StatCard
          title="Avg Confidence Δ"
          value={`-${((metrics.avgConfidenceReduction || 0) * 100).toFixed(1)}%`}
          subtitle="Average reduction"
          icon={Gauge}
          color="red"
        />
        <StatCard
          title="STRONG Blocked"
          value={`${((metrics.strongBlockedRate || 0) * 100).toFixed(1)}%`}
          subtitle="Blocked rate"
          icon={Shield}
          color="purple"
        />
      </div>
      
      {/* Downgrade Triggers */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Downgrade Triggers
          </CardTitle>
          <CardDescription>Breakdown by trigger type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { key: 'regime', label: 'Regime', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
              { key: 'stress', label: 'Market Stress', color: 'text-red-400', bgColor: 'bg-red-500/20' },
              { key: 'conflict', label: 'Pattern Conflict', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
              { key: 'mlWarning', label: 'ML WARNING', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
            ].map(trigger => {
              const count = metrics.byTrigger?.[trigger.key] || 0;
              const total = Math.max(1, metrics.downgraded || 1);
              const pct = Math.round((count / total) * 100);
              
              return (
                <div key={trigger.key} className="text-center">
                  <div className={`text-2xl font-bold ${trigger.color} mb-1`}>{count}</div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <Badge className={`${trigger.bgColor} ${trigger.color} border-none text-xs`}>
                    {trigger.label}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Active Rules */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Active Impact Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Market Stress Threshold</p>
              <p className="text-lg font-bold text-white">{((rules.marketStressThreshold || 0.7) * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Regime Confidence</p>
              <p className="text-lg font-bold text-white">{((rules.regimeConfidenceThreshold || 0.6) * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Conflict Patterns</p>
              <p className="text-lg font-bold text-white">≥ {rules.conflictPatternThreshold || 2}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">ML WARNING Gate</p>
              <Badge className={rules.mlWarningBlocksStrong ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                {rules.mlWarningBlocksStrong ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>
          </div>
          
          {/* Downgrading Regimes */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Downgrading Regimes (STRONG → WEAK)</p>
            <div className="flex flex-wrap gap-2">
              {(rules.downgradingRegimes || []).map(regime => (
                <Badge key={regime} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {regime}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Downgrades */}
      <Card className="bg-white/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-yellow-400" />
            Recent Downgrades
          </CardTitle>
          <CardDescription>Last {Math.min(10, downgrades.length)} downgrade events</CardDescription>
        </CardHeader>
        <CardContent>
          {downgrades.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-400">No downgrades recorded yet</p>
              <p className="text-xs text-gray-500 mt-1">Exchange conditions are favorable</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {downgrades.slice(0, 10).map((entry, idx) => (
                <div key={idx} className="p-3 bg-gray-800/50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        entry.trigger === 'REGIME' ? 'bg-purple-500/20 text-purple-400' :
                        entry.trigger === 'STRESS' ? 'bg-red-500/20 text-red-400' :
                        entry.trigger === 'CONFLICT' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-orange-500/20 text-orange-400'
                      }>
                        {entry.trigger}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">{entry.originalStrength}</span>
                      <ArrowDownRight className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400">{entry.finalStrength}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{entry.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Regime: {entry.exchangeContext?.regime}</span>
                    <span>Stress: {((entry.exchangeContext?.marketStress || 0) * 100).toFixed(0)}%</span>
                    <span>ML: {entry.exchangeContext?.mlVerdict}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function AdminMetaBrainPage() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [strongSignals, setStrongSignals] = useState(null);
  const [exchangeImpact, setExchangeImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, strongRes, impactMetrics, impactRules, impactDowngrades] = await Promise.all([
        fetch(`${API_URL}/api/v8/meta-brain/stats`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/v8/meta-brain/strong-signals?limit=50`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/v10/meta-brain/impact/metrics`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/v10/meta-brain/impact/rules`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/v10/meta-brain/impact/downgrades?limit=20`).then(r => r.json()).catch(() => ({ ok: false })),
      ]);
      
      if (statsRes.ok) setStats(statsRes.data);
      if (strongRes.ok) setStrongSignals(strongRes.data);
      
      // Combine Exchange Impact data
      setExchangeImpact({
        metrics: impactMetrics.ok ? impactMetrics.metrics : {},
        rules: impactRules.ok ? impactRules.rules : {},
        downgrades: impactDowngrades.ok ? impactDowngrades.downgrades : [],
      });
    } catch (error) {
      console.error('Failed to fetch meta-brain data:', error);
    }
    setLoading(false);
  }, []);
  
  const handleRunEvaluation = async () => {
    try {
      await fetch(`${API_URL}/api/v8/meta-brain/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 500 }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to run evaluation:', error);
    }
  };
  
  const handleResetImpactMetrics = async () => {
    try {
      await fetch(`${API_URL}/api/v10/meta-brain/impact/reset`, {
        method: 'POST',
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to reset impact metrics:', error);
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">S8: Meta-Brain</h1>
              <p className="text-sm text-gray-400">Final orchestration layer</p>
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
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-purple-300 font-medium">Meta-Brain = Final Orchestrator</p>
              <p className="text-purple-200/70">
                Combines <span className="text-blue-400">Sentiment</span> + 
                <span className="text-green-400"> Observation</span> + 
                <span className="text-yellow-400"> Onchain</span> → 
                <span className="text-white font-bold"> STRONG / WEAK / NO_ACTION</span>
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
            <TabsTrigger value="exchange" className="data-[state=active]:bg-gray-700">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Exchange Impact
            </TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-gray-700">
              <HelpCircle className="w-4 h-4 mr-2" />
              Why Engine
            </TabsTrigger>
            <TabsTrigger value="strong" className="data-[state=active]:bg-gray-700">
              <Zap className="w-4 h-4 mr-2" />
              Strong Signals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              stats={stats}
              loading={loading}
              onRunEvaluation={handleRunEvaluation}
            />
          </TabsContent>
          
          <TabsContent value="exchange" className="mt-6">
            <ExchangeImpactTab 
              impactData={exchangeImpact}
              loading={loading}
              onReset={handleResetImpactMetrics}
            />
          </TabsContent>
          
          <TabsContent value="why" className="mt-6">
            <WhyEngineTab 
              whyData={stats?.why_engine}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="strong" className="mt-6">
            <StrongSignalsTab 
              signals={strongSignals}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
