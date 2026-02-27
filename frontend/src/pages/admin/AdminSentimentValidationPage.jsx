/**
 * Admin Sentiment Validation Page
 * ================================
 * 
 * BLOCK 7: Early Validation Layer UI
 * 
 * Pure statistical validation dashboard — NO ML.
 * Answers: "Does bias predict anything or is it noise?"
 * 
 * Three validation layers:
 * 1. Dataset Health — samples, hit rate, last tick
 * 2. Correlation Monitor — per-horizon correlation with color indicators
 * 3. Bias Strength Table — segmentation by bias strength
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Database,
  RefreshCw,
  Loader2,
  BarChart3,
  Percent,
  Target,
  Layers,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// Helper Components
// ============================================================

const CorrelationBadge = ({ value, indicator }) => {
  const styles = {
    gray: 'bg-gray-100 text-gray-600 border-gray-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    green: 'bg-green-100 text-green-700 border-green-300',
  };
  
  return (
    <Badge className={`${styles[indicator] || styles.gray} border font-mono`}>
      {value.toFixed(3)}
    </Badge>
  );
};

const EdgeBadge = ({ strength }) => {
  const styles = {
    NONE: 'bg-gray-100 text-gray-600 border-gray-300',
    WEAK: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    MODERATE: 'bg-blue-100 text-blue-700 border-blue-300',
    STRONG: 'bg-green-100 text-green-700 border-green-300',
  };
  
  const icons = {
    NONE: <Minus className="w-3 h-3 mr-1" />,
    WEAK: <AlertTriangle className="w-3 h-3 mr-1" />,
    MODERATE: <TrendingUp className="w-3 h-3 mr-1" />,
    STRONG: <CheckCircle className="w-3 h-3 mr-1" />,
  };
  
  return (
    <Badge className={`${styles[strength] || styles.NONE} border`}>
      {icons[strength]}
      {strength}
    </Badge>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">{title}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-gray-800">{value}</span>
      {trend && (
        <span className={`text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3 inline" /> : null}
          {Math.abs(trend).toFixed(2)}%
        </span>
      )}
    </div>
    {subtitle && <span className="text-xs text-gray-400 mt-1 block">{subtitle}</span>}
  </div>
);

// ============================================================
// Main Component
// ============================================================

export default function AdminSentimentValidationPage() {
  const { isAuthenticated } = useAdminAuth();
  
  const [summary, setSummary] = useState(null);
  const [correlationData, setCorrelationData] = useState([]);
  const [strengthData, setStrengthData] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState('7D');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // ============================================================
  // Data Fetching
  // ============================================================
  
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sentiment-ml/validation/summary`);
      const data = await res.json();
      if (data.ok) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('[Validation] Failed to fetch summary:', err);
    }
  }, []);
  
  const fetchCorrelation = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sentiment-ml/validation/correlation`);
      const data = await res.json();
      if (data.ok) {
        setCorrelationData(data.data);
      }
    } catch (err) {
      console.error('[Validation] Failed to fetch correlation:', err);
    }
  }, []);
  
  const fetchStrength = useCallback(async (horizon) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sentiment-ml/validation/strength?horizon=${horizon}`);
      const data = await res.json();
      if (data.ok) {
        setStrengthData(data);
      }
    } catch (err) {
      console.error('[Validation] Failed to fetch strength:', err);
    }
  }, []);
  
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchCorrelation(),
      fetchStrength(selectedHorizon),
    ]);
    setRefreshing(false);
  }, [fetchSummary, fetchCorrelation, fetchStrength, selectedHorizon]);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchCorrelation(),
        fetchStrength(selectedHorizon),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchSummary, fetchCorrelation, fetchStrength, selectedHorizon]);
  
  useEffect(() => {
    fetchStrength(selectedHorizon);
  }, [selectedHorizon, fetchStrength]);
  
  // ============================================================
  // Render
  // ============================================================
  
  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">
          Please authenticate to access this page.
        </div>
      </AdminLayout>
    );
  }
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading validation data...
        </div>
      </AdminLayout>
    );
  }
  
  const overall = summary?.overall || {};
  const byHorizon = summary?.byHorizon || [];
  
  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Sentiment Validation
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              BLOCK 7 — Early validation layer (statistical, no ML)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
        
        {/* Overall Summary Card */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-800">
                  Validation Summary
                </CardTitle>
                <CardDescription>
                  Does bias predict forward returns?
                </CardDescription>
              </div>
              <EdgeBadge strength={overall.edgeStrength || 'NONE'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                title="Total Samples"
                value={overall.totalSamples || 0}
                subtitle={overall.totalSamples < 30 ? 'Need 30+ for reliable validation' : 'Sufficient data'}
                icon={Database}
              />
              <StatCard
                title="Avg Hit Rate"
                value={`${((overall.avgHitRate || 0) * 100).toFixed(1)}%`}
                subtitle={overall.avgHitRate > 0.55 ? 'Above threshold' : 'Below 55% threshold'}
                icon={Target}
              />
              <StatCard
                title="Avg Correlation"
                value={(overall.avgCorrelation || 0).toFixed(3)}
                subtitle={overall.avgCorrelation > 0.07 ? 'Signal detected' : 'Weak signal'}
                icon={Activity}
              />
              <StatCard
                title="Edge Detected"
                value={overall.hasEdge ? 'YES' : 'NO'}
                subtitle={overall.edgeStrength || 'NONE'}
                icon={TrendingUp}
              />
            </div>
            
            {/* Recommendation */}
            {summary?.recommendation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Recommendation</div>
                    <div className="text-blue-700 text-sm mt-1">{summary.recommendation}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Correlation Monitor */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Correlation Monitor
            </CardTitle>
            <CardDescription>
              Pearson correlation between bias and forward return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {correlationData.map((item) => (
                <div 
                  key={item.horizon}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-gray-800">{item.horizon}</span>
                    <CorrelationBadge value={item.correlation} indicator={item.indicator} />
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.sampleCount} samples
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        item.indicator === 'green' ? 'bg-green-500' :
                        item.indicator === 'yellow' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(Math.abs(item.correlation) * 500, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.indicator === 'green' ? '≥0.10 Good signal' :
                     item.indicator === 'yellow' ? '0.05-0.10 Weak signal' :
                     '<0.05 No signal'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Bias Strength Segmentation */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-500" />
                  Bias Strength Segmentation
                </CardTitle>
                <CardDescription>
                  Does stronger bias = better returns?
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {['24H', '7D', '30D'].map((h) => (
                  <Button
                    key={h}
                    variant={selectedHorizon === h ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedHorizon(h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {strengthData?.sampleCount === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No samples yet for {selectedHorizon}. Data will appear after window matures.
              </div>
            ) : (
              <>
                {/* Gradient indicator */}
                <div className={`mb-4 p-3 rounded-lg ${
                  strengthData?.hasGradient 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {strengthData?.hasGradient ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      strengthData?.hasGradient ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {strengthData?.hasGradient 
                        ? `Gradient detected: +${strengthData.gradientStrength} hit rate improvement`
                        : 'No clear gradient (strong bias ≠ better returns)'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-sm font-medium text-gray-500 py-2 px-3">Bias Range</th>
                        <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">Samples</th>
                        <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">Hit Rate</th>
                        <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">Avg Return</th>
                        <th className="text-left text-sm font-medium text-gray-500 py-2 px-3">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(strengthData?.buckets || []).map((bucket, idx) => (
                        <tr key={bucket.range} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <span className="font-mono text-sm text-gray-700">{bucket.range}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm text-gray-600">{bucket.samples}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-sm font-medium ${
                              bucket.hitRate > 0.55 ? 'text-green-600' :
                              bucket.hitRate > 0.50 ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {(bucket.hitRate * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-sm font-medium ${
                              bucket.avgReturn > 0 ? 'text-green-600' :
                              bucket.avgReturn < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {bucket.avgReturn > 0 ? '+' : ''}{(bucket.avgReturn * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  bucket.hitRate > 0.55 ? 'bg-green-500' :
                                  bucket.hitRate > 0.50 ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${bucket.hitRate * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Per-Horizon Breakdown */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-800">
              Per-Horizon Breakdown
            </CardTitle>
            <CardDescription>
              Detailed stats for each time window
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="24H" className="w-full">
              <TabsList className="bg-gray-100 border border-gray-200">
                <TabsTrigger value="24H" className="data-[state=active]:bg-white">24H</TabsTrigger>
                <TabsTrigger value="7D" className="data-[state=active]:bg-white">7D</TabsTrigger>
                <TabsTrigger value="30D" className="data-[state=active]:bg-white">30D</TabsTrigger>
              </TabsList>
              
              {byHorizon.map((stats) => (
                <TabsContent key={stats.horizon} value={stats.horizon} className="mt-4">
                  {stats.sampleCount === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No samples yet for {stats.horizon}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Samples</div>
                        <div className="text-2xl font-semibold text-gray-800">{stats.sampleCount}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Hit Rate</div>
                        <div className={`text-2xl font-semibold ${
                          stats.hitRate > 0.55 ? 'text-green-600' : 'text-gray-800'
                        }`}>
                          {(stats.hitRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Correlation</div>
                        <div className={`text-2xl font-semibold ${
                          stats.correlation > 0.10 ? 'text-green-600' :
                          stats.correlation > 0.05 ? 'text-yellow-600' :
                          'text-gray-800'
                        }`}>
                          {stats.correlation.toFixed(3)}
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Avg Forward Return</div>
                        <div className={`text-2xl font-semibold ${
                          stats.avgForwardReturn > 0 ? 'text-green-600' :
                          stats.avgForwardReturn < 0 ? 'text-red-600' :
                          'text-gray-800'
                        }`}>
                          {stats.avgForwardReturn > 0 ? '+' : ''}{(stats.avgForwardReturn * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Avg Return if LONG</div>
                        <div className={`text-2xl font-semibold ${
                          stats.avgReturnIfLong > 0 ? 'text-green-600' :
                          stats.avgReturnIfLong < 0 ? 'text-red-600' :
                          'text-gray-800'
                        }`}>
                          {stats.avgReturnIfLong > 0 ? '+' : ''}{(stats.avgReturnIfLong * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Avg Return if SHORT</div>
                        <div className={`text-2xl font-semibold ${
                          stats.avgReturnIfShort < 0 ? 'text-green-600' :
                          stats.avgReturnIfShort > 0 ? 'text-red-600' :
                          'text-gray-800'
                        }`}>
                          {stats.avgReturnIfShort > 0 ? '+' : ''}{(stats.avgReturnIfShort * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
