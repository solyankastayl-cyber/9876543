/**
 * Exchange Intelligence Panel
 * ===========================
 * Shows real-time exchange data: funding, OI, sectors, patterns.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, Layers, Target, 
  RefreshCw, Info, ChevronDown, ChevronUp, Zap, Clock,
  AlertCircle, CheckCircle, MinusCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FundingSentimentWidget } from './FundingSentimentWidget';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Lifecycle phase styling
const LIFECYCLE_STYLES = {
  BIRTH: { color: 'text-blue-500', bg: 'bg-blue-100', icon: Activity, hint: 'Pattern forming — early opportunity, low confidence' },
  EXPANSION: { color: 'text-green-500', bg: 'bg-green-100', icon: TrendingUp, hint: 'Pattern confirmed — best time to act' },
  PEAK: { color: 'text-orange-500', bg: 'bg-orange-100', icon: AlertCircle, hint: 'Near exhaustion — reduce exposure' },
  DECAY: { color: 'text-red-500', bg: 'bg-red-100', icon: TrendingDown, hint: 'Pattern dying — exit positions' },
  DEATH: { color: 'text-gray-400', bg: 'bg-gray-100', icon: MinusCircle, hint: 'Pattern dead — ignore signals' },
};

// Bucket styling  
const BUCKET_STYLES = {
  CANDIDATE: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  WATCH: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  AVOID: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

function SectorCard({ sector }) {
  const momentumPct = (sector.momentum * 100).toFixed(1);
  const isHot = sector.rotationScore > 0.5;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-2 rounded-lg border ${isHot ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">{sector.sector}</span>
              {isHot && <Zap className="h-3 w-3 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={sector.rotationScore * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-gray-500">{(sector.rotationScore * 100).toFixed(0)}%</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">{sector.sector} Sector</p>
            <p>Momentum: {momentumPct}%</p>
            <p>Breadth: {(sector.breadth * 100).toFixed(0)}% symbols positive</p>
            <p>Dispersion: {(sector.dispersion * 100).toFixed(1)}%</p>
            <p>Squeeze Risk: {(sector.squeezeRisk * 100).toFixed(0)}%</p>
            {sector.topSymbols?.length > 0 && (
              <p>Top: {sector.topSymbols.slice(0, 3).map(s => s.symbol).join(', ')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CandidateRow({ item }) {
  const style = BUCKET_STYLES[item.bucket] || BUCKET_STYLES.WATCH;
  const lifecycle = LIFECYCLE_STYLES[item.lifecycle] || LIFECYCLE_STYLES.BIRTH;
  const LifecycleIcon = lifecycle.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-2 rounded border ${style.border} ${style.bg} cursor-help`}>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">{item.symbol}</span>
                <LifecycleIcon className={`h-3 w-3 ${lifecycle.color}`} />
              </div>
              <Badge variant="outline" className={`text-xs ${style.color}`}>
                {item.bucket}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${item.scoreUp >= 70 ? 'bg-green-500' : item.scoreUp >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                  style={{ width: `${item.scoreUp}%` }}
                />
              </div>
              <span className="text-xs font-mono">{item.scoreUp}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">{item.symbol}</p>
            <p>Score Up: {item.scoreUp}%</p>
            <p>Confidence: {(item.confidence * 100).toFixed(0)}%</p>
            <p className={lifecycle.color}>Lifecycle: {item.lifecycle}</p>
            <p className="text-gray-400">{lifecycle.hint}</p>
            {item.explain?.length > 0 && (
              <div className="pt-1 border-t border-gray-700">
                {item.explain.map((e, i) => (
                  <p key={i}>• {e}</p>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ExchangeIntelligencePanel({ symbol = 'BTCUSDT' }) {
  const [sectors, setSectors] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectorsOpen, setSectorsOpen] = useState(true);
  const [candidatesOpen, setCandidatesOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sectors
        const sectorsRes = await fetch(`${API_URL}/api/market/rotation/sectors?window=4h`);
        const sectorsJson = await sectorsRes.json();
        if (sectorsJson.ok && sectorsJson.sectors?.length > 0) {
          setSectors(sectorsJson.sectors.slice(0, 6));
        } else {
          // Demo data
          setSectors([
            { sector: 'L2', rotationScore: 0.72, momentum: 0.21, breadth: 0.55, dispersion: 0.15, squeezeRisk: 0.2, topSymbols: [{ symbol: 'ARB' }] },
            { sector: 'AI', rotationScore: 0.65, momentum: 0.18, breadth: 0.48, dispersion: 0.18, squeezeRisk: 0.25, topSymbols: [{ symbol: 'FET' }] },
            { sector: 'MEME', rotationScore: 0.58, momentum: 0.15, breadth: 0.42, dispersion: 0.22, squeezeRisk: 0.35, topSymbols: [{ symbol: 'PEPE' }] },
            { sector: 'DEFI', rotationScore: 0.45, momentum: 0.08, breadth: 0.35, dispersion: 0.12, squeezeRisk: 0.15, topSymbols: [{ symbol: 'UNI' }] },
          ]);
        }

        // Fetch ranked alts
        const rankedRes = await fetch(`${API_URL}/api/market/alts/ranked?venue=hyperliquid&horizon=4h&limit=5`);
        const rankedJson = await rankedRes.json();
        if (rankedJson.ok && rankedJson.items?.length > 0) {
          setCandidates(rankedJson.items);
        } else {
          // Demo data
          setCandidates([
            { symbol: 'ARB', scoreUp: 78, confidence: 0.72, bucket: 'CANDIDATE', lifecycle: 'EXPANSION', explain: ['High momentum', 'Funding neutral'] },
            { symbol: 'OP', scoreUp: 71, confidence: 0.68, bucket: 'CANDIDATE', lifecycle: 'EXPANSION', explain: ['L2 sector hot', 'Volume rising'] },
            { symbol: 'FET', scoreUp: 65, confidence: 0.55, bucket: 'WATCH', lifecycle: 'BIRTH', explain: ['AI sector warming', 'Early signal'] },
            { symbol: 'SOL', scoreUp: 52, confidence: 0.45, bucket: 'WATCH', lifecycle: 'PEAK', explain: ['Near exhaustion'] },
          ]);
        }
      } catch (e) {
        console.error('Exchange fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="space-y-4">
      {/* Funding Widget */}
      <FundingSentimentWidget symbol={symbol} />

      {/* Sector Rotation */}
      <Card>
        <Collapsible open={sectorsOpen} onOpenChange={setSectorsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Sector Rotation
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Sector Rotation</strong> shows which crypto sectors have the highest momentum.
                        <br /><br />
                        Hot sectors (green) tend to outperform. Rotation score combines momentum, breadth, and risk.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              {sectorsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : sectors.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {sectors.map((s) => (
                    <SectorCard key={s.sector} sector={s} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No sector data available</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Alt Candidates */}
      <Card>
        <Collapsible open={candidatesOpen} onOpenChange={setCandidatesOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Top Candidates
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Alt Candidates</strong> ranked by probability score.
                        <br /><br />
                        Score combines pattern similarity, funding conditions, lifecycle phase, and historical performance.
                        <br /><br />
                        <strong>CANDIDATE</strong> = High probability
                        <br />
                        <strong>WATCH</strong> = Developing
                        <br />
                        <strong>AVOID</strong> = Poor conditions
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              {candidatesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : candidates.length > 0 ? (
                candidates.map((c) => (
                  <CandidateRow key={c.symbol} item={c} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No candidates found</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export default ExchangeIntelligencePanel;
