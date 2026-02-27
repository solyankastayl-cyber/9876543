/**
 * Feedback Tab - Phase 5.A.3
 * 
 * Features:
 * - Recent alerts needing feedback
 * - Feedback statistics (FP rate by type/pattern)
 * - Mark alerts as CORRECT / FALSE_POSITIVE / NOISE / TOO_EARLY
 * - ML Learning status
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '../../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Stat Card
const StatCard = ({ label, value, color = 'gray', icon: Icon, subtext }) => {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <span className="text-2xl font-bold">{value}</span>
      {subtext && <div className="text-xs mt-1 opacity-75">{subtext}</div>}
    </div>
  );
};

// Section Card
const SectionCard = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        {title}
      </h3>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// Feedback Button
const FeedbackButton = ({ label, icon: Icon, color, onClick, active }) => {
  const colors = {
    green: active ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
    red: active ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
    yellow: active ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    gray: active ? 'bg-gray-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
  };
  
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${colors[color]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
};

export default function FeedbackTab({ token }) {
  const [stats, setStats] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections/admin/ml/feedback/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/admin/ml/feedback/pending?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      
      if (statsData.ok) setStats(statsData.data);
      if (pendingData.ok) setPendingAlerts(pendingData.data?.alerts || []);
    } catch (err) {
      console.error('Failed to fetch feedback data:', err);
      setToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitFeedback = async (alertId, feedback) => {
    setSubmitting(prev => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/ml/feedback/${alertId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setToast({ type: 'success', message: `Marked as ${feedback}` });
        // Remove from pending list
        setPendingAlerts(prev => prev.filter(a => a.alert_id !== alertId));
        // Refresh stats
        fetchData();
      } else {
        setToast({ type: 'error', message: data.message || 'Failed to submit feedback' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setSubmitting(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // Toast component
  const Toast = ({ type, message, onClose }) => (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2
      ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">&times;</button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Alerts" 
          value={stats?.total || 0} 
          color="blue" 
          icon={BarChart3} 
        />
        <StatCard 
          label="Correct" 
          value={stats?.correct || 0} 
          color="green" 
          icon={CheckCircle} 
        />
        <StatCard 
          label="False Positives" 
          value={stats?.false_positive || 0} 
          color="red" 
          icon={XCircle} 
          subtext={`${stats?.fp_rate || 0}% FP rate`}
        />
        <StatCard 
          label="Pending Review" 
          value={stats?.unknown || 0} 
          color="yellow" 
          icon={Clock} 
        />
      </div>

      {/* FP Rate by Type */}
      {stats?.by_alert_type && Object.keys(stats.by_alert_type).length > 0 && (
        <SectionCard title="FP Rate by Alert Type" icon={TrendingUp}>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.by_alert_type).map(([type, data]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{type}</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold">{data.fp_rate?.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">
                    ({data.fp}/{data.total})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* FP Rate by Pattern */}
      {stats?.by_pattern && Object.keys(stats.by_pattern).length > 0 && (
        <SectionCard title="FP Rate by Pattern" icon={Filter}>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.by_pattern).map(([pattern, data]) => (
              <div key={pattern} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{pattern}</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold">{data.fp_rate?.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">
                    ({data.fp}/{data.total})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Pending Feedback */}
      <SectionCard 
        title="Alerts Needing Feedback" 
        icon={MessageSquare}
        action={
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        }
      >
        {pendingAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>All caught up! No alerts need feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAlerts.map(alert => (
              <div 
                key={alert.alert_id} 
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">@{alert.account_handle || alert.account_id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                      ${alert.alert_type === 'EARLY_BREAKOUT' ? 'bg-green-100 text-green-700' :
                        alert.alert_type === 'STRONG_ACCELERATION' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {alert.alert_type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {alert.score_to} • Confidence: {alert.confidence_score}%
                    {alert.patterns?.length > 0 && ` • Patterns: ${alert.patterns.join(', ')}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FeedbackButton 
                    label="Correct" 
                    icon={ThumbsUp} 
                    color="green"
                    onClick={() => submitFeedback(alert.alert_id, 'CORRECT')}
                  />
                  <FeedbackButton 
                    label="False Positive" 
                    icon={ThumbsDown} 
                    color="red"
                    onClick={() => submitFeedback(alert.alert_id, 'FALSE_POSITIVE')}
                  />
                  <FeedbackButton 
                    label="Noise" 
                    icon={AlertTriangle} 
                    color="yellow"
                    onClick={() => submitFeedback(alert.alert_id, 'NOISE')}
                  />
                  <FeedbackButton 
                    label="Too Early" 
                    icon={Clock} 
                    color="gray"
                    onClick={() => submitFeedback(alert.alert_id, 'TOO_EARLY')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ML Learning Status */}
      <SectionCard title="ML Learning Status" icon={TrendingUp}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Dataset Size</h4>
            <div className="text-3xl font-bold text-gray-900">
              {(stats?.total - stats?.unknown) || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              labeled alerts ready for training
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Training Status</h4>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="text-sm text-gray-600">Shadow mode (collecting data)</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Need 100+ labeled alerts to enable ML training
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
