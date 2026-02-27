/**
 * Decision Strip — Current verdict display
 */

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

const DECISION_STYLES = {
  BUY: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    icon: ArrowUpIcon,
  },
  SELL: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    icon: ArrowDownIcon,
  },
  AVOID: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: MinusIcon,
  },
};

export function DecisionStrip({ 
  decision = 'AVOID', 
  confidence = 0.5,
  direction = 'NEUTRAL',
  accuracy = null,
}) {
  const style = DECISION_STYLES[decision] || DECISION_STYLES.AVOID;
  const Icon = style.icon;
  
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-xl border ${style.bg} ${style.border}`}
      data-testid="decision-strip"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Icon className={`w-6 h-6 ${style.text}`} />
        </div>
        <div>
          <div className={`text-xl font-bold ${style.text}`}>
            {decision}
          </div>
          <div className="text-sm text-gray-500">
            {direction} · {Math.round(confidence * 100)}% confidence
          </div>
        </div>
      </div>
      
      {accuracy && (
        <div className="text-right">
          <div className="text-sm text-gray-500">Accuracy</div>
          <div className="text-lg font-semibold text-gray-900">
            {accuracy.directionAccuracy}%
          </div>
        </div>
      )}
    </div>
  );
}

export default DecisionStrip;
