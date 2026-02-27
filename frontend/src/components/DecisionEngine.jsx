import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import AlertModal from './AlertModal';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

export default function DecisionEngine({ 
  state = 'neutral', // bullish | neutral | risky
  confidence = 50, 
  reasons = [], 
  entity = 'Market',
  compact = false,
  scoreBreakdown = null // Decision Score v1 breakdown
}) {
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  const getStateConfig = (state) => {
    const configs = {
      bullish: {
        label: 'BULLISH',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        gradientFrom: 'from-emerald-400',
        gradientTo: 'to-green-600',
        icon: TrendingUp,
        emoji: '🚀',
        action: 'Consider Accumulating',
        lightBg: 'bg-emerald-500'
      },
      neutral: {
        label: 'NEUTRAL',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        gradientFrom: 'from-blue-400',
        gradientTo: 'to-cyan-600',
        icon: Minus,
        emoji: '⚖️',
        action: 'Monitor & Wait',
        lightBg: 'bg-blue-500'
      },
      risky: {
        label: 'RISKY',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        gradientFrom: 'from-red-400',
        gradientTo: 'to-orange-600',
        icon: TrendingDown,
        emoji: '⚠️',
        action: 'Consider Reducing Exposure',
        lightBg: 'bg-red-500'
      }
    };
    return configs[state] || configs.neutral;
  };

  const config = getStateConfig(state);
  const StateIcon = config.icon;

  // Confidence color based on level
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-emerald-600';
    if (conf >= 60) return 'text-blue-600';
    if (conf >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    // Compact version for inline use
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 ${config.borderColor} ${config.bgColor}`}>
        <span className="text-lg">{config.emoji}</span>
        <div>
          <div className={`text-sm font-bold ${config.color}`}>{config.label}</div>
          <div className={`text-xs ${getConfidenceColor(confidence)}`}>{confidence}% confidence</div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center shadow-lg`}>
          <StateIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">Decision Engine</h3>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${config.bgColor} ${config.color}`}>
              {entity}
            </span>
          </div>
          <p className="text-xs text-gray-500">AI-powered signal aggregation & recommendation</p>
        </div>
      </div>

      {/* State & Confidence */}
      <div className={`p-4 rounded-2xl border-2 ${config.borderColor} ${config.bgColor} mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <div className={`text-2xl font-bold ${config.color}`}>{config.label}</div>
              <div className="text-sm text-gray-600 mt-0.5">{config.action}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Confidence</div>
            <div className={`text-4xl font-bold ${getConfidenceColor(confidence)}`}>
              {confidence}%
            </div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${config.lightBg} rounded-full transition-all duration-700`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-600">{confidence}%</span>
        </div>
        
        {/* Decision Score v1 - Simplified Drivers */}
        {scoreBreakdown && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase">Decision Score</span>
              <span className="text-lg font-bold text-gray-900">{confidence}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                {scoreBreakdown.smartMoney > 50 ? '↑↑' : scoreBreakdown.smartMoney > 30 ? '↑' : '→'} Smart Money
              </span>
              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                {scoreBreakdown.regime > 50 ? '↑↑' : scoreBreakdown.regime > 30 ? '↑' : '→'} Regime
              </span>
              <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg font-medium">
                {scoreBreakdown.anomalies > 30 ? '↑' : '±'} Anomalies
              </span>
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg font-medium">
                {scoreBreakdown.risk > 20 ? '↓' : '−'} Risk
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Why - 3 Reasons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Why?</span>
        </div>
        {reasons.length > 0 ? (
          reasons.slice(0, 3).map((reason, i) => {
            const ReasonIcon = reason.icon || CheckCircle;
            return (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <ReasonIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{reason.text}</div>
                  {reason.detail && (
                    <div className="text-xs text-gray-500 mt-1">{reason.detail}</div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500 italic">No specific reasons available</div>
        )}
      </div>

      {/* Quick Actions - Unified CTA */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button 
          onClick={() => setShowAlertModal(true)}
          className={`px-4 py-2.5 text-sm font-bold text-white rounded-2xl transition-all shadow-md bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-1.5`}
        >
          🔔 Set Alert
        </button>
        <button className="px-4 py-2.5 text-sm font-bold text-gray-700 rounded-2xl transition-all border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center gap-1.5">
          📍 Track
        </button>
      </div>

      {/* Alert Modal */}
      <AlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        defaultType={state === 'bullish' ? 'accumulation' : state === 'risky' ? 'distribution' : 'accumulation'}
      />
    </GlassCard>
  );
}
