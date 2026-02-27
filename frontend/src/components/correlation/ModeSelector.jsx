import { Crown, Copy, Layers } from 'lucide-react';

const modes = [
  { id: 'influence', label: 'Influence', icon: Crown },
  { id: 'copy', label: 'Copy', icon: Copy },
  { id: 'clusters', label: 'Clusters', icon: Layers }
];

export const ModeSelector = ({ mode, setMode }) => (
  <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
    {modes.map(m => (
      <button
        key={m.id}
        onClick={() => setMode(m.id)}
        data-testid={`mode-selector-${m.id}`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
          mode === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <m.icon className="w-3.5 h-3.5" />
        {m.label}
      </button>
    ))}
  </div>
);

export default ModeSelector;
