/**
 * StateStale - показывается когда сессия устаревает
 */

import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParsingSlotCard } from './ParsingSlotCard';

export function StateStale({ status, onRefreshSession, onRefresh }) {
  const { sessions, details } = status;
  
  return (
    <div className="py-8 px-4">
      {/* Warning Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-amber-800 mb-1">
              Session Expiring Soon
            </h2>
            <p className="text-sm text-amber-700">
              One of your Twitter sessions needs to be refreshed to continue parsing.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{sessions.ok}</div>
          <div className="text-xs text-gray-500">OK</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{sessions.stale}</div>
          <div className="text-xs text-gray-500">Stale</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{sessions.invalid}</div>
          <div className="text-xs text-gray-500">Invalid</div>
        </div>
      </div>
      
      {/* Affected Account */}
      {details?.primaryAccount && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Affected Account
          </h3>
          <ParsingSlotCard
            username={details.primaryAccount.username}
            status="STALE"
            slotNumber={1}
            onRefresh={onRefreshSession}
          />
        </div>
      )}
      
      {/* Action */}
      <div className="space-y-3">
        <Button 
          className="w-full gap-2"
          onClick={onRefreshSession}
          data-testid="refresh-session-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Session
        </Button>
        
        <Button 
          variant="ghost"
          className="w-full gap-2"
          onClick={onRefresh}
        >
          <Clock className="w-4 h-4" />
          Check Status
        </Button>
      </div>
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        Open the Chrome extension and click "Sync" to refresh your session.
      </p>
    </div>
  );
}
