import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';

export default function HandshakePathView({ path, strength, hops }) {
  if (!path || path.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Handshake Path</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {hops} hop{hops !== 1 ? 's' : ''}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            strength >= 0.6 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : strength >= 0.3
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {Math.round(strength * 100)}% strength
          </span>
        </div>
      </div>

      {/* Path visualization */}
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {path.map((node, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0 ${
              node.isAnchor 
                ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700'
                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
              {node.isAnchor && <Shield className="w-3 h-3 text-purple-500" />}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {node.label || node.id}
              </span>
            </div>
            {i < path.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Trust explanation */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {path.some(n => n.isAnchor) 
          ? `Trusted via ${path.filter(n => n.isAnchor).map(n => n.label).join(', ')} (anchor${path.filter(n => n.isAnchor).length > 1 ? 's' : ''})`
          : 'Direct network connection'
        }
      </div>
    </div>
  );
}
