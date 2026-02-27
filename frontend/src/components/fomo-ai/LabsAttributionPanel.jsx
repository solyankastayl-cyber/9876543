/**
 * Labs Attribution Panel — FOMO AI
 * 
 * Shows which Labs influenced the decision:
 * - Which Labs contributed to BUY/SELL/AVOID
 * - Positive vs Negative influences
 * - Confidence adjustments from Labs
 * 
 * Labs → FOMO AI Attribution
 */

import { useState, useEffect } from 'react';
import { 
  FlaskConical, ChevronRight, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Map Lab states to influence direction
const getLabInfluence = (labName, labData) => {
  if (!labData) return null;
  
  const { state, confidence, risks } = labData;
  
  // Positive influences (support BUY)
  const positiveStates = [
    'STRONG_CONFIRMATION', 'ACCUMULATION', 'BUY_DOMINANT', 'ACCELERATING',
    'TRENDING_UP', 'DEEP_LIQUIDITY', 'STABLE', 'CLEAN', 'ALIGNED'
  ];
  
  // Negative influences (support SELL or AVOID)
  const negativeStates = [
    'DISTRIBUTION', 'SELL_DOMINANT', 'DECELERATING', 'TRENDING_DOWN',
    'PANIC', 'CASCADE_RISK', 'MANIPULATION', 'STRONG_CONFLICT', 
    'UNTRUSTED', 'DEGRADED', 'THIN_LIQUIDITY', 'LONGS_AT_RISK'
  ];
  
  // Warning influences (caution)
  const warningStates = [
    'WEAK_CONFIRMATION', 'NO_CONFIRMATION', 'REVERSAL_RISK', 'STRESSED',
    'HIGH_VOL', 'PARTIAL_CONFLICT', 'PARTIAL', 'TRANSITION', 'CHAOTIC'
  ];
  
  let direction = 'neutral';
  let weight = confidence * 0.5;
  
  if (positiveStates.includes(state)) {
    direction = 'positive';
    weight = confidence;
  } else if (negativeStates.includes(state)) {
    direction = 'negative';
    weight = confidence;
  } else if (warningStates.includes(state)) {
    direction = 'warning';
    weight = confidence * 0.7;
  }
  
  // Boost weight if risks present
  if (risks && risks.length > 0) {
    if (direction === 'negative') weight = Math.min(weight * 1.2, 1);
    if (direction === 'positive') weight = weight * 0.8;
  }
  
  return {
    labName,
    state,
    direction,
    weight,
    confidence,
    risks: risks || [],
    summary: labData.explain?.summary || state,
  };
};

// Group labels for display
const LAB_DISPLAY = {
  regime: { name: 'Regime', group: 'Structure' },
  volatility: { name: 'Volatility', group: 'Structure' },
  liquidity: { name: 'Liquidity', group: 'Structure' },
  marketStress: { name: 'Stress', group: 'Structure' },
  volume: { name: 'Volume', group: 'Flow' },
  flow: { name: 'Flow', group: 'Flow' },
  momentum: { name: 'Momentum', group: 'Flow' },
  participation: { name: 'Participation', group: 'Flow' },
  whale: { name: 'Whale', group: 'Smart Money' },
  accumulation: { name: 'Accumulation', group: 'Smart Money' },
  manipulation: { name: 'Manipulation', group: 'Risk' },
  liquidation: { name: 'Liquidation', group: 'Risk' },
  corridor: { name: 'Corridor', group: 'Price' },
  supportResistance: { name: 'S/R', group: 'Price' },
  priceAcceptance: { name: 'Acceptance', group: 'Price' },
  dataQuality: { name: 'Data Quality', group: 'Meta' },
  signalConflict: { name: 'Conflicts', group: 'Meta' },
  stability: { name: 'Stability', group: 'Meta' },
};

export function LabsAttributionPanel({ symbol, decision }) {
  const [labs, setLabs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v10/exchange/labs/v3/all?symbol=${symbol}`);
        if (res.data?.ok) {
          setLabs(res.data.snapshot?.labs);
        }
      } catch (err) {
        console.error('Labs fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLabs();
    const interval = setInterval(fetchLabs, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!labs) return null;

  // Calculate influences
  const influences = Object.entries(labs)
    .map(([name, data]) => getLabInfluence(name, data))
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);

  const positive = influences.filter(i => i.direction === 'positive');
  const negative = influences.filter(i => i.direction === 'negative');
  const warning = influences.filter(i => i.direction === 'warning');
  
  // Calculate overall sentiment
  const positiveScore = positive.reduce((sum, i) => sum + i.weight, 0);
  const negativeScore = negative.reduce((sum, i) => sum + i.weight, 0);
  const totalScore = positiveScore + negativeScore;
  const sentimentRatio = totalScore > 0 ? positiveScore / totalScore : 0.5;

  // Top influences (most impactful)
  const topInfluences = influences.slice(0, 6);

  return (
    <Card data-testid="labs-attribution-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            Labs Attribution
          </CardTitle>
          <Badge 
            variant="outline" 
            className={
              sentimentRatio > 0.6 ? 'bg-green-50 text-green-700' :
              sentimentRatio < 0.4 ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'
            }
          >
            {sentimentRatio > 0.6 ? 'Bullish Bias' :
             sentimentRatio < 0.4 ? 'Bearish Bias' : 'Mixed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sentiment Bar */}
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              style={{ 
                width: '100%',
                clipPath: `inset(0 ${(1 - sentimentRatio) * 100}% 0 0)` 
              }}
            />
          </div>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-green-600">Bullish</p>
            <p className="font-bold text-green-700">{positive.length}</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <p className="text-xs text-yellow-600">Caution</p>
            <p className="font-bold text-yellow-700">{warning.length}</p>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <p className="text-xs text-red-600">Bearish</p>
            <p className="font-bold text-red-700">{negative.length}</p>
          </div>
        </div>

        {/* Top Influences */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase">Key Influences</p>
          {topInfluences.map((inf) => {
            const display = LAB_DISPLAY[inf.labName] || { name: inf.labName, group: 'Other' };
            return (
              <div 
                key={inf.labName}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  inf.direction === 'positive' ? 'bg-green-50' :
                  inf.direction === 'negative' ? 'bg-red-50' :
                  'bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {inf.direction === 'positive' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  ) : inf.direction === 'negative' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                  )}
                  <span className="font-medium">{display.name}</span>
                  <span className="text-xs text-gray-500">{inf.state.replace(/_/g, ' ')}</span>
                </div>
                <span className={`text-xs font-medium ${
                  inf.direction === 'positive' ? 'text-green-700' :
                  inf.direction === 'negative' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {(inf.weight * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {influences.length > 6 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1"
          >
            {expanded ? 'Show less' : `Show all ${influences.length} Labs`}
          </button>
        )}

        {/* All Labs (expanded) */}
        {expanded && (
          <div className="space-y-1 pt-2 border-t border-gray-100">
            {influences.slice(6).map((inf) => {
              const display = LAB_DISPLAY[inf.labName] || { name: inf.labName, group: 'Other' };
              return (
                <div 
                  key={inf.labName}
                  className="flex items-center justify-between py-1 text-xs"
                >
                  <span className="text-gray-600">{display.name}</span>
                  <span className={
                    inf.direction === 'positive' ? 'text-green-600' :
                    inf.direction === 'negative' ? 'text-red-600' :
                    'text-yellow-600'
                  }>
                    {inf.state.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to Labs */}
        <a 
          href={`/exchange/labs?symbol=${symbol}`}
          className="block text-center text-xs text-gray-500 hover:text-blue-600 pt-2"
        >
          View all Labs →
        </a>
      </CardContent>
    </Card>
  );
}
