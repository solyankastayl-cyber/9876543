/**
 * CapacityInfo - информация о parsing capacity
 */

import { Info, Zap, Shield, Users } from 'lucide-react';

export function CapacityInfo({ className = '' }) {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">How capacity works</span>
      </div>
      
      <ul className="space-y-3 text-sm text-gray-600">
        <li className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>1 Twitter account ≈ 200–400 posts/hour</span>
        </li>
        <li className="flex items-start gap-3">
          <Users className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <span>More accounts = more parallel parsing</span>
        </li>
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>Accounts are isolated and never shared</span>
        </li>
      </ul>
      
      <p className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-400">
        Advanced users connect 2–3 accounts to reach 1M+ posts/month,
        comparable to enterprise APIs.
      </p>
    </div>
  );
}
