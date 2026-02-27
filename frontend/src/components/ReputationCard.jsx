/**
 * Reputation Card Component (Phase 15 UI)
 * 
 * Complete reputation card for actors/strategies with all metrics.
 */
import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import TrustBadge, { ReliabilityBadge } from './TrustBadge';
import { RegimePerformanceGrid } from './RegimeContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

export default function ReputationCard({ type, targetId }) {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (targetId) {
      fetchReputation();
    }
  }, [type, targetId]);
  
  const fetchReputation = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(
        `${backendUrl}/api/reputation/${type}/${targetId}`
      );
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        console.log('Reputation API returned', response.status);
        setReputation(null);
        return;
      }
      
      const data = await response.json();
      if (data.ok) {
        setReputation(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reputation:', error);
      setReputation(null);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!reputation) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-gray-500">
          No reputation data available
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <span>Reputation</span>
          </div>
          <TrustBadge score={reputation.trustScore} size="lg" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reliability Tier (for actors/strategies) */}
        {reputation.reliabilityTier && (
          <div>
            <ReliabilityBadge tier={reputation.reliabilityTier} />
          </div>
        )}
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Success Rate / Historical Accuracy */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase">Accuracy</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(reputation.successRate || reputation.historicalAccuracy || 0)}
              </span>
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          
          {/* Sample Size */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase">Signals</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {reputation.totalSignals || reputation.sampleSize || 0}
              </span>
            </div>
          </div>
          
          {/* Consistency */}
          {reputation.consistency !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase">Consistency</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(reputation.consistency)}
                </span>
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          )}
          
          {/* Confidence */}
          {reputation.confidence !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase">Confidence</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(reputation.confidence * 100)}
                </span>
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Regime Performance */}
        {reputation.regimePerformance && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Regime Performance
            </h4>
            <RegimePerformanceGrid regimePerformance={reputation.regimePerformance} />
          </div>
        )}
        
        {/* Regime Strengths (for actors) */}
        {reputation.regimeStrengths && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Regime Strengths
            </h4>
            <RegimePerformanceGrid regimePerformance={reputation.regimeStrengths} />
          </div>
        )}
        
        {/* Risk Metrics (for actors) */}
        {(reputation.drawdown !== undefined || reputation.riskAdjustedReturn !== undefined) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Metrics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {reputation.drawdown !== undefined && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase">Max Drawdown</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-red-600">
                        {Math.round(reputation.drawdown)}
                      </span>
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                )}
                {reputation.riskAdjustedReturn !== undefined && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase">Risk-Adj Return</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${reputation.riskAdjustedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reputation.riskAdjustedReturn.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-center pt-2">
          Updated {new Date(reputation.lastUpdatedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
