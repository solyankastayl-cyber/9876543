/**
 * S6.4 — ADMIN UI: Observation Model
 * S6.5 — ObservationModel v1 (ML Tab)
 * ===================================
 * 
 * Read-only visualization of observation decisions.
 * Shows where system is useful, blind, or just noise.
 * 
 * TABS:
 * 1. Overview — Health & Reality Check
 * 2. Rules Panel — Decision Engine v0
 * 3. Missed Explorer — Blind Spots (KEY)
 * 4. Metrics & Buckets — Preparation for ML
 * 5. ML Model — ObservationModel v1 (S6.5)
 * 
 * NO decisions, NO optimizations — pure data mirror.
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
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Clock,
  Eye,
  Loader2,
  ChevronRight,
  Filter,
  Search,
  X,
  Info,
  Zap,
  AlertCircle,
  Brain,
  Layers,
  Shield,
  EyeOff,
  Cpu,
  Play,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const DecisionBadge = ({ decision }) => {
  const styles = {
    USE: 'bg-green-100 text-green-700 border-green-300',
    IGNORE: 'bg-slate-100 text-slate-600 border-slate-300',
    MISS_ALERT: 'bg-amber-100 text-amber-700 border-amber-300',
    UNKNOWN: 'bg-purple-100 text-purple-600 border-purple-300',
  };
  
  const icons = {
    USE: <CheckCircle className="w-3 h-3 mr-1" />,
    IGNORE: <EyeOff className="w-3 h-3 mr-1" />,
    MISS_ALERT: <AlertTriangle className="w-3 h-3 mr-1" />,
    UNKNOWN: <Info className="w-3 h-3 mr-1" />,
  };
  
  return (
    <Badge variant="outline" className={`${styles[decision] || styles.UNKNOWN} flex items-center text-xs`}>
      {icons[decision] || icons.UNKNOWN}
      {decision}
    </Badge>
  );
};

const OutcomeBadge = ({ outcome }) => {
  const styles = {
    TRUE_POSITIVE: 'bg-green-100 text-green-700 border-green-300',
    TRUE_NEGATIVE: 'bg-green-100 text-green-700 border-green-300',
    FALSE_POSITIVE: 'bg-red-100 text-red-700 border-red-300',
    FALSE_NEGATIVE: 'bg-red-100 text-red-700 border-red-300',
    MISSED_OPPORTUNITY: 'bg-amber-100 text-amber-700 border-amber-300',
    NO_SIGNAL: 'bg-slate-100 text-slate-600 border-slate-300',
  };
  
  return (
    <Badge variant="outline" className={`${styles[outcome] || 'bg-slate-100'} text-xs`}>
      {outcome?.replace('_', ' ')}
    </Badge>
  );
};

const SentimentBadge = ({ label }) => {
  const styles = {
    POSITIVE: 'bg-green-100 text-green-700',
    NEGATIVE: 'bg-red-100 text-red-700',
    NEUTRAL: 'bg-slate-100 text-slate-600',
  };
  
  return (
    <Badge variant="outline" className={`${styles[label] || 'bg-slate-100'} text-xs`}>
      {label}
    </Badge>
  );
};

const DirectionIcon = ({ direction }) => {
  if (direction === 'UP') return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (direction === 'DOWN') return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, alert }) => (
  <Card className={`${alert === 'red' ? 'border-red-300 bg-red-50' : alert === 'yellow' ? 'border-amber-300 bg-amber-50' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${alert === 'red' ? 'bg-red-100' : alert === 'yellow' ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <Icon className={`w-5 h-5 ${alert === 'red' ? 'text-red-600' : alert === 'yellow' ? 'text-amber-600' : 'text-slate-600'}`} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-2">
          <Progress value={Math.min(trend, 100)} className="h-1" />
        </div>
      )}
    </CardContent>
  </Card>
);

// ============================================================
// Tab 1: Overview
// ============================================================

const OverviewTab = ({ stats, metrics, calibration, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const usableRate = metrics?.usableRate || 0;
  const missRate = metrics?.missRate || 0;
  const falseConfRate = metrics?.falseConfidenceRate || 0;
  const noiseRate = metrics?.noiseRate || 0;
  
  const byDecision = stats?.byDecision || {};
  const useCount = byDecision.USE || 0;
  const ignoreCount = byDecision.IGNORE || 0;
  const missCount = byDecision.MISS_ALERT || 0;
  const total = stats?.total || 0;

  return (
    <div className="space-y-6">
      {/* Health Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Observations"
          value={total}
          icon={Layers}
          subtitle="All processed signals"
        />
        <StatCard
          title="USE Rate"
          value={`${((useCount / total) * 100 || 0).toFixed(1)}%`}
          icon={CheckCircle}
          subtitle={`${useCount} signals`}
          alert={useCount === 0 && total > 0 ? 'yellow' : undefined}
        />
        <StatCard
          title="MISS_ALERT Rate"
          value={`${((missCount / total) * 100 || 0).toFixed(1)}%`}
          icon={AlertTriangle}
          subtitle={`${missCount} blind spots`}
          alert={missCount / total > 0.1 ? 'yellow' : undefined}
        />
        <StatCard
          title="False Confidence"
          value={`${falseConfRate.toFixed(1)}%`}
          icon={XCircle}
          subtitle="High conf + FP"
          alert={falseConfRate > 50 ? 'red' : falseConfRate > 30 ? 'yellow' : undefined}
        />
      </div>

      {/* Decision Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Decision Distribution
          </CardTitle>
          <CardDescription>How rules classify signals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* USE */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">USE</span>
              </div>
              <div className="flex-1">
                <Progress value={(useCount / total) * 100 || 0} className="h-3 bg-slate-100" />
              </div>
              <span className="w-16 text-right text-sm text-slate-600">
                {((useCount / total) * 100 || 0).toFixed(1)}%
              </span>
            </div>
            
            {/* IGNORE */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm font-medium">IGNORE</span>
              </div>
              <div className="flex-1">
                <Progress value={(ignoreCount / total) * 100 || 0} className="h-3 bg-slate-100" />
              </div>
              <span className="w-16 text-right text-sm text-slate-600">
                {((ignoreCount / total) * 100 || 0).toFixed(1)}%
              </span>
            </div>
            
            {/* MISS_ALERT */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">MISS</span>
              </div>
              <div className="flex-1">
                <Progress value={(missCount / total) * 100 || 0} className="h-3 bg-slate-100" />
              </div>
              <span className="w-16 text-right text-sm text-slate-600">
                {((missCount / total) * 100 || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Confidence Calibration
          </CardTitle>
          <CardDescription>Expected confidence vs actual TP rate (positive gap = overconfident)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {calibration?.map((bucket) => (
              <div key={bucket.bucket} className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-slate-600">{bucket.bucket}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-24 text-right">
                    <span className="text-xs text-slate-500">Expected: </span>
                    <span className="text-sm font-medium">{(bucket.expectedConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs text-slate-500">Actual: </span>
                    <span className="text-sm font-medium">{(bucket.actualTPRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className={`w-20 text-right text-sm font-medium ${bucket.calibrationGap > 0.3 ? 'text-red-600' : bucket.calibrationGap > 0.1 ? 'text-amber-600' : 'text-green-600'}`}>
                    Gap: {(bucket.calibrationGap * 100).toFixed(0)}%
                  </div>
                </div>
                <span className="w-12 text-right text-xs text-slate-400">n={bucket.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Tab 2: Rules Panel
// ============================================================

const RulesTab = ({ rulesStats, loading }) => {
  const [selectedRule, setSelectedRule] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const rules = [
    {
      id: 'USE',
      name: 'USE',
      description: 'Signal is historically useful',
      trigger: 'confidence >= 0.7 AND (TP OR TN) AND horizon in [1h, 4h]',
      count: rulesStats?.byDecision?.USE || 0,
      percent: rulesStats?.byDecisionPercent?.USE || 0,
      color: 'green',
    },
    {
      id: 'IGNORE',
      name: 'IGNORE',
      description: 'Signal is noise or flat',
      trigger: 'confidence < 0.6 OR NO_SIGNAL OR magnitude = NONE OR default',
      count: rulesStats?.byDecision?.IGNORE || 0,
      percent: rulesStats?.byDecisionPercent?.IGNORE || 0,
      color: 'slate',
    },
    {
      id: 'MISS_ALERT',
      name: 'MISS_ALERT',
      description: 'System was blind to movement',
      trigger: 'sent_label = NEUTRAL AND magnitude = STRONG',
      count: rulesStats?.byDecision?.MISS_ALERT || 0,
      percent: rulesStats?.byDecisionPercent?.MISS_ALERT || 0,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Rules Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Decision Engine v0</p>
              <p className="text-xs text-blue-600 mt-1">
                These are deterministic rules — no ML, no optimization. 
                Order: MISS_ALERT → USE → IGNORE (default).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rules Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRule === rule.id 
                    ? `bg-${rule.color}-50 border-${rule.color}-300` 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${rule.color}-500`} 
                         style={{ backgroundColor: rule.color === 'green' ? '#22c55e' : rule.color === 'amber' ? '#f59e0b' : '#64748b' }} />
                    <div>
                      <span className="font-medium">{rule.name}</span>
                      <p className="text-xs text-slate-500">{rule.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{rule.count}</span>
                    <span className="text-sm text-slate-500 ml-2">({rule.percent.toFixed(1)}%)</span>
                  </div>
                </div>
                
                {selectedRule === rule.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Trigger Formula:</p>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                      {rule.trigger}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* USE by Confidence */}
      {rulesStats?.useByConfidence && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">USE Rate by Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rulesStats.useByConfidence.map((bucket) => (
                <div key={bucket.bucket} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">{bucket.bucket}</span>
                  <div className="flex-1">
                    <Progress value={bucket.rate || 0} className="h-3" />
                  </div>
                  <span className="w-20 text-right text-sm">
                    {bucket.rate.toFixed(1)}% ({bucket.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================
// Tab 3: Missed Explorer (KEY)
// ============================================================

const MissedExplorerTab = ({ missedData, loading, onRefresh }) => {
  const [selectedObs, setSelectedObs] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const missed = missedData?.observations || [];

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Blind Spots — Key for S6.5 ML</p>
              <p className="text-xs text-amber-600 mt-1">
                These are cases where sentiment was NEUTRAL but price moved STRONGLY. 
                This is where future ML model will learn to improve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missed List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">MISS_ALERT Observations</CardTitle>
              <CardDescription>Total: {missed.length}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {missed.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No MISS_ALERT observations yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {missed.map((obs) => (
                  <div
                    key={obs.observation_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedObs?.observation_id === obs.observation_id
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => setSelectedObs(obs)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{obs.asset}</Badge>
                        <Badge variant="outline" className="text-xs bg-slate-100">{obs.horizon}</Badge>
                      </div>
                      <DirectionIcon direction={obs.direction} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SentimentBadge label={obs.sentiment_label} />
                        <span className="text-xs text-slate-500">conf: {(obs.sentiment_confidence * 100).toFixed(0)}%</span>
                      </div>
                      <span className={`text-sm font-bold ${obs.delta_pct < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {obs.delta_pct > 0 ? '+' : ''}{obs.delta_pct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedObs ? (
              <div className="text-center py-12 text-slate-500">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a signal to see details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700">MISS_ALERT</Badge>
                    <span className="text-sm font-mono text-slate-500">{selectedObs.observation_id?.slice(-12)}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedObs.timestamp_t0).toLocaleString()}
                  </span>
                </div>

                {/* Sentiment */}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Sentiment Analysis</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400">Label</span>
                      <p className="font-medium">{selectedObs.sentiment_label}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Confidence</span>
                      <p className="font-medium">{(selectedObs.sentiment_confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Price Reaction */}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Price Reaction</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-slate-400">Direction</span>
                      <div className="flex items-center gap-1">
                        <DirectionIcon direction={selectedObs.direction} />
                        <span className="font-medium">{selectedObs.direction}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Magnitude</span>
                      <p className="font-medium">{selectedObs.magnitude}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Delta</span>
                      <p className={`font-bold ${selectedObs.delta_pct < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedObs.delta_pct > 0 ? '+' : ''}{selectedObs.delta_pct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decision Reasons */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-600 mb-2">Why MISS_ALERT?</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedObs.decision?.reasons?.map((reason, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-white">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Market Context */}
                {selectedObs.market && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">Market Context (t0)</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Price t0: <span className="font-medium">${selectedObs.market.price_t0?.toFixed(2)}</span></div>
                      <div>Δ15m before: <span className="font-medium">{selectedObs.market.delta_15m_before?.toFixed(2) || 'N/A'}%</span></div>
                      <div>Δ1h before: <span className="font-medium">{selectedObs.market.delta_1h_before?.toFixed(2) || 'N/A'}%</span></div>
                      <div>Volatility 1h: <span className="font-medium">{selectedObs.market.volatility_1h?.toFixed(2) || 'N/A'}%</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// Tab 4: Metrics & Buckets
// ============================================================

const MetricsTab = ({ metrics, horizonStability, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const byConfBuckets = metrics?.byConfidenceBucket || [];
  const horizons = horizonStability?.horizons || [];

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Preparation for S6.5 ML</p>
              <div className="text-xs text-blue-600 mt-2 space-y-1">
                <p>• <strong>Confidence ≥ 0.7</strong> → higher usable rate</p>
                <p>• <strong>NEUTRAL sentiment</strong> → higher miss rate</p>
                <p>• <strong>1h–4h horizons</strong> → more stable signals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence × Usable Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Confidence → Usable Rate
          </CardTitle>
          <CardDescription>Where confidence actually works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byConfBuckets.map((bucket) => (
              <div key={bucket.bucket} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{bucket.bucket}</span>
                  <span className="text-sm text-slate-500">n={bucket.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Usable Rate</span>
                      <span className="text-xs font-medium">{bucket.usableRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={bucket.usableRate} 
                      className={`h-2 ${bucket.usableRate > 30 ? '[&>div]:bg-green-500' : '[&>div]:bg-slate-400'}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">TP Rate</span>
                      <span className="text-xs font-medium">{bucket.tpRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={bucket.tpRate} 
                      className={`h-2 ${bucket.tpRate > 30 ? '[&>div]:bg-green-500' : '[&>div]:bg-slate-400'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Horizon Stability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horizon Stability
          </CardTitle>
          <CardDescription>Signal quality across time horizons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Horizon</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-right py-2 px-2">Usable</th>
                  <th className="text-right py-2 px-2">Usable %</th>
                  <th className="text-right py-2 px-2">TP %</th>
                  <th className="text-right py-2 px-2">Miss %</th>
                </tr>
              </thead>
              <tbody>
                {horizons.map((h) => (
                  <tr key={h.horizon} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium">{h.horizon}</td>
                    <td className="text-right py-2 px-2">{h.total}</td>
                    <td className="text-right py-2 px-2">{h.usable}</td>
                    <td className="text-right py-2 px-2">
                      <span className={h.usableRate > 20 ? 'text-green-600 font-medium' : ''}>
                        {h.usableRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">
                      <span className={h.tpRate > 20 ? 'text-green-600 font-medium' : ''}>
                        {h.tpRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">
                      <span className={h.missRate > 10 ? 'text-amber-600 font-medium' : ''}>
                        {h.missRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <p className="text-sm">
                <strong>High confidence works:</strong> Signals with conf ≥ 0.7 show higher usable rates
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
              <p className="text-sm">
                <strong>NEUTRAL is blind:</strong> Most MISS_ALERT cases come from neutral sentiment + strong moves
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <p className="text-sm">
                <strong>Calibration gap:</strong> System overestimates confidence — actual TP rate is lower than expected
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <p className="text-sm">
                <strong>Next step:</strong> S6.5 ML model to predict USE vs MISS from these patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Tab 5: ML Model (S6.5)
// ============================================================

const MLModelTab = ({ mlStatus, mlComparison, loading, onTrain, onRefresh }) => {
  const [training, setTraining] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const trainingStats = mlStatus?.trainingStats || {};
  const metrics = mlStatus?.metrics;
  const featureImportance = mlStatus?.feature_importance || [];
  const rulesV0 = mlComparison?.rulesV0;
  const mlV1 = mlComparison?.mlV1;
  const improvement = mlComparison?.improvement;

  const handleTrain = async () => {
    setTraining(true);
    await onTrain();
    setTraining(false);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={trainingStats.ready ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cpu className={`w-5 h-5 mt-0.5 ${trainingStats.ready ? 'text-green-600' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${trainingStats.ready ? 'text-green-800' : 'text-amber-800'}`}>
                {trainingStats.ready 
                  ? 'Ready for ML Training' 
                  : `Need ${trainingStats.minRequired - trainingStats.total} more observations`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress 
                  value={Math.min(100, (trainingStats.total / trainingStats.minRequired) * 100)} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-slate-600">
                  {trainingStats.total} / {trainingStats.minRequired}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Data Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Training Data
            </CardTitle>
            <CardDescription>Distribution of training samples by class</CardDescription>
          </div>
          <Button 
            variant={trainingStats.ready ? 'default' : 'outline'} 
            size="sm" 
            onClick={handleTrain}
            disabled={training || !trainingStats.ready}
          >
            {training ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Train Model
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{trainingStats.byClass?.USE || 0}</p>
              <p className="text-xs text-slate-500">USE</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-600">{trainingStats.byClass?.IGNORE || 0}</p>
              <p className="text-xs text-slate-500">IGNORE</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">{trainingStats.byClass?.MISS_ALERT || 0}</p>
              <p className="text-xs text-slate-500">MISS_ALERT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Metrics (if trained) */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Model Performance
            </CardTitle>
            <CardDescription>ObservationModel v1 metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Accuracy</p>
                <p className="text-xl font-bold">{(metrics.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Precision (USE)</p>
                <p className="text-xl font-bold">{(metrics.precision_use * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Recall (MISS)</p>
                <p className="text-xl font-bold">{(metrics.recall_miss * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">F1 Score</p>
                <p className="text-xl font-bold">{(metrics.f1_score * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules v0 vs ML v1 Comparison */}
      {rulesV0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Rules v0 vs ML v1 Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Metric</th>
                    <th className="text-right py-2 px-2">Rules v0</th>
                    <th className="text-right py-2 px-2">ML v1</th>
                    <th className="text-right py-2 px-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-2">Accuracy</td>
                    <td className="text-right py-2 px-2">{(rulesV0.accuracy * 100).toFixed(1)}%</td>
                    <td className="text-right py-2 px-2">{mlV1 ? `${(mlV1.accuracy * 100).toFixed(1)}%` : '—'}</td>
                    <td className={`text-right py-2 px-2 font-medium ${improvement?.accuracy_delta > 0 ? 'text-green-600' : improvement?.accuracy_delta < 0 ? 'text-red-600' : ''}`}>
                      {improvement ? `${improvement.accuracy_delta > 0 ? '+' : ''}${(improvement.accuracy_delta * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">Precision (USE)</td>
                    <td className="text-right py-2 px-2">{(rulesV0.precision_use * 100).toFixed(1)}%</td>
                    <td className="text-right py-2 px-2">{mlV1 ? `${(mlV1.precision_use * 100).toFixed(1)}%` : '—'}</td>
                    <td className={`text-right py-2 px-2 font-medium ${improvement?.precision_delta > 0 ? 'text-green-600' : improvement?.precision_delta < 0 ? 'text-red-600' : ''}`}>
                      {improvement ? `${improvement.precision_delta > 0 ? '+' : ''}${(improvement.precision_delta * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">Recall (MISS)</td>
                    <td className="text-right py-2 px-2">{(rulesV0.recall_miss * 100).toFixed(1)}%</td>
                    <td className="text-right py-2 px-2">{mlV1 ? `${(mlV1.recall_miss * 100).toFixed(1)}%` : '—'}</td>
                    <td className={`text-right py-2 px-2 font-medium ${improvement?.recall_delta > 0 ? 'text-green-600' : improvement?.recall_delta < 0 ? 'text-red-600' : ''}`}>
                      {improvement ? `${improvement.recall_delta > 0 ? '+' : ''}${(improvement.recall_delta * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Importance */}
      {featureImportance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Feature Importance
            </CardTitle>
            <CardDescription>Top features for prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureImportance.slice(0, 8).map((f, i) => (
                <div key={f.feature} className="flex items-center gap-4">
                  <span className="w-6 text-sm text-slate-400">#{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{f.feature.replace(/_/g, ' ')}</span>
                  <div className="w-32">
                    <Progress value={Math.min(100, f.weight * 100)} className="h-2" />
                  </div>
                  <span className="w-12 text-right text-xs text-slate-500">{f.weight.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Model Yet */}
      {!metrics && !mlStatus?.hasModel && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <p className="text-sm font-medium text-blue-800">No Model Trained Yet</p>
            <p className="text-xs text-blue-600 mt-1">
              {trainingStats.ready 
                ? 'Click "Train Model" to train ObservationModel v1'
                : `Collect ${trainingStats.minRequired - trainingStats.total} more observations to enable training`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function AdminObservationPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [horizonStability, setHorizonStability] = useState(null);
  const [rulesStats, setRulesStats] = useState(null);
  const [missedData, setMissedData] = useState(null);
  
  // S6.5 ML states
  const [mlStatus, setMlStatus] = useState(null);
  const [mlComparison, setMlComparison] = useState(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        statsRes,
        metricsRes,
        calibrationRes,
        horizonRes,
        rulesRes,
        missedRes,
        mlStatusRes,
        mlCompareRes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/v6/observation/stats`),
        fetch(`${API_URL}/api/v6/observation/metrics/summary`),
        fetch(`${API_URL}/api/v6/observation/metrics/calibration`),
        fetch(`${API_URL}/api/v6/observation/metrics/horizon-stability`),
        fetch(`${API_URL}/api/v6/observation/rules/stats`),
        fetch(`${API_URL}/api/v6/observation/rules/missed?limit=50`),
        fetch(`${API_URL}/api/v6/observation/ml/status`),
        fetch(`${API_URL}/api/v6/observation/ml/compare`),
      ]);

      const [statsData, metricsData, calibrationData, horizonData, rulesData, missedDataRes, mlStatusData, mlCompareData] = await Promise.all([
        statsRes.json(),
        metricsRes.json(),
        calibrationRes.json(),
        horizonRes.json(),
        rulesRes.json(),
        missedRes.json(),
        mlStatusRes.json(),
        mlCompareRes.json(),
      ]);

      if (statsData.ok) setStats(statsData.data);
      if (metricsData.ok) setMetrics(metricsData.data);
      if (calibrationData.ok) setCalibration(calibrationData.data?.calibration);
      if (horizonData.ok) setHorizonStability(horizonData.data);
      if (rulesData.ok) setRulesStats(rulesData.data);
      if (missedDataRes.ok) setMissedData(missedDataRes.data);
      if (mlStatusData.ok) setMlStatus(mlStatusData.data);
      if (mlCompareData.ok) setMlComparison(mlCompareData.data);
      
    } catch (err) {
      console.error('Failed to fetch observation data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Train ML model
  const handleTrainModel = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v6/observation/ml/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      
      if (data.ok) {
        // Refresh data after training
        await fetchData();
      }
      
      return data;
    } catch (err) {
      console.error('Training failed:', err);
      return { ok: false, error: err.message };
    }
  }, [fetchData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, navigate, fetchData]);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Observation Model
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              S6.4+S6.5 — Observation rules and ML model
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>Error loading data: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {!loading && stats && (
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Total: <strong className="text-slate-700">{stats.total}</strong> observations</span>
            <span>•</span>
            <span>Schema: <strong className="text-slate-700">S6.3-v1</strong></span>
            <span>•</span>
            <span>Decision version: <strong className="text-slate-700">v0</strong></span>
            {mlStatus?.hasModel && (
              <>
                <span>•</span>
                <span className="text-purple-600">ML: <strong>trained</strong></span>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="missed" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Missed
              {missedData?.count > 0 && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
                  {missedData.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="ml" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              ML
              {mlStatus?.trainingStats?.ready && !mlStatus?.hasModel && (
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                  Ready
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              stats={stats}
              metrics={metrics}
              calibration={calibration}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <RulesTab 
              rulesStats={rulesStats}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="missed" className="mt-6">
            <MissedExplorerTab 
              missedData={missedData}
              loading={loading}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <MetricsTab 
              metrics={metrics}
              horizonStability={horizonStability}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="ml" className="mt-6">
            <MLModelTab 
              mlStatus={mlStatus}
              mlComparison={mlComparison}
              loading={loading}
              onTrain={handleTrainModel}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
