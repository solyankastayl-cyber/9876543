/**
 * Layer Toggles — Show/hide prediction layers
 */

const LAYERS = [
  { id: 'price', label: 'Real Price', color: '#3B82F6' },
  { id: 'combined', label: 'Combined', color: '#10B981' },
  { id: 'exchange', label: 'Exchange', color: '#F59E0B' },
  { id: 'onchain', label: 'Onchain', color: '#8B5CF6' },
  { id: 'sentiment', label: 'Sentiment', color: '#EC4899' },
];

export function LayerToggles({ visibleLayers, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="layer-toggles">
      {LAYERS.map(layer => {
        const isActive = visibleLayers.includes(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${isActive 
                ? 'text-white shadow-sm' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
            style={isActive ? { backgroundColor: layer.color } : {}}
            data-testid={`layer-toggle-${layer.id}`}
          >
            {layer.label}
          </button>
        );
      })}
    </div>
  );
}

export default LayerToggles;
