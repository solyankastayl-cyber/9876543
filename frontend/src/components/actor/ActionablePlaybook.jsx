import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { actionSuggestionColors } from '../../data/actors';

const ActionablePlaybook = ({ playbook }) => {
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Play className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold">Actionable Playbook</h2>
        </div>
        <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${actionSuggestionColors[playbook.suggestedAction]}`}>
          {playbook.suggestedAction}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-white/10 rounded-xl">
          <div className="text-xs text-gray-400 mb-1">Current Action</div>
          <div className="text-lg font-bold">{playbook.currentAction}</div>
        </div>
        <div className="p-3 bg-white/10 rounded-xl">
          <div className="text-xs text-gray-400 mb-1">Latency Status</div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              playbook.latencyStatus === 'Early' ? 'bg-emerald-500/20 text-emerald-400' :
              playbook.latencyStatus === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {playbook.latencyStatus}
            </span>
            <span className="text-lg font-bold">{playbook.confidenceLevel}%</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Tokens to Watch</div>
        <div className="flex items-center gap-2">
          {playbook.tokensToWatch.map((token, i) => (
            <Link 
              key={i} 
              to={`/tokens?search=${token}`}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
            >
              {token}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="text-xs text-gray-400 mb-1">Reasoning</div>
        <p className="text-sm">{playbook.reasoning}</p>
      </div>
    </div>
  );
};

export default ActionablePlaybook;
