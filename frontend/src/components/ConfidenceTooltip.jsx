/**
 * ConfidenceTooltip - Explains what Confidence Score means
 * 
 * CONTRACT:
 * - Confidence reflects DATA COMPLETENESS, not signal quality
 * - Users often confuse it with "how sure we are"
 * - This tooltip provides clear explanation
 */
import React from 'react';
import { Info, Database, Clock, Activity, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * Get confidence level info
 */
const getConfidenceLevel = (confidence) => {
  if (confidence >= 0.8) return { 
    level: 'High', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-100',
    description: 'Extensive on-chain history available'
  };
  if (confidence >= 0.5) return { 
    level: 'Medium', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    description: 'Moderate data available'
  };
  if (confidence >= 0.2) return { 
    level: 'Low', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    description: 'Limited on-chain activity detected'
  };
  return { 
    level: 'Minimal', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    description: 'Very little data available'
  };
};

/**
 * Confidence factors that contribute to the score
 */
const CONFIDENCE_FACTORS = [
  { 
    icon: Activity, 
    label: 'Transfer History',
    description: 'Number of indexed transfers'
  },
  { 
    icon: Clock, 
    label: 'Time Coverage',
    description: 'How far back data extends'
  },
  { 
    icon: Database, 
    label: 'Data Completeness',
    description: 'Gaps in historical data'
  },
  { 
    icon: CheckCircle, 
    label: 'Price Availability',
    description: 'USD conversion possible'
  },
];

/**
 * ConfidenceTooltip Component
 * 
 * Shows confidence score with explanation tooltip
 */
export default function ConfidenceTooltip({ 
  confidence, 
  showBadge = true,
  showValue = true,
  className = '' 
}) {
  const level = getConfidenceLevel(confidence);
  const percentValue = Math.round(confidence * 100);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 cursor-help ${className}`}>
            {showBadge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${level.bgColor} ${level.color}`}>
                {level.level}
              </span>
            )}
            {showValue && (
              <span className="text-xs text-gray-500">
                {percentValue}%
              </span>
            )}
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs p-0 bg-white border border-gray-200 shadow-lg"
          side="bottom"
        >
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">
                Data Confidence: {level.level}
              </span>
              <span className={`text-sm font-bold ${level.color}`}>
                {percentValue}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {level.description}
            </p>
          </div>
          
          {/* Important clarification */}
          <div className="p-3 bg-blue-50 border-b border-gray-100">
            <p className="text-xs text-blue-800 font-medium mb-1">
              ⚠️ What Confidence Means
            </p>
            <p className="text-xs text-blue-700">
              Confidence reflects <strong>data completeness</strong>, not signal accuracy.
              A low confidence score means we have less historical data to analyze—it doesn't mean the signals are wrong.
            </p>
          </div>
          
          {/* Contributing factors */}
          <div className="p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Contributing Factors:
            </p>
            <div className="space-y-1.5">
              {CONFIDENCE_FACTORS.map(({ icon: Icon, label, description }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-500 ml-1">— {description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer note */}
          <div className="px-3 py-2 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 italic">
              Confidence increases as more on-chain data is indexed.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version for inline use
 */
export function ConfidenceIndicator({ confidence, size = 'sm' }) {
  const level = getConfidenceLevel(confidence);
  const percentValue = Math.round(confidence * 100);
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 rounded font-medium cursor-help ${level.bgColor} ${level.color} ${sizeClasses[size]}`}>
            {percentValue}%
            <Info className="w-3 h-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm font-medium mb-1">Data Confidence: {level.level}</p>
          <p className="text-xs text-gray-400">
            Reflects data completeness, not signal accuracy.
            {confidence < 0.5 && ' Limited historical data available.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
