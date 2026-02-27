import { useState } from 'react';
import { Clock, Activity, AlertTriangle, ArrowUpRight, Users } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { eventTypeConfig } from './entityUtils';

export const EntityTimeline = ({ events, transactions }) => {
  const [filter, setFilter] = useState('all');
  
  // Combine timeline events with transactions for a complete view
  const allEvents = [
    ...events.map(e => ({ ...e, source: 'event' })),
    ...(transactions || []).slice(0, 5).map(tx => ({
      type: 'transaction',
      title: `${tx.type.toUpperCase()} ${tx.token}`,
      date: tx.time,
      description: `${tx.valueUsd} ${tx.pattern ? `• ${tx.pattern.replace(/_/g, ' ')}` : ''}`,
      source: 'transaction',
      txType: tx.type
    }))
  ];

  const filteredEvents = filter === 'all' 
    ? allEvents 
    : allEvents.filter(e => e.type === filter);

  const getIcon = (type) => {
    switch (type) {
      case 'behavior': return Activity;
      case 'bridge': return Users;
      case 'risk': return AlertTriangle;
      case 'transaction': return Activity;
      default: return ArrowUpRight;
    }
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Activity Timeline
        </h2>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {['all', 'behavior', 'transaction', 'risk'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              data-testid={`timeline-filter-${type}`}
              className={`px-2 py-1 rounded text-[10px] font-semibold capitalize transition-all ${
                filter === type 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No events found for this filter
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-3">
            {filteredEvents.map((event, i) => {
              const config = eventTypeConfig[event.type] || eventTypeConfig.transfer;
              const IconComponent = getIcon(event.type);
              return (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${config.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{event.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${config.color}`}>
                          {event.type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{event.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default EntityTimeline;
