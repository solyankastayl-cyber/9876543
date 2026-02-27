/**
 * StateInvalid - показывается когда сессия недействительна
 */

import { XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StateInvalid({ status, onReconnect, onRefresh }) {
  const { sessions, details } = status;
  
  return (
    <div className="py-8 px-4">
      {/* Error Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-red-800 mb-1">
              Session Invalid
            </h2>
            <p className="text-sm text-red-700">
              Your Twitter session has been invalidated. This can happen if you logged out 
              of Twitter or if the session expired.
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
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{sessions.stale}</div>
          <div className="text-xs text-gray-500">Stale</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{sessions.invalid}</div>
          <div className="text-xs text-gray-500">Invalid</div>
        </div>
      </div>
      
      {/* What to do */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">How to fix</span>
        </div>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Log into Twitter in your browser</li>
          <li>Open the FOMO Chrome Extension</li>
          <li>Click "Sync Cookies" to reconnect</li>
        </ol>
      </div>
      
      {/* Affected Account */}
      {details?.primaryAccount && (
        <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-medium text-gray-900">@{details.primaryAccount.username}</span>
            <span className="text-xs text-red-600 ml-auto">Invalid</span>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="space-y-3">
        <Button 
          className="w-full gap-2"
          onClick={onReconnect}
          data-testid="reconnect-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect Twitter
        </Button>
        
        <Button 
          variant="ghost"
          className="w-full"
          onClick={onRefresh}
        >
          Check Status
        </Button>
      </div>
    </div>
  );
}
