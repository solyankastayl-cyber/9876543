/**
 * Panel Helper Components for FOMO AI Page
 */

import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Layer Row - For "Why This Decision" panel
 */
export function LayerRow({ icon: Icon, label, status, statusColor, tooltip }) {
  const colors = {
    green: 'bg-green-100 text-green-700 shadow-sm',
    red: 'bg-red-100 text-red-700 shadow-sm',
    amber: 'bg-amber-100 text-amber-700 shadow-sm',
    gray: 'bg-gray-100 text-gray-600',
  };

  const iconColors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-500',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded-md ${iconColors[statusColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger><Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors" /></TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0"><p className="text-xs">{tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge className={colors[statusColor]}>{status}</Badge>
      </div>
    </div>
  );
}

/**
 * Influence Row - For Labs Attribution panel
 */
export function InfluenceRow({ label, status, value, color }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-amber-600';
  const bgClass = color === 'green' ? 'bg-green-50' : color === 'red' ? 'bg-red-50' : 'bg-amber-50';
  const Icon = color === 'green' ? CheckCircle : color === 'red' ? XCircle : AlertTriangle;
  
  return (
    <div className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors duration-200 hover:${bgClass}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`text-xs font-semibold ${colorClass}`}>{status}</span>
        <span className="text-xs text-gray-400 tabular-nums bg-gray-100 px-1.5 py-0.5 rounded">{value}</span>
      </div>
    </div>
  );
}

/**
 * Sector Bar - For Sector Rotation panel
 */
export function SectorBar({ label, value, momentum, topSymbol, index }) {
  const getBarColor = (val) => {
    if (val >= 50) return 'from-green-400 to-emerald-500';
    if (val >= 35) return 'from-blue-400 to-cyan-500';
    if (val >= 25) return 'from-amber-400 to-orange-500';
    return 'from-gray-300 to-gray-400';
  };

  const sectorIcons = {
    GAMING: '🎮',
    RWA: '🏛️',
    L2: '⚡',
    AI: '🤖',
    MEME: '🐸',
    INFRA: '🔧',
    DEFI: '💰',
    NFT: '🖼️',
  };

  const icon = sectorIcons[label] || '📊';
  const momentumStr = momentum ? (momentum > 0 ? `+${(momentum * 100).toFixed(2)}%` : `${(momentum * 100).toFixed(2)}%`) : null;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 group cursor-help">
            <span className="text-base">{icon}</span>
            <span className="w-14 text-xs font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${getBarColor(value)} rounded-full transition-all duration-500`}
                style={{width: `${Math.min(value, 100)}%`}} 
              />
            </div>
            <span className={`w-10 text-xs text-right font-bold tabular-nums ${
              value >= 50 ? 'text-green-600' : value >= 35 ? 'text-blue-600' : 'text-gray-600'
            }`}>{value}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
          <p className="text-xs font-medium mb-1">{label} Sector</p>
          <p className="text-xs opacity-80">Rotation Score: {value}%</p>
          {momentumStr && <p className="text-xs opacity-80">Momentum: {momentumStr}</p>}
          {topSymbol && <p className="text-xs opacity-80">Top Symbol: {topSymbol}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Get Flag Description - For applied flags badges
 */
export function getFlagDescription(flag) {
  const descriptions = {
    PASS_DATA_MODE: 'Real-time market data verified and reliable',
    PASS_ML_READY: 'ML models calibrated with sufficient data',
    WARN_ML_DRIFT: 'ML model performance degradation detected',
    PASS_WHALE_RISK: 'No significant whale activity detected',
    PASS_MARKET_STRESS: 'Market stress within normal bounds',
    PASS_NO_CONTRADICTION: 'All signal layers aligned',
    VERDICT_BULLISH: 'Final bullish verdict',
    VERDICT_BEARISH: 'Final bearish verdict',
    VERDICT_NEUTRAL: 'No clear directional signal',
    CONFIDENCE_BELOW_BUY_THRESHOLD: 'Confidence too low for BUY signal',
    GATE_CONTRADICTION: 'Signal contradiction detected',
  };
  return descriptions[flag] || 'Analysis pipeline flag';
}
