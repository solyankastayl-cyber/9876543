/**
 * Intelligence Meta-Brain Page v2
 * 
 * ТЕПЕРЬ ЧИТАЕТ ДАННЫЕ ИЗ LABS!
 * 
 * Meta-Brain = Decision orchestrator:
 * - Читает все Labs
 * - Обнаруживает конфликты между Labs
 * - Может понижать confidence на основе рисков
 * - Показывает логику принятия решений
 * 
 * Meta-Brain НЕ:
 * - Интерпретирует данные (это Research)
 * - Показывает рынок (это Exchange)
 */

import { useState, useEffect } from 'react';
import { 
  Brain, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle,
  Scale, GitBranch, Clock, ChevronRight, Settings, Zap, Shield,
  TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

const PRIORITY_LEVELS = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
};

// Analyze Labs for conflicts
function analyzeLabConflicts(labs) {
  const conflicts = [];
  
  if (!labs) return conflicts;

  // Conflict 1: Whale vs Volume
  if (labs.whale?.state === 'ACCUMULATION' && labs.volume?.state === 'NO_CONFIRMATION') {
    conflicts.push({
      type: 'WHALE_VOLUME_MISMATCH',
      labs: ['whale', 'volume'],
      description: 'Whale accumulation detected but volume does not confirm',
      severity: 'HIGH',
      recommendation: 'Consider lowering confidence',
    });
  }

  // Conflict 2: Flow vs Momentum
  if (labs.flow?.state === 'BUY_DOMINANT' && labs.momentum?.state === 'DECELERATING') {
    conflicts.push({
      type: 'FLOW_MOMENTUM_DIVERGENCE',
      labs: ['flow', 'momentum'],
      description: 'Buy flow dominant but momentum is decelerating',
      severity: 'MEDIUM',
      recommendation: 'Watch for reversal',
    });
  }

  // Conflict 3: Regime vs Volatility
  if (labs.regime?.state === 'RANGE' && labs.volatility?.state === 'EXPANSION') {
    conflicts.push({
      type: 'REGIME_VOL_CONFLICT',
      labs: ['regime', 'volatility'],
      description: 'Market in range but volatility expanding - breakout likely',
      severity: 'MEDIUM',
      recommendation: 'Prepare for regime change',
    });
  }

  // Conflict 4: Accumulation vs Distribution signals
  if (labs.accumulation?.state === 'ACCUMULATION' && labs.whale?.state === 'DISTRIBUTION') {
    conflicts.push({
      type: 'ACC_DIST_CONFLICT',
      labs: ['accumulation', 'whale'],
      description: 'Accumulation Lab vs Whale Lab disagree on market phase',
      severity: 'HIGH',
      recommendation: 'Wait for clarity',
    });
  }

  // Conflict 5: Liquidity risk
  if (labs.liquidity?.state === 'THIN_LIQUIDITY' && (labs.flow?.state === 'BUY_DOMINANT' || labs.flow?.state === 'SELL_DOMINANT')) {
    conflicts.push({
      type: 'LIQUIDITY_FLOW_RISK',
      labs: ['liquidity', 'flow'],
      description: 'Strong flow in thin liquidity - slippage risk',
      severity: 'HIGH',
      recommendation: 'Reduce position size',
    });
  }

  return conflicts;
}

