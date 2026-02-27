/**
 * NarrativesSidebar - Read-only insights with Experimental badge
 * 
 * Shows market narratives as read-only insights.
 * Marked as Experimental since no backend source/confidence.
 */
import { useState } from 'react';
import { Beaker } from 'lucide-react';
import NarrativesModal from './NarrativesModal';

// Static narratives - experimental feature
const NARRATIVES = [
  { name: 'AI & Infrastructure', stage: 'Early', action: 'Monitor & Accumulate' },
  { name: 'Layer 2', stage: 'Confirmed', action: 'Strong Position' },
  { name: 'RWA', stage: 'Crowded', action: 'Consider Exit' },
];

export default function NarrativesSidebar() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex flex-col h-full" data-testid="narratives-sidebar">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900">Top Narratives</h3>
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            <Beaker className="w-3 h-3" />
            Experimental
          </span>
        </div>
      
        <div className="space-y-1.5 mb-3 flex-grow">
          {NARRATIVES.map((n, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-gray-900">{n.name}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  n.stage === 'Early' ? 'bg-blue-100 text-blue-700' :
                  n.stage === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {n.stage}
                </span>
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {n.action}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 bg-white hover:bg-gray-100 text-white rounded-2xl text-xs font-semibold transition-colors mt-auto"
          data-testid="view-all-narratives-btn"
        >
          View All Narratives
        </button>
      </div>
    
      {showModal && <NarrativesModal isOpen={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
