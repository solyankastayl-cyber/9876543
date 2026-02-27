/**
 * ParsingSlotCard - карточка одного parsing slot (аккаунта)
 */

import { Twitter, RefreshCw, Trash2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  OK: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-100',
    label: 'Active',
  },
  STALE: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    label: 'Expiring',
  },
  INVALID: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    label: 'Invalid',
  },
};

export function ParsingSlotCard({ username, status, slotNumber, riskScore, lastSync, onRefresh, onRemove }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OK;
  const StatusIcon = config.icon;
  
  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`} data-testid={`slot-card-${slotNumber}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Twitter className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">@{username}</span>
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Slot #{slotNumber}
              {lastSync && ` • Last sync: ${lastSync}`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
          
          {onRefresh && status !== 'OK' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onRefresh(username)}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          {onRemove && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onRemove(username)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Risk indicator for non-OK statuses */}
      {status !== 'OK' && riskScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Risk Score</span>
            <span className={riskScore > 50 ? 'text-amber-600 font-medium' : 'text-gray-600'}>
              {riskScore}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
