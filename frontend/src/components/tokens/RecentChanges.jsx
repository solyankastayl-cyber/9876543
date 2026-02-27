import { ArrowUp, ArrowDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

export const RecentChanges = ({ changes }) => {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Changes</h3>
      <div className="space-y-3">
        {changes.map((change, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-help hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    change.type === 'up' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {change.type === 'up' 
                      ? <ArrowUp className="w-4 h-4 text-emerald-600" />
                      : <ArrowDown className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{change.metric}</div>
                    <div className="text-xs text-gray-500">{change.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${change.type === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {change.value}
                  </span>
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-sm p-4">
              <p className="font-semibold mb-2">{change.what}</p>
              <p className="text-sm text-gray-300">{change.why}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default RecentChanges;
