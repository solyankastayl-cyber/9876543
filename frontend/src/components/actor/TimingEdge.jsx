import React from 'react';
import { Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

const TimingEdge = ({ timingEdge }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">Timing Edge</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded"><Info className="w-4 h-4 text-gray-400" /></button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs">
            <p className="text-xs">How early this actor moves vs price action — key for following profitably</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="text-xs text-emerald-600 mb-1">Precedes Price By</div>
          <div className="text-xl font-bold text-emerald-700">{timingEdge.medianPrecedePrice}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="text-xs text-blue-600 mb-1">Success Rate (≤6h)</div>
          <div className="text-xl font-bold text-blue-700">{timingEdge.successRateWithin6h}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="text-xs text-amber-600 mb-1">Late Entry Drops After</div>
          <div className="text-xl font-bold text-amber-700">{timingEdge.lateEntryDropoff}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Best Performs In</div>
          <div className="text-xl font-bold text-gray-900">{timingEdge.bestPerformsIn}</div>
        </div>
      </div>
    </div>
  );
};

export default TimingEdge;
