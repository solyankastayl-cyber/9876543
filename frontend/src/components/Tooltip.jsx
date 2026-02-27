import { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

/**
 * Tooltip Component
 * Dark themed tooltip matching the design from screenshots
 * 
 * Usage:
 * <Tooltip title="Token Liquidity" description="Percentage of tokens currently in liquidity pool">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * Or with data points:
 * <Tooltip 
 *   title="Token Liquidity"
 *   description="Percentage of tokens currently in liquidity pool"
 *   data={[
 *     { label: 'Current', value: '10.24%', color: 'emerald' },
 *     { label: 'Locked Value', value: '$102400', color: 'white' }
 *   ]}
 * >
 *   <button>Hover me</button>
 * </Tooltip>
 */

export function Tooltip({ 
  title, 
  description, 
  data = [],
  children,
  position = 'top',
  showIcon = false,
  signal = null // { type: 'strong', text: 'Ready for immediate action', emoji: '🔥' }
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const signalColors = {
    strong: 'text-orange-400',
    weak: 'text-gray-400',
    medium: 'text-yellow-400',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center"
      >
        {children}
        {showIcon && (
          <Info className="w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
        )}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          style={{ width: 'max-content', maxWidth: '320px' }}
        >
          <div className="bg-white text-white rounded-2xl shadow-2xl p-4">
            {/* Title */}
            <h4 className="font-bold text-base text-white mb-1">{title}</h4>
            
            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">{description}</p>
            
            {/* Separator */}
            {(data.length > 0 || signal) && (
              <div className="h-px bg-gray-700 mb-3" />
            )}
            
            {/* Data Points */}
            {data.length > 0 && (
              <div className="space-y-2">
                {data.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{item.label}:</span>
                    <span className={`text-sm font-semibold ${
                      item.color === 'emerald' ? 'text-emerald-400' : 
                      item.color === 'red' ? 'text-red-400' : 
                      item.color === 'blue' ? 'text-blue-400' : 
                      item.color === 'orange' ? 'text-orange-400' : 
                      'text-white'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Signal */}
            {signal && (
              <div className="mt-2">
                <div className={`flex items-center gap-2 ${signalColors[signal.type] || 'text-gray-400'}`}>
                  {signal.emoji && <span className="text-lg">{signal.emoji}</span>}
                  <span className="text-sm font-bold">{signal.type === 'strong' ? 'Strong signal!' : signal.type === 'weak' ? 'Weak signal' : 'Medium signal'}</span>
                </div>
                {signal.text && (
                  <p className="text-sm text-gray-400 mt-1">{signal.text}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className={`absolute ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : 
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : 
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : 
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`}>
            <div className={`w-3 h-3 bg-white ${
              position === 'top' ? 'rotate-45' : 
              position === 'bottom' ? 'rotate-45' : 
              position === 'left' ? 'rotate-45' : 
              'rotate-45'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * InfoIcon Component
 * Simple icon with tooltip
 */
export function InfoIcon({ title, description, data = [], signal = null, position = 'top' }) {
  return (
    <Tooltip 
      title={title} 
      description={description} 
      data={data}
      signal={signal}
      position={position}
    >
      <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-100 transition-colors">
        <Info className="w-4 h-4 text-gray-400" />
      </button>
    </Tooltip>
  );
}

export default Tooltip;
