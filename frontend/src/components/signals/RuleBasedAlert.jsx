import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Bell, AlertTriangle, CheckCircle, Activity, Coins, BellRing 
} from 'lucide-react';

const ruleTypes = [
  { 
    value: 'behavior_change', 
    label: 'Behavior Change', 
    description: 'Alert when entity changes behavior (Accumulating → Distributing)',
    icon: Activity,
    examples: ['Binance starts distributing', 'VC fund begins rotation']
  },
  { 
    value: 'accumulation', 
    label: 'Accumulation Detected', 
    description: 'Alert when entity starts accumulating positions',
    icon: TrendingUp,
    examples: ['Net inflow > $10M', 'Holdings increase > 5%']
  },
  { 
    value: 'distribution', 
    label: 'Distribution Alert', 
    description: 'Alert when entity distributes or exits',
    icon: TrendingDown,
    examples: ['Net outflow > $10M', 'Holdings decrease > 5%']
  },
  { 
    value: 'narrative_stage', 
    label: 'Narrative Stage Change', 
    description: 'Alert when narrative moves to Crowded/Exhaustion',
    icon: Bell,
    examples: ['AI narrative → Crowded', 'L2 narrative → Exhaustion']
  },
  { 
    value: 'deposit_cex', 
    label: 'CEX Deposit', 
    description: 'Alert on deposit to exchange (sell signal)',
    icon: AlertTriangle,
    examples: ['Deposit to Binance', 'Transfer to Coinbase']
  },
  { 
    value: 'new_token', 
    label: 'New Token Purchase', 
    description: 'Alert when entity buys new token',
    icon: Coins,
    examples: ['New position opened', 'First purchase of token']
  }
];

export const RuleBasedAlert = ({ item, onSaveRule }) => {
  const [ruleType, setRuleType] = useState('behavior_change');
  const [threshold, setThreshold] = useState(50);
  const [enabled, setEnabled] = useState(true);

  const currentRule = ruleTypes.find(r => r.value === ruleType);

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200" data-testid="rule-based-alert">
      <div className="flex items-center gap-2 mb-4">
        <BellRing className="w-5 h-5 text-blue-600" />
        <h4 className="text-sm font-bold text-gray-900">Rule-Based Alerts</h4>
        <label className="ml-auto flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            data-testid="rule-enabled-checkbox"
          />
          <span className="text-xs font-semibold text-gray-600">Enabled</span>
        </label>
      </div>

      {/* Rule Type Selector */}
      <div className="space-y-2 mb-4">
        {ruleTypes.map(rule => {
          const Icon = rule.icon;
          return (
            <button
              key={rule.value}
              onClick={() => setRuleType(rule.value)}
              data-testid={`rule-type-${rule.value}`}
              className={`w-full p-3 rounded-2xl border-2 transition-all text-left ${
                ruleType === rule.value
                  ? 'border-blue-500 bg-white shadow-sm'
                  : 'border-gray-200 bg-white/50 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  ruleType === rule.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 mb-0.5">{rule.label}</div>
                  <div className="text-xs text-gray-600 mb-1">{rule.description}</div>
                  {ruleType === rule.value && (
                    <div className="text-xs text-blue-600 italic">
                      e.g., {rule.examples[0]}
                    </div>
                  )}
                </div>
                {ruleType === rule.value && (
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confidence Threshold */}
      {(ruleType === 'behavior_change' || ruleType === 'accumulation' || ruleType === 'distribution') && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Confidence Threshold: {threshold}%
          </label>
          <input 
            type="range" 
            min="50" 
            max="95" 
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            data-testid="threshold-slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50% (Sensitive)</span>
            <span>95% (Strict)</span>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button 
        onClick={() => onSaveRule({ 
          type: ruleType, 
          threshold, 
          enabled,
          entityId: item.id,
          entityLabel: item.label
        })}
        className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-shadow"
        data-testid="save-rule-btn"
      >
        Save Alert Rule
      </button>
    </div>
  );
};

export default RuleBasedAlert;