// Calculate confidence adjustments based on Labs
function calculateConfidenceAdjustments(labs) {
  const adjustments = [];
  
  if (!labs) return adjustments;

  // Data quality penalty
  if (labs.dataQuality?.state === 'DEGRADED') {
    adjustments.push({
      factor: 'Data Quality',
      adjustment: -0.2,
      reason: 'Degraded data quality reduces reliability',
    });
  } else if (labs.dataQuality?.state === 'UNTRUSTED') {
    adjustments.push({
      factor: 'Data Quality',
      adjustment: -0.4,
      reason: 'Untrusted data - significant confidence reduction',
    });
  }

  // Stability penalty
  if (labs.stability?.state === 'UNSTABLE' || labs.stability?.state === 'BREAK_RISK') {
    adjustments.push({
      factor: 'Market Stability',
      adjustment: -0.15,
      reason: 'Unstable market conditions',
    });
  }

  // Manipulation risk penalty
  if (labs.manipulation?.state !== 'CLEAN') {
    adjustments.push({
      factor: 'Manipulation Risk',
      adjustment: -0.1,
      reason: `Manipulation risk: ${labs.manipulation?.state}`,
    });
  }

  // Signal conflict penalty
  if (labs.signalConflict?.state === 'STRONG_CONFLICT') {
    adjustments.push({
      factor: 'Signal Conflicts',
      adjustment: -0.25,
      reason: 'Strong conflicts between Labs',
    });
  } else if (labs.signalConflict?.state === 'PARTIAL_CONFLICT') {
    adjustments.push({
      factor: 'Signal Conflicts',
      adjustment: -0.1,
      reason: 'Partial conflicts detected',
    });
  }

  // Liquidity bonus/penalty
  if (labs.liquidity?.state === 'DEEP_LIQUIDITY') {
    adjustments.push({
      factor: 'Liquidity',
      adjustment: +0.05,
      reason: 'Deep liquidity supports execution',
    });
  } else if (labs.liquidity?.state === 'THIN_LIQUIDITY') {
    adjustments.push({
      factor: 'Liquidity',
      adjustment: -0.1,
      reason: 'Thin liquidity increases risk',
    });
  }

  return adjustments;
}

// Generate decision rules status
function generateRulesStatus(labs) {
  const rules = [
    {
      id: 'guard_data_quality',
      name: 'Data Quality Guard',
      description: 'Block decisions when data is degraded',
      priority: 'CRITICAL',
      enabled: true,
      triggered: labs?.dataQuality?.state !== 'CLEAN',
      labSource: 'dataQuality',
    },
    {
      id: 'confidence_threshold',
      name: 'Confidence Gate',
      description: 'Minimum 60% confidence for BUY/SELL',
      priority: 'HIGH',
      enabled: true,
      triggered: false,
      threshold: 0.6,
    },
    {
      id: 'conflict_resolver',
      name: 'Conflict Resolution',
      description: 'Handle Lab disagreements',
      priority: 'HIGH',
      enabled: true,
      triggered: labs?.signalConflict?.state !== 'ALIGNED',
      labSource: 'signalConflict',
    },
    {
      id: 'volatility_damper',
      name: 'Volatility Damper',
      description: 'Reduce confidence in high volatility',
      priority: 'MEDIUM',
      enabled: true,
      triggered: labs?.volatility?.state === 'HIGH_VOL',
      labSource: 'volatility',
    },
    {
      id: 'liquidity_check',
      name: 'Liquidity Check',
      description: 'Warn on thin liquidity',
      priority: 'MEDIUM',
      enabled: true,
      triggered: labs?.liquidity?.state === 'THIN_LIQUIDITY',
      labSource: 'liquidity',
    },
    {
      id: 'manipulation_guard',
      name: 'Manipulation Guard',
      description: 'Flag manipulation risks',
      priority: 'HIGH',
      enabled: true,
      triggered: labs?.manipulation?.state !== 'CLEAN',
      labSource: 'manipulation',
    },
  ];

  return rules;
}

