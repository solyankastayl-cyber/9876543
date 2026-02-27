/**
 * Admin ML Validation Page - ML v2.1 STEP 1
 * 
 * Shows signal validation outcomes and accuracy metrics.
 */

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../api/client';
import { 
  CheckCircle, XCircle, MinusCircle, Clock,
  RefreshCw, Loader2, AlertTriangle, Play,
  Target, TrendingUp, BarChart3, HelpCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

// ============ INFO TOOLTIP ============
function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-slate-400 hover:text-slate-600 ml-1">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white text-white border-slate-700">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ OUTCOME BADGE ============
function OutcomeBadge({ outcome }) {
  const config = {
    CORRECT: { icon: CheckCircle, class: 'bg-green-50 text-green-700 border-green-200' },
    WRONG: { icon: XCircle, class: 'bg-red-50 text-red-700 border-red-200' },
    NEUTRAL: { icon: MinusCircle, class: 'bg-slate-50 text-slate-600 border-slate-200' },
    SKIPPED: { icon: Clock, class: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  
  const { icon: Icon, class: className } = config[outcome] || config.SKIPPED;
  
  return (
    <Badge variant="outline" className={`${className} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {outcome}
    </Badge>
  );
}

// ============ KPI CARD ============
function KPICard({ title, value, subtitle, icon: Icon, color = 'blue', tooltip }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500 flex items-center">
          {title}
          {tooltip && <InfoTip text={tooltip} />}
        </span>
        <div className={`p-1.5 rounded ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminValidationPage() {
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  
  const [network, setNetwork] = useState('');
  
  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [summaryRes, statsRes, outcomesRes] = await Promise.all([
        api.get('/api/admin/ml/outcomes/summary?days=7', { headers }),
        api.get('/api/admin/ml/validation/stats', { headers }),
        api.get('/api/admin/ml/outcomes?limit=30', { headers }),
      ]);
      
      if (summaryRes.data.ok) setSummary(summaryRes.data.data);
      if (statsRes.data.ok) setStats(statsRes.data.data || []);
      if (outcomesRes.data.ok) setOutcomes(outcomesRes.data.data || []);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load validation data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Trigger validation
  const triggerValidation = async () => {
    setTriggering(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post('/api/admin/ml/validation/trigger', 
        { network: network || undefined, limit: 50 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.ok) {
        setSuccess(`Validated ${res.data.data.processed} signals`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Validation trigger failed');
    } finally {
      setTriggering(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ML Validation</h1>
              <p className="text-sm text-slate-500">Signal outcome tracking & accuracy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* KPI Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard
              title="Total Signals"
              value={summary.total.toLocaleString()}
              icon={BarChart3}
              color="blue"
              tooltip="Total signals evaluated in the last 7 days"
            />
            <KPICard
              title="Accuracy"
              value={`${(summary.accuracy * 100).toFixed(1)}%`}
              subtitle="Correct / Evaluated"
              icon={Target}
              color={summary.accuracy >= 0.55 ? 'green' : 'red'}
              tooltip="Percentage of correct predictions (excluding skipped/neutral)"
            />
            <KPICard
              title="Correct"
              value={summary.correct.toLocaleString()}
              icon={CheckCircle}
              color="green"
              tooltip="Predictions that matched actual market direction"
            />
            <KPICard
              title="Wrong"
              value={summary.wrong.toLocaleString()}
              icon={XCircle}
              color="red"
              tooltip="Predictions that were opposite to market direction"
            />
            <KPICard
              title="Skipped"
              value={summary.skipped.toLocaleString()}
              icon={Clock}
              color="amber"
              tooltip="Signals without price data or low market movement"
            />
          </div>
        )}

        {/* Manual Trigger */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900 flex items-center">
                Manual Validation
                <InfoTip text="Manually trigger validation for pending signals. Useful for testing or catching up on backlog." />
              </h3>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              >
                <option value="">All Networks</option>
                <option value="ethereum">Ethereum</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="base">Base</option>
              </select>
            </div>
            <Button onClick={triggerValidation} disabled={triggering}>
              {triggering ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Validation
            </Button>
          </div>
        </div>

        {/* Stats by Network */}
        {stats.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Accuracy by Network
              <InfoTip text="Breakdown of validation results per blockchain network" />
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-600 font-medium">Network</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Total</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Correct</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Wrong</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Skipped</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.network} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-900 capitalize">{s.network}</td>
                      <td className="py-3 text-center text-slate-600">{s.total}</td>
                      <td className="py-3 text-center text-green-600">{s.correct}</td>
                      <td className="py-3 text-center text-red-600">{s.wrong}</td>
                      <td className="py-3 text-center text-amber-600">{s.skipped}</td>
                      <td className="py-3 text-center">
                        <Badge 
                          variant="outline" 
                          className={`${
                            s.accuracy >= 0.6 ? 'bg-green-50 text-green-700 border-green-200' :
                            s.accuracy >= 0.5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {(s.accuracy * 100).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Outcomes */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-600" />
            Recent Outcomes
            <InfoTip text="Latest validated signals with their outcomes" />
          </h3>
          
          {outcomes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No outcomes yet. Run validation to see results.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-600 font-medium">Signal</th>
                    <th className="text-left py-2 text-slate-600 font-medium">Network</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Predicted</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Return</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Outcome</th>
                    <th className="text-left py-2 text-slate-600 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomes.slice(0, 20).map((o, i) => (
                    <tr key={o.signalId || i} className="border-b border-slate-100">
                      <td className="py-2 font-mono text-xs text-slate-500">
                        {o.signalId?.slice(0, 8)}...
                      </td>
                      <td className="py-2 capitalize text-slate-700">{o.network}</td>
                      <td className="py-2 text-center">
                        <Badge 
                          variant="outline" 
                          className={`${
                            o.predictedSide === 'BUY' ? 'bg-green-50 text-green-700 border-green-200' :
                            o.predictedSide === 'SELL' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {o.predictedSide}
                        </Badge>
                      </td>
                      <td className={`py-2 text-center font-mono ${
                        o.actualReturnPct > 0 ? 'text-green-600' :
                        o.actualReturnPct < 0 ? 'text-red-600' :
                        'text-slate-500'
                      }`}>
                        {o.actualReturnPct !== null ? `${o.actualReturnPct > 0 ? '+' : ''}${o.actualReturnPct.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-2 text-center">
                        <OutcomeBadge outcome={o.outcome} />
                      </td>
                      <td className="py-2 text-xs text-slate-500">
                        {o.evaluatedAt ? new Date(o.evaluatedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
