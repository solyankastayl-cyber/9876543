/**
 * InterpretationBlock (P0 - Common Platform Layer)
 * 
 * Displays interpretation from API response
 * НЕ ПИШЕМ свои интерпретации на фронте
 */
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function InterpretationBlock({ 
  headline,
  description,
  expandable = true,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (!headline) return null;
  
  return (
    <div 
      className={`bg-blue-50 rounded-lg p-4 ${className}`}
      data-testid="interpretation-block"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          {/* Headline */}
          <p className="text-sm font-medium text-blue-900">
            {headline}
          </p>
          
          {/* Description (expandable or always shown) */}
          {description && (
            <>
              {expandable ? (
                <>
                  {expanded && (
                    <p className="text-sm text-blue-700 mt-2">
                      {description}
                    </p>
                  )}
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    {expanded ? (
                      <>Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>More <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-sm text-blue-700 mt-2">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