export default function MetaBrainPage() {
  const [labsSnapshot, setLabsSnapshot] = useState(null);
  const [summary, setSummary] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [rules, setRules] = useState([]);
  const [macroContext, setMacroContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Labs data and Macro Context in parallel
      const [labsRes, macroRes] = await Promise.all([
        api.get(`/api/v10/exchange/labs/v3/all?symbol=${selectedAsset}`),
        api.get('/api/v10/macro/impact'),
      ]);
      
      if (labsRes.data?.ok) {
        setLabsSnapshot(labsRes.data.snapshot);
        setSummary(labsRes.data.summary);
        
        // Analyze conflicts
        const detectedConflicts = analyzeLabConflicts(labsRes.data.snapshot?.labs);
        setConflicts(detectedConflicts);
        
        // Calculate adjustments
        const calculatedAdjustments = calculateConfidenceAdjustments(labsRes.data.snapshot?.labs);
        setAdjustments(calculatedAdjustments);
        
        // Generate rules status
        const rulesStatus = generateRulesStatus(labsRes.data.snapshot?.labs);
        setRules(rulesStatus);
      }
      
      if (macroRes.data?.ok) {
        setMacroContext(macroRes.data.data);
      }
    } catch (err) {
      console.error('Meta-Brain fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Calculate total adjustment
  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.adjustment, 0);
  const triggeredRules = rules.filter(r => r.triggered);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="metabrain-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Meta-Brain
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Decision orchestration — reads all 18 Labs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
          </select>
          <Badge 
            variant="outline" 
            className={summary?.overallHealth === 'healthy' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : summary?.overallHealth === 'warning'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'
            }
          >
            {summary?.overallHealth === 'healthy' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Healthy</>
            ) : summary?.overallHealth === 'warning' ? (
              <><AlertTriangle className="w-3 h-3 mr-1" /> Warning</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Critical</>
            )}
          </Badge>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Labs Active</p>
            <p className="text-2xl font-bold text-gray-900">
              {Object.keys(labsSnapshot?.labs || {}).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Conflicts</p>
            <p className={`text-2xl font-bold ${conflicts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {conflicts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confidence Adj</p>
            <p className={`text-2xl font-bold ${totalAdjustment < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalAdjustment >= 0 ? '+' : ''}{(totalAdjustment * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Macro Multiplier</p>
            <p className={`text-2xl font-bold ${
              macroContext?.impact?.confidenceMultiplier < 0.9 ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {macroContext?.impact?.confidenceMultiplier 
                ? `${(macroContext.impact.confidenceMultiplier * 100).toFixed(0)}%`
                : '-'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Macro Context Panel */}
      {macroContext && (
        <Card className={macroContext.impact?.blockedStrong ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Market Context Layer
              {macroContext.impact?.blockedStrong && (
                <Badge variant="destructive" className="ml-2">STRONG BLOCKED</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Macro-level market sentiment affecting all decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fear & Greed */}
              <div className={`p-4 rounded-lg border ${
                macroContext.signal?.flags?.includes('MACRO_PANIC') ? 'bg-red-100 border-red-300' :
                macroContext.signal?.flags?.includes('MACRO_EUPHORIA') ? 'bg-amber-100 border-amber-300' :
                'bg-gray-100 border-gray-200'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Fear & Greed Index</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {macroContext.signal?.explain?.bullets?.[0]?.match(/Fear & Greed: (\d+)/)?.[1] || '-'}
                  </span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    macroContext.signal?.flags?.includes('MACRO_PANIC') ? 'bg-red-200 text-red-800' :
                    macroContext.signal?.flags?.includes('MACRO_EUPHORIA') ? 'bg-amber-200 text-amber-800' :
                    macroContext.signal?.flags?.includes('MACRO_RISK_OFF') ? 'bg-orange-200 text-orange-800' :
                    macroContext.signal?.flags?.includes('MACRO_RISK_ON') ? 'bg-green-200 text-green-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {macroContext.signal?.flags?.includes('MACRO_PANIC') ? 'EXTREME FEAR' :
                     macroContext.signal?.flags?.includes('MACRO_EUPHORIA') ? 'EXTREME GREED' :
                     macroContext.signal?.flags?.includes('MACRO_RISK_OFF') ? 'FEAR' :
                     macroContext.signal?.flags?.includes('MACRO_RISK_ON') ? 'GREED' : 'NEUTRAL'}
                  </span>
                </div>
              </div>

              {/* BTC Dominance */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">BTC Dominance</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-700">
                    {macroContext.signal?.explain?.bullets?.[1]?.match(/BTC Dominance: ([\d.]+)%/)?.[1] || '-'}%
                  </span>
                  {macroContext.signal?.flags?.includes('BTC_DOM_UP') && (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  )}
                  {macroContext.signal?.flags?.includes('BTC_DOM_DOWN') && (
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Stablecoin Dominance */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-gray-500 mb-1">Stablecoin Dominance</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-700">
                    {macroContext.signal?.explain?.bullets?.[2]?.match(/Stablecoin Dominance: ([\d.]+)%/)?.[1] || '-'}%
                  </span>
                  {macroContext.signal?.flags?.includes('STABLE_INFLOW') && (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  )}
                  {macroContext.signal?.flags?.includes('STABLE_OUTFLOW') && (
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Active Flags & Impact */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {macroContext.signal?.flags?.map((flag) => (
                <Badge 
                  key={flag} 
                  variant="outline"
                  className={
                    flag.includes('PANIC') || flag.includes('EUPHORIA') ? 'bg-red-100 text-red-700' :
                    flag.includes('RISK_OFF') || flag.includes('INFLOW') ? 'bg-orange-100 text-orange-700' :
                    flag.includes('RISK_ON') || flag.includes('OUTFLOW') ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }
                >
                  {flag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>

            {macroContext.impact?.applied && (
              <div className={`mt-4 p-3 rounded-lg ${
                macroContext.impact.blockedStrong ? 'bg-red-100 border border-red-300' : 'bg-amber-100 border border-amber-300'
              }`}>
                <p className={`text-sm font-medium ${
                  macroContext.impact.blockedStrong ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {macroContext.impact.reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Decision Rules (from Labs)
          </CardTitle>
          <CardDescription>
            Guards and gates — {triggeredRules.length} triggered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((rule) => {
              const priorityConfig = PRIORITY_LEVELS[rule.priority] || PRIORITY_LEVELS.LOW;
              
              return (
                <div
                  key={rule.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    rule.triggered 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    rule.triggered ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      <Badge variant="outline" className={`text-xs ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </Badge>
                      {rule.labSource && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          Lab: {rule.labSource}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                  </div>
                  {rule.triggered ? (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lab Conflicts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-gray-400" />
            Lab Conflicts
          </CardTitle>
          <CardDescription>Disagreements between Labs</CardDescription>
        </CardHeader>
        <CardContent>
          {conflicts.length > 0 ? (
            <div className="space-y-3">
              {conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">{conflict.type}</span>
                    <Badge variant="outline" className={
                      conflict.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                      conflict.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {conflict.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">{conflict.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-amber-600">
                      Labs: {conflict.labs.join(' vs ')}
                    </span>
                    <span className="text-amber-800 font-medium">
                      → {conflict.recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="font-medium">No conflicts detected</p>
              <p className="text-sm text-gray-400">All Labs are aligned</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-400" />
            Confidence Adjustments
          </CardTitle>
          <CardDescription>How Labs affect final confidence</CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length > 0 ? (
            <div className="space-y-2">
              {adjustments.map((adj, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900">{adj.factor}</span>
                    <p className="text-xs text-gray-500">{adj.reason}</p>
                  </div>
                  <span className={`font-bold ${
                    adj.adjustment > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {adj.adjustment > 0 ? '+' : ''}{(adj.adjustment * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg mt-2">
                <span className="font-semibold text-gray-900">Total Adjustment</span>
                <span className={`font-bold text-lg ${
                  totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalAdjustment >= 0 ? '+' : ''}{(totalAdjustment * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Scale className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No adjustments needed</p>
              <p className="text-sm text-gray-400">All factors are nominal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labs Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Labs Input Summary</CardTitle>
          <CardDescription>Current state of all Labs feeding Meta-Brain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {labsSnapshot?.labs && Object.entries(labsSnapshot.labs).map(([name, lab]) => {
              const isProblematic = lab.risks?.length > 0 || lab.confidence < 0.5;
              return (
                <div
                  key={name}
                  className={`p-2 rounded-lg text-center ${
                    isProblematic ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                  title={lab.explain?.summary}
                >
                  <span className="text-xs text-gray-500 block truncate">{name}</span>
                  <span className={`text-xs font-medium block truncate ${
                    isProblematic ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                    {lab.state?.replace(/_/g, ' ').slice(0, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
