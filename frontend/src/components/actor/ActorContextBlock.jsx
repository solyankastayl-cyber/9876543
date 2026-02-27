/**
 * Actor Context Block (P3.5)
 * 
 * Shows "Appears in X signal contexts (last 24h)"
 * Links to Signals Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronRight, Clock, Users } from 'lucide-react';
import { api } from '../../api/client';

export default function ActorContextBlock({ actorSlug }) {
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContexts() {
      if (!actorSlug) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/api/actors/${actorSlug}/contexts?limit=5`);
        if (response.data.ok) {
          setContexts(response.data.data.contexts || []);
        }
      } catch (err) {
        console.error('Context fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContexts();
  }, [actorSlug]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (contexts.length === 0) {
    return null; // Don't show block if no contexts
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100" data-testid="actor-context-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Appears in {contexts.length} context{contexts.length > 1 ? 's' : ''}
          </h3>
        </div>
        
        <Link
          to="/signals"
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Context list */}
      <div className="space-y-2">
        {contexts.map((ctx) => (
          <div
            key={ctx.id}
            className="p-3 bg-purple-50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-purple-900">
                {ctx.summary}
              </span>
              <span className="text-xs text-purple-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ctx.window}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                {ctx.overlapScore} signals
              </span>
              {ctx.involvedActors?.length > 1 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  +{ctx.involvedActors.length - 1} actors
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 italic">
        Contexts show related signal clusters. Not predictions.
      </p>
    </div>
  );
}
