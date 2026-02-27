import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { abbreviate, getRatingBorder, NODE_FILL, TEXT_COLOR } from './correlationUtils';

export const ActorPanel = ({ actor, onClose, onSelectEdge, graphLinks }) => {
  if (!actor) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm h-full flex items-center justify-center">
        <span className="text-xs text-gray-400">Click on a node to select</span>
      </div>
    );
  }
  
  const rc = getRatingBorder(actor.influenceScore);
  
  // Найти связи актора
  const actorLinks = graphLinks?.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === actor.id || targetId === actor.id;
  }) || [];
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm h-full" data-testid="actor-panel">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-gray-500 uppercase">Selected</span>
        <button onClick={onClose} className="p-0.5 hover:bg-gray-100 rounded" data-testid="actor-panel-close">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex gap-2 items-center mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border-2 flex-shrink-0"
          style={{ backgroundColor: NODE_FILL, borderColor: rc, color: TEXT_COLOR }}
        >
          {abbreviate(actor.real_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{actor.real_name}</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: rc }}>{actor.influenceScore}</span>
            <span className="text-[10px] text-gray-500">{actor.strategy}</span>
          </div>
        </div>
        <Link
          to={`/actors/${actor.id}`}
          className="flex-shrink-0 px-2 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-medium"
          data-testid="actor-panel-profile-link"
        >
          Profile
        </Link>
      </div>
      
      {/* Связи актора - кликабельные */}
      {actorLinks.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <div className="text-[9px] text-gray-500 mb-1">CONNECTIONS ({actorLinks.length})</div>
          <div className="flex flex-wrap gap-1">
            {actorLinks.slice(0, 4).map((link, idx) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              const otherId = sourceId === actor.id ? targetId : sourceId;
              const isOutgoing = sourceId === actor.id;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectEdge?.(link)}
                  data-testid={`actor-connection-${idx}`}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition hover:opacity-80 ${
                    isOutgoing ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isOutgoing ? '→' : '←'} {abbreviate(otherId)} ({link.count || 1})
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActorPanel;
