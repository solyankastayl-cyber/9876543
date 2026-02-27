/**
 * CheckedBadge (P0 - Common Platform Layer)
 * 
 * Shows what data sources were checked
 * "✓ Checked: flows, signals, corridors"
 */
import { CheckCircle } from 'lucide-react';

export default function CheckedBadge({ checked = [], className = '' }) {
  if (!checked || checked.length === 0) return null;
  
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 ${className}`}>
      <CheckCircle className="w-3.5 h-3.5" />
      <span>Checked: {checked.join(', ')}</span>
    </div>
  );
}
