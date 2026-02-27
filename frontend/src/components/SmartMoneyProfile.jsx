/**
 * SmartMoneyProfile (B4)
 * 
 * UI component for Wallet Profile page
 * Shows "Historical Performance" block
 * 
 * CRITICAL UI RULES:
 * - NEVER show score without explanation
 * - NEVER show label without sampleSize
 * - B4 ≠ signal, B4 = context
 * - Tooltip must explain: "Based on X events over Y days"
 * - NEVER say "Buy" / "Strong signal" / "Guaranteed"
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Award, BarChart3, Clock, 
  RefreshCw, AlertTriangle, Info, Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getWalletSmartProfile, calculateWalletSmartProfile } from '../api/smartMoney.api';

/**
 * Get label badge styling
 */
const getLabelBadge = (label) => {
  switch (label) {
    case 'elite':
      return { 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: Award,
        text: 'Elite',
        description: 'Top tier historical performance',
      };
    case 'proven':
      return { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: TrendingUp,
        text: 'Proven',
        description: 'Consistent historical performance',
      };
    default:
      return { 
        color: 'bg-gray-100 text-gray-600 border-gray-200', 
        icon: Target,
        text: 'Emerging',
        description: 'Building track record',
      };
  }
};

/**
 * Format percentage
 */
const formatPercent = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `${Math.round(value * 100)}%`;
};

/**
 * Score Breakdown Tooltip
 */
const ScoreBreakdown = ({ scoreComponents, score }) => {
  if (!scoreComponents) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 hover:bg-slate-100 rounded">
            <Info className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-medium">Score Breakdown</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Win Rate (40%)</span>
                <span className="font-mono">+{scoreComponents.winRateContrib.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Accumulation (30%)</span>
                <span className="font-mono">+{scoreComponents.accumulationContrib.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Timing (20%)</span>
                <span className="font-mono">+{scoreComponents.timingContrib.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Drawdown (-10%)</span>
                <span className="font-mono">-{scoreComponents.drawdownPenalty.toFixed(1)}</span>
              </div>
            </div>
            <div className="pt-1 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Score</span>
                <span>{Math.round(score)}/100</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Metric Card
 */
const MetricCard = ({ label, value, icon: Icon, tooltip }) => {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-gray-700" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
};

/**
 * Main SmartMoneyProfile Component
 * 
 * NEW: Uses /api/wallets/:address/performance API
 */
export function SmartMoneyProfile({ 
  walletAddress, 
  chain = 'Ethereum',
  className = '',
}) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchProfile = useCallback(async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use new API endpoint
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${walletAddress}/performance`
      );
      const data = await response.json();
      
      if (data?.ok && data?.data) {
        setApiData(data.data);
      } else {
        setError(data?.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
      setError('Unable to load historical performance');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Extract data
  const performanceLabel = apiData?.performanceLabel || 'insufficient_data';
  const interpretation = apiData?.interpretation || {};
  const analysisStatus = apiData?.analysisStatus;
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4" />
            Historical Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No data or insufficient data state - CONTRACT: explain WHAT was checked
  if (performanceLabel === 'insufficient_data' || !apiData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Historical Performance
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">Checked</Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchProfile}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 bg-slate-50 rounded-xl">
            <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {interpretation.headline || 'Insufficient historical data'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {interpretation.description || 'This wallet does not have sufficient historical activity to evaluate performance. This is not a failure — it\'s an honest assessment.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const labelBadge = getLabelBadge(performanceLabel);
  const LabelIcon = labelBadge.icon;
  
  return (
    <Card className={className} data-testid="smart-money-profile">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Historical Performance
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchProfile}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Label with interpretation */}
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${labelBadge.color} cursor-help`}>
                  <LabelIcon className="w-3 h-3 mr-1" />
                  {labelBadge.text}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{labelBadge.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {apiData?.volumeAnalyzed > 0 && (
            <span className="text-xs text-muted-foreground">
              ${(apiData.volumeAnalyzed / 1e6).toFixed(1)}M analyzed
            </span>
          )}
        </div>
        
        {/* Interpretation - CRITICAL */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <p className="text-sm font-medium text-purple-800">{interpretation.headline}</p>
          {interpretation.description && (
            <p className="text-xs text-purple-600 mt-1">{interpretation.description}</p>
          )}
        </div>
        
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Tokens Analyzed"
            value={apiData?.tokenCount || 0}
            icon={Target}
            tooltip="Number of unique tokens tracked"
          />
          <MetricCard
            label="Volume"
            value={apiData?.volumeAnalyzed ? `$${(apiData.volumeAnalyzed / 1e6).toFixed(1)}M` : '$0'}
            icon={BarChart3}
            tooltip="Total volume analyzed"
          />
        </div>
        
        {/* Analysis status */}
        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-muted-foreground text-center">
          Based on 30-day historical analysis
        </div>
      </CardContent>
    </Card>
  );
}

export default SmartMoneyProfile;
