/**
 * WalletSignalsBlock - Wallet Signals Component
 * 
 * CONTRACT:
 * - ALWAYS renders when status === 'completed'
 * - Shows signals with baseline deviation evidence
 * - Empty state explains WHAT was checked
 * 
 * Uses: GET /api/wallets/:address/signals
 */
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

/**
 * Get signal severity color
 */
const getSeverityColor = (severity) => {
  if (severity >= 80) return 'bg-red-100 text-red-700 border-red-200';
  if (severity >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (severity >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

/**
 * Get signal icon based on type
 */
const SIGNAL_ICONS = {
  activity_spike: Activity,
  large_move: TrendingUp,
  accumulation: TrendingUp,
  distribution: TrendingDown,
};

/**
 * Single Signal Card
 */
const SignalCard = ({ signal }) => {
  const Icon = SIGNAL_ICONS[signal.type] || Zap;
  const severityColor = getSeverityColor(signal.severity);
  
  return (
    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">{signal.title}</span>
        </div>
        <Badge className={severityColor}>
          {signal.severity}%
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground">
        {signal.description}
      </p>
      
      {signal.evidence && (
        <div className="p-2 bg-white rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Metric</span>
            <span className="font-mono">{signal.evidence.metric}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Baseline</span>
            <span className="font-mono">{signal.evidence.baseline?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Current</span>
            <span className="font-mono">{signal.evidence.current?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Deviation</span>
            <span className="font-mono font-medium text-purple-600">
              {signal.evidence.deviation?.toFixed(1)}x
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * WalletSignalsBlock Component
 * 
 * Uses: GET /api/wallets/:address/signals?window={timeWindow}
 */
export default function WalletSignalsBlock({ 
  walletAddress,
  timeWindow = '24h',
  className = '' 
}) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchSignals() {
      if (!walletAddress) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${walletAddress}/signals?window=${timeWindow}`
        );
        const data = await response.json();
        if (data?.ok && data?.data) {
          setApiData(data.data);
        }
      } catch (err) {
        console.error('Failed to load wallet signals:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSignals();
  }, [walletAddress, timeWindow]);
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const signals = apiData?.signals || [];
  const interpretation = apiData?.interpretation || {};
  const checkedMetrics = apiData?.checkedMetrics || [];
  const baseline = apiData?.baseline || {};
  
  // No signals - show what was checked
  if (signals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Signals
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
              Checked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 bg-slate-50 rounded-xl">
            <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
              <Zap className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {interpretation.headline || 'No signals detected'}
            </p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {interpretation.description || 'Activity is within normal range compared to baseline.'}
            </p>
          </div>
          
          {/* What was checked */}
          {checkedMetrics.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-2">We checked:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                {checkedMetrics.map((metric, i) => (
                  <li key={i}>• {metric}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Baseline info */}
          {baseline.periodDays > 0 && (
            <div className="mt-3 text-center text-xs text-gray-400">
              Baseline: {baseline.periodDays}-day average
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className} data-testid="wallet-signals-block">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Signals
          </div>
          <Badge className="bg-purple-100 text-purple-700">
            {signals.length} signal{signals.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Interpretation banner */}
        {interpretation.headline && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800">{interpretation.headline}</p>
            {interpretation.description && (
              <p className="text-xs text-purple-600 mt-1">{interpretation.description}</p>
            )}
          </div>
        )}
        
        {/* Signal list */}
        {signals.map((signal, i) => (
          <SignalCard key={i} signal={signal} />
        ))}
        
        {/* Baseline reference */}
        {baseline.periodDays > 0 && (
          <div className="text-center text-xs text-gray-400 pt-2">
            Compared to {baseline.periodDays}-day baseline
          </div>
        )}
      </CardContent>
    </Card>
  );
}
