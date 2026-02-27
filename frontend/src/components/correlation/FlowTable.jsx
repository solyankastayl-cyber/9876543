import { useState, useMemo } from 'react';
import { ArrowRightLeft, X, ChevronUp, ChevronDown, Filter, Clock } from 'lucide-react';
import { abbreviate, CORRIDOR_THRESHOLD } from './correlationUtils';

export const FlowTable = ({ edge, onClose, actors, onHoverRow, hoveredRowId }) => {
  const [expanded, setExpanded] = useState(true);
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all' | 'forward' | 'backward'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Follow' | 'Front-run' | 'Copy'
  const [timeFilter, setTimeFilter] = useState('30d'); // '24h' | '7d' | '30d'
  
  // Вычисляем все данные до условных return (правила хуков)
  const sourceId = edge ? (typeof edge.source === 'object' ? edge.source.id : edge.source) : null;
  const targetId = edge ? (typeof edge.target === 'object' ? edge.target.id : edge.target) : null;
  
  const sourceActor = sourceId ? actors.find(a => a.id === sourceId) : null;
  const targetActor = targetId ? actors.find(a => a.id === targetId) : null;
  
  const sourceName = sourceActor?.real_name || '';
  const targetName = targetActor?.real_name || '';
  const count = edge?.count || 1;
  const isIncoming = edge?.type === 'incoming';
  const isCorridor = count >= CORRIDOR_THRESHOLD.minEdges;
  
  // Генерируем детализированные связи (mock data)
  const allRelations = useMemo(() => {
    if (!sourceId || !targetId || !sourceName || !targetName) return [];
    
    const types = ['Follow', 'Front-run', 'Copy'];
    const times = ['1h ago', '2h ago', '5h ago', '12h ago', '1d ago', '2d ago', '5d ago', '14d ago', '25d ago'];
    
    // Детерминированная функция для генерации веса (вместо Math.random)
    const getWeight = (index) => (0.45 + ((index * 17 + 7) % 55) / 100).toFixed(2);
    
    return Array.from({ length: count }, (_, i) => {
      // Чередуем направления для двунаправленных связей
      const isForward = i % 3 !== 2;
      return {
        id: `rel-${i}`,
        from: isForward ? sourceName : targetName,
        fromId: isForward ? sourceId : targetId,
        to: isForward ? targetName : sourceName,
        toId: isForward ? targetId : sourceId,
        type: types[i % 3],
        weight: getWeight(i),
        time: times[Math.min(i, times.length - 1)],
        timeHours: i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 5 : i * 12,
        status: i < Math.ceil(count * 0.4) ? 'Active' : 'Historical',
      };
    });
  }, [count, sourceName, targetName, sourceId, targetId]);
  
  // Применяем фильтры
  const filteredRelations = useMemo(() => {
    return allRelations.filter(rel => {
      // Direction filter
      if (directionFilter === 'forward' && rel.fromId !== sourceId) return false;
      if (directionFilter === 'backward' && rel.fromId !== targetId) return false;
      
      // Type filter
      if (typeFilter !== 'all' && rel.type !== typeFilter) return false;
      
      // Time filter
      const hourLimits = { '24h': 24, '7d': 168, '30d': 720 };
      if (rel.timeHours > hourLimits[timeFilter]) return false;
      
      return true;
    });
  }, [allRelations, directionFilter, typeFilter, timeFilter, sourceId, targetId]);
  
  // Рассчитываем Net Flow
  const netFlow = useMemo(() => {
    const forward = filteredRelations.filter(r => r.fromId === sourceId).length;
    const backward = filteredRelations.filter(r => r.fromId === targetId).length;
    const diff = forward - backward;
    return {
      value: Math.abs(diff),
      direction: diff >= 0 ? targetName : sourceName,
      isPositive: diff >= 0,
    };
  }, [filteredRelations, sourceId, targetId, sourceName, targetName]);
  
  // Условный return ПОСЛЕ всех хуков
  if (!edge || !sourceActor || !targetActor) return null;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid="flow-table">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between p-2.5 border-b border-gray-100">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded px-1 -mx-1"
          data-testid="flow-table-toggle"
        >
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-semibold text-gray-900 text-xs">Flow: {abbreviate(sourceName)}</span>
            <span className={`text-xs ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>↔</span>
            <span className="font-semibold text-gray-900 text-xs">{abbreviate(targetName)}</span>
          </div>
          {isCorridor && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-medium rounded">
              CORRIDOR
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span>{filteredRelations.length} relations</span>
            <span className="text-gray-300">|</span>
            <span className={netFlow.isPositive ? 'text-green-600' : 'text-red-500'}>
              Net: {netFlow.value > 0 ? `+${netFlow.value}` : '0'} → {abbreviate(netFlow.direction)}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" data-testid="flow-table-close">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100 bg-gray-50">
            {/* Direction Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-gray-400" />
              <select 
                value={directionFilter} 
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5"
                data-testid="flow-table-direction-filter"
              >
                <option value="all">All directions</option>
                <option value="forward">{abbreviate(sourceName)} → {abbreviate(targetName)}</option>
                <option value="backward">{abbreviate(targetName)} → {abbreviate(sourceName)}</option>
              </select>
            </div>
            
            {/* Type Filter */}
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5"
              data-testid="flow-table-type-filter"
            >
              <option value="all">All types</option>
              <option value="Follow">Follow</option>
              <option value="Front-run">Front-run</option>
              <option value="Copy">Copy</option>
            </select>
            
            {/* Time Filter */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5"
                data-testid="flow-table-time-filter"
              >
                <option value="24h">24h</option>
                <option value="7d">7d</option>
                <option value="30d">30d</option>
              </select>
            </div>
          </div>
          
          {/* Table */}
          <div className="max-h-36 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-1.5 text-gray-500 font-medium">From</th>
                  <th className="text-left p-1.5 text-gray-500 font-medium">To</th>
                  <th className="text-left p-1.5 text-gray-500 font-medium">Relation</th>
                  <th className="text-right p-1.5 text-gray-500 font-medium">Weight</th>
                  <th className="text-right p-1.5 text-gray-500 font-medium">Time</th>
                  <th className="text-center p-1.5 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRelations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-400">
                      No relations match filters
                    </td>
                  </tr>
                ) : (
                  filteredRelations.map(rel => (
                    <tr 
                      key={rel.id} 
                      className={`border-t border-gray-50 cursor-pointer transition-colors ${
                        hoveredRowId === rel.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => onHoverRow?.(rel)}
                      onMouseLeave={() => onHoverRow?.(null)}
                      data-testid={`flow-table-row-${rel.id}`}
                    >
                      <td className="p-1.5">
                        <span className="font-medium text-gray-900">{abbreviate(rel.from)}</span>
                      </td>
                      <td className="p-1.5">
                        <span className="font-medium text-gray-900">{abbreviate(rel.to)}</span>
                      </td>
                      <td className="p-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          rel.type === 'Follow' ? 'bg-blue-100 text-blue-700' :
                          rel.type === 'Front-run' ? 'bg-amber-100 text-amber-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{rel.type}</span>
                      </td>
                      <td className="p-1.5 text-right font-medium text-gray-700">{rel.weight}</td>
                      <td className="p-1.5 text-right text-gray-500">{rel.time}</td>
                      <td className="p-1.5 text-center">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                          rel.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                        }`} title={rel.status}></span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Stats */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-gray-100 bg-gray-50 text-[9px] text-gray-500">
            <span>
              Showing {filteredRelations.length} of {allRelations.length} relations
            </span>
            <span>
              Strongest lag: {(2.3 + (filteredRelations.length % 4) * 0.7).toFixed(1)}h
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default FlowTable;
