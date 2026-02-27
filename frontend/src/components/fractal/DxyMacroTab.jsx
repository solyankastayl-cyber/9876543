/**
 * DXY Macro Tab — DXI Macro Only (no AE Brain content)
 * 
 * Shows only:
 * - Macro score + drivers
 * - Guard level + why
 * - Liquidity impulse + regime
 * - Adjustment on hybrid path (deltaReturn)
 * - Macro path chart
 * 
 * NO cross-asset scenarios (that's AE Brain tab)
 * NO base/bull/bear scenarios
 */

import React, { useEffect, useState, memo } from 'react';
import HoverTip from '../core/HoverTip';
import '../core/HoverTip.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const styles = `
.dxyMacroTab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
}

.dxyMacroGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dxyMacroCard {
  background: #f9fafb;
  border-radius: 10px;
  padding: 16px;
}

.dxyMacroCard.fullWidth {
  grid-column: 1 / -1;
}

.cardTitle {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.statGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.statBlock {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.statLabel {
  font-size: 12px;
  color: #6b7280;
}

.statValue {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.statValue.positive { color: #059669; }
.statValue.negative { color: #dc2626; }
.statValue.neutral { color: #6366f1; }
.statValue.warning { color: #d97706; }

.regimeTag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.regimeTag.EASING { background: #d1fae5; color: #059669; }
.regimeTag.TIGHTENING { background: #fee2e2; color: #dc2626; }
.regimeTag.STRESS { background: #fee2e2; color: #dc2626; }
.regimeTag.NEUTRAL { background: #fef3c7; color: #d97706; }
.regimeTag.NEUTRAL_MIXED { background: #fef3c7; color: #d97706; }
.regimeTag.UNKNOWN { background: #e5e7eb; color: #6b7280; }

.guardBadge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.guardBadge.NONE { background: #d1fae5; color: #059669; }
.guardBadge.LOW { background: #fef3c7; color: #d97706; }
.guardBadge.MEDIUM { background: #fed7aa; color: #c2410c; }
.guardBadge.HIGH { background: #fee2e2; color: #dc2626; }

.driverList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.driverItem {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 6px;
}

.driverName { color: #374151; }
.driverValue { font-weight: 600; }
.driverValue.up { color: #059669; }
.driverValue.down { color: #dc2626; }

.reasonsList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.reasonItem {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.reasonDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  margin-top: 6px;
  flex-shrink: 0;
}

.explanationBox {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.loadingState {
  text-align: center;
  color: #9ca3af;
  padding: 60px 0;
  font-size: 14px;
}
`;

function DxyMacroTab({ focus = '30d', macroPathPack = null }) {
  const [scoreData, setScoreData] = useState(null);
  const [guardData, setGuardData] = useState(null);
  const [liquidityData, setLiquidityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Fetch macro score, guard, and liquidity in parallel
    Promise.all([
      fetch(`${API_URL}/api/dxy-macro-core/score/evidence`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/dxy-macro-core/guard/current`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/liquidity/state`).then(r => r.json()).catch(() => null),
    ]).then(([score, guard, liquidity]) => {
      setScoreData(score);
      setGuardData(guard);
      setLiquidityData(liquidity);
      setLoading(false);
    });
  }, [focus]);

  // Inject styles
  useEffect(() => {
    const styleId = 'dxy-macro-tab-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (loading) {
    return (
      <div className="dxyMacroTab">
        <div className="loadingState">Loading DXY Macro context...</div>
      </div>
    );
  }

  const score = scoreData?.score;
  const evidence = scoreData?.evidence;
  const guard = guardData?.guard;
  const liquidity = liquidityData?.state;

  // Get delta return from macro path pack
  const deltaReturn = macroPathPack?.adjustment?.deltaReturnEnd || 0;
  const dominantRegime = score?.summary?.dominantRegime || 'UNKNOWN';

  // Format score display
  const formatScore = (val) => {
    if (val === undefined || val === null) return '—';
    const pct = (val * 100).toFixed(1);
    return val >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const getScoreClass = (val) => {
    if (val > 0.1) return 'positive';
    if (val < -0.1) return 'negative';
    return 'neutral';
  };

  return (
    <div className="dxyMacroTab">
      
      {/* Row 1: Score + Guard */}
      <div className="dxyMacroGrid">
        
        {/* Macro Score Card */}
        <div className="dxyMacroCard">
          <div className="cardTitle">DXY Macro Score</div>
          <div className="statGrid">
            <div className="statBlock">
              <HoverTip text="Macro score summarizes inflation, rates, and stress into one signal">
                <span className="statLabel">Score (Signed)</span>
              </HoverTip>
              <span className={`statValue ${getScoreClass(score?.scoreSigned)}`}>
                {formatScore(score?.scoreSigned)}
              </span>
            </div>
            <div className="statBlock">
              <HoverTip text="Dominant macro regime detected from component analysis">
                <span className="statLabel">Regime</span>
              </HoverTip>
              <span className={`regimeTag ${dominantRegime}`}>
                {dominantRegime.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="statBlock">
              <HoverTip text="Confidence in macro score based on data quality">
                <span className="statLabel">Confidence</span>
              </HoverTip>
              <span className="statValue">{score?.confidence || '—'}</span>
            </div>
            <div className="statBlock">
              <HoverTip text="Impact of macro adjustment on end return">
                <span className="statLabel">Δ End Return</span>
              </HoverTip>
              <span className={`statValue ${getScoreClass(deltaReturn)}`}>
                {formatScore(deltaReturn)}
              </span>
            </div>
          </div>
        </div>

        {/* Guard Card */}
        <div className="dxyMacroCard">
          <div className="cardTitle">Guard Level</div>
          <div className="statGrid">
            <div className="statBlock">
              <span className="statLabel">Current Guard</span>
              <span className={`guardBadge ${guard?.level || 'NONE'}`}>
                {guard?.level || 'NONE'}
              </span>
            </div>
            <div className="statBlock">
              <HoverTip text="Liquidity regime from Fed balance sheet analysis">
                <span className="statLabel">Liquidity</span>
              </HoverTip>
              <span className={`regimeTag ${liquidity?.regime || 'UNKNOWN'}`}>
                {liquidity?.regime || '—'}
              </span>
            </div>
            <div className="statBlock">
              <HoverTip text="Fed liquidity impulse: positive = expansion, negative = contraction">
                <span className="statLabel">Impulse</span>
              </HoverTip>
              <span className={`statValue ${(liquidity?.impulse || 0) > 0 ? 'positive' : 'negative'}`}>
                {liquidity?.impulse?.toFixed(2) || '—'}
              </span>
            </div>
          </div>
          
          {/* Guard Reasons */}
          {guard?.reasons?.length > 0 && (
            <div className="reasonsList" style={{ marginTop: '12px' }}>
              {guard.reasons.map((r, i) => (
                <div key={i} className="reasonItem">
                  <span className="reasonDot"></span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Row 2: Key Drivers */}
      <div className="dxyMacroCard fullWidth">
        <div className="cardTitle">Key Macro Drivers</div>
        <div className="driverList">
          {score?.summary?.keyDrivers?.length > 0 ? (
            score.summary.keyDrivers.map((driver, i) => {
              const [name, rest] = driver.split(':');
              const isUp = rest?.includes('+') || rest?.includes('TIGHTENING');
              return (
                <div key={i} className="driverItem">
                  <span className="driverName">{name}</span>
                  <span className={`driverValue ${isUp ? 'up' : 'down'}`}>{rest}</span>
                </div>
              );
            })
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>No drivers available</div>
          )}
        </div>
      </div>

      {/* Row 3: What Would Change */}
      <div className="dxyMacroCard fullWidth">
        <div className="cardTitle">What Would Change the Macro Adjustment</div>
        <div className="explanationBox">
          {evidence?.whatWouldFlip?.length > 0 ? (
            evidence.whatWouldFlip.map((item, i) => (
              <div key={i} style={{ marginBottom: i < evidence.whatWouldFlip.length - 1 ? '8px' : 0 }}>
                • {item}
              </div>
            ))
          ) : (
            <>
              <div>• Fed pivot from tightening to easing → score shifts negative (USD bearish)</div>
              <div>• Inflation spike above expectations → score shifts positive (USD bullish)</div>
              <div>• Liquidity contraction + credit stress → guard escalates to HIGH</div>
            </>
          )}
        </div>
      </div>

      {/* Component breakdown if available */}
      {score?.components?.length > 0 && (
        <div className="dxyMacroCard fullWidth">
          <div className="cardTitle">Component Decomposition</div>
          <div className="driverList">
            {score.components.slice(0, 6).map((comp, i) => (
              <div key={i} className="driverItem">
                <span className="driverName">{comp.displayName}</span>
                <span className={`driverValue ${comp.rawPressure > 0 ? 'up' : 'down'}`}>
                  {comp.rawPressure > 0 ? '+' : ''}{(comp.rawPressure * 100).toFixed(1)}% (w: {(comp.weight * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default memo(DxyMacroTab);
