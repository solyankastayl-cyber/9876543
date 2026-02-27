import { useState } from 'react';
import { Bell, BellRing, Plus, Trash2, Settings, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, Coins, X } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function AlertsPanel({ watchlistItem, onClose }) {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'cex_deposit', label: 'Deposit to CEX', enabled: true, threshold: '> $10,000' },
    { id: 2, type: 'buy_spike', label: 'Buy Spike', enabled: true, threshold: '> 50% increase' },
    { id: 3, type: 'sell_spike', label: 'Sell Spike', enabled: false, threshold: '> 50% increase' },
    { id: 4, type: 'new_token', label: 'New Token Bought', enabled: true, threshold: 'Any new token' },
    { id: 5, type: 'risky_approval', label: 'Approval to Risky Spender', enabled: true, threshold: 'Unverified contracts' },
  ]);

  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, type: 'cex_deposit', message: 'Deposited 50 ETH to Binance', time: '2h ago', severity: 'warning' },
    { id: 2, type: 'buy_spike', message: 'Bought $125K UNI (3x normal)', time: '5h ago', severity: 'info' },
    { id: 3, type: 'new_token', message: 'First purchase of ARB token', time: '1d ago', severity: 'info' },
  ]);

  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlertType, setNewAlertType] = useState('cex_deposit');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');

  const alertTypeIcons = {
    cex_deposit: TrendingUp,
    buy_spike: TrendingUp,
    sell_spike: TrendingDown,
    new_token: Coins,
    risky_approval: ShieldAlert,
  };

  const alertTypeColors = {
    cex_deposit: 'text-orange-600 bg-orange-100',
    buy_spike: 'text-emerald-600 bg-emerald-100',
    sell_spike: 'text-red-600 bg-red-100',
    new_token: 'text-blue-600 bg-blue-100',
    risky_approval: 'text-purple-600 bg-purple-100',
  };

  const severityColors = {
    warning: 'border-l-orange-500 bg-orange-50',
    info: 'border-l-blue-500 bg-blue-50',
    danger: 'border-l-red-500 bg-red-50',
  };

  const toggleAlert = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const addAlert = () => {
    if (newAlertThreshold) {
      const alertLabel = {
        cex_deposit: 'Deposit to CEX',
        buy_spike: 'Buy Spike',
        sell_spike: 'Sell Spike',
        new_token: 'New Token Bought',
        risky_approval: 'Approval to Risky Spender',
      };
      
      setAlerts([...alerts, {
        id: Date.now(),
        type: newAlertType,
        label: alertLabel[newAlertType],
        enabled: true,
        threshold: newAlertThreshold,
      }]);
      setNewAlertThreshold('');
      setShowAddAlert(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <GlassCard className="w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Alert Settings</h2>
                <p className="text-sm text-gray-500">{watchlistItem?.label || 'Configure alerts'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Alert Rules */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Alert Rules</h3>
              <button 
                onClick={() => setShowAddAlert(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Rule
              </button>
            </div>

            {showAddAlert && (
              <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Alert Type</label>
                    <select 
                      value={newAlertType}
                      onChange={(e) => setNewAlertType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="cex_deposit">Deposit to CEX</option>
                      <option value="buy_spike">Buy Spike</option>
                      <option value="sell_spike">Sell Spike</option>
                      <option value="new_token">New Token Bought</option>
                      <option value="risky_approval">Risky Approval</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Threshold</label>
                    <input 
                      type="text"
                      value={newAlertThreshold}
                      onChange={(e) => setNewAlertThreshold(e.target.value)}
                      placeholder="e.g., > $10,000"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddAlert(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addAlert}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Alert
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = alertTypeIcons[alert.type];
                const colorClass = alertTypeColors[alert.type];
                return (
                  <div 
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${alert.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{alert.label}</div>
                        <div className="text-xs text-gray-500">{alert.threshold}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${alert.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alert.enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <button 
                        onClick={() => removeAlert(alert.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Alerts */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Recent Alerts</h3>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p>No recent alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((alert) => {
                  const Icon = alertTypeIcons[alert.type];
                  return (
                    <div 
                      key={alert.id}
                      className={`p-3 rounded-2xl border-l-4 ${severityColors[alert.severity]}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-sm text-gray-900">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          alert.severity === 'warning' ? 'bg-orange-200 text-orange-700' :
                          alert.severity === 'danger' ? 'bg-red-200 text-red-700' :
                          'bg-blue-200 text-blue-700'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {alerts.filter(a => a.enabled).length} of {alerts.length} alerts active
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-white rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
