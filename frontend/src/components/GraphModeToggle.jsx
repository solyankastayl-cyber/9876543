/**
 * Graph Mode Toggle Component
 * 
 * Switches between:
 * - Actors Graph (Influence/Structural)
 * - Graph Intelligence (Routes/DEX/CEX/Bridges)
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Network, GitBranch } from 'lucide-react';

const GRAPH_MODES = [
  {
    id: 'actors',
    label: 'Actors',
    sublabel: 'Influence',
    path: '/actors/graph',
    icon: Network,
    description: 'Structural relationships between actors'
  },
  {
    id: 'intelligence',
    label: 'Routes',
    sublabel: 'Intelligence',
    path: '/graph-intelligence',
    icon: GitBranch,
    description: 'Exit routes with DEX/CEX/Bridges'
  }
];

export default function GraphModeToggle({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active mode from current path
  const activeMode = location.pathname.includes('graph-intelligence') 
    ? 'intelligence' 
    : 'actors';
  
  return (
    <div className={`flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 shadow-sm ${className}`}>
      {GRAPH_MODES.map(mode => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => navigate(mode.path)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-white text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
            title={mode.description}
            data-testid={`graph-mode-${mode.id}`}
          >
            <Icon className="w-4 h-4" />
            <div className="flex flex-col items-start leading-tight">
              <span>{mode.label}</span>
              <span className={`text-[9px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {mode.sublabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for headers
export function GraphModeToggleCompact({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeMode = location.pathname.includes('graph-intelligence') 
    ? 'intelligence' 
    : 'actors';
  
  return (
    <div className={`flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 ${className}`}>
      {GRAPH_MODES.map(mode => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => navigate(mode.path)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
              ${isActive 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
            title={mode.description}
          >
            <Icon className="w-3.5 h-3.5" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
