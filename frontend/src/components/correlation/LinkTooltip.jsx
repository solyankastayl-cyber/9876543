import { abbreviate, CORRIDOR_THRESHOLD } from './correlationUtils';

export const LinkTooltip = ({ link, actors, position }) => {
  if (!link || !position) return null;
  
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  
  const sourceActor = actors.find(a => a.id === sourceId);
  const targetActor = actors.find(a => a.id === targetId);
  
  if (!sourceActor || !targetActor) return null;
  
  const count = link.count || 1;
  const isCorridor = count >= CORRIDOR_THRESHOLD.minEdges;
  
  return (
    <div 
      className="absolute z-50 bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded-lg shadow-lg pointer-events-none"
      style={{ 
        left: position.x + 10, 
        top: position.y - 30,
        transform: 'translateX(-50%)'
      }}
      data-testid="link-tooltip"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="font-medium">{abbreviate(sourceActor.real_name)}</span>
        <span className="text-gray-400">↔</span>
        <span className="font-medium">{abbreviate(targetActor.real_name)}</span>
      </div>
      <div className="text-gray-400">
        {count} relations • Click for details
        {isCorridor && <span className="ml-1 text-amber-400">★ Corridor</span>}
      </div>
    </div>
  );
};

export default LinkTooltip;
