/**
 * ML2 Feedback Controls Component - Phase C2
 * 
 * Provides feedback buttons for admin:
 * - Correct (alert was useful)
 * - False Positive (alert was noise)
 * 
 * Also shows recent feedback stats
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  MessageSquare,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '../../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Feedback Button Component
export function FeedbackButtons({ 
  actorId, 
  alertId, 
  ml2Decision = 'SEND', 
  token,
  onFeedbackSubmitted 
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const submitFeedback = async (action) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorId,
          alertId,
          ml2Decision,
          action,
          source: 'ADMIN',
        }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setSubmitted(action);
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted({ actorId, alertId, action });
        }
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {submitted === 'CORRECT' ? (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Marked Correct
          </span>
        ) : (
          <span className="text-red-600 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Marked False Positive
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => submitFeedback('CORRECT')}
        disabled={submitting}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 
          border border-green-200 hover:bg-green-100 disabled:opacity-50 
          flex items-center gap-1.5 transition"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        Correct
      </button>
      <button
        onClick={() => submitFeedback('FALSE_POSITIVE')}
        disabled={submitting}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 
          border border-red-200 hover:bg-red-100 disabled:opacity-50 
          flex items-center gap-1.5 transition"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        False Positive
      </button>
    </div>
  );
}

// Feedback Stats Panel
export function FeedbackStatsPanel({ token }) {
  const [stats, setStats] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('7d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/connections/feedback/stats?window=${window}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/feedback/recent?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const statsData = await statsRes.json();
      const recentData = await recentRes.json();
      
      if (statsData.ok) setStats(statsData.data);
      if (recentData.ok) setRecentFeedback(recentData.data?.entries || []);
    } catch (err) {
      console.error('Failed to fetch feedback data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, window]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const correctCount = stats?.byAction?.find(a => a._id === 'CORRECT')?.count || 0;
  const fpCount = stats?.byAction?.find(a => a._id === 'FALSE_POSITIVE')?.count || 0;
  const totalRated = correctCount + fpCount;
  const accuracyRate = totalRated > 0 ? ((correctCount / totalRated) * 100).toFixed(1) : 'N/A';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          Feedback Stats
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['7d', '30d'].map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition
                  ${window === w 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {w}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Correct</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{correctCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">False Positive</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{fpCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{accuracyRate}%</p>
          </div>
        </div>

        {/* Recent Feedback */}
        {recentFeedback.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Recent Feedback</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentFeedback.map((fb, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {fb.action === 'CORRECT' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : fb.action === 'FALSE_POSITIVE' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span className="font-medium">{fb.action}</span>
                    <span className="text-gray-400">for {fb.actorId?.slice(0, 12)}...</span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(fb.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Source */}
        {stats?.bySource?.length > 0 && (
          <div className="text-xs text-gray-500">
            Feedback sources: {stats.bySource.map(s => `${s._id} (${s.count})`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackButtons;
