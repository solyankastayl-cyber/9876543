import React, { useState, useEffect } from 'react';
import { Scale, Trophy, ArrowLeftRight } from 'lucide-react';
import { compareEntities } from '../../api/connectionsIntelligence.api';

export default function CompareDrawer({ leftId, rightId, preset, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leftId || !rightId) return;

    setLoading(true);
    compareEntities(leftId, rightId, preset)
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [leftId, rightId, preset]);

  if (!leftId || !rightId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <div className="flex items-center justify-center gap-3">
            <Scale className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Compare</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Comparing...</div>
        ) : data ? (
          <div className="p-4 space-y-4">
            {/* Winner badge */}
            {data.winner && (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Trophy className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {data.winner === leftId ? data.leftEntity?.title : data.rightEntity?.title} wins
                </span>
              </div>
            )}

            {/* Reason */}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {data.reason}
            </p>

            {/* Comparison bars */}
            <div className="space-y-3">
              {Object.entries(data.comparison || {}).map(([key, [left, right]]) => (
                <ComparisonBar 
                  key={key} 
                  label={key} 
                  leftValue={left} 
                  rightValue={right}
                  leftLabel={data.leftEntity?.title}
                  rightLabel={data.rightEntity?.title}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Failed to compare</div>
        )}
      </div>
    </div>
  );
}

function ComparisonBar({ label, leftValue, rightValue, leftLabel, rightLabel }) {
  const maxValue = Math.max(leftValue, rightValue, 0.01);
  const leftWidth = (leftValue / maxValue) * 100;
  const rightWidth = (rightValue / maxValue) * 100;
  const leftWins = leftValue > rightValue;

  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
        <span className="capitalize">{label}</span>
        <span>
          {Math.round(leftValue * 100)}% vs {Math.round(rightValue * 100)}%
        </span>
      </div>
      <div className="flex gap-1 h-3">
        <div className="flex-1 flex justify-end bg-gray-100 dark:bg-gray-700 rounded-l-full overflow-hidden">
          <div 
            className={`h-full transition-all rounded-l-full ${leftWins ? 'bg-green-500' : 'bg-blue-400'}`}
            style={{ width: `${leftWidth}%` }}
          />
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-r-full overflow-hidden">
          <div 
            className={`h-full transition-all rounded-r-full ${!leftWins ? 'bg-green-500' : 'bg-purple-400'}`}
            style={{ width: `${rightWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
