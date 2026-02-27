import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, Bell, MapPin } from 'lucide-react';
import AlertModal from './AlertModal';
import { toast } from 'sonner';

// COMPACT Market Signal - Decision Card (НЕ full-width, НЕ громоздкий)
export default function MarketSignalCard({ 
  state = 'bullish',
  confidence = 57,
  scoreBreakdown = { smartMoney: 75, regime: 99, anomalies: 25, risk: 20 }
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const config = {
    bullish: {
      label: 'BULLISH',
      color: 'emerald',
      icon: TrendingUp,
      action: 'Consider Accumulating'
    },
    neutral: {
      label: 'NEUTRAL',
      color: 'blue',
      icon: Minus,
      action: 'Monitor & Wait'
    },
    risky: {
      label: 'RISKY',
      color: 'red',
      icon: TrendingDown,
      action: 'Consider Exit'
    }
  }[state];

  const Icon = config.icon;

  const reasons = [
    { text: '3 smart money entities accumulating', detail: 'vs 1 distributing' },
    { text: 'Net inflow: +$89.2M', detail: 'Strong buy pressure' },
    { text: '2 new positions opened', detail: 'Fresh capital entering' },
  ];

  const handleTrack = () => {
    toast.success('Added to Watchlist', {
      description: 'Market signal is now being tracked',
      duration: 3000,
    });
  };

  const colorClasses = {
    emerald: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      badge: 'bg-emerald-600 text-white',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    blue: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      badge: 'bg-gray-600 text-white',
      button: 'bg-gray-600 hover:bg-gray-100 text-white'
    },
    red: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      badge: 'bg-red-600 text-white',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    }
  }[config.color];

  return (
    <>
      <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-2xl overflow-hidden`}>
        {/* Compact Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${colorClasses.badge} rounded-2xl flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">Market Signal</div>
                <div className={`text-xl font-bold ${colorClasses.text}`}>{config.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${colorClasses.text}`}>{confidence}%</div>
              <div className="text-xs text-gray-500">confidence</div>
            </div>
          </div>

          {/* Action */}
          <div className="mb-3 p-2.5 bg-white rounded-2xl border border-gray-200">
            <div className="text-xs text-gray-500 mb-0.5">Recommended Action</div>
            <div className={`text-sm font-bold ${colorClasses.text}`}>{config.action}</div>
          </div>

          {/* Score Breakdown - Compact */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
              {scoreBreakdown.smartMoney > 50 ? '↑↑' : '↑'} Smart Money
            </span>
            <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
              {scoreBreakdown.regime > 50 ? '↑↑' : '↑'} Regime
            </span>
            <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
              ± Anomalies
            </span>
            <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
              − Risk
            </span>
          </div>

          {/* Why? Collapsible */}
          <div className="border-t border-gray-200 -mx-4 px-4 pt-3">
            <button 
              onClick={() => setShowWhy(!showWhy)}
              className="w-full flex items-center justify-between text-left hover:bg-white/50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <span className="text-xs font-semibold text-gray-600">Why this signal?</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
            </button>
            
            {showWhy && (
              <div className="mt-2 space-y-1.5">
                {reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">{r.text}</span>
                      <span className="text-gray-500 ml-1">— {r.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions - Compact */}
        <div className="px-4 pb-4 flex gap-2">
          <button 
            onClick={() => setShowAlertModal(true)}
            className={`flex-1 py-2 ${colorClasses.button} rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-1`}
          >
            <Bell className="w-4 h-4" /> Alert
          </button>
          <button 
            onClick={handleTrack}
            className="flex-1 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <MapPin className="w-4 h-4" /> Track
          </button>
        </div>
      </div>

      <AlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        defaultType="accumulation"
      />
    </>
  );
}
