/**
 * Labs Macro Regime Page
 * 
 * Full market regime analysis dashboard
 * Style: FomoAI Design System
 */

import { BarChart3, TrendingUp, RefreshCw, Activity, Zap, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketRegimeGrid } from '../../components/macro/MarketRegimeGrid';
import { ActiveRegimeCard } from '../../components/macro/ActiveRegimeCard';
import { FearGreedHistoryChart } from '../../components/fomo-ai/FearGreedHistoryChart';
import { MacroContextPanel } from '../../components/fomo-ai/MacroContextPanel';
import { RegimeTransitionsHistory } from '../../components/macro/RegimeTransitionsHistory';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations (FomoAI style)
═══════════════════════════════════════════════════════════════ */
if (typeof document !== 'undefined' && !document.getElementById('macro-animations')) {
  const style = document.createElement('style');
  style.id = 'macro-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
  `;
  document.head.appendChild(style);
}

export default function LabsMacroRegimePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ animation: 'fadeIn 0.4s ease-out forwards' }}>
      {/* Header - FomoAI Style */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <Globe className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Macro Regime</span>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                <span className="w-1.5 h-1.5 rounded-full mr-1 bg-green-500 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Row: Active Regime + Context */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'slideUp 0.5s ease-out forwards', animationDelay: '100ms' }}>
          <ActiveRegimeCard />
          <MacroContextPanel />
        </div>

        {/* Regime Grid */}
        <div style={{ animation: 'slideUp 0.5s ease-out forwards', animationDelay: '200ms' }}>
          <MarketRegimeGrid />
        </div>

        {/* Historical Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'slideUp 0.5s ease-out forwards', animationDelay: '300ms' }}>
          <FearGreedHistoryChart days={14} />
          <RegimeTransitionsHistory limit={10} />
        </div>
        
        {/* Regime Explanation Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm card-hover" style={{ animation: 'slideUp 0.5s ease-out forwards', animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Activity className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">How Regime Detection Works</h3>
          </div>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              The Market Regime Engine analyzes four key signals to determine the current market state:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 font-bold text-sm">₿</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">BTC Dominance</span>
                  <p className="text-gray-500 text-xs mt-0.5">Capital concentration in Bitcoin vs altcoins</p>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">BTC Price</span>
                  <p className="text-gray-500 text-xs mt-0.5">Direction of Bitcoin price over 24h</p>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Alt Market</span>
                  <p className="text-gray-500 text-xs mt-0.5">Proxy for altcoin market movement</p>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Stablecoin Dominance</span>
                  <p className="text-gray-500 text-xs mt-0.5">Capital in stablecoins (USDT+USDC)</p>
                </div>
              </li>
            </ul>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-500 italic text-xs">
                Macro regime affects confidence multiplier and can block strong actions during extreme conditions.
                It never creates signals or changes direction — only context and caution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
