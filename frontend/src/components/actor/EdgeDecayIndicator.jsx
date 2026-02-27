import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

const EdgeDecayIndicator = ({ edgeDecay }) => {
  if (!edgeDecay) return null;

  return (
    <div className={`rounded-2xl p-5 border ${
      edgeDecay.status === 'stable' ? 'bg-emerald-50 border-emerald-200' :
      edgeDecay.status === 'degrading' ? 'bg-amber-50 border-amber-200' :
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            edgeDecay.status === 'stable' ? 'bg-emerald-100' :
            edgeDecay.status === 'degrading' ? 'bg-amber-100' :
            'bg-red-100'
          }`}>
            {edgeDecay.status === 'stable' ? <Check className="w-5 h-5 text-emerald-600" /> :
             edgeDecay.status === 'degrading' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
             <X className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              Edge {edgeDecay.status === 'stable' ? 'Stable ✓' : 
                    edgeDecay.status === 'degrading' ? 'Degrading ⚠' : 
                    'Exhausted ✗'}
            </h3>
            <p className="text-sm text-gray-600">{edgeDecay.trend}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Success rate: <span className={`font-semibold ${
            edgeDecay.successRateTrend.startsWith('+') ? 'text-emerald-600' :
            edgeDecay.successRateTrend.startsWith('-') ? 'text-red-500' : 'text-gray-600'
          }`}>{edgeDecay.successRateTrend}</span></div>
          <div className="mt-1">{edgeDecay.crowdFollowing}</div>
        </div>
      </div>
    </div>
  );
};

export default EdgeDecayIndicator;
