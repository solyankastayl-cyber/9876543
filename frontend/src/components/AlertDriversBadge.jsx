/**
 * AlertDriversBadge (B2)
 * 
 * Compact badge showing "Driven by Wallet A and 1 more" in alert cards
 * 
 * ARCHITECTURAL RULES:
 * - A4 Dispatcher does NOT form drivers
 * - Drivers come ONLY from B2
 * - Empty state: "Behavior detected" (not error - crowd behavior)
 * - Role is contextual with roleContext
 * - scoreComponents visible in expanded view
 */
import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getAlertGroupDrivers } from '../api/wallets.api';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get role emoji with context
 */
const getRoleEmoji = (role) => {
  switch (role) {
    case 'buyer': return '📈';
    case 'seller': return '📉';
    default: return '📊';
  }
};

/**
 * Get role text with context
 */
const getRoleText = (role, roleContext) => {
  const contextText = {
    accumulation: 'in accumulation',
    distribution: 'in distribution',
    net_flow: 'by flow',
    alert_group: 'in alert',
    signal_window: 'during signal',
  }[roleContext] || '';
  
  return `${role} ${contextText}`.trim();
};

/**
 * Compact drivers badge for alert cards
 * 
 * Empty state behavior:
 * - label: "Behavior detected"
 * - tooltip: "No dominant wallets identified for this activity"
 * - Empty driver ≠ error (sometimes market moves as "crowd")
 */
export function AlertDriversBadge({ 
  groupId, 
  onClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!groupId) return;
    
    const fetchDrivers = async () => {
      try {
        const response = await getAlertGroupDrivers(groupId);
        if (response.ok) {
          setDrivers(response.data);
        }
      } catch (err) {
        console.error('Error fetching alert drivers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, [groupId]);
  
  if (loading) {
    return (
      <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
    );
  }
  
  // Empty state: "Behavior detected" - not an error
  if (!drivers || !drivers.hasDrivers || drivers.drivers?.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`cursor-help ${className}`}
              data-testid="alert-drivers-badge-empty"
            >
              <Users className="w-3 h-3 mr-1 opacity-50" />
              Behavior detected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">No dominant wallets identified for this activity</p>
            <p className="text-xs text-muted-foreground mt-1">Market may be moving as "crowd"</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${className}`}
            onClick={() => onClick?.(drivers)}
            data-testid="alert-drivers-badge"
          >
            <Users className="w-3 h-3 mr-1" />
            {drivers.driverSummary}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Activity Drivers</p>
            <div className="space-y-1">
              {drivers.drivers.slice(0, 3).map((driver, i) => (
                <div key={driver.walletAddress} className="flex items-center gap-2 text-sm">
                  <span>{getRoleEmoji(driver.role)}</span>
                  <span className="font-mono">{formatAddress(driver.walletAddress)}</span>
                  <span className="text-muted-foreground text-xs">
                    {Math.round(driver.influenceScore * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Expanded drivers panel for alert detail view
 * Shows scoreComponents for transparency
 */
export function AlertDriversPanel({ 
  groupId,
  onWalletClick,
  className = '',
}) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!groupId) return;
    
    const fetchDrivers = async () => {
      try {
        const response = await getAlertGroupDrivers(groupId);
        if (response.ok) {
          setDrivers(response.data);
        }
      } catch (err) {
        console.error('Error fetching alert drivers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, [groupId]);
  
  if (loading) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!drivers || !drivers.hasDrivers || drivers.drivers?.length === 0) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-sm text-slate-600">Behavior Detected</span>
        </div>
        <p className="text-sm text-muted-foreground">
          No dominant wallets identified for this activity. Market may be moving as "crowd" without individual actors driving the behavior.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${className}`} data-testid="alert-drivers-panel">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-sm">Activity Drivers</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {drivers.driverSummary}
      </p>
      
      <div className="space-y-2">
        {drivers.drivers.map((driver) => (
          <div 
            key={driver.walletAddress}
            className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-gray-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            onClick={() => onWalletClick?.(driver.walletAddress)}
          >
            <div className="flex items-center gap-2">
              <span>{getRoleEmoji(driver.role)}</span>
              <span className="font-mono text-sm">{formatAddress(driver.walletAddress)}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {getRoleText(driver.role, driver.roleContext)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-right">
                <span className="font-medium">{Math.round(driver.influenceScore * 100)}%</span>
                <span className="text-muted-foreground ml-1">influence</span>
              </div>
              {/* Score breakdown tooltip */}
              {driver.scoreComponents && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 hover:bg-slate-100 rounded">
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div className="space-y-1">
                        <div>Volume: {Math.round(driver.scoreComponents.volumeShare * 100)}%</div>
                        <div>Activity: {Math.round(driver.scoreComponents.activityFrequency * 100)}%</div>
                        <div>Timing: {Math.round(driver.scoreComponents.timingWeight * 100)}%</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertDriversBadge;
