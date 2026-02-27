/**
 * Graph Overlay Admin Tab (Phase 4.4)
 * 
 * Admin controls for graph overlay:
 * - Mode: mock / live / blended
 * - min_edge_confidence
 * - show_divergent
 * - show_low_confidence
 * - divergence_threshold
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Network, Eye, EyeOff, RefreshCw, Save, AlertTriangle,
  Check, Layers, Sliders
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const modeOptions = [
  { value: 'mock', label: 'Mock Only', desc: 'Show only overlap-based edges' },
  { value: 'live', label: 'Live Only', desc: 'Show only Twitter follow edges' },
  { value: 'blended', label: 'Blended', desc: 'Combine mock and live using weights' },
];

export default function GraphOverlayAdminTab({ token }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/graph/overlay/config`);
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch config');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Save config
  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/graph/overlay/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save config');
    }
    
    setSaving(false);
  };

  // Update config field
  const updateField = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading Graph Overlay config...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="graph-overlay-admin">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Graph Overlay Settings</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Phase 4.4
            </span>
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : success ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {success ? 'Saved!' : 'Save'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Phase 4.4 Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Network className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Live vs Mock Graph Overlay</h4>
              <p className="text-sm text-blue-700 mt-1">
                Control how the graph displays live Twitter follow edges vs mock overlap edges.
                Visual comparison helps validate connection quality before full live switch.
              </p>
            </div>
          </div>
        </div>

        {config && (
          <div className="space-y-6">
            {/* Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">Overlay Enabled</h4>
                <p className="text-sm text-gray-500">Enable overlay metadata on graph edges</p>
              </div>
              <button
                onClick={() => updateField('enabled', !config.enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Mode Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Display Mode</h4>
              <div className="grid grid-cols-3 gap-3">
                {modeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateField('mode', opt.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      config.mode === opt.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{opt.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-6">
              {/* Min Edge Confidence */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Min Edge Confidence
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.min_edge_confidence}
                    onChange={(e) => updateField('min_edge_confidence', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-mono bg-gray-100 px-2 py-1 rounded">
                    {config.min_edge_confidence}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Edges below this confidence are hidden (unless Show Low Confidence is enabled)
                </p>
              </div>

              {/* Divergence Threshold */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Divergence Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(config.divergence_threshold * 100)}
                    onChange={(e) => updateField('divergence_threshold', parseInt(e.target.value) / 100)}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-mono bg-gray-100 px-2 py-1 rounded">
                    {Math.round(config.divergence_threshold * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Weight difference above this marks edge as "divergent"
                </p>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-3 gap-4">
              {/* Show Low Confidence */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {config.show_low_confidence ? (
                    <Eye className="w-4 h-4 text-gray-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Low Confidence</span>
                </div>
                <button
                  onClick={() => updateField('show_low_confidence', !config.show_low_confidence)}
                  className={`w-10 h-5 rounded-full ${
                    config.show_low_confidence ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    config.show_low_confidence ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Show Divergent */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {config.show_divergent ? (
                    <Eye className="w-4 h-4 text-gray-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Divergent Edges</span>
                </div>
                <button
                  onClick={() => updateField('show_divergent', !config.show_divergent)}
                  className={`w-10 h-5 rounded-full ${
                    config.show_divergent ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    config.show_divergent ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Prefer Live */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Prefer Live</span>
                </div>
                <button
                  onClick={() => updateField('prefer_live_when_both', !config.prefer_live_when_both)}
                  className={`w-10 h-5 rounded-full ${
                    config.prefer_live_when_both ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    config.prefer_live_when_both ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Edge Color Legend</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-gray-400 rounded" />
                  <span className="text-gray-600">Mock (overlap-based)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-green-500 rounded" />
                  <span className="text-gray-600">Live (confirmed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-orange-500 rounded" />
                  <span className="text-gray-600">Divergent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 border border-dashed border-gray-400 rounded" />
                  <span className="text-gray-600">Low confidence</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
