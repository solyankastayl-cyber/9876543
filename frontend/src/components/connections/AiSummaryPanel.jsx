/**
 * AiSummaryPanel - AI Summary Panel Component (Phase 3.6)
 * 
 * Shows AI-generated analysis with:
 * - Verdict Badge (STRONG/GOOD/MIXED/RISKY/INSUFFICIENT_DATA)
 * - Confidence Indicator
 * - Key Drivers
 * - Risks/Concerns
 * - Recommendations
 */
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Shield, RefreshCw, Info } from 'lucide-react';
import { Button } from '../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Verdict badge styles
const verdictStyles = {
  STRONG: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    icon: '🚀',
    label: 'Strong',
  },
  GOOD: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    icon: '✅',
    label: 'Good',
  },
  MIXED: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    icon: '⚖️',
    label: 'Mixed',
  },
  RISKY: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    icon: '⚠️',
    label: 'Risky',
  },
  INSUFFICIENT_DATA: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-600',
    icon: '❓',
    label: 'Insufficient Data',
  },
};

// Confidence level styles
const confidenceStyles = {
  high: { bg: 'bg-green-50', text: 'text-green-700', label: 'High Confidence' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medium Confidence' },
  low: { bg: 'bg-red-50', text: 'text-red-700', label: 'Low Confidence' },
};

export default function AiSummaryPanel({ accountId, scoreData, onRecompute, isAdmin = false }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  // Fetch AI summary when scoreData changes
  useEffect(() => {
    // Skip if no accountId
    if (!accountId) return;
    
    const fetchAiSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First check cache
        const cachedRes = await fetch(`${BACKEND_URL}/api/connections/ai/cached/${accountId}`);
        const cached = await cachedRes.json();
        
        if (cached.ok && cached.data) {
          setAiSummary(cached.data);
          setLoading(false);
          return;
        }
        
        // Build snapshot from scoreData with sensible defaults
        const score = scoreData?.twitter_score || scoreData?.influence_score || 500;
        const snapshot = {
          twitter_score_0_1000: Math.min(score, 1000),
          grade: scoreData?.grade || 'B',
          influence_0_1000: Math.min(scoreData?.influence_score || score, 1000),
          quality_0_1: Math.min(scoreData?.quality || 0.7, 1),
          trend_0_1: Math.min(scoreData?.trend_score || 0.5, 1),
          network_0_1: Math.min(scoreData?.network || 0.6, 1),
          consistency_0_1: Math.min(scoreData?.consistency || 0.7, 1),
          audience_quality_0_1: Math.min(scoreData?.audience_quality || 0.75, 1),
          authority_0_1: Math.min(scoreData?.authority || 0.6, 1),
          smart_followers_0_100: Math.min(scoreData?.smart_followers || 65, 100),
          hops: scoreData?.hops || { avg_hops_to_top: 2.5 },
          trends: scoreData?.trends || { velocity_pts_per_day: 5, state: 'stable' },
          early_signal: scoreData?.early_signal || { badge: 'none', score: 300 },
          red_flags: scoreData?.red_flags || [],
          twitter_confidence_score_0_100: Math.min(scoreData?.confidence || 75, 100),
        };
        
        // Generate new summary
        const res = await fetch(`${BACKEND_URL}/api/connections/ai/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: accountId,
            mode: 'summary',
            snapshot,
          }),
        });
        
        const data = await res.json();
        if (data.ok) {
          setAiSummary(data.data);
        } else {
          console.error('AI Summary error response:', data);
          setError(data.error || 'Failed to generate AI summary');
        }
      } catch (err) {
        console.error('AI Summary fetch error:', err);
        setError('AI service unavailable');
      }
      
      setLoading(false);
    };
    
    // Add small delay to allow other data to load first
    const timer = setTimeout(fetchAiSummary, 500);
    return () => clearTimeout(timer);
  }, [accountId, scoreData]);

  // Determine confidence level
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 70) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  };

  // Handle recompute
  const handleRecompute = async () => {
    if (!onRecompute) return;
    setLoading(true);
    await onRecompute();
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200" data-testid="ai-summary-panel">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            AI Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
          <span className="ml-3 text-gray-500">Analyzing account...</span>
        </div>
      </div>
    );
  }

  if (error || !aiSummary) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200" data-testid="ai-summary-panel">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            AI Analysis
          </h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{error || 'AI analysis not available'}</p>
          {isAdmin && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleRecompute}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Analysis
            </Button>
          )}
        </div>
      </div>
    );
  }

  const verdictStyle = verdictStyles[aiSummary.verdict] || verdictStyles.MIXED;
  const confidence = aiSummary.evidence?.confidence_0_100 || 75;
  const confidenceLevel = getConfidenceLevel(confidence);
  const confStyle = confidenceStyles[confidenceLevel];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200" data-testid="ai-summary-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            AI Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${confStyle.bg} ${confStyle.text}`}>
            {confStyle.label}
          </span>
          {/* Verdict Badge */}
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${verdictStyle.bg} ${verdictStyle.border} ${verdictStyle.text}`}>
            {verdictStyle.icon} {verdictStyle.label}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{aiSummary.headline}</h4>
        <p className="text-gray-600 mt-2 leading-relaxed">{aiSummary.summary}</p>
      </div>

      {/* Key Drivers */}
      {aiSummary.key_drivers?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Key Drivers</span>
          </div>
          <ul className="space-y-1">
            {aiSummary.key_drivers.map((driver, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">•</span>
                {driver}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {aiSummary.risks?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-gray-700">Risks & Concerns</span>
          </div>
          <ul className="space-y-1">
            {aiSummary.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-500 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {aiSummary.recommendations?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Recommendations</span>
          </div>
          <ul className="space-y-1">
            {aiSummary.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-500 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence */}
      {aiSummary.evidence?.notable?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Notable Evidence</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSummary.evidence.notable.map((note, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer with score and admin controls */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Score: <span className="font-semibold text-gray-900">{aiSummary.evidence?.score || '—'}</span>
          {aiSummary.evidence?.grade && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
              Grade {aiSummary.evidence.grade}
            </span>
          )}
        </div>
        {isAdmin && onRecompute && (
          <Button variant="ghost" size="sm" onClick={handleRecompute} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recompute
          </Button>
        )}
      </div>
    </div>
  );
}
