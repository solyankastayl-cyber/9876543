/**
 * Model Registry Component
 * 
 * Displays all ML models with their stages and metrics
 */

import { useState } from 'react';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Archive,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  Trash2
} from 'lucide-react';

export function ModelRegistry({ models, activeId, candidateId, onPromote, onRetire }) {
  const [expandedModel, setExpandedModel] = useState(null);

  const getStageStyle = (stage) => {
    switch (stage) {
      case 'ACTIVE':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'CANDIDATE':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'RETIRED':
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sort models: ACTIVE first, then CANDIDATE, then RETIRED
  const sortedModels = [...models].sort((a, b) => {
    const order = { ACTIVE: 0, CANDIDATE: 1, RETIRED: 2 };
    return (order[a.stage] ?? 3) - (order[b.stage] ?? 3);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Brain className="w-5 h-5 text-purple-500" />
          Model Registry
        </h3>
        <span className="text-sm text-gray-500">{models.length} models</span>
      </div>

      <div className="space-y-3">
        {sortedModels.map((model) => {
          const style = getStageStyle(model.stage);
          const isExpanded = expandedModel === model.modelId;
          const isActive = model.modelId === activeId;
          const isCandidate = model.modelId === candidateId;

          return (
            <div
              key={model.modelId}
              className={`rounded-lg border ${style.border} overflow-hidden`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedModel(isExpanded ? null : model.modelId)}
                className={`w-full px-4 py-3 flex items-center justify-between ${style.bg} hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  
                  <span className="font-mono text-sm text-gray-900">
                    {model.modelId.slice(0, 8)}...
                  </span>
                  
                  <span className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.text} border ${style.border}`}>
                    {model.stage}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {model.algo}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Accuracy</div>
                    <div className={`text-sm font-medium ${
                      model.metrics.accuracy >= 0.7 ? 'text-green-600' :
                      model.metrics.accuracy >= 0.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(model.metrics.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">ECE</div>
                    <div className={`text-sm font-medium ${
                      model.metrics.ece <= 0.2 ? 'text-green-600' :
                      model.metrics.ece <= 0.3 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(model.metrics.ece * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <MetricBox label="Accuracy" value={`${(model.metrics.accuracy * 100).toFixed(2)}%`} />
                    <MetricBox label="Brier Score" value={model.metrics.brier.toFixed(4)} />
                    <MetricBox label="ECE" value={`${(model.metrics.ece * 100).toFixed(2)}%`} />
                    <MetricBox label="Dataset Rows" value={model.dataset.rows.toLocaleString()} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Train Split:</span>{' '}
                      <span className="text-gray-700">
                        {(model.dataset.split.train * 100)}% / {(model.dataset.split.val * 100)}% / {(model.dataset.split.test * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>{' '}
                      <span className="text-gray-700">{formatDate(model.createdAt)}</span>
                    </div>
                  </div>

                  {model.notes && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="text-gray-500">Notes:</span> {model.notes}
                    </div>
                  )}

                  {/* Shadow State */}
                  {model.shadow && (
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="text-gray-500">Shadow:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        model.shadow.lastHealth === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                        model.shadow.lastHealth === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
                        model.shadow.lastHealth === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {model.shadow.lastHealth || 'N/A'}
                      </span>
                      <span className="text-gray-500">
                        Crit: {model.shadow.critStreak || 0} | Deg: {model.shadow.degStreak || 0}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {model.stage === 'CANDIDATE' && (
                      <button
                        onClick={() => onPromote(model.modelId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        <ArrowUp className="w-4 h-4" />
                        Promote to Active
                      </button>
                    )}
                    
                    {model.stage === 'CANDIDATE' && (
                      <button
                        onClick={() => onRetire(model.modelId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Retire
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {models.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No models in registry. Run a retrain to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
