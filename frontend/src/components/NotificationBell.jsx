/**
 * NotificationBell - Header notification indicator
 * 
 * Shows:
 * - Unacknowledged alert count
 * - Dropdown with recent alerts
 * - Quick acknowledge actions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertsApi } from '../api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await alertsApi.getAlertsFeed({ 
        limit: 5, 
        unacknowledged: true 
      });
      
      if (response?.ok) {
        setAlerts(response.data || []);
        setUnreadCount(response.unacknowledgedCount || 0);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Acknowledge single alert
  const handleAcknowledge = async (alertId, e) => {
    e.stopPropagation();
    try {
      await alertsApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Acknowledge all
  const handleAcknowledgeAll = async () => {
    try {
      await alertsApi.acknowledgeAllAlerts();
      setAlerts([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to acknowledge all alerts:', err);
    }
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get signal emoji
  const getEmoji = (signalType) => {
    const emojis = {
      'accumulation': '📥',
      'distribution': '📤',
      'large_move': '💰',
      'smart_money_entry': '🐋',
      'smart_money_exit': '🏃',
      'strategy_detected': '🎯',
      'strategy_confirmed': '✅',
      'strategy_shift': '🔄',
      'strategy_risk_spike': '⚠️',
    };
    return emojis[signalType] || '🔔';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleAcknowledgeAll}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && alerts.length === 0 ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getEmoji(alert.signalType)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(alert.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleAcknowledge(alert._id, e)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="block text-center py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
