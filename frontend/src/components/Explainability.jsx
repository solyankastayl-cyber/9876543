import { useState } from 'react';
import { HelpCircle, X, ChevronRight, Lightbulb, Database, Activity, Shield, TrendingUp } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${className}`}>
    {children}
  </div>
);

// Компонент кнопки "Why?" для объяснения атрибуции
export function WhyButton({ entityType, entityName, reasons, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
        title="Why this label?"
      >
        <HelpCircle className="w-3 h-3" />
        Why?
      </button>

      {isOpen && (
        <ExplainabilityModal
          entityType={entityType}
          entityName={entityName}
          reasons={reasons}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// Модальное окно с объяснением
export function ExplainabilityModal({ entityType, entityName, reasons, onClose }) {
  // Default reasons if none provided
  const defaultReasons = {
    'Smart Money': [
      { icon: TrendingUp, label: 'Trading Performance', detail: 'Historically profitable trades with >70% win rate' },
      { icon: Activity, label: 'Activity Pattern', detail: 'Trades ahead of market moves, consistent alpha generation' },
      { icon: Database, label: 'On-chain History', detail: 'Early participant in multiple successful token launches' },
    ],
    'Whale': [
      { icon: Database, label: 'Balance Threshold', detail: 'Holds >$10M in verified assets across multiple chains' },
      { icon: Activity, label: 'Market Impact', detail: 'Transactions have measurable price impact on markets' },
      { icon: TrendingUp, label: 'Historical Activity', detail: 'Consistent high-value transactions over 12+ months' },
    ],
    'CEX': [
      { icon: Shield, label: 'Known Address', detail: 'Verified exchange hot wallet from public disclosure' },
      { icon: Activity, label: 'Transaction Pattern', detail: 'High volume, uniform transaction sizes, 24/7 activity' },
      { icon: Database, label: 'Flow Analysis', detail: 'Receives deposits from thousands of unique addresses' },
    ],
    'Fund': [
      { icon: Database, label: 'Cluster Analysis', detail: 'Part of known VC fund address cluster' },
      { icon: Shield, label: 'Public Records', detail: 'Linked to known fund through on-chain governance votes' },
      { icon: Activity, label: 'Behavior Pattern', detail: 'Long holding periods, strategic accumulation patterns' },
    ],
    'High Risk': [
      { icon: Shield, label: 'Sanctions Check', detail: 'Address has indirect exposure to OFAC sanctioned entities' },
      { icon: Activity, label: 'Mixer Usage', detail: 'Funds traced through privacy protocols (2 hops)' },
      { icon: Database, label: 'Approval Risk', detail: '3 unlimited approvals to unverified contracts' },
    ],
    'Low Risk': [
      { icon: Shield, label: 'Clean History', detail: 'No interaction with flagged addresses in last 12 months' },
      { icon: Activity, label: 'Transparent Flow', detail: 'All transactions traceable to legitimate sources' },
      { icon: Database, label: 'Verified Contracts', detail: 'Only interacts with audited, verified protocols' },
    ],
  };

  const displayReasons = reasons || defaultReasons[entityType] || defaultReasons['Smart Money'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <GlassCard className="w-[480px] max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Why "{entityType}"?</h2>
                <p className="text-sm text-gray-500">{entityName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Attribution Reasons</div>
            <div className="space-y-3">
              {displayReasons.map((reason, i) => {
                const Icon = reason.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{reason.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{reason.detail}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-blue-900">Confidence Score</div>
                <div className="text-xs text-blue-700 mt-1">
                  This label has <span className="font-bold">87% confidence</span> based on 
                  on-chain data analysis and cross-referencing with known entity databases.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>Labels are generated automatically using:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>On-chain transaction pattern analysis</li>
              <li>Address clustering algorithms</li>
              <li>Cross-reference with known entity databases</li>
              <li>Behavioral fingerprinting models</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Report Incorrect Label
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-white rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// Экспорт по умолчанию
export default WhyButton;
