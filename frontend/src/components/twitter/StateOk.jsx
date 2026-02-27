/**
 * StateOk - показывается когда всё работает
 */

import { CheckCircle2, Plus, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParsingSlotCard } from './ParsingSlotCard';
import { CapacityInfo } from './CapacityInfo';

export function StateOk({ status, onAddSlot, onRefresh, onRefreshSlot }) {
  const { accounts, sessions, details } = status;
  
  return (
    <div className="py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Twitter Connected
            </h2>
            <p className="text-sm text-gray-500">
              {sessions.ok} active parsing {sessions.ok === 1 ? 'slot' : 'slots'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      
      {/* Capacity Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">Parsing Capacity</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          ~{sessions.ok * 200}-{sessions.ok * 400} posts/hour
        </p>
        <p className="text-sm text-gray-500">
          Based on {sessions.ok} active {sessions.ok === 1 ? 'slot' : 'slots'}
        </p>
      </div>
      
      {/* Slots List */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Your Parsing Slots
        </h3>
        
        <div className="space-y-3">
          {/* Show primary account first */}
          {details?.primaryAccount && (
            <ParsingSlotCard
              username={details.primaryAccount.username}
              status="OK"
              slotNumber={1}
              onRefresh={onRefreshSlot}
            />
          )}
          
          {/* Placeholder for additional slots */}
          {accounts > 1 && (
            <div className="text-sm text-gray-500 pl-4">
              +{accounts - 1} more {accounts - 1 === 1 ? 'account' : 'accounts'}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Slot CTA */}
      <Button 
        variant="outline" 
        onClick={onAddSlot}
        className="w-full gap-2"
        data-testid="add-slot-btn"
      >
        <Plus className="w-4 h-4" />
        Add Parsing Slot
      </Button>
      
      {/* Capacity Info */}
      <CapacityInfo className="mt-6" />
    </div>
  );
}
