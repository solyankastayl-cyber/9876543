/**
 * Strategy Simulation Page (Block 28)
 * 
 * Research interface for testing behavioral strategies
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  LineChart, Play, RefreshCw, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, BarChart2, Target, Zap, Filter,
  HelpCircle, Users, ExternalLink, Info, ChevronDown, ChevronUp,
  Shield, Skull, Clock, Award
} from 'lucide-react';
import { 
  fetchStrategies, 
  runStrategySimulation, 
  fetchStrategyReport,
  compareStrategies 
} from '../../api/blocks15-28.api';

// Strategy configurations with detailed explanations
const STRATEGY_CONFIG = {
  EARLY_CONVICTION_ONLY: {
    icon: Zap,
    color: 'purple',
    shortDesc: 'Follow trend-finders first',
    fullDesc: 'These actors are the first to identify emerging trends. They typically mention tokens 2-7 days before mainstream attention. High risk, high reward.',
    whoAreThey: 'Researchers, alpha hunters, on-chain analysts who spot opportunities before the crowd.',
    bestFor: 'Aggressive traders looking for early entries',
    risk: 'High',
    examples: ['@cobie', '@hsaka', '@ansem']
  },
  LONG_TERM_ACCUMULATORS: {
    icon: TrendingUp,
    color: 'emerald',
    shortDesc: 'Follow patient builders',
    fullDesc: 'These actors accumulate positions over weeks/months. They focus on fundamentals, not hype. Lower frequency signals but higher conviction.',
    whoAreThey: 'Fund managers, long-term holders, fundamental analysts who build positions slowly.',
    bestFor: 'Patient investors seeking quality over quantity',
    risk: 'Low',
    examples: ['@raoulpal', '@loomdart']
  },
  HIGH_AUTHENTICITY: {
    icon: CheckCircle,
    color: 'blue',
    shortDesc: 'Follow verified authentic actors',
    fullDesc: 'Actors with high authenticity scores (>75%). They have consistent track records and rarely shill. Their mentions correlate with real price moves.',
    whoAreThey: 'Verified influencers with proven track records and genuine market insights.',
    bestFor: 'Those who want reliable signals from trusted sources',
    risk: 'Medium',
    examples: ['Actors with Reality Score > 75']
  },
  AVOID_PUMP_EXIT: {
    icon: Shield,
    color: 'orange',
    shortDesc: 'Exclude known manipulators',
    fullDesc: 'This strategy EXCLUDES "Pump & Exit" actors - those who hype tokens then dump. Following everyone EXCEPT these manipulators improves signal quality.',
    whoAreThey: 'Excluded: Paid shillers, pump group leaders, accounts with patterns of dumping after mentions.',
    bestFor: 'Risk-averse traders who want to avoid manipulation',
    risk: 'Low-Medium',
    examples: ['Excludes: paid promos, coordinated pumps']
  }
};

function InfoTooltip({ children, content }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {children}
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl -top-2 left-6">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3"></div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, suffix = '', trend, description, tooltip }) {
  const isPositive = trend === 'positive';
  const isNegative = trend === 'negative';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
        {label}
        {tooltip && (
          <InfoTooltip content={tooltip}>
            <HelpCircle className="w-3.5 h-3.5" />
          </InfoTooltip>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${
          isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-900 dark:text-white'
        }`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-gray-500">{suffix}</span>
      </div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
    </div>
  );
}

function StrategyCard({ strategy, config, onSelect, selected }) {
  const Icon = config?.icon || BarChart2;
  const color = config?.color || 'gray';
  const [expanded, setExpanded] = useState(false);
  
  const colorClasses = {
    purple: {
      bg: selected ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800',
      border: selected ? 'border-purple-300 dark:border-purple-700' : 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconText: 'text-purple-600 dark:text-purple-400',
      risk: 'text-red-500'
    },
    emerald: {
      bg: selected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-gray-800',
      border: selected ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      risk: 'text-green-500'
    },
    blue: {
      bg: selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800',
      border: selected ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconText: 'text-blue-600 dark:text-blue-400',
      risk: 'text-yellow-500'
    },
    orange: {
      bg: selected ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-800',
      border: selected ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconText: 'text-orange-600 dark:text-orange-400',
      risk: 'text-yellow-500'
    }
  };
  
  const classes = colorClasses[color] || colorClasses.purple;
  
  return (
    <div className={`rounded-lg border transition-all ${classes.bg} ${classes.border}`}>
      <button
        onClick={() => onSelect(strategy.name)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${classes.iconBg}`}>
            <Icon className={`w-5 h-5 ${classes.iconText}`} />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {strategy.name.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {config?.shortDesc || strategy.description}
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </button>
      
      {expanded && config && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">What this means</div>
              <p className="text-gray-700 dark:text-gray-300">{config.fullDesc}</p>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Who are these actors?</div>
              <p className="text-gray-700 dark:text-gray-300">{config.whoAreThey}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Risk Level: </span>
                <span className={`font-medium ${classes.risk}`}>{config.risk}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Best for: </span>
                <span className="text-gray-700 dark:text-gray-300">{config.bestFor}</span>
              </div>
            </div>
            {config.examples && (
              <div className="flex flex-wrap gap-1">
                {config.examples.map((ex, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                    {ex}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HowItWorksSection() {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800 mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How Strategy Simulation Works</h2>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This tool answers the question: <strong>"What if I only followed certain types of Twitter influencers?"</strong>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">What are Actors?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Actors</strong> are Twitter influencers we track. Each actor has a <strong>behavior profile</strong> based on their historical patterns:
              </p>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>Early Conviction</strong> - First to spot trends</li>
                <li>• <strong>Long-Term Accumulator</strong> - Patient builders</li>
                <li>• <strong>Pump & Exit</strong> - Manipulators (avoid!)</li>
                <li>• <strong>Liquidity Provider</strong> - Market makers</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">What do the metrics mean?</h3>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Hit Rate</strong> - % of mentions that led to price increase within 24h</li>
                <li><strong>Avg Follow Through</strong> - Average price change after mention</li>
                <li><strong>Noise Ratio</strong> - % of false signals (mentions with no price move)</li>
                <li><strong>Sample Size</strong> - Number of events analyzed</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
            <strong className="text-yellow-700 dark:text-yellow-400">Example:</strong>
            <span className="text-yellow-600 dark:text-yellow-300"> If "Early Conviction Only" shows 68% Hit Rate with +12% Follow Through, it means: following only Early Conviction actors would have given you profitable signals 68% of the time, with an average gain of 12%.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategySimulationPage() {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [windowDays, setWindowDays] = useState(30);

  // Load strategies
  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await fetchStrategies();
      if (result?.strategies) {
        setStrategies(result.strategies);
        if (result.strategies.length > 0) {
          setSelectedStrategy(result.strategies[0].name);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Load report when strategy selected
  useEffect(() => {
    async function loadReport() {
      if (!selectedStrategy) return;
      const result = await fetchStrategyReport(selectedStrategy);
      if (result?.report) {
        setReport(result.report);
      } else {
        setReport(null);
      }
    }
    loadReport();
  }, [selectedStrategy]);

  const handleRunSimulation = useCallback(async () => {
    if (!selectedStrategy) return;
    setRunning(true);
    const result = await runStrategySimulation(selectedStrategy, windowDays, 100);
    if (result?.report) {
      setReport(result.report);
    }
    setRunning(false);
  }, [selectedStrategy, windowDays]);

  const selectedConfig = selectedStrategy ? STRATEGY_CONFIG[selectedStrategy] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <LineChart className="w-7 h-7 text-white" />
              </div>
              Strategy Simulation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 ml-15">
              Backtest different influencer-following strategies to find what works best
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="animate-fade-in-up stagger-1">
          <HowItWorksSection />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategies List */}
          <div className="space-y-4 animate-fade-in-up stagger-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2 section-header">
                <Target className="w-5 h-5 text-purple-500" />
                Choose a Strategy
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Click the arrow to expand and learn more about each strategy
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {strategies.map((strategy) => (
                    <StrategyCard
                      key={strategy.name}
                      strategy={strategy}
                      config={STRATEGY_CONFIG[strategy.name]}
                      selected={selectedStrategy === strategy.name}
                      onSelect={setSelectedStrategy}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Simulation Settings</h3>
                <InfoTooltip content="Choose how many days of historical data to analyze. Longer periods give more reliable results but may not reflect recent market conditions.">
                  <HelpCircle className="w-3.5 h-3.5" />
                </InfoTooltip>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400">
                      Lookback Window
                    </label>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {windowDays} days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="90"
                    value={windowDays}
                    onChange={(e) => setWindowDays(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>7d (recent)</span>
                    <span>90d (comprehensive)</span>
                  </div>
                </div>
                
                <button
                  onClick={handleRunSimulation}
                  disabled={!selectedStrategy || running}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  {running ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {report ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="Hit Rate"
                    value={report.metrics.hitRate * 100}
                    suffix="%"
                    trend={report.metrics.hitRate >= 0.6 ? 'positive' : report.metrics.hitRate < 0.4 ? 'negative' : null}
                    description="Successful signals"
                    tooltip="Percentage of mentions that led to a price increase within 24 hours. Higher is better."
                  />
                  <MetricCard
                    label="Avg Follow Through"
                    value={report.metrics.avgFollowThrough}
                    suffix="%"
                    trend={report.metrics.avgFollowThrough > 0 ? 'positive' : 'negative'}
                    description="Average price move"
                    tooltip="Average percentage price change 24h after an actor mentions a token. Positive means profitable on average."
                  />
                  <MetricCard
                    label="Noise Ratio"
                    value={report.metrics.noiseRatio * 100}
                    suffix="%"
                    trend={report.metrics.noiseRatio < 0.3 ? 'positive' : 'negative'}
                    description="False signals"
                    tooltip="Percentage of mentions that didn't lead to any significant price movement. Lower is better."
                  />
                  <MetricCard
                    label="Sample Size"
                    value={report.metrics.sampleSize}
                    description="Events analyzed"
                    tooltip="Number of mention events analyzed. Higher sample size means more reliable statistics."
                  />
                </div>

                {/* Strategy Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {selectedConfig && (
                        <div className={`p-2 rounded-lg bg-${selectedConfig.color}-100 dark:bg-${selectedConfig.color}-900/30`}>
                          <selectedConfig.icon className={`w-6 h-6 text-${selectedConfig.color}-600 dark:text-${selectedConfig.color}-400`} />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {report.strategy.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedConfig?.shortDesc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      Window: {report.window}
                    </div>
                  </div>
                  
                  {selectedConfig && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {selectedConfig.fullDesc}
                      </p>
                    </div>
                  )}
                  
                  {/* Visual Summary */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Award className={`w-8 h-8 ${
                          report.metrics.hitRate >= 0.6 ? 'text-green-500' :
                          report.metrics.hitRate >= 0.4 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                      </div>
                      <div className={`text-2xl font-bold ${
                        report.metrics.hitRate >= 0.6 ? 'text-green-500' :
                        report.metrics.hitRate >= 0.4 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {report.metrics.hitRate >= 0.6 ? 'A' :
                         report.metrics.hitRate >= 0.5 ? 'B' :
                         report.metrics.hitRate >= 0.4 ? 'C' : 'D'}
                      </div>
                      <div className="text-xs text-gray-500">Reliability Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {report.metrics.avgFollowThrough > 0 ? (
                          <TrendingUp className="w-8 h-8 text-green-500" />
                        ) : (
                          <TrendingDown className="w-8 h-8 text-red-500" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${report.metrics.avgFollowThrough > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {report.metrics.avgFollowThrough > 0 ? '+' : ''}{report.metrics.avgFollowThrough.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Direction Bias</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {report.metrics.noiseRatio < 0.3 ? (
                          <Shield className="w-8 h-8 text-green-500" />
                        ) : report.metrics.noiseRatio < 0.4 ? (
                          <AlertCircle className="w-8 h-8 text-yellow-500" />
                        ) : (
                          <Skull className="w-8 h-8 text-red-500" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${
                        report.metrics.noiseRatio < 0.25 ? 'text-green-500' :
                        report.metrics.noiseRatio < 0.4 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {report.metrics.noiseRatio < 0.25 ? 'Low' :
                         report.metrics.noiseRatio < 0.4 ? 'Med' : 'High'}
                      </div>
                      <div className="text-xs text-gray-500">Noise Level</div>
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                {report.events?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            Historical Events
                            <InfoTooltip content="Real events where actors in this strategy mentioned tokens. Shows the actual price movement that followed.">
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </InfoTooltip>
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Showing {Math.min(report.events.length, 20)} of {report.events.length} events
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Actor
                              <span className="normal-case font-normal ml-1 text-gray-400">(who mentioned)</span>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Token
                              <span className="normal-case font-normal ml-1 text-gray-400">(what was mentioned)</span>
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              24h Move
                              <span className="normal-case font-normal ml-1 text-gray-400">(price change)</span>
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                              Result
                              <span className="normal-case font-normal ml-1 text-gray-400">(profitable?)</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {report.events.slice(0, 20).map((event, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                              <td className="px-4 py-3">
                                <a 
                                  href={`/connections/influencers?actor=${event.actorId}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  @{event.actorId}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${event.asset}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm text-right font-medium ${
                                event.movePercent > 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {event.movePercent > 0 ? '+' : ''}{event.movePercent?.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                {event.wasConfirmed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                    <CheckCircle className="w-3 h-3" />
                                    Hit
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    Miss
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <LineChart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select a Strategy to Begin
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Choose a strategy from the left panel to see how it would have performed historically.
                  Click the arrow on any strategy to learn more about it.
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-1">Research Tool - Not Financial Advice</p>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    This simulation analyzes historical behavior patterns. Past performance does not 
                    guarantee future results. Use for research and understanding market dynamics only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
