/**
 * QuickActions - Fixed navigation and disabled states
 * 
 * Clickable actions lead to pages.
 * Non-clickable are disabled with tooltips.
 */
import { Bell, Eye, TrendingUp, Compass } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export default function QuickActions() {
  const navigate = useNavigate();
  const [hoveredAction, setHoveredAction] = useState(null);
  
  const actions = [
    { 
      icon: Bell, 
      label: 'Alerts', 
      description: 'Set up custom alerts',
      enabled: true,
      route: '/alerts'
    },
    { 
      icon: Eye, 
      label: 'Watchlist', 
      description: 'Manage your watchlist',
      enabled: true,
      route: '/watchlist'
    },
    { 
      icon: TrendingUp, 
      label: 'Signals', 
      description: 'View active signals',
      enabled: true,
      route: '/signals'
    },
    { 
      icon: Compass, 
      label: 'Explore', 
      description: 'Browse tokens and actors',
      enabled: true,
      route: '/tokens'
    },
  ];

  return (
    <TooltipProvider>
      <div className="bg-white border border-gray-200 rounded-2xl p-3" data-testid="quick-actions">
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action, i) => {
            const Icon = action.icon;
            
            if (!action.enabled) {
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="w-full flex flex-col items-center gap-1.5 p-3 rounded-2xl opacity-50 cursor-not-allowed">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">{action.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white text-white">
                    <p className="text-xs">{action.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <button
                key={i}
                onClick={() => navigate(action.route)}
                onMouseEnter={() => setHoveredAction(i)}
                onMouseLeave={() => setHoveredAction(null)}
                className="w-full flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 transition-colors relative"
                data-testid={`quick-action-${action.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
                
                {/* Tooltip */}
                {hoveredAction === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-white text-xs rounded-lg whitespace-nowrap z-10">
                    {action.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
