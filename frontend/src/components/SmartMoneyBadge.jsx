/**
 * SmartMoneyBadge (B4)
 * 
 * Compact badge for Token Page (B2 drivers) and Alerts
 * Shows "Historically profitable wallets involved"
 * 
 * CRITICAL UI RULES:
 * - B4 ≠ signal, B4 = context
 * - NEVER say "Buy" / "Strong signal" / "Guaranteed"
 * - Tooltip: "Wallets with strong historical correlation to positive outcomes"
 * - Always explain with sample size
 */
import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getSmartMoneySummary, getAlertSmartMoneyContext } from '../api/smartMoney.api';

/**
 * Format wallet address
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Smart Money Badge for Token Activity Drivers (B2)
 * Shows if historically profitable wallets are involved
 */
export function SmartMoneyDriversBadge({ 
  driverAddresses,
  className = '',
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!driverAddresses || driverAddresses.length === 0) {
      setLoading(false);
      return;
    }
    
    const fetchSummary = async () => {
      try {
        const response = await getSmartMoneySummary(driverAddresses);
        if (response.ok) {
          setSummary(response.data);
        }
      } catch (err) {
        console.error('Error fetching smart money summary:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [driverAddresses]);
  
  if (loading || !summary || !summary.hasSmartMoney) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`bg-purple-100 text-purple-700 border-purple-200 cursor-help ${className}`}
            data-testid="smart-money-drivers-badge"
          >
            <Award className="w-3 h-3 mr-1" />
            Smart Money Involved
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-medium">{summary.summary}</p>
            <p className="text-muted-foreground">{summary.tooltip}</p>
            {summary.topPerformer && (
              <div className="pt-1 border-t">
                <p className="text-muted-foreground">
                  Top performer: {formatAddress(summary.topPerformer.subjectId)}
                </p>
                <p className="text-muted-foreground">
                  {Math.round(summary.topPerformer.winRate * 100)}% win rate • {summary.topPerformer.sampleSize} events
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Smart Money Badge for Alert Cards
 * Shows smart money context for an alert group
 * 
 * CRITICAL: Never says "Buy signal" or "Strong signal"
 * Only provides context about historical performance
 */
export function AlertSmartMoneyBadge({ 
  groupId,
  className = '',
}) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    
    const fetchContext = async () => {
      try {
        const response = await getAlertSmartMoneyContext(groupId);
        if (response.ok) {
          setContext(response.data);
        }
      } catch (err) {
        console.error('Error fetching alert smart money context:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContext();
  }, [groupId]);
  
  if (loading || !context || !context.smartMoneyInvolved) {
    return null;
  }
  
  // Determine badge style based on label counts
  const hasElite = context.labelCounts.elite > 0;
  const hasProven = context.labelCounts.proven > 0;
  
  const badgeClass = hasElite 
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : hasProven
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';
  
  const Icon = hasElite ? Award : TrendingUp;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`cursor-help ${badgeClass} ${className}`}
            data-testid="alert-smart-money-badge"
          >
            <Icon className="w-3 h-3 mr-1" />
            Smart Money
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            {/* Context text - CRITICAL: no "buy signal" language */}
            <p className="font-medium">{context.contextText}</p>
            
            {/* Label breakdown */}
            <div className="flex gap-2">
              {context.labelCounts.elite > 0 && (
                <span className="text-purple-600">
                  {context.labelCounts.elite} elite
                </span>
              )}
              {context.labelCounts.proven > 0 && (
                <span className="text-green-600">
                  {context.labelCounts.proven} proven
                </span>
              )}
              {context.labelCounts.emerging > 0 && (
                <span className="text-gray-500">
                  {context.labelCounts.emerging} emerging
                </span>
              )}
            </div>
            
            {/* Disclaimer - CRITICAL */}
            <p className="text-muted-foreground italic">
              Historical performance does not guarantee future results
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline Smart Money Indicator
 * For use in driver cards in TokenActivityDrivers
 */
export function SmartMoneyIndicator({ 
  label,
  winRate,
  sampleSize,
  compact = false,
}) {
  if (!label || label === 'emerging') {
    return null;
  }
  
  const Icon = label === 'elite' ? Award : TrendingUp;
  const color = label === 'elite' ? 'text-purple-600' : 'text-green-600';
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Icon className={`w-4 h-4 ${color}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {label === 'elite' ? 'Elite' : 'Proven'} performer: {Math.round(winRate * 100)}% win rate ({sampleSize} events)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${color} border-current cursor-help`}>
            <Icon className="w-3 h-3 mr-1" />
            {label === 'elite' ? 'Elite' : 'Proven'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {Math.round(winRate * 100)}% win rate based on {sampleSize} historical events
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SmartMoneyDriversBadge;
