import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { explainEntity } from '../../api/connectionsIntelligence.api';
import AuthorityBreakdown from './AuthorityBreakdown';

export default function WhyThisMatters({ entityId, preset, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!entityId) return;

    setLoading(true);
    explainEntity(entityId, preset)
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [entityId, preset]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analyzing...
      </div>
    );
  }

  if (!data) return null;

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
      >
        <Info className="w-3 h-3" />
        Why this matters
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600" />
        Why This Matters
      </h3>

      {/* Summary */}
      <p className="text-sm text-gray-700 dark:text-gray-300">{data.summary}</p>

      {/* Key Points */}
      {data.keyPoints?.length > 0 && (
        <ul className="space-y-1">
          {data.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Risks */}
      {data.risk?.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">Risks</div>
          <ul className="space-y-1">
            {data.risk.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-orange-700 dark:text-orange-300">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Authority Breakdown */}
      {data.scores && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <AuthorityBreakdown scores={data.scores} preset={preset} />
        </div>
      )}
    </div>
  );
}
