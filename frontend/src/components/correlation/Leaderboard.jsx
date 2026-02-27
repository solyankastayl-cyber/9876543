import { TrendingUp } from 'lucide-react';
import { abbreviate, getRatingBorder } from './correlationUtils';

export const Leaderboard = ({ actors, onSelect, selectedId, focusId, setFocusId }) => {
  const sorted = [...actors].sort((a, b) => b.influenceScore - a.influenceScore);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <span className="font-semibold text-gray-900 text-sm">Ranking</span>
      </div>
      <div className="flex flex-wrap gap-1" data-testid="leaderboard-list">
        {sorted.slice(0, 8).map((actor, i) => {
          const rc = getRatingBorder(actor.influenceScore);
          return (
            <button
              key={actor.id}
              onClick={() => {
                onSelect(actor);
                if (actor.role === 'Leader') setFocusId(actor.id);
              }}
              data-testid={`leaderboard-item-${actor.id}`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-left transition border ${
                focusId === actor.id ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {i + 1}
              </span>
              <span className="text-xs font-medium text-gray-900">{abbreviate(actor.real_name)}</span>
              <span className="text-xs font-bold" style={{ color: rc }}>{actor.influenceScore}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
