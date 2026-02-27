/**
 * EmptyState (P0 - Common Platform Layer)
 * 
 * Shows empty result with "what we checked"
 * Empty = valid result, NOT error
 */
import { Search, CheckCircle } from 'lucide-react';

export default function EmptyState({ 
  message = 'No data found',
  description = null,
  checked = [],
  icon: Icon = Search,
  className = '',
}) {
  return (
    <div className={`text-center py-12 ${className}`} data-testid="empty-state">
      {/* Icon */}
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      {/* Message */}
      <p className="text-gray-600 font-medium">{message}</p>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      )}
      
      {/* What we checked */}
      {checked && checked.length > 0 && (
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>We checked: {checked.join(', ')}</span>
        </div>
      )}
    </div>
  );
}
