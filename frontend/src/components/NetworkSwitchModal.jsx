/**
 * NetworkSwitchModal - ETAP B3
 * 
 * Modal for confirming network switch after cross-chain exit detection.
 * 
 * UX PRINCIPLE:
 * - Cross-chain = conscious user decision
 * - NOT automatic
 * - User confirms before switch
 */

import { memo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { SUPPORTED_NETWORKS } from '../state/network.store';

// Network colors for visual feedback
const getNetworkColor = (networkId) => {
  const config = SUPPORTED_NETWORKS.find(n => n.id === networkId);
  return config?.color || '#6366F1';
};

/**
 * Network Switch Confirmation Modal
 */
const NetworkSwitchModal = memo(function NetworkSwitchModal({
  open,
  from,
  to,
  bridge,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  
  const fromColor = getNetworkColor(from);
  const toColor = getNetworkColor(to);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        data-testid="network-switch-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Cross-chain transfer detected
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            data-testid="modal-close-btn"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          {/* Visual network transition */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: fromColor }}
              >
                {from?.slice(0, 3).toUpperCase()}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">
                {from?.toUpperCase()}
              </span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: toColor }}
              >
                {to?.slice(0, 3).toUpperCase()}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">
                {to?.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-center text-gray-600 mb-2">
            Funds moved from <span className="font-semibold">{from?.toUpperCase()}</span> to{' '}
            <span className="font-semibold">{to?.toUpperCase()}</span>
          </p>
          
          {bridge && (
            <p className="text-center text-sm text-gray-500 mb-4">
              via <span className="font-medium">{bridge}</span>
            </p>
          )}
          
          <p className="text-center text-gray-600">
            Do you want to switch network?
          </p>
        </div>
        
        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            data-testid="modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(to)}
            className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: toColor }}
            data-testid="modal-confirm-btn"
          >
            Switch to {to?.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
});

export default NetworkSwitchModal;
