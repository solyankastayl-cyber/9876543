/**
 * S10.6I.8 — Indicators Explorer UI
 * 
 * Read-only visual dashboard for market state based on 32 indicators.
 * 
 * NO signals, NO predictions, NO recommendations.
 * Only: state, intensity, drivers.
 * 
 * Color = intensity, NOT direction.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw,
  Loader2,
  Activity,
  TrendingUp,
  Info,
  Clock,
  BarChart2,
  Layers,
  Target,
  Gauge,
  Database,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// ═══════════════════════════════════════════════════════════════
// CATEGORY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  PRICE_STRUCTURE: { 
    icon: '📐', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    label: 'Price Structure',
    description: 'Where price is relative to key levels'
  },
  MOMENTUM: { 
    icon: '⚡', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50',
    label: 'Momentum',
    description: 'Energy and speed of movement'
  },
  VOLUME: { 
    icon: '📊', 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    label: 'Volume / Participation',
    description: 'Market activity and interest'
  },
  ORDER_BOOK: { 
    icon: '📚', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50',
    label: 'Order Book / Depth',
    description: 'Limit order pressure and liquidity'
  },
  POSITIONING: { 
    icon: '🎯', 
    color: 'bg-red-500', 
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    label: 'Positioning / Derivatives',
    description: 'Open interest and crowd positioning'
  },
};

// ═══════════════════════════════════════════════════════════════
// AGGREGATE AXIS CONFIGURATION (for radar)
// ═══════════════════════════════════════════════════════════════

const AXIS_CONFIG = {
  structureState: { label: 'Structure', icon: '📐' },
  momentumState: { label: 'Momentum', icon: '⚡' },
  participation: { label: 'Participation', icon: '📊' },
  orderbookPressure: { label: 'Order Book', icon: '📚' },
  positionCrowding: { label: 'Crowding', icon: '🎯' },
  marketStress: { label: 'Stress', icon: '🔥' },
};

// ═══════════════════════════════════════════════════════════════
// INTENSITY COLOR SCALE
// ═══════════════════════════════════════════════════════════════

function getIntensityColor(value, isNormalized = true) {
  // Normalize to 0-1 range
  let normalized = isNormalized ? value : (value + 1) / 2;
  normalized = Math.max(0, Math.min(1, normalized));
  
  // Color scale: low (gray) -> medium (yellow) -> high (orange/red)
  if (normalized < 0.3) return { bg: 'bg-gray-100', text: 'text-gray-600', intensity: 'low' };
  if (normalized < 0.5) return { bg: 'bg-yellow-100', text: 'text-yellow-700', intensity: 'medium' };
  if (normalized < 0.7) return { bg: 'bg-orange-100', text: 'text-orange-700', intensity: 'elevated' };
  return { bg: 'bg-red-100', text: 'text-red-700', intensity: 'high' };
}

function getBipolarIntensityColor(value) {
  // For [-1, +1] range indicators
  const absValue = Math.abs(value);
  if (absValue < 0.2) return { bg: 'bg-gray-100', text: 'text-gray-600', intensity: 'neutral' };
  if (absValue < 0.4) return { bg: 'bg-blue-100', text: 'text-blue-700', intensity: 'slight' };
  if (absValue < 0.6) return { bg: 'bg-indigo-100', text: 'text-indigo-700', intensity: 'moderate' };
  if (absValue < 0.8) return { bg: 'bg-purple-100', text: 'text-purple-700', intensity: 'strong' };
  return { bg: 'bg-violet-100', text: 'text-violet-700', intensity: 'extreme' };
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT BAR COMPONENT
// ═══════════════════════════════════════════════════════════════

function ContextBar({ symbol, observation, onRefresh, loading }) {
  const timestamp = observation?.timestamp;
  const indicatorsMeta = observation?.indicatorsMeta || {};
  const indicatorCount = indicatorsMeta.indicatorCount || 0;
  const completeness = indicatorsMeta.completeness || 0;
  const source = indicatorsMeta.source || 'unknown';

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800" data-testid="context-bar">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Symbol */}
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-xl font-bold text-white">{symbol}</span>
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-slate-600" />
            
            {/* Timeframe */}
            <div className="text-sm">
              <span className="text-slate-400">Timeframe: </span>
              <span className="text-white font-medium">5m</span>
            </div>
            
            {/* Indicator Coverage */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-white font-medium">{indicatorCount}/32</span>
              <span className="text-slate-400 text-sm">indicators</span>
            </div>
            
            {/* Completeness */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${completeness > 0.9 ? 'bg-green-500' : completeness > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${completeness * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{(completeness * 100).toFixed(0)}%</span>
            </div>
            
            {/* Data Source */}
            <Badge variant="outline" className="text-gray-700 border-slate-600">
              <Database className="w-3 h-3 mr-1" />
              {source.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timestamp */}
            {timestamp && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                {new Date(timestamp).toLocaleTimeString()}
              </div>
            )}
            
            {/* Refresh */}
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MARKET AXES RADAR COMPONENT
// ═══════════════════════════════════════════════════════════════

function MarketAxesRadar({ aggregates }) {
  // Prepare axis data
  const axes = [
    { key: 'structureState', value: aggregates?.structureState ?? 0, bipolar: true },
    { key: 'momentumState', value: aggregates?.momentumState ?? 0, bipolar: true },
    { key: 'participation', value: aggregates?.participation ?? 0.5, bipolar: false },
    { key: 'orderbookPressure', value: aggregates?.orderbookPressure ?? 0, bipolar: true },
    { key: 'positionCrowding', value: aggregates?.positionCrowding ?? 0.5, bipolar: false },
    { key: 'marketStress', value: aggregates?.marketStress ?? 0.5, bipolar: false },
  ];

  // Normalize all to 0-1 for display
  const normalizedAxes = axes.map(axis => ({
    ...axis,
    normalized: axis.bipolar ? (axis.value + 1) / 2 : axis.value,
    config: AXIS_CONFIG[axis.key],
  }));

  // Simple bar visualization (fallback from radar)
  return (
    <Card data-testid="market-axes-radar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-400" />
          Market Axes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {normalizedAxes.map((axis) => {
            const intensity = getIntensityColor(axis.normalized);
            const drivers = aggregates?.drivers?.[axis.key] || [];
            
            return (
              <div 
                key={axis.key} 
                className={`p-4 rounded-lg ${intensity.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{axis.config?.icon}</span>
                  <span className="text-sm font-medium text-slate-700">
                    {axis.config?.label}
                  </span>
                </div>
                
                {/* Value bar */}
                <div className="mb-2">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        axis.normalized > 0.7 ? 'bg-red-500' : 
                        axis.normalized > 0.5 ? 'bg-orange-500' : 
                        axis.normalized > 0.3 ? 'bg-yellow-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${axis.normalized * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Value display */}
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-bold ${intensity.text}`}>
                    {axis.bipolar ? axis.value.toFixed(2) : (axis.value * 100).toFixed(0) + '%'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {intensity.intensity}
                  </Badge>
                </div>
                
                {/* Drivers */}
                {drivers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {drivers.slice(0, 2).map((driver, i) => (
                      <span 
                        key={i}
                        className="text-xs px-1.5 py-0.5 bg-white/50 rounded text-slate-600"
                      >
                        {driver.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// INDICATORS HEATMAP COMPONENT
// ═══════════════════════════════════════════════════════════════

function IndicatorsHeatmap({ indicators }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Group indicators by category
  const byCategory = {};
  Object.entries(indicators || {}).forEach(([id, data]) => {
    const category = data.category || 'UNKNOWN';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({ id, ...data });
  });

  // Order categories
  const categoryOrder = ['PRICE_STRUCTURE', 'MOMENTUM', 'VOLUME', 'ORDER_BOOK', 'POSITIONING'];
  const orderedCategories = categoryOrder.filter(cat => byCategory[cat]);

  return (
    <Card data-testid="indicators-heatmap">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-slate-400" />
          32 Market Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orderedCategories.map(category => {
            const config = CATEGORY_CONFIG[category] || {};
            const items = byCategory[category] || [];
            const isExpanded = expandedCategory === category;
            
            return (
              <div key={category} className="border rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className={`w-full flex items-center justify-between p-3 ${config.bgLight || 'bg-gray-50'} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <div className="text-left">
                      <p className={`font-medium ${config.textColor}`}>
                        {config.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {items.length} indicators
                      </p>
                    </div>
                  </div>
                  
                  {/* Mini heatmap preview */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {items.slice(0, 8).map((ind, i) => {
                        const color = Math.abs(ind.value) > 0.6 ? 'bg-red-400' : 
                                     Math.abs(ind.value) > 0.3 ? 'bg-orange-400' : 'bg-gray-300';
                        return (
                          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
                        );
                      })}
                    </div>
                    {isExpanded ? 
                      <ChevronDown className="w-5 h-5 text-slate-400" /> : 
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    }
                  </div>
                </button>
                
                {/* Expanded Indicators */}
                {isExpanded && (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((indicator) => {
                      const intensityColor = getBipolarIntensityColor(indicator.value);
                      
                      return (
                        <div 
                          key={indicator.id}
                          className={`p-3 rounded-lg ${intensityColor.bg} group cursor-help`}
                          title={indicator.interpretation || indicator.id}
                        >
                          <p className="text-xs font-medium text-slate-700 truncate mb-1">
                            {indicator.id.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${intensityColor.text}`}>
                              {typeof indicator.value === 'number' 
                                ? indicator.value.toFixed(2) 
                                : indicator.value
                              }
                            </span>
                            <Badge variant="outline" className="text-xs opacity-70">
                              {intensityColor.intensity}
                            </Badge>
                          </div>
                          
                          {/* Tooltip on hover */}
                          {indicator.interpretation && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {indicator.interpretation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Empty State */}
        {orderedCategories.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <BarChart2 className="w-10 h-10 mx-auto mb-2 text-gray-700" />
            <p>No indicator data available</p>
            <p className="text-xs mt-1">Create an observation with indicators first</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME EXPLANATION COMPONENT
// ═══════════════════════════════════════════════════════════════

function RegimeExplanation({ observation, dualData }) {
  const legacy = observation?.regime || {};
  const indicatorDriven = dualData?.indicatorDriven || {};
  const diff = dualData?.diff || {};

  const formatRegime = (type) => {
    return (type || 'NEUTRAL').replace(/_/g, ' ');
  };

  return (
    <Card data-testid="regime-explanation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-slate-400" />
          Regime Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Legacy Regime */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-slate-500">Legacy</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-1">
              {formatRegime(legacy.type)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Confidence:</span>
              <span className="text-sm font-medium">
                {((legacy.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* Indicator-Driven Regime */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-blue-500">Indicator-Driven</Badge>
            </div>
            <p className="text-2xl font-bold text-blue-800 mb-1">
              {formatRegime(indicatorDriven.regime)}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-blue-600">Confidence:</span>
              <span className="text-sm font-medium text-blue-700">
                {((indicatorDriven.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
            
            {/* Drivers */}
            {indicatorDriven.drivers && indicatorDriven.drivers.length > 0 && (
              <div className="pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-2">Why this regime:</p>
                <div className="flex flex-wrap gap-1">
                  {indicatorDriven.drivers.map((driver, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-white rounded text-xs text-blue-700"
                    >
                      {driver.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Agreement indicator */}
        {diff.agreement !== undefined && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">
              Agreement: {(diff.agreement * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATTERNS PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════

function PatternsPanel({ patterns }) {
  const activePatterns = patterns || [];

  return (
    <Card data-testid="patterns-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          Active Patterns
          {activePatterns.length > 0 && (
            <Badge variant="secondary">{activePatterns.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activePatterns.length > 0 ? (
          <div className="space-y-3">
            {activePatterns.map((pattern, idx) => (
              <div 
                key={pattern.name || idx}
                className="p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800">
                    {(pattern.name || 'Unknown').replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    {pattern.stability !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {pattern.stability} ticks
                      </Badge>
                    )}
                    <Badge 
                      className={
                        pattern.confidence > 0.7 ? 'bg-green-500' : 
                        pattern.confidence > 0.5 ? 'bg-yellow-500' : 'bg-slate-500'
                      }
                    >
                      {((pattern.confidence || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                {/* Confidence bar */}
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full ${
                      pattern.confidence > 0.7 ? 'bg-green-500' : 
                      pattern.confidence > 0.5 ? 'bg-yellow-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${(pattern.confidence || 0) * 100}%` }}
                  />
                </div>
                
                {/* Drivers */}
                {pattern.drivers && pattern.drivers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pattern.drivers.map((driver, i) => (
                      <span 
                        key={i}
                        className="px-1.5 py-0.5 bg-slate-200 rounded text-xs text-slate-600"
                      >
                        {driver.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <p>No active patterns</p>
            <p className="text-xs mt-1">Market is in a calm state</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// STABILITY TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════

function StabilityTimeline({ history }) {
  // For now, show placeholder since we don't have historical data yet
  const hasHistory = history && history.length > 0;

  return (
    <Card data-testid="stability-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          State Evolution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasHistory ? (
          <div className="space-y-2">
            {/* Simple timeline visualization */}
            <div className="flex gap-1 items-end h-20">
              {history.slice(-20).map((point, i) => {
                const height = (point.regimeConfidence || 0.5) * 100;
                return (
                  <div 
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`Confidence: ${(point.regimeConfidence * 100).toFixed(0)}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Past</span>
              <span>Now</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <p>State evolution will appear here</p>
            <p className="text-xs mt-1">Tracking regime confidence over time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function IndicatorsExplorerPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [observation, setObservation] = useState(null);
  const [dualData, setDualData] = useState(null);
  const [patternData, setPatternData] = useState(null);
  const [aggregates, setAggregates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [obsRes, regimeRes, patternRes] = await Promise.all([
        api.get(`/api/v10/exchange/observation/${selectedSymbol}/latest`).catch(() => null),
        api.get(`/api/v10/exchange/regime/${selectedSymbol}/dual`).catch(() => null),
        api.get(`/api/v10/exchange/patterns/${selectedSymbol}/indicator-driven`).catch(() => null),
      ]);

      // Process observation
      if (obsRes?.data?.ok && obsRes.data.observation) {
        setObservation(obsRes.data.observation);
      } else {
        // No observation — try to create one
        try {
          const createRes = await api.post('/api/v10/exchange/observation/tick/full', {
            symbol: selectedSymbol
          });
          if (createRes?.data?.ok) {
            // Fetch again
            const newObs = await api.get(`/api/v10/exchange/observation/${selectedSymbol}/latest`);
            if (newObs?.data?.ok) {
              setObservation(newObs.data.observation);
            }
          }
        } catch (e) {
          console.error('Failed to create observation:', e);
        }
      }

      // Process regime dual
      if (regimeRes?.data?.ok) {
        setDualData(regimeRes.data.data);
        // Extract aggregates from indicator-driven result
        if (regimeRes.data.data?.indicatorDriven?.aggregates) {
          setAggregates(regimeRes.data.data.indicatorDriven.aggregates);
        }
      }

      // Process patterns
      if (patternRes?.data?.ok) {
        setPatternData(patternRes.data);
        // Also extract aggregates if available
        if (patternRes.data.aggregates) {
          setAggregates(patternRes.data.aggregates);
        }
      }

    } catch (err) {
      console.error('Indicators Explorer fetch error:', err);
      setError('Failed to load indicator data');
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSymbolChange = (e) => {
    setSelectedSymbol(e.target.value);
    setObservation(null);
    setDualData(null);
    setPatternData(null);
    setAggregates(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="indicators-explorer-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicators Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Market state visualization • S10.6I.8 • Read-only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSymbol}
            onChange={handleSymbolChange}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            data-testid="symbol-selector"
          >
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'].map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && !observation && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-700">{error}</span>
        </div>
      )}

      {/* Main Content */}
      {observation && (
        <>
          {/* Context Bar */}
          <ContextBar 
            symbol={selectedSymbol}
            observation={observation}
            onRefresh={fetchData}
            loading={loading}
          />

          {/* Market Axes Radar */}
          <MarketAxesRadar aggregates={aggregates} />

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Indicators Heatmap - Takes 2 columns */}
            <div className="lg:col-span-2">
              <IndicatorsHeatmap indicators={observation.indicators} />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Regime Explanation */}
              <RegimeExplanation 
                observation={observation}
                dualData={dualData}
              />
              
              {/* Patterns Panel */}
              <PatternsPanel patterns={patternData?.patterns} />
            </div>
          </div>

          {/* Stability Timeline */}
          <StabilityTimeline history={[]} />

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This dashboard displays market state measurements only. 
              It does NOT provide trading signals, recommendations, or price predictions.
              Color represents intensity, not direction.
            </p>
          </div>
        </>
      )}

      {/* No Data State */}
      {!loading && !observation && !error && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Observation Data</h3>
          <p className="text-gray-500 mb-4">
            Create an observation with indicators to view market state
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Generate Observation
          </button>
        </div>
      )}
    </div>
  );
}
