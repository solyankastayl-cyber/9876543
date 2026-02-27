/**
 * InsightBlock - Component for insight-first content (C3.B pattern)
 * 
 * Philosophy (базовое правило C3.B):
 * 1. Insight sentence - человеческое объяснение
 * 2. Evidence - данные (вторично)
 * 3. Implication - что это может значить
 * 4. Next action - что можно сделать
 * 
 * Usage:
 * <InsightBlock
 *   insight="Large wallets are consistently buying this token"
 *   evidence={<MetricDisplay />}
 *   implication="This behavior often indicates long-term positioning"
 *   action={<Button>Track this token</Button>}
 * />
 */
import { cn } from '../lib/utils';
import { Info } from 'lucide-react';

export default function InsightBlock({
  // 1. Insight sentence (required)
  insight,
  
  // 2. Evidence - data/charts (optional)
  evidence = null,
  
  // 3. Implication - what it means (optional)
  implication = null,
  
  // 4. Next action (optional)
  action = null,
  
  // Icon
  icon = null,
  
  // Style variants
  variant = 'default', // default | highlight | subtle
  
  className = '',
}) {
  const variants = {
    default: 'bg-white border border-gray-200',
    highlight: 'bg-purple-50 border border-purple-200',
    subtle: 'bg-gray-50 border border-gray-100',
  };

  return (
    <div className={cn(
      'rounded-xl p-4',
      variants[variant],
      className
    )}>
      {/* Insight sentence - always first */}
      <div className="flex items-start gap-3 mb-3">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          {insight}
        </p>
      </div>

      {/* Evidence - data section */}
      {evidence && (
        <div className="mb-3 pl-8">
          {evidence}
        </div>
      )}

      {/* Implication - what it means */}
      {implication && (
        <div className="flex items-start gap-2 mb-3 pl-8">
          <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 leading-relaxed">
            {implication}
          </p>
        </div>
      )}

      {/* Next action */}
      {action && (
        <div className="pl-8 pt-2 border-t border-gray-100">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * SignalInsight - Specific variant for signal cards
 */
export function SignalInsight({
  type,
  label,
  description,
  evidence,
  action,
  className = '',
}) {
  return (
    <InsightBlock
      insight={description}
      evidence={evidence}
      implication={getSignalImplication(type)}
      action={action}
      variant="subtle"
      className={className}
    />
  );
}

/**
 * Get implication text for signal types
 */
function getSignalImplication(type) {
  const implications = {
    accumulation: 'Such patterns often precede price expansion when combined with other bullish factors',
    distribution: 'Sustained selling pressure can indicate profit-taking or reduced confidence',
    large_move: 'Large movements often signal institutional activity or major holder decisions',
    smart_money_entry: 'Wallets with strong track records entering can be an early signal',
    smart_money_exit: 'Profitable wallets exiting may indicate local tops or risk management',
  };
  
  return implications[type] || null;
}

/**
 * EmptyInsight - For "no data yet" states with context
 */
export function EmptyInsight({
  title,
  description,
  reason,
  action,
  className = '',
}) {
  return (
    <div className={cn(
      'bg-gray-50 border border-gray-200 rounded-xl p-6 text-center',
      className
    )}>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        {description}
      </p>
      {reason && (
        <p className="text-xs text-gray-500 mb-4 italic">
          {reason}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
