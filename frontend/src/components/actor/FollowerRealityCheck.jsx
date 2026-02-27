import React from 'react';
import { Target, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

const FollowerRealityCheck = ({ followerReality }) => {
  if (!followerReality) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Follower Reality Check</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-blue-100 rounded"><Info className="w-4 h-4 text-blue-400" /></button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs">
            <p className="text-xs">Expected returns adjusted for entry delay, slippage, and crowding. This is what YOU can realistically expect.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Avg Entry Delay</div>
          <div className="text-lg font-bold text-gray-900">{followerReality.avgEntryDelay}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Expected Slippage</div>
          <div className="text-lg font-bold text-gray-900">{followerReality.expectedSlippage}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Actor ROI (30d)</div>
          <div className={`text-lg font-bold ${followerReality.modeledROI30d.actor.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {followerReality.modeledROI30d.actor}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
          <div className="text-xs text-blue-600 font-medium mb-1">Your Modeled ROI</div>
          <div className={`text-xl font-bold ${followerReality.modeledROI30d.follower.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {followerReality.modeledROI30d.follower}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Max DD (Follower)</div>
          <div className="text-lg font-bold text-amber-600">{followerReality.maxDDFollower}</div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span>Crowding Factor:</span>
        <span className={`px-2 py-0.5 rounded font-medium ${
          followerReality.crowdingFactor === 'Low' ? 'bg-emerald-100 text-emerald-700' :
          followerReality.crowdingFactor === 'Medium' ? 'bg-amber-100 text-amber-700' :
          followerReality.crowdingFactor === 'High' ? 'bg-orange-100 text-orange-700' :
          'bg-red-100 text-red-700'
        }`}>
          {followerReality.crowdingFactor}
        </span>
        <span className="text-gray-400">•</span>
        <span>{followerReality.crowdingFactor === 'Low' ? 'Minimal impact on entry' : 
               followerReality.crowdingFactor === 'Medium' ? 'Some slippage expected' :
               'High competition for entries'}</span>
      </div>
    </div>
  );
};

export default FollowerRealityCheck;
