/**
 * Graph Logic Toggle Component
 * 
 * Inline toggle for switching between:
 * - Influence (Actors structural graph)
 * - Routes (Exit routes / Intelligence)
 * 
 * Designed to replace the "STRUCTURAL" badge
 */

import { useNavigate, useLocation } from 'react-router-dom';

export default function GraphLogicToggle({ className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Determine mode from path:
  // - /actors/correlation = Influence (main graph page)
  // - /graph-intelligence = Routes
  const mode = pathname.includes('graph-intelligence') ? 'routes' : 'influence';
  
  return (
    <div className={`flex items-center gap-0.5 rounded-lg bg-white p-0.5 ${className}`}>
      <button
        onClick={() => navigate('/actors/correlation')}
        className={`
          px-3 py-1 text-xs font-semibold rounded-md transition-all
          ${mode === 'influence' 
            ? 'bg-indigo-600 text-white' 
            : 'text-gray-400 hover:text-white'
          }
        `}
        data-testid="graph-mode-influence"
      >
        Influence
      </button>
      
      <button
        onClick={() => navigate('/graph-intelligence')}
        className={`
          px-3 py-1 text-xs font-semibold rounded-md transition-all
          ${mode === 'routes' 
            ? 'bg-purple-600 text-white' 
            : 'text-gray-400 hover:text-white'
          }
        `}
        data-testid="graph-mode-routes"
      >
        Routes
      </button>
    </div>
  );
}

// Compact version for tight spaces
export function GraphLogicToggleCompact({ className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  const mode = pathname.includes('graph-intelligence') ? 'routes' : 'influence';
  
  return (
    <div className={`inline-flex items-center gap-px text-[9px] font-bold ${className}`}>
      <button
        onClick={() => navigate('/actors/correlation')}
        className={`
          px-2 py-0.5 rounded-l transition-all
          ${mode === 'influence' 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-gray-100 text-gray-400 hover:text-gray-600'
          }
        `}
      >
        INFLUENCE
      </button>
      <button
        onClick={() => navigate('/graph-intelligence')}
        className={`
          px-2 py-0.5 rounded-r transition-all
          ${mode === 'routes' 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-400 hover:text-gray-600'
          }
        `}
      >
        ROUTES
      </button>
    </div>
  );
}
