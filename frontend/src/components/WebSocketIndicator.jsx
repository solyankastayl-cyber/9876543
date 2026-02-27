import React from 'react';
import { useWebSocket } from '../context/WebSocketContext.jsx';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WebSocketIndicator({ showLabel = false }) {
  const { connectionState, isConnected } = useWebSocket();
  
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Live',
          pulse: true
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          label: 'Connecting...',
          animate: 'animate-spin'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          label: 'Offline'
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}
      title={`WebSocket: ${connectionState}`}
    >
      <div className="relative">
        <Icon className={`w-3.5 h-3.5 ${config.color} ${config.animate || ''}`} />
        {config.pulse && isConnected && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export default WebSocketIndicator;
