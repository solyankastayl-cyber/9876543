/**
 * Risk Analysis Components - Panel and Compact versions
 */

import { Shield, CheckCircle, AlertTriangle, Info, Brain, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Risk definitions with human-readable text and explanations
export const RISK_DEFINITIONS = {
  SIGNAL_CONTRADICTION: {
    title: 'Signal Contradiction',
    shortDesc: 'Orderbook vs Price trend',
    fullDesc: 'Price is moving in one direction, but orderbook pressure suggests the opposite. Signal may be unreliable.',
    severity: 'medium',
    icon: 'split',
    advice: 'Wait for direction confirmation',
  },
  ML_DRIFT: {
    title: 'ML Model Drift',
    shortDesc: 'Calibration uncertain',
    fullDesc: 'Machine learning model shows deviation from historical patterns. Prediction accuracy may be reduced.',
    severity: 'low',
    icon: 'brain',
    advice: 'Confidence values less reliable',
  },
  WHALE_RISK_HIGH: {
    title: 'High Whale Risk',
    shortDesc: 'Large positions detected',
    fullDesc: 'Extreme funding rates indicate large positions by whales. Possible manipulation or liquidation cascade.',
    severity: 'high',
    icon: 'whale',
    advice: 'High risk of sudden moves',
  },
  WHALE_RISK_MEDIUM: {
    title: 'Medium Whale Risk',
    shortDesc: 'Elevated positions',
    fullDesc: 'Funding rates above normal, suggesting accumulation by large players.',
    severity: 'medium',
    icon: 'whale',
    advice: 'Watch for sudden changes',
  },
  STRESS_EXTREME: {
    title: 'Extreme Market Stress',
    shortDesc: 'Very high volatility',
    fullDesc: 'Market showing extreme volatility (>5% per hour). Highly unstable conditions.',
    severity: 'high',
    icon: 'activity',
    advice: 'Extremely risky to enter position',
  },
  STRESS_ELEVATED: {
    title: 'Elevated Market Stress',
    shortDesc: 'High volatility',
    fullDesc: 'Volatility above normal (>2% per hour). Market is unstable.',
    severity: 'medium',
    icon: 'activity',
    advice: 'Use smaller position size',
  },
  NO_LIVE_DATA: {
    title: 'No Live Data',
    shortDesc: 'Using cached data',
    fullDesc: 'Real-time exchange data unavailable. Signals based on stale information.',
    severity: 'high',
    icon: 'wifi-off',
    advice: 'Wait for connection to restore',
  },
};

// Helper to get risk info
const getRiskInfo = (riskCode) => {
  if (RISK_DEFINITIONS[riskCode]) return RISK_DEFINITIONS[riskCode];
  for (const key of Object.keys(RISK_DEFINITIONS)) {
    if (riskCode.includes(key) || key.includes(riskCode.replace('_', ''))) {
      return RISK_DEFINITIONS[key];
    }
  }
  return {
    title: riskCode.replace(/_/g, ' '),
    shortDesc: 'Risk detected',
    fullDesc: 'System detected a potential risk for the current signal.',
    severity: 'medium',
    icon: 'alert',
    advice: 'Proceed with caution',
  };
};

// Severity styles
const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'high':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
    case 'medium':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' };
    default:
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' };
  }
};

// Risk Icon Component
const RiskIcon = ({ type, className }) => {
  switch (type) {
    case 'split':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
        </svg>
      );
    case 'brain':
      return <Brain className={className} />;
    case 'whale':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
    case 'activity':
      return <Activity className={className} />;
    case 'wifi-off':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
      );
    default:
      return <AlertTriangle className={className} />;
  }
};

/**
 * Risk Analysis Panel - Full panel with detailed risk info
 */
export function RiskAnalysisPanel({ risks, dataMode }) {
  const hasRisks = risks && risks.length > 0;

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mt-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${hasRisks ? 'bg-amber-100' : 'bg-green-100'}`}>
            <Shield className={`w-4 h-4 ${hasRisks ? 'text-amber-600' : 'text-green-600'}`} />
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-800">Risk Analysis</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-gray-400 ml-1.5 inline hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                  <p className="text-xs font-medium mb-1">Why Risk Analysis?</p>
                  <p className="text-xs opacity-80">Alerts you when signal reliability may be compromised.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs ${dataMode === 'LIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
          {dataMode === 'LIVE' ? '● LIVE' : dataMode || 'LIVE'}
        </Badge>
      </div>

      {!hasRisks ? (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">No risks detected</p>
            <p className="text-xs text-green-600 mt-0.5">Signal can be considered without additional restrictions</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((riskCode, i) => {
            const info = getRiskInfo(riskCode);
            const styles = getSeverityStyles(info.severity);
            
            return (
              <TooltipProvider key={i} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-3 rounded-lg border cursor-help transition-all hover:shadow-md ${styles.bg} ${styles.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${styles.badge}`}>
                          <RiskIcon type={info.icon} className={`w-4 h-4 ${styles.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${styles.text}`}>{info.title}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${styles.badge}`}>
                              {info.severity === 'high' ? 'High' : info.severity === 'medium' ? 'Medium' : 'Low'}
                            </Badge>
                          </div>
                          <p className={`text-xs mt-1 ${styles.text} opacity-80`}>{info.shortDesc}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-gray-900 text-white border-0 max-w-xs p-3">
                    <p className="text-xs font-semibold mb-2">{info.title}</p>
                    <p className="text-xs opacity-90 mb-2">{info.fullDesc}</p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-700">
                      <span className="text-[10px] text-amber-400 font-medium">💡 {info.advice}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Risk Analysis Compact - For header row
 */
export function RiskAnalysisCompact({ risks }) {
  const hasRisks = risks && risks.length > 0;

  if (!hasRisks) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">No Risks</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg cursor-help hover:shadow-md transition-all">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {risks.length} Risk{risks.length > 1 ? 's' : ''}
            </span>
            <div className="flex -space-x-1">
              {risks.slice(0, 3).map((risk, i) => {
                const info = getRiskInfo(risk);
                const bgColor = info.severity === 'high' ? 'bg-red-400' : 
                               info.severity === 'medium' ? 'bg-amber-400' : 'bg-orange-400';
                return <div key={i} className={`w-2 h-2 rounded-full ${bgColor} border border-white`} />;
              })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-900 text-white border-0 max-w-sm p-3">
          <p className="text-xs font-semibold mb-2">Active Risks</p>
          <div className="space-y-1.5">
            {risks.map((risk, i) => {
              const info = getRiskInfo(risk);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    info.severity === 'high' ? 'bg-red-400' : 
                    info.severity === 'medium' ? 'bg-amber-400' : 'bg-orange-400'
                  }`} />
                  <span className="text-xs">{info.title}</span>
                  <span className="text-[10px] opacity-60">({info.severity})</span>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
