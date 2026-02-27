/**
 * Market Gauges - FearGreed and Dominance semicircle gauges
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Dominance Gauge - Semicircle gauge for BTC/Stablecoin dominance
 */
export function DominanceGauge({ value, type }) {
  // BTC Dominance: typical range 40-65%, Stablecoin: 5-15%
  const isBtc = type === 'btc';
  const minVal = isBtc ? 40 : 5;
  const maxVal = isBtc ? 65 : 15;
  
  // Normalize to 0-100 for gauge position
  const normalized = Math.max(0, Math.min(100, ((value - minVal) / (maxVal - minVal)) * 100));
  const angle = (normalized / 100) * 180 - 90;
  
  // Determine color and label based on value
  const getColorInfo = () => {
    if (isBtc) {
      // BTC Dominance: High = BTC strong, Low = Altseason
      if (value >= 60) return { text: 'text-orange-600', label: 'BTC Strong' };
      if (value >= 52) return { text: 'text-amber-600', label: 'Balanced' };
      return { text: 'text-green-600', label: 'Alt Season' };
    } else {
      // Stablecoin: High = Risk-Off, Low = Risk-On
      if (value >= 12) return { text: 'text-red-600', label: 'Risk-Off' };
      if (value >= 8) return { text: 'text-amber-600', label: 'Neutral' };
      return { text: 'text-green-600', label: 'Risk-On' };
    }
  };
  
  const colorInfo = getColorInfo();
  const gradientId = `dominanceGradient_${type}`;
  
  // Gradient colors
  const gradientColors = isBtc 
    ? ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ea580c']
    : ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-center cursor-help hover:scale-105 transition-transform">
            <div className="relative w-20 h-12">
              <svg viewBox="0 0 100 55" className="w-full h-full">
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    {gradientColors.map((color, i) => (
                      <stop key={i} offset={`${i * 25}%`} stopColor={color} />
                    ))}
                  </linearGradient>
                </defs>
                
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                
                <g transform={`rotate(${angle}, 50, 50)`}>
                  <line x1="50" y1="50" x2="50" y2="18" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4" fill="#1f2937" />
                </g>
              </svg>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <span className={`text-lg font-bold ${colorInfo.text}`}>{value.toFixed(1)}%</span>
              </div>
            </div>
            
            <span className="text-[9px] font-semibold text-gray-600 mt-0.5">
              {isBtc ? 'BTC Dominance' : 'Stable Dom.'}
            </span>
            <span className={`text-[8px] font-medium ${colorInfo.text}`}>{colorInfo.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
          <p className="text-xs font-medium mb-1">
            {isBtc ? 'Bitcoin Dominance' : 'Stablecoin Dominance'}: {value.toFixed(1)}%
          </p>
          <p className="text-xs opacity-80">
            {isBtc 
              ? 'High = BTC strength, Low = capital rotating to altcoins (Alt Season)'
              : 'High = Risk-off (capital fleeing to safety), Low = Risk-on appetite'
            }
          </p>
          <p className={`text-xs mt-1 ${colorInfo.text}`}>Current: {colorInfo.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Fear & Greed Gauge - Classic semicircle gauge visualization
 */
export function FearGreedGauge({ value }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180 - 90;
  
  const getColor = (v) => {
    if (v <= 25) return { text: 'text-red-600', label: 'Extreme Fear' };
    if (v <= 45) return { text: 'text-orange-600', label: 'Fear' };
    if (v <= 55) return { text: 'text-amber-600', label: 'Neutral' };
    if (v <= 75) return { text: 'text-lime-600', label: 'Greed' };
    return { text: 'text-green-600', label: 'Extreme Greed' };
  };
  
  const colorInfo = getColor(clampedValue);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-center cursor-help hover:scale-105 transition-transform">
            <div className="relative w-20 h-12">
              <svg viewBox="0 0 100 55" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="25%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="75%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                
                <g transform={`rotate(${angle}, 50, 50)`}>
                  <line x1="50" y1="50" x2="50" y2="18" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4" fill="#1f2937" />
                </g>
              </svg>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <span className={`text-lg font-bold ${colorInfo.text}`}>{clampedValue}</span>
              </div>
            </div>
            
            <span className="text-[9px] font-semibold text-gray-600 mt-0.5">Fear & Greed</span>
            <span className={`text-[8px] font-medium ${colorInfo.text}`}>{colorInfo.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
          <p className="text-xs font-medium mb-1">Fear & Greed Index: {clampedValue}</p>
          <p className="text-xs opacity-80">0-25: Extreme Fear, 26-45: Fear, 46-55: Neutral, 56-75: Greed, 76-100: Extreme Greed</p>
          <p className="text-xs text-amber-400 mt-1">Current: {colorInfo.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
