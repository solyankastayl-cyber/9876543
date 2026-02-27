/**
 * NetworkSelector - ETAP B1
 * 
 * Global network selector component.
 * Changes network context for ALL data in the application.
 */

import { memo } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import useNetworkStore, { SUPPORTED_NETWORKS } from '../state/network.store';

// Network icons (simple colored circles for now)
const NetworkIcon = memo(function NetworkIcon({ network, size = 16 }) {
  const config = SUPPORTED_NETWORKS.find(n => n.id === network);
  if (!config) return null;
  
  return (
    <div 
      className="rounded-full"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: config.color,
        border: '2px solid rgba(255,255,255,0.2)',
      }}
    />
  );
});

/**
 * Compact network selector for header
 */
export const NetworkSelectorCompact = memo(function NetworkSelectorCompact({ className = '' }) {
  const { network, setNetwork, switching } = useNetworkStore();
  const currentConfig = SUPPORTED_NETWORKS.find(n => n.id === network);
  
  return (
    <div className={`relative ${className}`}>
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
        disabled={switching}
        className="appearance-none pl-8 pr-8 py-2 bg-gray-800 border border-gray-200 rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SUPPORTED_NETWORKS.map(net => (
          <option key={net.id} value={net.id}>
            {net.name}
          </option>
        ))}
      </select>
      
      {/* Network icon */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <NetworkIcon network={network} size={14} />
      </div>
      
      {/* Chevron */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
});

/**
 * Full network selector with label
 */
export const NetworkSelectorFull = memo(function NetworkSelectorFull({ label = 'Network', className = '' }) {
  const { network, setNetwork, switching } = useNetworkStore();
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-gray-500">{label}:</span>
      <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
        {SUPPORTED_NETWORKS.map(net => (
          <button
            key={net.id}
            onClick={() => setNetwork(net.id)}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              network === net.id
                ? 'bg-white text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <NetworkIcon network={net.id} size={10} />
            {net.shortName}
          </button>
        ))}
      </div>
    </div>
  );
});

/**
 * Network badge (display only)
 */
export const NetworkBadge = memo(function NetworkBadge({ network, size = 'sm' }) {
  const config = SUPPORTED_NETWORKS.find(n => n.id === network);
  if (!config) return null;
  
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-1',
    md: 'text-xs px-2.5 py-1.5',
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      <NetworkIcon network={network} size={size === 'xs' ? 8 : 10} />
      {config.shortName}
    </span>
  );
});

/**
 * Default export - compact selector
 */
export default NetworkSelectorCompact;
