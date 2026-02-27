/**
 * Reason Tree Component (Light Theme)
 * 
 * Shows WHY the decision was made, including Macro Context Layer
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, AlertCircle, Gauge, Globe } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export function ReasonTree({ decision }) {
  const [macroData, setMacroData] = useState(null);
  
  // Fetch macro data for explainability
  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v10/macro/impact`);
        const json = await res.json();
        if (json.ok) {
          setMacroData(json.data);
        }
      } catch (err) {
        console.error('Macro fetch error:', err);
      }
    };
    fetchMacro();
  }, [decision]);
  
  if (!decision || !decision.ok) return null;

  const { explainability, context } = decision;
  if (!explainability) return null;

  const layers = [
    {
      id: 'exchange',
      label: 'Exchange Layer',
      icon: '📊',
      verdict: explainability.verdict || 'NEUTRAL',
      confidence: explainability.rawConfidence,
      drivers: context?.drivers || [],
      notes: [],
    },
    {
      id: 'ml',
      label: 'ML Calibration',
      icon: '🧠',
      verdict: explainability.mlReady ? 'APPLIED' : 'NOT_APPLIED',
      confidence: explainability.mlAdjustedConfidence,
      drivers: [],
      notes: explainability.mlReady 
        ? [`Raw: ${(explainability.rawConfidence * 100).toFixed(0)}% → Calibrated: ${(explainability.mlAdjustedConfidence * 100).toFixed(0)}%`]
        : ['ML calibration not available'],
    },
  ];

  // Add Macro Context Layer
  if (macroData?.impact) {
    const { signal, impact } = macroData;
    const macroVerdict = impact.blockedStrong ? 'BLOCKED' 
      : impact.applied ? 'ADJUSTED' 
      : 'NEUTRAL';
    
    // Parse Fear & Greed value from explanation
    const fgMatch = signal?.explain?.bullets?.[0]?.match(/Fear & Greed: (\d+) \((.+)\)/);
    const fgValue = fgMatch ? fgMatch[1] : '-';
    const fgLabel = fgMatch ? fgMatch[2] : '-';
    
    const macroDrivers = [];
    if (signal?.flags?.includes('MACRO_PANIC')) {
      macroDrivers.push(`Fear & Greed: ${fgValue} (${fgLabel}) — Extreme Fear detected`);
    } else if (signal?.flags?.includes('MACRO_EUPHORIA')) {
      macroDrivers.push(`Fear & Greed: ${fgValue} (${fgLabel}) — Extreme Greed detected`);
    } else if (fgValue !== '-') {
      macroDrivers.push(`Fear & Greed: ${fgValue} (${fgLabel})`);
    }
    
    if (signal?.flags?.includes('BTC_DOM_UP')) {
      macroDrivers.push('BTC Dominance rising → Risk-off signal');
    } else if (signal?.flags?.includes('BTC_DOM_DOWN')) {
      macroDrivers.push('BTC Dominance falling → Risk-on signal');
    }
    
    if (signal?.flags?.includes('STABLE_INFLOW')) {
      macroDrivers.push('Stablecoin inflow detected → Flight to safety');
    } else if (signal?.flags?.includes('STABLE_OUTFLOW')) {
      macroDrivers.push('Stablecoin outflow detected → Capital deployment');
    }
    
    if (signal?.flags?.includes('RISK_REVERSAL')) {
      macroDrivers.push('Mixed signals → Potential regime change');
    }
    
    const macroNotes = [];
    if (impact.blockedStrong) {
      macroNotes.push('⛔ STRONG actions blocked due to extreme sentiment');
    }
    if (impact.confidenceMultiplier < 1.0) {
      macroNotes.push(`Confidence penalty: ${((1 - impact.confidenceMultiplier) * 100).toFixed(0)}%`);
    }
    
    layers.push({
      id: 'macro',
      label: 'Macro Context',
      icon: '🌍',
      verdict: macroVerdict,
      confidence: impact.confidenceMultiplier,
      drivers: macroDrivers,
      notes: macroNotes,
    });
  }

  if (context?.risks?.length > 0) {
    layers.push({
      id: 'risks',
      label: 'Risk Analysis',
      icon: '⚠️',
      verdict: context.risks.length > 0 ? 'DETECTED' : 'CLEAR',
      confidence: null,
      drivers: context.risks,
      notes: [],
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" data-testid="reason-tree">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>💡</span>
        Why This Decision
      </h3>

      <div className="space-y-3">
        {layers.map((layer) => (
          <LayerNode key={layer.id} layer={layer} />
        ))}
      </div>

      {/* Blocked By */}
      {explainability.blockedBy && Array.isArray(explainability.blockedBy) && explainability.blockedBy.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Blocked By
          </h4>
          <div className="space-y-1">
            {explainability.blockedBy.map((blocker, i) => (
              <div key={i} className="text-sm text-gray-600 pl-6">
                • {typeof blocker === 'string' ? blocker : JSON.stringify(blocker)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LayerNode({ layer }) {
  const [isExpanded, setIsExpanded] = useState(layer.id === 'macro' && layer.verdict !== 'NEUTRAL');

  const getVerdictStyle = (verdict) => {
    if (verdict === 'BULLISH' || verdict === 'CONFIRMED' || verdict === 'APPLIED') {
      return { color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp };
    }
    if (verdict === 'BEARISH' || verdict === 'DIVERGED' || verdict === 'DETECTED' || verdict === 'BLOCKED') {
      return { color: 'text-red-600', bg: 'bg-red-100', icon: TrendingDown };
    }
    if (verdict === 'ADJUSTED') {
      return { color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle };
    }
    if (verdict === 'NEUTRAL' || verdict === 'NOT_APPLIED' || verdict === 'CLEAR') {
      return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Minus };
    }
    return { color: 'text-gray-500', bg: 'bg-gray-100', icon: Minus };
  };

  const style = getVerdictStyle(layer.verdict);
  const VerdictIcon = style.icon;
  const hasDetails = layer.drivers.length > 0 || layer.notes.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        disabled={!hasDetails}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{layer.icon}</span>
          <span className="font-medium text-gray-900">{layer.label}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
            <VerdictIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{layer.verdict}</span>
          </div>
          
          {layer.confidence !== null && (
            <span className="text-xs text-gray-500">
              {(layer.confidence * 100).toFixed(0)}%
            </span>
          )}

          {hasDetails && (
            isExpanded 
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && hasDetails && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-200 bg-white">
          {layer.drivers.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Drivers:</div>
              <div className="space-y-1">
                {layer.drivers.map((driver, i) => (
                  <div key={i} className="text-sm text-gray-700 pl-2">
                    • {driver}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {layer.notes.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Notes:</div>
              <div className="space-y-1">
                {layer.notes.map((note, i) => (
                  <div key={i} className="text-sm text-gray-500 pl-2 italic">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
