/**
 * Trust Explanation Component (Phase 15 UI)
 * 
 * Popover with detailed trust explanation, strengths, weaknesses.
 */
import React, { useState, useEffect } from 'react';
import { Info, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

export default function TrustExplanation({ type, targetId, triggerClassName }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (open && !snapshot && targetId) {
      fetchSnapshot();
    }
  }, [open, targetId]);
  
  const fetchSnapshot = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(
        `${backendUrl}/api/reputation/trust/${type}/${targetId}`
      );
      const data = await response.json();
      if (data.ok) {
        setSnapshot(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trust snapshot:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 transition-colors',
            triggerClassName
          )}
          aria-label="Show trust explanation"
        >
          <Info className="h-4 w-4 text-gray-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading trust data...
          </div>
        ) : snapshot ? (
          <div className="space-y-4 p-4">
            {/* Header */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Trust Analysis</h4>
              <p className="text-sm text-gray-600">{snapshot.explanation}</p>
            </div>
            
            {/* Badges */}
            {snapshot.badges && snapshot.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {snapshot.badges.map((badge, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
            
            <Separator />
            
            {/* Strengths */}
            {snapshot.strengths && snapshot.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Strengths</span>
                </div>
                <ul className="space-y-1.5 ml-5">
                  {snapshot.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-600 list-disc">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Weaknesses */}
            {snapshot.weaknesses && snapshot.weaknesses.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Considerations</span>
                </div>
                <ul className="space-y-1.5 ml-5">
                  {snapshot.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-600 list-disc">
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Market Context */}
            {snapshot.context && (snapshot.context.bestIn || snapshot.context.worstIn) && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Market Context</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {snapshot.context.bestIn && (
                    <div>✓ Best in <span className="font-medium">{snapshot.context.bestIn}</span> markets</div>
                  )}
                  {snapshot.context.worstIn && (
                    <div>⚠ Weak in <span className="font-medium">{snapshot.context.worstIn}</span> markets</div>
                  )}
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Recommendation */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 mb-1">RECOMMENDATION</div>
              <div className="text-sm text-gray-900">{snapshot.recommendation}</div>
            </div>
            
            {/* Data Quality Warning */}
            {snapshot.dataQuality && !snapshot.dataQuality.hasSufficientData && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700">
                  {snapshot.dataQuality.warning || 'Limited data - wait for more history'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No trust data available
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
