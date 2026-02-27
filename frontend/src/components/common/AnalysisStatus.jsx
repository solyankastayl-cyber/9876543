/**
 * AnalysisStatus (P0 - Common Platform Layer)
 * 
 * Shows analysis status badge
 * completed → никогда не спиннер
 * pending → спиннер + "Analyzing..."
 * failed → error state + retry
 */
import { CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AnalysisStatus({ 
  status = 'completed', // 'completed' | 'pending' | 'failed'
  window = '24h',
  onRetry,
  className = '',
}) {
  if (status === 'completed') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 ${className}`}
        data-testid="analysis-status-completed"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Analysis complete ({window})</span>
      </div>
    );
  }
  
  if (status === 'pending') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs text-amber-600 ${className}`}
        data-testid="analysis-status-pending"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Analyzing...</span>
      </div>
    );
  }
  
  if (status === 'failed') {
    return (
      <div 
        className={`inline-flex items-center gap-2 ${className}`}
        data-testid="analysis-status-failed"
      >
        <div className="inline-flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Analysis failed</span>
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    );
  }
  
  return null;
}
