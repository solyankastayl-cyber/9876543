/**
 * Admin Auto-Retrain Policies Page
 * 
 * ML v2.2 + v2.3 Integration
 * - Configure auto-retrain policies per task/network
 * - Select ML version (v2.1 classic or v2.3 with feature pruning)
 * - Configure v2.3 settings (pruning mode, weighting mode, safety guards)
 */

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Settings, RefreshCw, Loader2, CheckCircle, XCircle,
  Cpu, Zap, Shield, Clock, TrendingDown, Activity,
  ChevronDown, ChevronUp, Play, AlertTriangle, HelpCircle,
  Layers, Scissors, Scale
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ============ HELPERS ============
function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-slate-600 hover:text-slate-900 ml-1">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white text-slate-900 border-slate-200">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ POLICY CARD ============
function PolicyCard({ policy, onEdit, onDryRun, onTrigger, loading }) {
  const [expanded, setExpanded] = useState(false);
  const mlVersion = policy.mlVersion || 'v2.1';
  
  return (
    <div className={`bg-white rounded-xl border ${policy.enabled ? 'border-slate-200' : 'border-slate-200 opacity-60'} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${policy.enabled ? 'bg-green-50' : 'bg-slate-100/50'}`}>
            <Cpu className={`w-5 h-5 ${policy.enabled ? 'text-green-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{policy.task}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-700">{policy.network}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={policy.enabled ? 'border-green-300 text-green-600' : 'border-slate-300 text-slate-500'}>
                {policy.enabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge variant="outline" className={
                mlVersion === 'v2.3' 
                  ? 'border-purple-300 text-purple-600' 
                  : 'border-slate-300 text-slate-600'
              }>
                {mlVersion}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDryRun(policy)}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900"
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(policy)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-600 hover:text-slate-900"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-200/50 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Triggers */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Triggers</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Accuracy</span>
                  <span className={policy.triggers?.accuracy?.enabled ? 'text-green-600' : 'text-slate-500'}>
                    {policy.triggers?.accuracy?.enabled ? `< ${(policy.triggers.accuracy.minAccuracy7d * 100).toFixed(0)}%` : 'Off'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Drift</span>
                  <span className={policy.triggers?.drift?.enabled ? 'text-amber-600' : 'text-slate-500'}>
                    {policy.triggers?.drift?.enabled ? policy.triggers.drift.minLevel : 'Off'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Time</span>
                  <span className={policy.triggers?.time?.enabled ? 'text-blue-600' : 'text-slate-500'}>
                    {policy.triggers?.time?.enabled ? `> ${policy.triggers.time.maxHoursSinceRetrain}h` : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Guards */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Guards</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Cooldown</span>
                  <span className="text-slate-700">{policy.guards?.cooldownMinutes}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Max/day</span>
                  <span className="text-slate-700">{policy.guards?.maxJobsPerDay}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Min rows</span>
                  <span className="text-slate-700">{policy.guards?.minRows}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* v2.3 Config */}
          {mlVersion === 'v2.3' && policy.v23Config && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-xs font-medium text-purple-600 uppercase mb-2 flex items-center gap-1">
                <Scissors className="w-3 h-3" />
                v2.3 Config
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pruning</span>
                  <span className="text-purple-700">{policy.v23Config.pruningMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Weighting</span>
                  <span className="text-purple-700">{policy.v23Config.weightingMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Min features</span>
                  <span className="text-purple-700">{policy.v23Config.minFeatures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max drop %</span>
                  <span className="text-purple-700">{policy.v23Config.maxFeatureDropPct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ EDIT MODAL ============
function PolicyEditModal({ policy, open, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    enabled: false,
    mlVersion: 'v2.1',
    triggers: {
      accuracy: { enabled: false, minAccuracy7d: 0.55 },
      drift: { enabled: false, minLevel: 'HIGH' },
      time: { enabled: false, maxHoursSinceRetrain: 48 }
    },
    guards: {
      cooldownMinutes: 360,
      maxJobsPerDay: 2,
      minRows: 500
    },
    v23Config: {
      pruningMode: 'FULL',
      weightingMode: 'FULL',
      minFeatures: 5,
      maxFeatureDropPct: 40
    }
  });

  useEffect(() => {
    if (policy) {
      setForm({
        enabled: policy.enabled || false,
        mlVersion: policy.mlVersion || 'v2.1',
        triggers: {
          accuracy: policy.triggers?.accuracy || { enabled: false, minAccuracy7d: 0.55 },
          drift: policy.triggers?.drift || { enabled: false, minLevel: 'HIGH' },
          time: policy.triggers?.time || { enabled: false, maxHoursSinceRetrain: 48 }
        },
        guards: {
          cooldownMinutes: policy.guards?.cooldownMinutes || 360,
          maxJobsPerDay: policy.guards?.maxJobsPerDay || 2,
          minRows: policy.guards?.minRows || 500
        },
        v23Config: policy.v23Config || {
          pruningMode: 'FULL',
          weightingMode: 'FULL',
          minFeatures: 5,
          maxFeatureDropPct: 40
        }
      });
    }
  }, [policy]);

  const handleSave = () => {
    onSave(form);
  };

  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Edit Policy: {policy.task}/{policy.network}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Configure auto-retrain triggers, guards, and ML version
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="bg-white border-slate-200">
            <TabsTrigger value="general" className="data-[state=active]:bg-white">General</TabsTrigger>
            <TabsTrigger value="triggers" className="data-[state=active]:bg-white">Triggers</TabsTrigger>
            <TabsTrigger value="guards" className="data-[state=active]:bg-white">Guards</TabsTrigger>
            <TabsTrigger value="ml" className="data-[state=active]:bg-white">ML Version</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div>
                <Label className="text-slate-900">Policy Enabled</Label>
                <p className="text-xs text-slate-600 mt-1">Enable auto-retrain for this task/network</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
              />
            </div>
          </TabsContent>

          {/* Triggers */}
          <TabsContent value="triggers" className="mt-4 space-y-4">
            {/* Accuracy Trigger */}
            <div className="p-4 bg-white rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <Label className="text-slate-900">Accuracy Drop</Label>
                  <InfoTip text="Trigger retrain when 7-day accuracy drops below threshold" />
                </div>
                <Switch
                  checked={form.triggers.accuracy.enabled}
                  onCheckedChange={(checked) => setForm({
                    ...form,
                    triggers: { ...form.triggers, accuracy: { ...form.triggers.accuracy, enabled: checked } }
                  })}
                />
              </div>
              {form.triggers.accuracy.enabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-slate-600 text-sm">Threshold:</Label>
                  <Input
                    type="number"
                    value={(form.triggers.accuracy.minAccuracy7d * 100).toFixed(0)}
                    onChange={(e) => setForm({
                      ...form,
                      triggers: { ...form.triggers, accuracy: { ...form.triggers.accuracy, minAccuracy7d: parseFloat(e.target.value) / 100 } }
                    })}
                    className="w-20 bg-slate-100 border-slate-300 text-slate-900"
                    min={0}
                    max={100}
                  />
                  <span className="text-slate-600">%</span>
                </div>
              )}
            </div>

            {/* Drift Trigger */}
            <div className="p-4 bg-white rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <Label className="text-slate-900">Drift Level</Label>
                  <InfoTip text="Trigger retrain when drift reaches specified level" />
                </div>
                <Switch
                  checked={form.triggers.drift.enabled}
                  onCheckedChange={(checked) => setForm({
                    ...form,
                    triggers: { ...form.triggers, drift: { ...form.triggers.drift, enabled: checked } }
                  })}
                />
              </div>
              {form.triggers.drift.enabled && (
                <Select
                  value={form.triggers.drift.minLevel}
                  onValueChange={(value) => setForm({
                    ...form,
                    triggers: { ...form.triggers, drift: { ...form.triggers.drift, minLevel: value } }
                  })}
                >
                  <SelectTrigger className="w-32 bg-slate-100 border-slate-300 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Time Trigger */}
            <div className="p-4 bg-white rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <Label className="text-slate-900">Time Elapsed</Label>
                  <InfoTip text="Trigger retrain after specified hours since last retrain" />
                </div>
                <Switch
                  checked={form.triggers.time.enabled}
                  onCheckedChange={(checked) => setForm({
                    ...form,
                    triggers: { ...form.triggers, time: { ...form.triggers.time, enabled: checked } }
                  })}
                />
              </div>
              {form.triggers.time.enabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-slate-600 text-sm">Max hours:</Label>
                  <Input
                    type="number"
                    value={form.triggers.time.maxHoursSinceRetrain}
                    onChange={(e) => setForm({
                      ...form,
                      triggers: { ...form.triggers, time: { ...form.triggers.time, maxHoursSinceRetrain: parseInt(e.target.value) } }
                    })}
                    className="w-20 bg-slate-100 border-slate-300 text-slate-900"
                    min={1}
                  />
                  <span className="text-slate-600">hours</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Guards */}
          <TabsContent value="guards" className="mt-4 space-y-4">
            <div className="p-4 bg-white rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <Label className="text-slate-900">Safety Guards</Label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-600 text-sm">Cooldown (min)</Label>
                  <Input
                    type="number"
                    value={form.guards.cooldownMinutes}
                    onChange={(e) => setForm({
                      ...form,
                      guards: { ...form.guards, cooldownMinutes: parseInt(e.target.value) }
                    })}
                    className="mt-1 bg-slate-100 border-slate-300 text-slate-900"
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-slate-600 text-sm">Max jobs/day</Label>
                  <Input
                    type="number"
                    value={form.guards.maxJobsPerDay}
                    onChange={(e) => setForm({
                      ...form,
                      guards: { ...form.guards, maxJobsPerDay: parseInt(e.target.value) }
                    })}
                    className="mt-1 bg-slate-100 border-slate-300 text-slate-900"
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-slate-600 text-sm">Min rows</Label>
                  <Input
                    type="number"
                    value={form.guards.minRows}
                    onChange={(e) => setForm({
                      ...form,
                      guards: { ...form.guards, minRows: parseInt(e.target.value) }
                    })}
                    className="mt-1 bg-slate-100 border-slate-300 text-slate-900"
                    min={1}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ML Version */}
          <TabsContent value="ml" className="mt-4 space-y-4">
            {/* Version Selection */}
            <div className="p-4 bg-white rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-purple-600" />
                <Label className="text-slate-900">ML Training Version</Label>
                <InfoTip text="v2.1 = classic training, v2.3 = feature pruning + sample weighting" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setForm({ ...form, mlVersion: 'v2.1' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    form.mlVersion === 'v2.1'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">v2.1 Classic</div>
                  <div className="text-xs text-slate-600 mt-1">Standard training without feature manipulation</div>
                </button>
                <button
                  onClick={() => setForm({ ...form, mlVersion: 'v2.3' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    form.mlVersion === 'v2.3'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    v2.3 Advanced
                    <Badge className="bg-purple-500/20 text-purple-700 text-xs">NEW</Badge>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Feature pruning + sample weighting</div>
                </button>
              </div>
            </div>

            {/* v2.3 Config */}
            {form.mlVersion === 'v2.3' && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <Label className="text-slate-900">v2.3 Configuration</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pruning Mode */}
                  <div>
                    <Label className="text-slate-600 text-sm flex items-center gap-1">
                      Pruning Mode
                      <InfoTip text="OFF = no pruning, FULL = variance + correlation + importance" />
                    </Label>
                    <Select
                      value={form.v23Config.pruningMode}
                      onValueChange={(value) => setForm({
                        ...form,
                        v23Config: { ...form.v23Config, pruningMode: value }
                      })}
                    >
                      <SelectTrigger className="mt-1 bg-slate-100 border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="OFF">OFF</SelectItem>
                        <SelectItem value="BASIC">BASIC (variance only)</SelectItem>
                        <SelectItem value="CORRELATION">CORRELATION</SelectItem>
                        <SelectItem value="IMPORTANCE">IMPORTANCE</SelectItem>
                        <SelectItem value="FULL">FULL (all)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weighting Mode */}
                  <div>
                    <Label className="text-slate-600 text-sm flex items-center gap-1">
                      Weighting Mode
                      <InfoTip text="OFF = equal weights, FULL = time decay + strong boost + class balance" />
                    </Label>
                    <Select
                      value={form.v23Config.weightingMode}
                      onValueChange={(value) => setForm({
                        ...form,
                        v23Config: { ...form.v23Config, weightingMode: value }
                      })}
                    >
                      <SelectTrigger className="mt-1 bg-slate-100 border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="OFF">OFF</SelectItem>
                        <SelectItem value="TIME_DECAY">TIME_DECAY</SelectItem>
                        <SelectItem value="CLASS_WEIGHT">CLASS_WEIGHT</SelectItem>
                        <SelectItem value="FULL">FULL (all)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Safety Guards */}
                  <div>
                    <Label className="text-slate-600 text-sm flex items-center gap-1">
                      Min Features
                      <InfoTip text="Minimum features to keep after pruning (safety guard)" />
                    </Label>
                    <Input
                      type="number"
                      value={form.v23Config.minFeatures}
                      onChange={(e) => setForm({
                        ...form,
                        v23Config: { ...form.v23Config, minFeatures: parseInt(e.target.value) }
                      })}
                      className="mt-1 bg-slate-100 border-slate-300 text-slate-900"
                      min={1}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-600 text-sm flex items-center gap-1">
                      Max Drop %
                      <InfoTip text="Maximum percentage of features that can be dropped (safety guard)" />
                    </Label>
                    <Input
                      type="number"
                      value={form.v23Config.maxFeatureDropPct}
                      onChange={(e) => setForm({
                        ...form,
                        v23Config: { ...form.v23Config, maxFeatureDropPct: parseInt(e.target.value) }
                      })}
                      className="mt-1 bg-slate-100 border-slate-300 text-slate-900"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="border-slate-300 text-slate-700 hover:bg-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ MAIN PAGE ============
export default function AdminAutoRetrainPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [summary, setSummary] = useState({ total: 0, enabled: 0, disabled: 0 });
  const [editPolicy, setEditPolicy] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/auto-retrain/policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setPolicies(data.policies || []);
        setSummary(data.summary || { total: 0, enabled: 0, disabled: 0 });
      } else {
        setError(data.error || 'Failed to load policies');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Save policy
  const handleSavePolicy = async (form) => {
    if (!editPolicy) return;
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/auto-retrain/policies/${editPolicy.task}/${editPolicy.network}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(`Policy ${editPolicy.task}/${editPolicy.network} updated`);
        setEditPolicy(null);
        fetchPolicies();
      } else {
        setError(data.error || 'Failed to save policy');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Dry run
  const handleDryRun = async (policy) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/auto-retrain/dry-run/${policy.task}/${policy.network}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDryRunResult({
        task: policy.task,
        network: policy.network,
        ...data
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Manual trigger
  const handleTrigger = async (policy) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/api/admin/auto-retrain/run/${policy.task}/${policy.network}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok && data.enqueued) {
        setSuccess(`Retrain triggered for ${policy.task}/${policy.network}`);
        fetchPolicies();
      } else {
        setError(data.reason || data.reasons?.join(', ') || 'Trigger skipped');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-auto-retrain-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Auto-Retrain Policies</h1>
              <p className="text-sm text-slate-600">ML v2.2 + v2.3 — Automated model retraining with feature optimization</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchPolicies}
            disabled={loading}
            className="border-slate-300 text-slate-700 hover:bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-300">✕</button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-300">✕</button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-500 uppercase">Total Policies</p>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-xs text-green-600 uppercase">Enabled</p>
            <p className="text-2xl font-bold text-green-600">{summary.enabled}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-500 uppercase">Disabled</p>
            <p className="text-2xl font-bold text-slate-600">{summary.disabled}</p>
          </div>
        </div>

        {/* Dry Run Result */}
        {dryRunResult && (
          <div className={`p-4 rounded-lg border ${dryRunResult.wouldEnqueue ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Dry Run: {dryRunResult.task}/{dryRunResult.network}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Would enqueue: <span className={dryRunResult.wouldEnqueue ? 'text-amber-600' : 'text-slate-500'}>
                    {dryRunResult.wouldEnqueue ? 'YES' : 'NO'}
                  </span>
                  {dryRunResult.reason && ` — ${dryRunResult.reason}`}
                  {dryRunResult.reasons && ` — ${dryRunResult.reasons.join(', ')}`}
                </p>
                {dryRunResult.mlVersion && (
                  <p className="text-sm text-purple-600 mt-1">ML Version: {dryRunResult.mlVersion}</p>
                )}
              </div>
              <button onClick={() => setDryRunResult(null)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
          </div>
        )}

        {/* Policies Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((policy) => (
            <PolicyCard
              key={`${policy.task}-${policy.network}`}
              policy={policy}
              onEdit={setEditPolicy}
              onDryRun={handleDryRun}
              onTrigger={handleTrigger}
              loading={loading}
            />
          ))}
        </div>

        {/* Edit Modal */}
        <PolicyEditModal
          policy={editPolicy}
          open={!!editPolicy}
          onClose={() => setEditPolicy(null)}
          onSave={handleSavePolicy}
          loading={saving}
        />
      </div>
    </AdminLayout>
  );
}
