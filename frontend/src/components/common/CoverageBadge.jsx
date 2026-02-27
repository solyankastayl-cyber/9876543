/**
 * CoverageBadge (P0 - Common Platform Layer)
 * 
 * Shows data coverage percentage with tooltip
 * coverage.pct = полнота данных, НЕ качество
 */
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

function getCoverageLevel(pct) {
  if (pct >= 70) return 'high';
  if (pct >= 40) return 'medium';
  return 'low';
}

function getCoverageStyles(level) {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: Info,
        iconColor: 'text-amber-500',
      };
    case 'low':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        icon: Info,
        iconColor: 'text-gray-400',
      };
  }
}

export default function CoverageBadge({ 
  pct = 0, 
  note = '', 
  showWarning = true,
  className = '' 
}) {
  const level = getCoverageLevel(pct);
  const styles = getCoverageStyles(level);
  const Icon = styles.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium cursor-help ${styles.bg} ${styles.text} ${className}`}
            data-testid="coverage-badge"
          >
            <Icon className={`w-3.5 h-3.5 ${styles.iconColor}`} />
            <span>{pct}%</span>
          </div>
        </TooltipTrigger>
        
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">
              Data Coverage: {pct}%
            </div>
            
            {note && (
              <div className="text-sm text-gray-600">
                {note}
              </div>
            )}
            
            {showWarning && level === 'low' && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Limited data coverage may affect accuracy</span>
              </div>
            )}
            
            <div className="text-xs text-gray-400 italic">
              Coverage = data completeness, not quality
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
