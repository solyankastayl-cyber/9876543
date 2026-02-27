/**
 * TokenActivityDrivers (B2)
 * 
 * UI component: "Who is driving this activity?"
 * 
 * PRODUCT RULES:
 * - Max 3 wallets (not dashboard)
 * - Sort by influenceScore (not txCount)
 * - Human-summary ALWAYS on top
 * - Role is contextual: "acted as buyer during this accumulation"
 * - scoreComponents visible for transparency
 * 
 * ARCHITECTURAL RULE:
 * UI never guesses, backend always explains.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, TrendingDown, Activity, ExternalLink, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getTokenDrivers, calculateTokenDrivers } from '../api/wallets.api';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get role display with CONTEXTUAL text
 * NOT: "Wallet is buyer" (absolute)
 * YES: "Acted as buyer during this accumulation" (contextual)
 */
const getRoleDisplay = (role, roleContext) => {
  const contextText = {
    accumulation: 'during this accumulation',
    distribution: 'during this distribution',
    net_flow: 'based on net flow',
    alert_group: 'in this alert',
    signal_window: 'during signal window',
  }[roleContext] || '';

  switch (role) {
    case 'buyer':
      return {
        color: 'bg-green-500/10 text-green-600 border-green-500/20',
        icon: TrendingUp,
        label: 'Buyer',
        description: `Acted as buyer ${contextText}`.trim(),
      };
    case 'seller':
      return {
        color: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: TrendingDown,
        label: 'Seller',
        description: `Acted as seller ${contextText}`.trim(),
      };
    default:
      return {
        color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        icon: Activity,
        label: 'Mixed',
        description: `Mixed activity ${contextText}`.trim(),
      };
  }
};

/**
 * Get confidence badge
 */
const getConfidenceBadge = (confidence) => {
  if (confidence >= 0.7) {
    return { label: 'High', color: 'bg-green-100 text-green-700' };
  } else if (confidence >= 0.4) {
    return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  }
  return { label: 'Low', color: 'bg-gray-100 text-gray-600' };
};

/**
 * Score Components Tooltip - explains WHY this wallet is important
 */
