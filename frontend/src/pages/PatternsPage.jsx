/**
 * S10.5 — Exchange Patterns Page
 * 
 * "What is happening on the market and why"
 * 
 * Displays:
 * - Active Patterns List
 * - Pattern Detail Panel
 * - Conflict Indicator
 * - Pattern Timeline
 * 
 * NO signals, NO predictions — only explanation
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  ChevronRight,
  Info,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Category configuration
const CATEGORY_CONFIG = {
  FLOW: { icon: '🔄', color: 'bg-blue-500', textColor: 'text-blue-600', label: 'Order Flow' },
  OI: { icon: '📈', color: 'bg-purple-500', textColor: 'text-purple-600', label: 'Open Interest' },
  LIQUIDATION: { icon: '💥', color: 'bg-red-500', textColor: 'text-red-600', label: 'Liquidation' },
  VOLUME: { icon: '📊', color: 'bg-green-500', textColor: 'text-green-600', label: 'Volume' },
  STRUCTURE: { icon: '🏗️', color: 'bg-orange-500', textColor: 'text-orange-600', label: 'Structure' },
};

// Direction icons
const DIRECTION_CONFIG = {
  BULLISH: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  BEARISH: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
  NEUTRAL: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100' },
};

// Strength colors
const STRENGTH_CONFIG = {
  WEAK: { color: 'text-gray-500', width: 33 },
  MEDIUM: { color: 'text-yellow-600', width: 66 },
  STRONG: { color: 'text-green-600', width: 100 },
};

export default function PatternsPage() {
  const [patternData, setPatternData] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const response = await api.get(`/api/v10/exchange/patterns/${selectedSymbol}`);
      
      if (response.data?.ok) {
        setPatternData(response.data);
        // Select first pattern by default
        if (response.data.patterns?.length > 0 && !selectedPattern) {
          setSelectedPattern(response.data.patterns[0]);
        }
      }
    } catch (err) {
      console.error('Patterns fetch error:', err);
      setError('Failed to fetch pattern data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const patterns = patternData?.patterns || [];
  const hasConflict = patternData?.hasConflict || false;
  const summary = patternData?.summary || { bullish: 0, bearish: 0, neutral: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="patterns-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Patterns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Market behavior library • S10.5
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              setSelectedPattern(null);
            }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            data-testid="symbol-selector"
          >
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'].map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error} — Enable exchange module in admin to see live data
        </div>
      )}

      {/* Summary Bar */}
      <Card data-testid="summary-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold">{patterns.length}</span>
                <span className="text-sm text-gray-500">Active Patterns</span>
              </div>
              
              {/* Direction breakdown */}
              <div className="flex items-center gap-4 pl-6 border-l">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{summary.bullish}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">{summary.bearish}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{summary.neutral}</span>
                </div>
              </div>
            </div>
            
            {/* Conflict indicator */}
            {hasConflict && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Conflicting Signals</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Patterns List */}
        <Card className="lg:col-span-1" data-testid="patterns-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-400" />
              Active Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.map((pattern, idx) => {
                  const catConfig = CATEGORY_CONFIG[pattern.category] || CATEGORY_CONFIG.FLOW;
                  const dirConfig = DIRECTION_CONFIG[pattern.direction] || DIRECTION_CONFIG.NEUTRAL;
                  const DirIcon = dirConfig.icon;
                  const isSelected = selectedPattern?.id === pattern.id;
                  
                  return (
                    <button
                      key={pattern.id || idx}
                      onClick={() => setSelectedPattern(pattern)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      data-testid={`pattern-item-${idx}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{catConfig.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {pattern.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {catConfig.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${dirConfig.bg}`}>
                            <DirIcon className={`w-3.5 h-3.5 ${dirConfig.color}`} />
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Confidence bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Confidence</span>
                          <span className="font-medium">{(pattern.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${catConfig.color}`}
                            style={{ width: `${pattern.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p>No patterns detected</p>
                <p className="text-xs mt-1">Market is in a calm state</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pattern Detail Panel */}
        <Card className="lg:col-span-2" data-testid="pattern-detail">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              Pattern Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPattern ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {CATEGORY_CONFIG[selectedPattern.category]?.icon || '📊'}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedPattern.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {CATEGORY_CONFIG[selectedPattern.category]?.label || selectedPattern.category}
                      </p>
                    </div>
                  </div>
                  
                  {/* Direction & Strength badges */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${DIRECTION_CONFIG[selectedPattern.direction]?.bg || 'bg-gray-100'} ${DIRECTION_CONFIG[selectedPattern.direction]?.color || 'text-gray-600'}`}
                    >
                      {selectedPattern.direction}
                    </Badge>
                    <Badge variant="outline">
                      {selectedPattern.strength}
                    </Badge>
                    <Badge variant="outline" className="text-gray-500">
                      {selectedPattern.timeframe}
                    </Badge>
                  </div>
                </div>

                {/* Confidence meter */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Pattern Confidence</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {(selectedPattern.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${CATEGORY_CONFIG[selectedPattern.category]?.color || 'bg-blue-500'}`}
                      style={{ width: `${selectedPattern.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Why Detected (Conditions) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Why This Pattern Detected
                  </h4>
                  <div className="space-y-2">
                    {(selectedPattern.conditions || []).map((condition, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </div>
                    ))}
                    {(!selectedPattern.conditions || selectedPattern.conditions.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No condition details available</p>
                    )}
                  </div>
                </div>

                {/* Raw Metrics */}
                {selectedPattern.metrics && Object.keys(selectedPattern.metrics).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Supporting Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(selectedPattern.metrics).map(([key, value]) => (
                        <div 
                          key={key}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <p className="text-xs text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {typeof value === 'number' 
                              ? value.toFixed(2) 
                              : String(value)
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600">
                    <strong>Note:</strong> This pattern is for market understanding only. 
                    It is NOT a trading signal and does NOT predict future price movement.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Info className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p>Select a pattern to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conflict Section (if applicable) */}
      {hasConflict && (
        <Card className="border-yellow-200" data-testid="conflict-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              Pattern Conflict Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Both bullish and bearish patterns are active simultaneously. 
              This indicates market indecision or a transitional state.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">Bullish Patterns ({summary.bullish})</h4>
                <div className="space-y-1">
                  {patterns.filter(p => p.direction === 'BULLISH').map((p, i) => (
                    <div key={i} className="text-sm text-green-600 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-700 mb-2">Bearish Patterns ({summary.bearish})</h4>
                <div className="space-y-1">
                  {patterns.filter(p => p.direction === 'BEARISH').map((p, i) => (
                    <div key={i} className="text-sm text-red-600 flex items-center gap-2">
                      <TrendingDown className="w-3 h-3" />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Timeline Placeholder */}
      <Card data-testid="timeline-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Pattern Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <p>Pattern history will appear here</p>
            <p className="text-xs mt-1">Tracking when patterns appear and disappear</p>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-400 text-right">
        Last update: {patternData?.lastUpdated ? new Date(patternData.lastUpdated).toLocaleTimeString() : 'Never'}
        {patternData?.detectionDurationMs && ` • Detection: ${patternData.detectionDurationMs}ms`}
      </div>
    </div>
  );
}
