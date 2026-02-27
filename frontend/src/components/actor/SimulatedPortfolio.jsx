import React, { useState } from 'react';
import { Calculator, DollarSign, ChevronDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

const SimulatedPortfolio = ({ simulatedPortfolio }) => {
  const [simCapital, setSimCapital] = useState(10000);
  const [simPeriod, setSimPeriod] = useState('30d');
  const [showTradeDetails, setShowTradeDetails] = useState(false);

  // Calculate simulated results
  const getSimulatedResults = () => {
    if (!simulatedPortfolio || !simulatedPortfolio.periods || simulatedPortfolio.periods.length === 0) return null;
    const periodData = simulatedPortfolio.periods.find(p => p.period === simPeriod) || simulatedPortfolio.periods[0];
    const actorFinalValue = simCapital * (1 + periodData.actorReturn / 100);
    const followerFinalValue = simCapital * (1 + periodData.followerReturn / 100);
    const returnGap = periodData.actorReturn - periodData.followerReturn;
    return {
      ...periodData,
      actorFinalValue,
      followerFinalValue,
      returnGap,
      slippageCost: simCapital * (periodData.slippageLoss / 100),
      delayCost: simCapital * (periodData.delayLoss / 100),
    };
  };

  const simResults = getSimulatedResults();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-700" />
          <h2 className="text-lg font-bold text-gray-900">Simulated Portfolio</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 hover:bg-indigo-100 rounded"><Info className="w-4 h-4 text-indigo-400" /></button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-xs">
              <p className="text-xs">What-if calculator showing hypothetical results if you had copied this actor's trades with realistic delays and slippage.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-medium">BETA</span>
      </div>

      {/* Capital Input + Period Selector */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <label className="text-xs text-gray-600 mb-1 block">Starting Capital</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={simCapital}
              onChange={(e) => setSimCapital(Number(e.target.value) || 10000)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setSimPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                simPeriod === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Results Comparison */}
      {simResults && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Actor Results */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Actor's Return</div>
              <div className={`text-2xl font-bold ${simResults.actorReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {simResults.actorReturn >= 0 ? '+' : ''}{simResults.actorReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ${simResults.actorFinalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Follower Results */}
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-4 border border-indigo-200">
              <div className="text-xs text-indigo-600 mb-1">Your Simulated Return</div>
              <div className={`text-2xl font-bold ${simResults.followerReturn >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                {simResults.followerReturn >= 0 ? '+' : ''}{simResults.followerReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-indigo-600 mt-1">
                ${simResults.followerFinalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Return Gap Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Return Gap: {simResults.returnGap.toFixed(1)}%</span>
              <span className="text-xs text-gray-500">Why you earn less than the actor</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-600">Slippage Cost</span>
                </div>
                <span className="text-xs font-semibold text-amber-600">-{simResults.slippageLoss.toFixed(1)}% (${simResults.slippageCost.toFixed(0)})</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600">Entry Delay Cost</span>
                </div>
                <span className="text-xs font-semibold text-red-600">-{simResults.delayLoss.toFixed(1)}% (${simResults.delayCost.toFixed(0)})</span>
              </div>
            </div>
            {/* Visual bar */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, simResults.followerReturn / Math.max(simResults.actorReturn, 1) * 100)}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${simResults.slippageLoss}%` }} />
              <div className="h-full bg-red-400" style={{ width: `${simResults.delayLoss}%` }} />
            </div>
          </div>

          {/* Delay Impact Table */}
          {simulatedPortfolio?.impactByDelay && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-3">Impact by Entry Delay</div>
              <div className="space-y-2">
                {simulatedPortfolio.impactByDelay.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs font-medium text-gray-700">{item.delay} delay</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${
                        item.returnLoss.includes('+') ? 'text-red-600' : 
                        parseInt(item.returnLoss) > -30 ? 'text-amber-600' : 'text-red-600'
                      }`}>{item.returnLoss}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.recommendation === 'Optimal' ? 'bg-emerald-100 text-emerald-700' :
                        item.recommendation === 'Acceptable' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{item.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Trade Stats */}
      {simulatedPortfolio?.trades && (
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <button 
            onClick={() => setShowTradeDetails(!showTradeDetails)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-gray-900">Trade Statistics</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTradeDetails ? 'rotate-180' : ''}`} />
          </button>
          {showTradeDetails && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-gray-900">{simulatedPortfolio.trades.total}</div>
                <div className="text-xs text-gray-500">Trades</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{simulatedPortfolio.trades.profitable}</div>
                <div className="text-xs text-gray-500">Winners</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{simulatedPortfolio.trades.avgWin}</div>
                <div className="text-xs text-gray-500">Avg Win</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-red-600">{simulatedPortfolio.trades.avgLoss}</div>
                <div className="text-xs text-gray-500">Avg Loss</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulatedPortfolio;
