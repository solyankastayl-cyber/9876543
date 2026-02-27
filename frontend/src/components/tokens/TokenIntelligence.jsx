import { Check, Zap, Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { getStructureColor } from './tokenUtils';

export const TokenIntelligence = ({ intelligence, token }) => {
  if (!intelligence) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-gray-900">Token Intelligence</h2>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStructureColor(intelligence.structureStatus)}`}>
              {intelligence.structureStatus}
            </span>
          </div>
          <p className="text-sm text-gray-600">Structure analysis for {token.symbol}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Confirmed for</div>
          <div className="text-2xl font-bold text-gray-900">
            <span className="text-white font-medium">{intelligence.confirmedDays} days</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Market Alignment</div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-gray-900">{intelligence.marketAlignment}</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Trend</div>
          <div className="flex items-center gap-1">
            <Zap className={`w-4 h-4 ${intelligence.trend === 'improving' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="font-semibold text-gray-900 capitalize">{intelligence.trend}</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Duration</div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{intelligence.duration}</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Confidence</div>
          <span className="font-semibold text-gray-900">{intelligence.confidence}</span>
        </div>
      </div>

      {/* Drivers & Risk */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-xs text-emerald-700 font-semibold mb-2">PRIMARY DRIVERS</div>
          <ul className="space-y-1">
            {intelligence.primaryDrivers.map((driver, i) => (
              <li key={i} className="text-sm text-emerald-800 flex items-center gap-2">
                <Check className="w-3 h-3" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="text-xs text-red-700 font-semibold mb-2">PRIMARY RISK</div>
          <p className="text-sm text-red-800">{intelligence.primaryRisk}</p>
        </div>
      </div>
    </div>
  );
};

export default TokenIntelligence;
