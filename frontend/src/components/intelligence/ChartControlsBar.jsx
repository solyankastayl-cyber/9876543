/**
 * ChartControlsBar — V3.1 Unified Control Bar
 * 
 * [ Prediction | Forecast | Exchange | On-chain | Sentiment ] [ 🕯 | 📈 ] [ 1D | 7D | 30D ]
 * 
 * LOGIC:
 * - Prediction: Base chart + arrow only (no forecast bars)
 * - Forecast/Exchange/etc: Each adds INDEPENDENT 2-bar overlay
 * - Multiple overlays can be active simultaneously
 */

import { 
  BrainCircuitIcon, 
  LineChartIcon, 
  LinkIcon, 
  MessageCircleIcon,
  CandlestickChartIcon,
  TrendingUpIcon,
  TargetIcon
} from 'lucide-react';

// Layer configuration
const LAYERS = {
  prediction: {
    key: 'prediction',
    label: 'Prediction',
    color: '#64748b', // Slate - neutral
    icon: TargetIcon,
    enabled: true,
    isBase: true, // Base layer - just arrow
  },
  forecast: { 
    key: 'forecast',
    label: 'Forecast', 
    color: '#00C896', // Neo green
    icon: BrainCircuitIcon,
    enabled: true,
    isBase: false,
  },
  exchange: { 
    key: 'exchange',
    label: 'Exchange', 
    color: '#7C4DFF', // Purple
    icon: LineChartIcon,
    enabled: true,
    isBase: false,
  },
  onchain: { 
    key: 'onchain',
    label: 'On-chain', 
    color: '#FFB020', // Amber
    icon: LinkIcon,
    enabled: false, // Frozen
    isBase: false,
  },
  sentiment: { 
    key: 'sentiment',
    label: 'Sentiment', 
    color: '#00B8D9', // Teal
    icon: MessageCircleIcon,
    enabled: true, // BLOCK 5: Enabled
    isBase: false,
  },
};

const HORIZONS = [
  { value: '1D', label: '1D' },
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
];

export function ChartControlsBar({
  activeLayer,
  onLayerChange,
  viewMode, // 'candle' | 'line'
  onViewModeChange,
  horizon,
  onHorizonChange,
  // Multi-select for overlay layers
  enabledLayers = new Set(['prediction']),
  onToggleLayer,
}) {

  const handleLayerClick = (layerKey) => {
    if (!LAYERS[layerKey].enabled) return;
    onToggleLayer?.(layerKey);
  };

  const isLayerActive = (layerKey) => {
    return enabledLayers.has(layerKey);
  };

  return (
    <div 
      className="flex items-center gap-3"
      data-testid="chart-controls-bar"
    >
      {/* Layer Switches */}
      <div className="flex gap-1 bg-gray-50 rounded-2xl p-1 border border-gray-200">
        {Object.entries(LAYERS).map(([key, config]) => {
          const isActive = isLayerActive(key);
          const isDisabled = !config.enabled;
          const IconComponent = config.icon;
          
          return (
            <button
              key={key}
              onClick={() => handleLayerClick(key)}
              disabled={isDisabled}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isActive
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
              data-testid={`layer-${key}`}
            >
              <IconComponent 
                className={`w-3.5 h-3.5 ${isDisabled ? 'opacity-30' : ''}`}
                style={isActive && !isDisabled ? { color: config.color } : {}}
              />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* View Mode Switch */}
      <div className="flex gap-1 bg-gray-50 rounded-2xl p-1 border border-gray-200">
        <button
          onClick={() => onViewModeChange('candle')}
          className={`p-1.5 rounded-xl transition-all ${
            viewMode === 'candle'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="Candle view"
          data-testid="view-mode-candle"
        >
          <CandlestickChartIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('line')}
          className={`p-1.5 rounded-xl transition-all ${
            viewMode === 'line'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="Line view"
          data-testid="view-mode-line"
        >
          <TrendingUpIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Horizon Switch */}
      <div className="flex gap-1 bg-gray-50 rounded-2xl p-1 border border-gray-200">
        {HORIZONS.map(h => (
          <button
            key={h.value}
            onClick={() => onHorizonChange(h.value)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              horizon === h.value
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            data-testid={`horizon-${h.value.toLowerCase()}`}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Export layer colors for chart usage
export const LAYER_COLORS = {
  prediction: '#64748b',
  forecast: '#00C896',
  exchange: '#7C4DFF',
  onchain: '#FFB020',
  sentiment: '#00B8D9',
};

// Export layer config
export const LAYER_CONFIG = LAYERS;

export default ChartControlsBar;
