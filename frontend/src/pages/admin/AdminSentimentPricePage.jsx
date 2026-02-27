/**
 * S5.4 — ADMIN UI: Sentiment × Price
 * ===================================
 * 
 * Read-only visualization of sentiment-price correlations.
 * NO ML, NO decisions, NO optimizations — pure data mirror.
 * 
 * BLOCKS:
 * 1. Overview — Signal → Price Health
 * 2. Horizon Comparison — Where sentiment "works"
 * 3. Signal Explorer — Real cases with filters
 * 4. Confidence × Outcome Matrix
 * 5. Missed Opportunity View
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const OutcomeBadge = ({ outcome }) => {
  const styles = {
    TRUE_POSITIVE: 'bg-green-100 text-green-700 border-green-300',
    TRUE_NEGATIVE: 'bg-green-100 text-green-700 border-green-300',
    FALSE_POSITIVE: 'bg-red-100 text-red-700 border-red-300',
    FALSE_NEGATIVE: 'bg-red-100 text-red-700 border-red-300',
    MISSED_OPPORTUNITY: 'bg-amber-100 text-amber-700 border-amber-300',
    NO_SIGNAL: 'bg-slate-100 text-slate-600 border-slate-300',
    PENDING: 'bg-blue-100 text-blue-600 border-blue-300',
  };
  
  const icons = {
    TRUE_POSITIVE: <CheckCircle className="w-3 h-3 mr-1" />,
    TRUE_NEGATIVE: <CheckCircle className="w-3 h-3 mr-1" />,
    FALSE_POSITIVE: <XCircle className="w-3 h-3 mr-1" />,
    FALSE_NEGATIVE: <XCircle className="w-3 h-3 mr-1" />,
    MISSED_OPPORTUNITY: <AlertTriangle className="w-3 h-3 mr-1" />,
    NO_SIGNAL: <Minus className="w-3 h-3 mr-1" />,
    PENDING: <Clock className="w-3 h-3 mr-1" />,
  };
  
  return (
    <Badge className={`${styles[outcome] || styles.PENDING} border text-xs`}>
      {icons[outcome]}
      {outcome?.replace(/_/g, ' ')}
    </Badge>
  );
};

const SentimentBadge = ({ label }) => {
  const colors = {
    POSITIVE: 'bg-green-100 text-green-700 border-green-300',
    NEUTRAL: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    NEGATIVE: 'bg-red-100 text-red-700 border-red-300',
  };
  return <Badge className={`${colors[label] || 'bg-slate-100'} border text-xs`}>{label}</Badge>;
};

const DirectionBadge = ({ direction, delta }) => {
  const styles = {
    UP: 'text-green-600',
    DOWN: 'text-red-600',
    FLAT: 'text-slate-500',
  };
  const icons = {
    UP: <TrendingUp className="w-4 h-4" />,
    DOWN: <TrendingDown className="w-4 h-4" />,
    FLAT: <Minus className="w-4 h-4" />,
  };
  return (
    <span className={`flex items-center gap-1 font-medium ${styles[direction]}`}>
      {icons[direction]}
      {delta !== undefined && `${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`}
    </span>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };
  
  return (
    <Card className={`${colors[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-70">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
          </div>
          {Icon && <Icon className="w-8 h-8 opacity-50" />}
        </div>
        {trend !== undefined && (
          <div className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function AdminSentimentPricePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [outcomeStats, setOutcomeStats] = useState(null);
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState('1h');
  
  // Filters
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  
  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, outcomeRes, signalsRes] = await Promise.all([
        fetch(`${API_URL}/api/v5/price-layer/stats`),
        fetch(`${API_URL}/api/v5/price-layer/outcomes/stats`),
        fetch(`${API_URL}/api/v5/price-layer/signals?limit=100`),
      ]);
      
      const statsData = await statsRes.json();
      const outcomeData = await outcomeRes.json();
      const signalsData = await signalsRes.json();
      
      if (statsData.ok) setStats(statsData.data);
      if (outcomeData.ok) setOutcomeStats(outcomeData.data);
      if (signalsData.ok) setSignals(signalsData.data.signals || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Filtered signals
  const filteredSignals = signals.filter(s => {
    if (filterAsset !== 'all' && s.asset !== filterAsset) return false;
    if (filterSentiment !== 'all' && s.sentiment?.label !== filterSentiment) return false;
    if (filterOutcome !== 'all') {
      const outcome = s.reactions?.find(r => r.horizon === selectedHorizon);
      // For outcome filter, check if any reaction matches
      const hasOutcome = s.reactions?.some(r => {
        // Map reaction to outcome
        const label = s.sentiment?.label;
        const dir = r.direction;
        if (label === 'POSITIVE' && dir === 'UP') return filterOutcome === 'TRUE_POSITIVE';
        if (label === 'POSITIVE' && dir !== 'UP') return filterOutcome === 'FALSE_POSITIVE';
        if (label === 'NEGATIVE' && dir === 'DOWN') return filterOutcome === 'TRUE_NEGATIVE';
        if (label === 'NEGATIVE' && dir !== 'DOWN') return filterOutcome === 'FALSE_NEGATIVE';
        if (label === 'NEUTRAL' && r.magnitude === 'STRONG') return filterOutcome === 'MISSED_OPPORTUNITY';
        if (label === 'NEUTRAL') return filterOutcome === 'NO_SIGNAL';
        return false;
      });
      if (!hasOutcome) return false;
    }
    return true;
  });
  
  // Compute horizon stats
  const horizonStats = ['5m', '15m', '1h', '4h', '24h'].map(h => {
    const withHorizon = signals.filter(s => s.reactions?.some(r => r.horizon === h));
    let tp = 0, fp = 0, tn = 0, fn = 0, missed = 0, noSignal = 0;
    let totalDelta = 0;
    
    withHorizon.forEach(s => {
      const r = s.reactions?.find(r => r.horizon === h);
      if (!r) return;
      
      const label = s.sentiment?.label;
      const dir = r.direction;
      const mag = r.magnitude;
      
      if (label === 'POSITIVE' && dir === 'UP') tp++;
      else if (label === 'POSITIVE') fp++;
      else if (label === 'NEGATIVE' && dir === 'DOWN') tn++;
      else if (label === 'NEGATIVE') fn++;
      else if (label === 'NEUTRAL' && mag === 'STRONG') missed++;
      else noSignal++;
      
      if (label === 'POSITIVE' && dir === 'UP') totalDelta += r.delta_pct;
    });
    
    const total = tp + fp + tn + fn + missed + noSignal;
    const correct = tp + tn + noSignal;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgDelta = tp > 0 ? totalDelta / tp : 0;
    
    return { horizon: h, tp, fp, tn, fn, missed, noSignal, total, accuracy, avgDelta };
  });
  
  // Confidence buckets
  const confidenceBuckets = [
    { label: '0.9 - 1.0', min: 0.9, max: 1.0 },
    { label: '0.7 - 0.9', min: 0.7, max: 0.9 },
    { label: '0.5 - 0.7', min: 0.5, max: 0.7 },
    { label: '< 0.5', min: 0, max: 0.5 },
  ].map(bucket => {
    const inBucket = signals.filter(s => {
      const conf = s.sentiment?.confidence || 0;
      return conf >= bucket.min && conf < bucket.max;
    });
    
    let tp = 0, fp = 0, fn = 0, total = 0;
    inBucket.forEach(s => {
      const r = s.reactions?.find(r => r.horizon === selectedHorizon);
      if (!r) return;
      total++;
      
      const label = s.sentiment?.label;
      const dir = r.direction;
      
      if (label === 'POSITIVE' && dir === 'UP') tp++;
      else if (label === 'POSITIVE') fp++;
      else if (label === 'NEGATIVE' && dir !== 'DOWN') fn++;
    });
    
    return { ...bucket, tp, fp, fn, total, tpRate: total > 0 ? (tp / total) * 100 : 0 };
  });
  
  // Missed opportunities
  const missedOpportunities = signals.filter(s => {
    const r = s.reactions?.find(r => r.horizon === selectedHorizon);
    return s.sentiment?.label === 'NEUTRAL' && r?.magnitude === 'STRONG';
  });
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sentiment × Price</h1>
            <p className="text-sm text-slate-500 mt-1">
              S5.4 — Read-only correlation analysis. No ML, no decisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              v1.6.0 FROZEN
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Horizon Switcher */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">Horizon:</span>
          <div className="flex gap-1">
            {['5m', '15m', '1h', '4h', '24h'].map(h => (
              <Button
                key={h}
                variant={selectedHorizon === h ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedHorizon(h)}
                className={selectedHorizon === h ? 'bg-white' : ''}
              >
                {h}
              </Button>
            ))}
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="horizons" className="data-[state=active]:bg-white">
              <Clock className="w-4 h-4 mr-2" />
              Horizons
            </TabsTrigger>
            <TabsTrigger value="explorer" className="data-[state=active]:bg-white">
              <Search className="w-4 h-4 mr-2" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="confidence" className="data-[state=active]:bg-white">
              <Target className="w-4 h-4 mr-2" />
              Confidence
            </TabsTrigger>
            <TabsTrigger value="missed" className="data-[state=active]:bg-white">
              <AlertCircle className="w-4 h-4 mr-2" />
              Missed
            </TabsTrigger>
          </TabsList>
          
          {/* ============================================================ */}
          {/* TAB 1: OVERVIEW */}
          {/* ============================================================ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Signals"
                value={stats?.totalSignals || 0}
                icon={Zap}
                color="blue"
              />
              <StatCard
                title="With Outcomes"
                value={stats?.totalOutcomes || 0}
                subtitle={`${((stats?.totalOutcomes / stats?.totalSignals) * 100 || 0).toFixed(0)}% labeled`}
                icon={BarChart3}
                color="slate"
              />
              <StatCard
                title="Signal Accuracy"
                value={`${((stats?.signalAccuracy || 0) * 100).toFixed(1)}%`}
                subtitle="TP + TN + NO_SIGNAL"
                icon={Target}
                color={stats?.signalAccuracy > 0.5 ? 'green' : 'amber'}
              />
              <StatCard
                title="Completeness"
                value={`${((stats?.completenessRate || 0) * 100).toFixed(0)}%`}
                subtitle="1h horizon coverage"
                icon={CheckCircle}
                color="blue"
              />
            </div>
            
            {/* Outcome Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outcome Distribution</CardTitle>
                <CardDescription>How sentiment signals perform against price</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { key: 'TRUE_POSITIVE', label: 'True Positive', color: 'green', icon: CheckCircle },
                    { key: 'TRUE_NEGATIVE', label: 'True Negative', color: 'green', icon: CheckCircle },
                    { key: 'FALSE_POSITIVE', label: 'False Positive', color: 'red', icon: XCircle },
                    { key: 'FALSE_NEGATIVE', label: 'False Negative', color: 'red', icon: XCircle },
                    { key: 'MISSED_OPPORTUNITY', label: 'Missed', color: 'amber', icon: AlertTriangle },
                    { key: 'NO_SIGNAL', label: 'No Signal', color: 'slate', icon: Minus },
                  ].map(({ key, label, color, icon: Icon }) => (
                    <div key={key} className={`p-4 rounded-lg bg-${color}-50 border border-${color}-200`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                      </div>
                      <p className={`text-2xl font-bold text-${color}-700`}>
                        {stats?.outcomesByLabel?.[key] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Asset & Sentiment Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.signalsByAsset || {}).map(([asset, count]) => (
                      <div key={asset} className="flex items-center justify-between">
                        <span className="font-medium">{asset}</span>
                        <div className="flex items-center gap-3">
                          <Progress value={(count / stats?.totalSignals) * 100} className="w-24 h-2" />
                          <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {Object.keys(stats?.signalsByAsset || {}).length === 0 && (
                      <p className="text-sm text-slate-400">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(label => {
                      const count = stats?.signalsBySentiment?.[label] || 0;
                      const colors = {
                        POSITIVE: 'bg-green-500',
                        NEUTRAL: 'bg-yellow-500',
                        NEGATIVE: 'bg-red-500',
                      };
                      return (
                        <div key={label} className="flex items-center justify-between">
                          <SentimentBadge label={label} />
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colors[label]} rounded-full`}
                                style={{ width: `${(count / stats?.totalSignals) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* ============================================================ */}
          {/* TAB 2: HORIZON COMPARISON */}
          {/* ============================================================ */}
          <TabsContent value="horizons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horizon Comparison</CardTitle>
                <CardDescription>
                  Where does sentiment have predictive power?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Horizon</th>
                        <th className="text-center py-3 px-4 font-medium text-green-600">TP</th>
                        <th className="text-center py-3 px-4 font-medium text-red-600">FP</th>
                        <th className="text-center py-3 px-4 font-medium text-green-600">TN</th>
                        <th className="text-center py-3 px-4 font-medium text-red-600">FN</th>
                        <th className="text-center py-3 px-4 font-medium text-amber-600">Missed</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">No Signal</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Total</th>
                        <th className="text-center py-3 px-4 font-medium text-blue-600">Accuracy</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Avg Δ%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horizonStats.map(h => (
                        <tr 
                          key={h.horizon} 
                          className={`border-b hover:bg-slate-50 ${h.horizon === selectedHorizon ? 'bg-blue-50' : ''}`}
                        >
                          <td className="py-3 px-4 font-medium">{h.horizon}</td>
                          <td className="text-center py-3 px-4 text-green-600 font-medium">{h.tp}</td>
                          <td className="text-center py-3 px-4 text-red-600">{h.fp}</td>
                          <td className="text-center py-3 px-4 text-green-600 font-medium">{h.tn}</td>
                          <td className="text-center py-3 px-4 text-red-600">{h.fn}</td>
                          <td className="text-center py-3 px-4 text-amber-600">{h.missed}</td>
                          <td className="text-center py-3 px-4 text-slate-500">{h.noSignal}</td>
                          <td className="text-center py-3 px-4">{h.total}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-bold ${h.accuracy >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {h.accuracy.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-slate-600">
                            {h.avgDelta > 0 ? `+${h.avgDelta.toFixed(2)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {horizonStats.every(h => h.total === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No horizon data yet. Create signals and wait for price collection.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Insight Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">How to read this table</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• <strong>TP (True Positive):</strong> POSITIVE sentiment → price went UP</li>
                      <li>• <strong>FP (False Positive):</strong> POSITIVE sentiment → price went DOWN/FLAT</li>
                      <li>• <strong>TN (True Negative):</strong> NEGATIVE sentiment → price went DOWN</li>
                      <li>• <strong>FN (False Negative):</strong> NEGATIVE sentiment → price went UP/FLAT</li>
                      <li>• <strong>Missed:</strong> NEUTRAL sentiment → STRONG price movement (missed opportunity)</li>
                      <li>• <strong>Accuracy:</strong> (TP + TN + NoSignal) / Total</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ============================================================ */}
          {/* TAB 3: SIGNAL EXPLORER */}
          {/* ============================================================ */}
          <TabsContent value="explorer" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Filters:</span>
                  </div>
                  
                  <Select value={filterAsset} onValueChange={setFilterAsset}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="SOL">SOL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="POSITIVE">POSITIVE</SelectItem>
                      <SelectItem value="NEUTRAL">NEUTRAL</SelectItem>
                      <SelectItem value="NEGATIVE">NEGATIVE</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outcomes</SelectItem>
                      <SelectItem value="TRUE_POSITIVE">True Positive</SelectItem>
                      <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                      <SelectItem value="TRUE_NEGATIVE">True Negative</SelectItem>
                      <SelectItem value="FALSE_NEGATIVE">False Negative</SelectItem>
                      <SelectItem value="MISSED_OPPORTUNITY">Missed</SelectItem>
                      <SelectItem value="NO_SIGNAL">No Signal</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(filterAsset !== 'all' || filterSentiment !== 'all' || filterOutcome !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterAsset('all');
                        setFilterSentiment('all');
                        setFilterOutcome('all');
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  
                  <span className="text-sm text-slate-500 ml-auto">
                    {filteredSignals.length} signals
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Signals Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Text</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Asset</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Sentiment</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Conf</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Δ% ({selectedHorizon})</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Outcome</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSignals.slice(0, 50).map(signal => {
                        const reaction = signal.reactions?.find(r => r.horizon === selectedHorizon);
                        const outcome = getOutcomeLabel(signal.sentiment?.label, reaction?.direction, reaction?.magnitude);
                        
                        return (
                          <tr 
                            key={signal.signal_id} 
                            className="border-b hover:bg-slate-50 cursor-pointer"
                            onClick={() => setSelectedSignal(signal)}
                          >
                            <td className="py-3 px-4 max-w-xs truncate">
                              {signal.meta?.text || '-'}
                            </td>
                            <td className="text-center py-3 px-4 font-medium">{signal.asset}</td>
                            <td className="text-center py-3 px-4">
                              <SentimentBadge label={signal.sentiment?.label} />
                            </td>
                            <td className="text-center py-3 px-4">
                              {((signal.sentiment?.confidence || 0) * 100).toFixed(0)}%
                            </td>
                            <td className="text-center py-3 px-4">
                              {reaction ? (
                                <DirectionBadge direction={reaction.direction} delta={reaction.delta_pct} />
                              ) : (
                                <span className="text-slate-400">pending</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {reaction ? <OutcomeBadge outcome={outcome} /> : <OutcomeBadge outcome="PENDING" />}
                            </td>
                            <td className="text-center py-3 px-4">
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {filteredSignals.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No signals match your filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Signal Detail Panel */}
            {selectedSignal && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Signal Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSignal(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">Text</h4>
                      <p className="text-sm bg-white p-3 rounded border">
                        {selectedSignal.meta?.text || 'No text'}
                      </p>
                      
                      <h4 className="font-medium text-slate-700 mt-4 mb-2">Sentiment</h4>
                      <div className="flex items-center gap-3">
                        <SentimentBadge label={selectedSignal.sentiment?.label} />
                        <span className="text-sm text-slate-600">
                          Score: {selectedSignal.sentiment?.score?.toFixed(3)}
                        </span>
                        <span className="text-sm text-slate-600">
                          Confidence: {((selectedSignal.sentiment?.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">Price Reactions</h4>
                      <div className="space-y-2">
                        {selectedSignal.reactions?.length > 0 ? (
                          selectedSignal.reactions.map(r => (
                            <div key={r.horizon} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span className="font-medium">{r.horizon}</span>
                              <DirectionBadge direction={r.direction} delta={r.delta_pct} />
                              <Badge variant="outline">{r.magnitude}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">No reactions yet</p>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-slate-700 mt-4 mb-2">Meta</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>Asset: <strong>{selectedSignal.asset}</strong></p>
                        <p>Source: {selectedSignal.source}</p>
                        <p>Created: {new Date(selectedSignal.created_at).toLocaleString()}</p>
                        <p>Price t0: ${selectedSignal.price_t0?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* ============================================================ */}
          {/* TAB 4: CONFIDENCE × OUTCOME MATRIX */}
          {/* ============================================================ */}
          <TabsContent value="confidence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confidence × Outcome Matrix</CardTitle>
                <CardDescription>
                  Does higher confidence mean better outcomes? (Horizon: {selectedHorizon})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Confidence</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Signals</th>
                        <th className="text-center py-3 px-4 font-medium text-green-600">TP</th>
                        <th className="text-center py-3 px-4 font-medium text-red-600">FP</th>
                        <th className="text-center py-3 px-4 font-medium text-red-600">FN</th>
                        <th className="text-center py-3 px-4 font-medium text-blue-600">TP Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confidenceBuckets.map(bucket => (
                        <tr key={bucket.label} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{bucket.label}</td>
                          <td className="text-center py-3 px-4">{bucket.total}</td>
                          <td className="text-center py-3 px-4 text-green-600 font-medium">{bucket.tp}</td>
                          <td className="text-center py-3 px-4 text-red-600">{bucket.fp}</td>
                          <td className="text-center py-3 px-4 text-red-600">{bucket.fn}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full" 
                                  style={{ width: `${bucket.tpRate}%` }}
                                />
                              </div>
                              <span className="font-medium">{bucket.tpRate.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {confidenceBuckets.every(b => b.total === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No confidence data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Insight */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Key Question</p>
                    <p className="text-sm text-amber-700 mt-1">
                      If high confidence (0.9+) has similar TP rate to low confidence (&lt;0.5), 
                      then confidence metric needs recalibration in future versions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ============================================================ */}
          {/* TAB 5: MISSED OPPORTUNITIES */}
          {/* ============================================================ */}
          <TabsContent value="missed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Missed Opportunities
                </CardTitle>
                <CardDescription>
                  NEUTRAL sentiment + STRONG price movement (Horizon: {selectedHorizon})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {missedOpportunities.length > 0 ? (
                  <div className="space-y-3">
                    {missedOpportunities.map(signal => {
                      const reaction = signal.reactions?.find(r => r.horizon === selectedHorizon);
                      return (
                        <div 
                          key={signal.signal_id}
                          className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-slate-700 mb-2">
                                {signal.meta?.text || 'No text'}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-medium">{signal.asset}</span>
                                <SentimentBadge label={signal.sentiment?.label} />
                                <span className="text-slate-500">
                                  Conf: {((signal.sentiment?.confidence || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <DirectionBadge direction={reaction?.direction} delta={reaction?.delta_pct} />
                              <p className="text-xs text-slate-500 mt-1">
                                {reaction?.magnitude} movement
                              </p>
                            </div>
                          </div>
                          {signal.sentiment?.cnn_flags?.includes('cnn_positive_boost') && (
                            <Badge className="mt-2 bg-blue-100 text-blue-700 text-xs">
                              CNN Bullish detected
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No missed opportunities at {selectedHorizon} horizon</p>
                    <p className="text-xs mt-1">This is good — NEUTRAL signals stayed neutral</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Bridge to future */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">Future: S6 Observation Model</p>
                    <p className="text-sm text-slate-500 mt-1">
                      These missed opportunities will be the training ground for the Observation Model — 
                      finding patterns in when NEUTRAL actually means &quot;wait for confirmation&quot;.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Helper function to compute outcome label
function getOutcomeLabel(sentimentLabel, direction, magnitude) {
  if (!direction) return 'PENDING';
  
  if (sentimentLabel === 'POSITIVE') {
    return direction === 'UP' ? 'TRUE_POSITIVE' : 'FALSE_POSITIVE';
  }
  if (sentimentLabel === 'NEGATIVE') {
    return direction === 'DOWN' ? 'TRUE_NEGATIVE' : 'FALSE_NEGATIVE';
  }
  // NEUTRAL
  if (direction === 'FLAT' || magnitude === 'NONE') return 'NO_SIGNAL';
  if (magnitude === 'STRONG') return 'MISSED_OPPORTUNITY';
  return 'NO_SIGNAL';
}
