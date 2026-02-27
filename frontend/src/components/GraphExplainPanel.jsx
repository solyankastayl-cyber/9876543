/**
 * GraphExplainPanel (P1.8.D)
 * 
 * Read-only panel showing risk explanation.
 * No logic - pure presentational component.
 * Data comes from P1.7 backend.
 */

import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Activity,
  Clock,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useState } from 'react';
import { 
  getSeverityColor, 
  getSeverityBadgeClass,
  getReasonLabel,
  getReasonColor 
} from '../graph/graphHighlight.adapter';

// ============================================
// Risk Level Badge
// ============================================

function RiskLevelBadge({ score, label }) {
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
  const bgColor = {
    CRITICAL: 'bg-red-600',
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-green-500',
  }[level];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${bgColor} text-white text-xs font-semibold`}>
      <Shield className="w-3 h-3" />
      {label || level}
    </div>
  );
}

// ============================================
// Metric Card
// ============================================

function MetricCard({ label, value, icon: Icon, color = 'gray', subtext }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 text-${color}-500`} />
        <span className="text-[10px] font-semibold text-gray-500 uppercase">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {subtext && <div className="text-[10px] text-gray-500 mt-0.5">{subtext}</div>}
    </div>
  );
}

// ============================================
// Reason Card
// ============================================

function ReasonCard({ reason }) {
  const [expanded, setExpanded] = useState(false);
  const severityColor = getSeverityColor(reason.severity);
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: severityColor }}
          />
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">{reason.title}</div>
            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${getSeverityBadgeClass(reason.severity)}`}>
              {reason.severity}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 mt-2">{reason.description}</p>
          {reason.evidence && reason.evidence.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Evidence</div>
              <div className="flex flex-wrap gap-1">
                {reason.evidence.map((ev, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Amplifier Badge
// ============================================

function AmplifierBadge({ amplifier, isSupressor = false }) {
  const isPositive = amplifier.multiplier > 1;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isSupressor 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700';
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${color}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{amplifier.tag.replace(/_/g, ' ')}</span>
      <span className="text-[10px] font-bold">
        {isSupressor ? '-' : '+'}{Math.abs((amplifier.multiplier - 1) * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ============================================
// Path Step Badge
// ============================================

function PathStepBadge({ step, index }) {
  const color = getReasonColor(step.reason);
  const contribution = (step.riskContribution * 100).toFixed(0);
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
        style={{ backgroundColor: color }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-900">{getReasonLabel(step.reason)}</div>
        <div className="text-[10px] text-gray-500">{contribution}% risk contribution</div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function GraphExplainPanel({ 
  riskSummary, 
  explain, 
  highlightedPath,
  metadata,
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('summary');
  
  if (!riskSummary) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No risk data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Risk Explanation</h3>
            <p className="text-[10px] text-gray-500">P1.7 Graph Intelligence</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['summary', 'reasons', 'path'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${
              activeTab === tab 
                ? 'text-gray-900 border-b-2 border-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Main Risk Score */}
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {riskSummary.contextualRiskScore || riskSummary.dumpRiskScore}
              </div>
              <div className="text-xs text-gray-500 mb-2">Contextual Risk Score</div>
              <RiskLevelBadge score={riskSummary.contextualRiskScore || riskSummary.dumpRiskScore} />
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard 
                label="Exit Probability" 
                value={`${(riskSummary.exitProbability * 100).toFixed(0)}%`}
                icon={Activity}
                color="red"
              />
              <MetricCard 
                label="Market Amplifier" 
                value={`${riskSummary.marketAmplifier.toFixed(2)}x`}
                icon={Zap}
                color={riskSummary.marketAmplifier > 1 ? 'red' : 'green'}
              />
              <MetricCard 
                label="Path Entropy" 
                value={`${(riskSummary.pathEntropy * 100).toFixed(0)}%`}
                icon={Activity}
                color="blue"
                subtext={riskSummary.pathEntropy < 0.3 ? 'Direct path' : 'Complex path'}
              />
              <MetricCard 
                label="Market Regime" 
                value={riskSummary.marketRegime || 'STABLE'}
                icon={TrendingUp}
                color={riskSummary.marketRegime === 'STRESSED' ? 'red' : 'green'}
              />
            </div>
            
            {/* Context Tags */}
            {riskSummary.contextTags && riskSummary.contextTags.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Context Tags</div>
                <div className="flex flex-wrap gap-1">
                  {riskSummary.contextTags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-medium">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Amplifiers & Suppressors */}
            {explain && (explain.amplifiers?.length > 0 || explain.suppressors?.length > 0) && (
              <div className="space-y-3">
                {explain.amplifiers?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Risk Amplifiers</div>
                    <div className="flex flex-wrap gap-1">
                      {explain.amplifiers.map((amp, i) => (
                        <AmplifierBadge key={i} amplifier={amp} />
                      ))}
                    </div>
                  </div>
                )}
                {explain.suppressors?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Risk Suppressors</div>
                    <div className="flex flex-wrap gap-1">
                      {explain.suppressors.map((sup, i) => (
                        <AmplifierBadge key={i} amplifier={sup} isSupressor />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Reasons Tab */}
        {activeTab === 'reasons' && (
          <div className="space-y-3">
            {explain?.reasons?.length > 0 ? (
              explain.reasons.map((reason, i) => (
                <ReasonCard key={i} reason={reason} />
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No risk reasons detected
              </div>
            )}
          </div>
        )}
        
        {/* Path Tab */}
        {activeTab === 'path' && (
          <div className="space-y-3">
            {highlightedPath?.length > 0 ? (
              <>
                <div className="text-xs text-gray-500 mb-3">
                  {highlightedPath.length} steps in highlighted path
                </div>
                {highlightedPath.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <PathStepBadge step={step} index={i} />
                    {i < highlightedPath.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No highlighted path
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {metadata && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Built in {metadata.buildTimeMs}ms
            </div>
            <div>
              {metadata.nodesCount} nodes • {metadata.edgesCount} edges
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
