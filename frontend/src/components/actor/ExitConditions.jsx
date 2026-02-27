import React from 'react';
import { LogOut, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

const ExitConditions = ({ exitConditions }) => {
  if (!exitConditions || exitConditions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LogOut className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Exit Conditions</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-orange-100 rounded"><Info className="w-4 h-4 text-orange-400" /></button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs">
            <p className="text-xs">Pre-defined rules for when to stop following this actor. Setting these up front prevents emotional decision-making.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-2">
        {exitConditions.map((condition, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
            condition.priority === 'critical' ? 'bg-red-100 border border-red-200' :
            condition.priority === 'high' ? 'bg-orange-100 border border-orange-200' :
            'bg-amber-50 border border-amber-200'
          }`}>
            <div className={`p-1 rounded ${
              condition.priority === 'critical' ? 'bg-red-200' :
              condition.priority === 'high' ? 'bg-orange-200' :
              'bg-amber-200'
            }`}>
              <LogOut className={`w-3.5 h-3.5 ${
                condition.priority === 'critical' ? 'text-red-700' :
                condition.priority === 'high' ? 'text-orange-700' :
                'text-amber-700'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-gray-900 text-sm">{condition.trigger}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${
                  condition.priority === 'critical' ? 'bg-red-200 text-red-800' :
                  condition.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                  'bg-amber-200 text-amber-800'
                }`}>
                  {condition.priority}
                </span>
              </div>
              <span className="text-sm text-gray-600">→ {condition.action}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-700">
        <span className="font-semibold">Pro tip:</span> Set these as alerts to get notified when conditions are met
      </div>
    </div>
  );
};

export default ExitConditions;
