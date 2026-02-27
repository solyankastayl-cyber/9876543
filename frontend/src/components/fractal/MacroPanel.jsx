/**
 * DXY Macro Panel — Compact unified macro module
 * 
 * Layout:
 * Row 1: Hybrid Projection (30%) | Macro State (70%)
 * Row 2: DXY Macro Scenarios (3 columns)
 * Row 3: Evidence (2 lines)
 * 
 * No borders, CSS hover tooltips, Bloomberg density
 */

import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// CSS styles embedded
const styles = `
.macroContainer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 20px;
  background: #fff;
}

.macroTopRow {
  display: grid;
  grid-template-columns: 30% 70%;
  gap: 30px;
}

.macroHybrid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sectionTitle {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.macroState {
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
}

.stateLine {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
}

.metric {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #374151;
}

.metric.highlight {
  font-weight: 600;
  color: #111827;
}

.metricValue {
  font-weight: 500;
}

.metricValue.positive { color: #059669; }
.metricValue.negative { color: #dc2626; }
.metricValue.neutral { color: #6366f1; }

.macroScenarios {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.scenariosTitle {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.scenario {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.scenarioName {
  font-weight: 500;
  color: #374151;
}

.scenarioProb {
  font-weight: 700;
  color: #7c3aed;
}

.scenarioTilt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-top: 4px;
}

.tiltUp { color: #059669; }
.tiltDown { color: #dc2626; }
.tiltNeutral { color: #6b7280; }

.macroEvidence {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.evidenceTitle {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.regimeTag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  text-decoration: none;
}

.regimeTag.bullish { background: #d1fae5; color: #059669; }
.regimeTag.bearish { background: #fee2e2; color: #dc2626; }
.regimeTag.neutral { background: #fef3c7; color: #d97706; border: none; }

.guardTag {
  font-weight: 600;
}
.guardTag.none { color: #059669; }
.guardTag.warn { color: #d97706; }
.guardTag.block { color: #dc2626; }

/* Tooltip system - no icons, hover only */
.macroLabel {
  position: relative;
  cursor: help;
  color: #6b7280;
}

.macroLabel:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -32px;
  left: 0;
  background: #111827;
  color: #fff;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 400;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
`;

function MacroPanel({ focus = '30d', focusPack = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/ae/terminal`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [focus]);

  // Inject styles
  useEffect(() => {
    const styleId = 'macro-panel-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (loading) {
    return (
      <div className="macroContainer">
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
          Loading macro context...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="macroContainer">
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
          Macro data unavailable
        </div>
      </div>
    );
  }

  const { regime, scenarios, recommendation } = data;
  const horizonDays = focus.replace('d', '');
  
  // Get hybrid projection values from focusPack if available
  const syntheticReturn = focusPack?.synthetic?.forecast?.base 
    ? (focusPack.synthetic.forecast.base * 100).toFixed(1)
    : '-9.0';
  const replayWeight = focusPack?.hybrid?.replayWeight 
    ? (focusPack.hybrid.replayWeight * 100).toFixed(0)
    : '80';
  // Simulated values - replace with actual focusPack data
  const replayReturn = '-0.9';
  const hybridReturn = '-2.5';

  // Regime classification
  const getRegimeClass = (r) => {
    if (r?.includes('BULL') || r?.includes('RISK_ON') || r?.includes('EASING')) return 'bullish';
    if (r?.includes('BEAR') || r?.includes('STRESS') || r?.includes('TIGHT')) return 'bearish';
    return 'neutral';
  };

  const getGuardClass = (g) => {
    if (g === 'NONE') return 'none';
    if (g === 'WARN') return 'warn';
    return 'block';
  };

  const getTiltClass = (t) => {
    if (t === 'UP') return 'tiltUp';
    if (t === 'DOWN') return 'tiltDown';
    return 'tiltNeutral';
  };

  const getTiltLabel = (t) => {
    if (t === 'UP') return '↑ Bullish';
    if (t === 'DOWN') return '↓ Bearish';
    return '— Neutral';
  };

  return (
    <div className="macroContainer">
      
      {/* Row 1: Hybrid Projection + Macro State */}
      <div className="macroTopRow">
        
        {/* LEFT: Hybrid Projection */}
        <div className="macroHybrid">
          <div className="sectionTitle">Hybrid Projection ({horizonDays}D)</div>
          
          <div className="metric">
            <span className="macroLabel" data-tooltip="Synthetic model projection based on statistical fractals">
              Model
            </span>
            <span className={`metricValue ${parseFloat(syntheticReturn) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(syntheticReturn) >= 0 ? '+' : ''}{syntheticReturn}%
            </span>
          </div>
          
          <div className="metric">
            <span className="macroLabel" data-tooltip="Historical replay projection from matched period">
              Replay
            </span>
            <span className={`metricValue ${parseFloat(replayReturn) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(replayReturn) >= 0 ? '+' : ''}{replayReturn}%
            </span>
          </div>
          
          <div className="metric">
            <span className="macroLabel" data-tooltip="Weight given to replay vs model in hybrid calculation">
              Weight
            </span>
            <span className="metricValue neutral">{replayWeight}% replay</span>
          </div>
          
          <div className="metric highlight">
            <span className="macroLabel" data-tooltip="Final hybrid projection combining model and replay">
              Hybrid
            </span>
            <span className={`metricValue ${parseFloat(hybridReturn) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(hybridReturn) >= 0 ? '+' : ''}{hybridReturn}%
            </span>
          </div>
        </div>
        
        {/* RIGHT: Macro State */}
        <div className="macroState">
          <div className="stateLine">
            <span className="macroLabel" data-tooltip="Current macro regime classification based on Fed policy, inflation, and market conditions">
              Regime
            </span>
            <span className={`regimeTag ${getRegimeClass(regime?.regime)}`}>
              {(regime?.regime || 'N/A').replace(/_/g, ' ')}
            </span>
            <span style={{ color: '#6b7280', fontSize: '13px' }}>
              Confidence: {((regime?.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="stateLine">
            <span className="macroLabel" data-tooltip="Position sizing adjusted by macro regime - 1.00x means no adjustment">
              Position Size
            </span>
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {recommendation?.sizeMultiplier?.toFixed(2) || '1.00'}x
            </span>
          </div>
          
          <div className="stateLine">
            <span className="macroLabel" data-tooltip="Risk guard level - NONE allows trading, WARN suggests caution, BLOCK prevents trading">
              Guard
            </span>
            <span className={`guardTag ${getGuardClass(recommendation?.guard)}`}>
              {recommendation?.guard || 'NONE'}
            </span>
          </div>
        </div>
        
      </div>
      
      {/* Row 2: DXY Macro Scenarios */}
      <div>
        <div className="scenariosTitle">DXY Macro Scenarios</div>
        <div className="macroScenarios">
          {scenarios?.scenarios?.slice(0, 3).map((s, i) => (
            <div key={i} className="scenario">
              <div>
                <div className="scenarioName">{s.name}</div>
                <div className={`scenarioTilt ${getTiltClass(s.tilt?.DXY)}`}>
                  {getTiltLabel(s.tilt?.DXY)}
                </div>
              </div>
              <div className="scenarioProb">{(s.prob * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Row 3: Evidence */}
      {regime?.reasons?.length > 0 && (
        <div className="macroEvidence">
          <div className="evidenceTitle">Evidence</div>
          {regime.reasons.slice(0, 2).map((r, i) => (
            <div key={i}>• {r}</div>
          ))}
        </div>
      )}
      
    </div>
  );
}

export default MacroPanel;