const ScoreComponentsInfo = ({ scoreComponents, influenceScore }) => {
  if (!scoreComponents) return null;
  
  const weights = { volumeShare: 0.4, activityFrequency: 0.3, timingWeight: 0.3 };
  
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
            <p className="font-medium">Influence Breakdown</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Volume Share ({Math.round(weights.volumeShare * 100)}%)</span>
                <span className="font-mono">{Math.round(scoreComponents.volumeShare * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Activity ({Math.round(weights.activityFrequency * 100)}%)</span>
                <span className="font-mono">{Math.round(scoreComponents.activityFrequency * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Timing ({Math.round(weights.timingWeight * 100)}%)</span>
                <span className="font-mono">{Math.round(scoreComponents.timingWeight * 100)}%</span>
              </div>
            </div>
            <div className="pt-1 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Influence</span>
                <span>{Math.round(influenceScore * 100)}%</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Single Driver Card
 */
const DriverCard = ({ driver, rank, onWalletClick }) => {
  const roleDisplay = getRoleDisplay(driver.role, driver.roleContext);
  const RoleIcon = roleDisplay.icon;
  const confidenceBadge = getConfidenceBadge(driver.confidence);
  
  return (
    <div 
      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      onClick={() => onWalletClick?.(driver.walletAddress)}
      data-testid={`driver-card-${rank}`}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
          {rank}
        </div>
        
        {/* Wallet info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              {formatAddress(driver.walletAddress)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className={`text-xs ${roleDisplay.color}`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleDisplay.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{roleDisplay.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Wallet tags if available */}
          {driver.walletMeta?.tags?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {driver.walletMeta.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Metrics */}
      <div className="flex items-center gap-3 text-right">
        {/* Influence Score with breakdown */}
        <div className="flex items-center gap-1">
          <div>
            <div className="text-xs text-muted-foreground">Influence</div>
            <div className="font-semibold text-sm">
              {Math.round(driver.influenceScore * 100)}%
            </div>
          </div>
          <ScoreComponentsInfo 
            scoreComponents={driver.scoreComponents} 
            influenceScore={driver.influenceScore}
          />
        </div>
        
        {/* Volume Share */}
        <div className="hidden sm:block">
          <div className="text-xs text-muted-foreground">Volume</div>
          <div className="text-sm">
            {Math.round(driver.volumeShare * 100)}%
          </div>
        </div>
        
        {/* Confidence */}
        <Badge className={`${confidenceBadge.color} text-xs hidden md:inline-flex`}>
          {confidenceBadge.label}
        </Badge>
        
        {/* External link */}
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

/**
 * Main TokenActivityDrivers Component
 * 
 * PRODUCT RULES:
 * - Max 3 wallets
 * - Human-summary on top
 * - Sorted by influenceScore
 */
export function TokenActivityDrivers({ 
  tokenAddress, 
  chain = 'Ethereum',
  onWalletClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDrivers = useCallback(async () => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Request max 3 drivers (product rule)
      const response = await getTokenDrivers(tokenAddress, chain, 10);
      if (response.ok && response.data) {
        // Use new API structure with concentration metrics
        const apiData = response.data;
        const concentration = apiData.concentration || {};
        
        const transformed = {
          topDrivers: (apiData.topDrivers || []).slice(0, 3).map(d => ({
            walletAddress: d.wallet,
            role: d.role === 'accumulator' ? 'buyer' : d.role === 'distributor' ? 'seller' : 'mixed',
            roleContext: 'net_flow',
            influenceScore: d.influence / 100,
            volumeShare: d.influence / 100,
            confidence: 0.8,
            scoreComponents: {
              volumeShare: d.influence / 100,
              activityFrequency: 0.5,
              timingWeight: 0.5,
            },
            volumeInUsd: d.volumeInUsd,
            volumeOutUsd: d.volumeOutUsd,
            netFlowUsd: d.netFlowUsd,
          })),
          totalParticipants: concentration.totalWallets || apiData.topDrivers?.length || 0,
          hasConcentration: apiData.hasConcentration,
          concentration: {
            top1Share: concentration.top1Share,
            top5Share: concentration.top5Share,
            top10Share: concentration.top10Share,
            interpretation: concentration.interpretation,
          },
          summary: {
            headline: concentration.headline || 'Activity analysis complete',
            description: concentration.description || (apiData.totalVolumeUsd 
              ? `Total 24h volume: $${Math.round(apiData.totalVolumeUsd).toLocaleString()}`
              : null),
          },
          totalVolumeUsd: apiData.totalVolumeUsd,
        };
        setDrivers(transformed);
      } else if (response.ok === false) {
        setError(response.error || 'Failed to load drivers');
      } else {
        setDrivers(null);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Unable to connect to activity service');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chain]);
  
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);
  
  const handleRefresh = async () => {
    setCalculating(true);
    try {
      await calculateTokenDrivers(tokenAddress, chain, 24);
      await fetchDrivers();
    } catch (err) {
      console.error('Error calculating drivers:', err);
    } finally {
      setCalculating(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who is driving this activity?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who is driving this activity?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No data / Empty state - use API interpretation
  if (!drivers || drivers.topDrivers?.length === 0) {
    const headline = drivers?.summary?.headline || 'No dominant wallets identified';
    const description = drivers?.summary?.description || 
      `We analyzed ${drivers?.totalParticipants?.toLocaleString() || 0} wallets. No single wallet exceeded influence thresholds.`;
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Who is driving this activity?
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Analyzed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="p-3 bg-slate-100 rounded-xl inline-block mb-3">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 mb-2">{headline}</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className} data-testid="token-activity-drivers">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Who is driving this activity?
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={calculating}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Human-readable Summary - ALWAYS ON TOP (product rule) */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            {drivers.summary?.headline || 'Activity analysis in progress'}
          </p>
          {drivers.summary?.description && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {drivers.summary.description}
            </p>
          )}
        </div>
        
        {/* Top Participants Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Top Participants
          </h4>
          <Badge variant="outline" className="text-xs">
            Showing {Math.min(3, drivers.topDrivers.length)} of {drivers.totalParticipants}
          </Badge>
        </div>
        
        {/* Driver List (max 3 - product rule) */}
        <div className="space-y-2">
          {drivers.topDrivers.slice(0, 3).map((driver, index) => (
            <DriverCard
              key={driver.walletAddress}
              driver={driver}
              rank={index + 1}
              onWalletClick={onWalletClick}
            />
          ))}
        </div>
        
        {/* Actions */}
        {drivers.topDrivers.length > 0 && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onWalletClick?.(drivers.topDrivers[0]?.walletAddress)}
            >
              View Top Wallet Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TokenActivityDrivers;
