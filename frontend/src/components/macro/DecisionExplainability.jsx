/**
 * Decision Explainability Component
 * 
 * P1.3 — Shows WHY a decision was made, including macro impact
 * P1.6 — Correct layer order: Macro → Asset Truth → ML → Final
 */

import { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  AlertTriangleIcon,
  ShieldIcon,
  TrendingDownIcon,
  GlobeIcon,
  CpuIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { getRegimeName, getRiskStyle, REGIME_COLORS } from '../labs/constants';

const LAYER_ORDER = [
  { key: 'macro', title: 'MACRO CONTEXT', icon: GlobeIcon, emoji: '🌍' },
  { key: 'assetTruth', title: 'ASSET TRUTH', icon: null, emoji: '📊' },
  { key: 'ml', title: 'ML ADJUSTMENT', icon: CpuIcon, emoji: '🤖' },
  { key: 'decision', title: 'FINAL DECISION', icon: CheckCircleIcon, emoji: '🎯' },
];

export function DecisionExplainability({ verdict }) {
  const [expanded, setExpanded] = useState({
    decision: true,
    macro: true,
    risks: false,
    confidence: false,
  });

  if (!verdict) return null;

  const explain = verdict.explain || {};
  const macroContext = verdict.macroContext || {};
  const invariantCheck = verdict.invariantCheck || {};
  
  // Build macro penalty explanation
  const macroPenalties = [];
  
  if (macroContext.blockedStrong) {
    macroPenalties.push({
      type: 'BLOCK',
      text: 'Strong actions blocked due to elevated macro risk.',
      severity: 'high',
    });
  }
  
  if (macroContext.confidenceMultiplier && macroContext.confidenceMultiplier < 1) {
    const reduction = Math.round((1 - macroContext.confidenceMultiplier) * 100);
    macroPenalties.push({
      type: 'PENALTY',
      text: `Confidence reduced by ${reduction}% due to macro conditions.`,
      severity: macroContext.confidenceMultiplier < 0.7 ? 'high' : 'medium',
    });
  }
  
  if (macroContext.flags?.includes('MACRO_PANIC')) {
    macroPenalties.push({
      type: 'FLAG',
      text: 'Market in PANIC state. Extra caution advised.',
      severity: 'high',
    });
  }
  
  if (macroContext.flags?.includes('RISK_REVERSAL')) {
    macroPenalties.push({
      type: 'FLAG',
      text: 'Risk reversal detected. Sentiment shifting.',
      severity: 'medium',
    });
  }

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100"
      data-testid="decision-explainability"
    >
      {/* Decision Section */}
      <Section
        title={explain.decision?.title || 'DECISION'}
        icon={SECTION_ICONS.decision}
        expanded={expanded.decision}
        onToggle={() => toggleSection('decision')}
      >
        <p className="text-gray-700 mb-3">
          {explain.decision?.summary || 'No summary available.'}
        </p>
        {explain.decision?.bullets?.length > 0 && (
          <ul className="space-y-1">
            {explain.decision.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Macro Context Section */}
      <Section
        title={explain.macroContext?.title || 'MACRO CONTEXT'}
        icon={SECTION_ICONS.macro}
        expanded={expanded.macro}
        onToggle={() => toggleSection('macro')}
        badge={macroContext.flags?.length > 0 ? `${macroContext.flags.length} flags` : null}
      >
        <p className="text-gray-700 mb-3">
          {explain.macroContext?.summary || `Market regime: ${macroContext.regime || 'Unknown'}`}
        </p>
        
        {/* Macro penalties */}
        {macroPenalties.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="text-xs font-medium text-gray-500 uppercase">Impact on Decision</div>
            {macroPenalties.map((penalty, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  penalty.severity === 'high' 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {penalty.type === 'BLOCK' && <ShieldIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {penalty.type === 'PENALTY' && <TrendingDownIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {penalty.type === 'FLAG' && <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span className="text-sm">{penalty.text}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Macro stats */}
        {explain.macroContext?.bullets?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {explain.macroContext.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Risks Section */}
      <Section
        title={explain.risks?.title || 'RISKS'}
        icon={SECTION_ICONS.risks}
        expanded={expanded.risks}
        onToggle={() => toggleSection('risks')}
        badge={invariantCheck.violations?.length > 0 ? `${invariantCheck.violations.length} issues` : null}
      >
        <p className="text-gray-700 mb-3">
          {explain.risks?.summary || 'Standard market risk applies.'}
        </p>
        
        {/* Invariant violations */}
        {invariantCheck.violations?.length > 0 && (
          <div className="space-y-2">
            {invariantCheck.violations.map((violation, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 text-orange-700"
              >
                <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{violation}</span>
              </div>
            ))}
          </div>
        )}
        
        {invariantCheck.blocked && (
          <div className="mt-3 p-3 rounded-lg bg-red-100 text-red-800">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5" />
              <span className="font-medium">Action Blocked</span>
            </div>
            <p className="text-sm mt-1">
              {invariantCheck.blockReason || 'Risk conditions prevent this action.'}
            </p>
          </div>
        )}
      </Section>

      {/* Confidence Section */}
      <Section
        title={explain.confidence?.title || 'CONFIDENCE'}
        icon={SECTION_ICONS.confidence}
        expanded={expanded.confidence}
        onToggle={() => toggleSection('confidence')}
      >
        <p className="text-gray-700 mb-3">
          {explain.confidence?.summary || `Final confidence: ${Math.round(verdict.finalConfidence * 100)}%`}
        </p>
        
        {/* Confidence breakdown */}
        <div className="mt-3">
          <ConfidenceBar 
            value={verdict.finalConfidence} 
            label="Final Confidence"
          />
          {verdict.assetTruth?.applied && (
            <div className="mt-2 text-xs text-gray-500">
              Venue agreement modifier: {Math.round(verdict.assetTruth.confidenceModifier * 100)}%
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, expanded, onToggle, badge, children }) {
  return (
    <div className="py-4 px-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
        data-testid={`section-${title.toLowerCase().replace(/\s/g, '-')}`}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-gray-900">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-3 pl-6">
          {children}
        </div>
      )}
    </div>
  );
}

function ConfidenceBar({ value, label }) {
  const percentage = Math.round(value * 100);
  const color = percentage >= 70 
    ? 'bg-green-500' 
    : percentage >= 50 
      ? 'bg-yellow-500' 
      : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default DecisionExplainability;
