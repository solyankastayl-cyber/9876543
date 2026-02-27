/**
 * Phase 6: Mode Audit History
 * Shows mode change history
 */
import { useState, useEffect } from 'react';
import { History, Loader2, RefreshCw, ArrowRight, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getModeAudit } from '../../api/mlModes.api';

const ACTION_COLORS = {
  MODE_CHANGE: 'bg-blue-100 text-blue-700',
  KILL_SWITCH_TRIGGER: 'bg-red-100 text-red-700',
  KILL_SWITCH_RESET: 'bg-green-100 text-green-700',
  AUTO_DISABLE: 'bg-amber-100 text-amber-700',
};

const ACTION_TOOLTIPS = {
  MODE_CHANGE: 'Manual or gate-driven mode transition',
  KILL_SWITCH_TRIGGER: 'Kill Switch was activated (auto or manual)',
  KILL_SWITCH_RESET: 'Kill Switch was re-armed',
  AUTO_DISABLE: 'System automatically disabled ML due to safety trigger',
};

export function ModeAuditHistory({ limit = 20 }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const data = await getModeAudit(limit);
      setAudits(data.audits || []);
    } catch (err) {
      console.error('Failed to fetch mode audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Mode Change History</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Complete audit trail of all ML mode changes. All events are logged automatically and cannot be deleted.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={fetchAudits}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="refresh-mode-audit"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Refresh audit history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {audits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No mode change records</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {audits.map((audit, idx) => (
            <TooltipProvider key={audit.auditId || idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-help"
                    data-testid={`mode-audit-item-${idx}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[audit.action] || 'bg-gray-100 text-gray-700'}`}>
                        {audit.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {audit.timestamp && new Date(audit.timestamp).toLocaleString('en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    {audit.fromMode && audit.toMode && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span className="font-medium">{audit.fromMode}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{audit.toMode}</span>
                      </div>
                    )}
                    
                    {audit.reason && (
                      <p className="text-xs text-gray-500 mt-1 truncate" title={audit.reason}>
                        {audit.reason}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400 mt-1">
                      by {audit.triggeredBy || 'system'}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
                  <p className="text-sm">{ACTION_TOOLTIPS[audit.action] || 'Mode state change event'}</p>
                  {audit.reason && <p className="text-xs text-gray-400 mt-1">Reason: {audit.reason}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModeAuditHistory;
