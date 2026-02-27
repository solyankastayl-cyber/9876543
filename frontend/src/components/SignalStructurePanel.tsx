/**
 * SignalStructurePanel — Multi-Layer Influence Bars (Block A)
 * 
 * Displays model decision transparency:
 * - Layer contributions (Exchange, On-chain, Sentiment)
 * - Overlay adjustments (Macro, Funding, Health)
 * - Top signals driving the verdict
 * 
 * Architectural principle: Transparency without UI clutter.
 * No rainbow colors, no charts — just clean progress bars and deltas.
 */

import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

// Type definitions matching backend explain.builder.ts
interface ExplainLayerEntry {
  key: 'exchange' | 'onchain' | 'sentiment';
  weight: number;
  note?: string;
}

interface ExplainOverlayEntry {
  key: 'macro' | 'funding' | 'health';
  delta: number;
  label?: string;
}

interface ExplainSignalEntry {
  key: string;
  impact: number;
}

interface ExplainSnapshot {
  horizon: '1D' | '7D' | '30D';
  final: {
    action: string;
    confidence_raw: number;
    confidence_adj: number;
    expectedMovePct: number;
  };
  drivers: {
    layers: ExplainLayerEntry[];
    overlays: ExplainOverlayEntry[];
    topSignals: ExplainSignalEntry[];
  };
}

interface SignalStructurePanelProps {
  explain?: ExplainSnapshot | null;
  compact?: boolean;
}

// Layer display configuration
const LAYER_CONFIG: Record<string, { label: string; color: string }> = {
  exchange: { label: 'Exchange', color: '#3b82f6' },
  onchain: { label: 'On-chain', color: '#f59e0b' },
  sentiment: { label: 'Sentiment', color: '#ec4899' },
};

// Overlay display configuration  
const OVERLAY_CONFIG: Record<string, { label: string }> = {
  macro: { label: 'Macro' },
  funding: { label: 'Funding' },
  health: { label: 'Health' },
};

export default function SignalStructurePanel({ explain, compact = false }: SignalStructurePanelProps) {
  if (!explain) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="signal-structure-panel">
        <div className="text-xs font-medium text-gray-500 mb-3">SIGNAL STRUCTURE</div>
        <div className="text-center py-4 text-sm text-gray-400">
          Loading model data...
        </div>
      </div>
    );
  }

  const { final, drivers } = explain;
  const { layers, overlays, topSignals } = drivers;

  // Action badge colors
  const actionColors: Record<string, string> = {
    BUY: 'bg-green-500 text-white',
    SELL: 'bg-red-500 text-white',
    HOLD: 'bg-gray-400 text-white',
    AVOID: 'bg-red-700 text-white',
  };

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4"
      data-testid="signal-structure-panel"
      style={{ minWidth: compact ? 220 : 260 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Signal Structure
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold ${actionColors[final.action] || actionColors.HOLD}`}>
          {final.action}
        </div>
      </div>

      {/* Confidence Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Confidence</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 line-through">
              {Math.round(final.confidence_raw * 100)}%
            </span>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(final.confidence_adj * 100)}%
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-gray-600">Expected Move</span>
          <span className={`font-medium ${final.expectedMovePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {final.expectedMovePct >= 0 ? '+' : ''}{final.expectedMovePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Section 1: Layers */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Layers</div>
        <div className="space-y-2">
          {layers.map(layer => (
            <LayerBar key={layer.key} layer={layer} />
          ))}
        </div>
      </div>

      {/* Section 2: Adjustments */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Adjustments</div>
        <div className="space-y-1">
          {overlays.map(overlay => (
            <OverlayRow key={overlay.key} overlay={overlay} />
          ))}
        </div>
      </div>

      {/* Section 3: Top Signals */}
      {topSignals.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Top Signals</div>
          <div className="space-y-1">
            {topSignals.map(signal => (
              <SignalRow key={signal.key} signal={signal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Layer bar component with progress visualization
 */
function LayerBar({ layer }: { layer: ExplainLayerEntry }) {
  const config = LAYER_CONFIG[layer.key] || { label: layer.key, color: '#6b7280' };
  const isFrozen = layer.note === 'frozen' || layer.weight === 0;
  const percentage = Math.round(layer.weight * 100);

  return (
    <div className={isFrozen ? 'opacity-50' : ''}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{config.label}</span>
        <span className={`text-sm font-medium ${isFrozen ? 'text-gray-400' : 'text-gray-700'}`}>
          {isFrozen ? (
            <span className="text-xs">frozen</span>
          ) : (
            `${percentage}%`
          )}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: isFrozen ? '#d1d5db' : config.color,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Overlay adjustment row showing delta values
 */
function OverlayRow({ overlay }: { overlay: ExplainOverlayEntry }) {
  const config = OVERLAY_CONFIG[overlay.key] || { label: overlay.key };
  const deltaPct = Math.round(overlay.delta * 100);
  const isNeutral = Math.abs(deltaPct) < 1;
  
  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{config.label}</span>
        {overlay.label && (
          <span className="text-xs text-gray-400 truncate max-w-[100px]" title={overlay.label}>
            {overlay.label}
          </span>
        )}
      </div>
      <span className={`text-sm font-medium ${
        isNeutral 
          ? 'text-gray-400' 
          : deltaPct > 0 
            ? 'text-green-600' 
            : 'text-red-600'
      }`}>
        {isNeutral ? '0%' : `${deltaPct > 0 ? '+' : ''}${deltaPct}%`}
      </span>
    </div>
  );
}

/**
 * Signal row showing individual signal impact
 */
function SignalRow({ signal }: { signal: ExplainSignalEntry }) {
  const impactPct = Math.round(signal.impact * 100);
  const isPositive = impactPct > 0;
  
  // Format signal key for display (camelCase → readable)
  const displayKey = signal.key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase();

  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-green-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-500" />
        )}
        <span className="text-sm text-gray-600 capitalize">{displayKey}</span>
      </div>
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{impactPct}%
      </span>
    </div>
  );
}

export { SignalStructurePanel };
