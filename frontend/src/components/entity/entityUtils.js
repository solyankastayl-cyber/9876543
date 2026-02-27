// Signal Score Calculation Engine
export const calculateSignalScore = (entity) => {
  const breakdown = [];
  let totalScore = 0;

  // 1. BEHAVIOR (0-25 points)
  if (entity.behavior?.current) {
    const behavior = entity.behavior;
    if (behavior.change) {
      if (behavior.current === 'distributing') {
        totalScore += 25;
        breakdown.push({ component: 'Behavior', score: 25, reason: 'Shifted to distribution', icon: '🔄' });
      } else if (behavior.current === 'accumulating') {
        totalScore += 20;
        breakdown.push({ component: 'Behavior', score: 20, reason: 'Started accumulating', icon: '📈' });
      } else {
        totalScore += 15;
        breakdown.push({ component: 'Behavior', score: 15, reason: 'Behavior changed', icon: '🔄' });
      }
    } else if (behavior.current === 'distributing') {
      totalScore += 10;
      breakdown.push({ component: 'Behavior', score: 10, reason: 'Active distribution', icon: '📉' });
    }
  }

  // 2. RISK (0-20 points)
  if (entity.riskScore > 40) {
    totalScore += 20;
    breakdown.push({ component: 'Risk', score: 20, reason: `Risk score ${entity.riskScore}/100`, icon: '⚠️' });
  } else if (entity.riskScore > 20) {
    totalScore += 10;
    breakdown.push({ component: 'Risk', score: 10, reason: 'Elevated risk', icon: '⚡' });
  }

  // 3. COORDINATION (0-20 points)
  if (entity.behavior?.alignedWith?.length > 0) {
    const count = entity.behavior.alignedWith.length;
    const coordScore = Math.min(20, 10 + count * 3);
    totalScore += coordScore;
    breakdown.push({ component: 'Coordination', score: coordScore, reason: `Aligned with ${count} entities`, icon: '🔗' });
  }

  // 4. MAGNITUDE (0-20 points)
  if (entity.contextSignals?.bridge) {
    totalScore += 15;
    breakdown.push({ component: 'Magnitude', score: 15, reason: 'Bridge cluster detected', icon: '📊' });
  }

  // 5. RECENCY (0-15 points)
  if (entity.behavior?.change?.time?.includes('h')) {
    totalScore += 15;
    breakdown.push({ component: 'Recency', score: 15, reason: `Changed ${entity.behavior.change.time}`, icon: '🕐' });
  }

  breakdown.sort((a, b) => b.score - a.score);

  return {
    score: Math.min(totalScore, 100),
    breakdown,
    topReasons: breakdown.slice(0, 3),
    tier: totalScore >= 70 ? 'critical' : totalScore >= 40 ? 'notable' : 'low'
  };
};

// Tier config
export const tierConfig = {
  critical: { label: 'Critical', color: 'bg-gray-900', textColor: 'text-gray-900', bgLight: 'bg-gray-100' },
  notable: { label: 'Notable', color: 'bg-amber-100 border border-amber-200', textColor: 'text-amber-700', bgLight: 'bg-white' },
  low: { label: 'Low', color: 'bg-gray-100', textColor: 'text-gray-500', bgLight: 'bg-white' }
};

// Behavior interpretation helper
export const getBehaviorInterpretation = (behavior) => {
  if (behavior.current === 'distributing' && behavior.alignedWith?.length > 0) {
    return 'Large net outflows to exchanges detected after accumulation phase';
  }
  if (behavior.current === 'accumulating') {
    return 'Consistent inflow pattern suggests long-term positioning';
  }
  if (behavior.current === 'distributing') {
    return 'Active distribution phase — monitoring for exit signals';
  }
  if (behavior.current === 'rotating') {
    return 'Portfolio rebalancing detected — neutral market signal';
  }
  return 'Monitoring for behavioral changes';
};

// Behavior icon style
export const getBehaviorIconStyle = (current) => {
  if (current === 'accumulating') return 'bg-emerald-500';
  if (current === 'distributing') return 'bg-red-500';
  if (current === 'rotating') return 'bg-blue-500';
  return 'bg-gray-400';
};

// Event type config
export const eventTypeConfig = {
  behavior: { color: 'bg-purple-100 text-purple-600', label: 'Behavior' },
  bridge: { color: 'bg-blue-100 text-blue-600', label: 'Bridge' },
  risk: { color: 'bg-red-100 text-red-600', label: 'Risk' },
  transfer: { color: 'bg-gray-100 text-gray-600', label: 'Transfer' },
  transaction: { color: 'bg-emerald-100 text-emerald-600', label: 'Transaction' },
  coordination: { color: 'bg-indigo-100 text-indigo-600', label: 'Coordination' },
  accumulation: { color: 'bg-green-100 text-green-600', label: 'Accumulation' }
};

// Transaction type colors
export const txTypeConfig = {
  transfer: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '↗' },
  swap: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⇄' },
  bridge: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '⬡' },
  deposit: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '↓' },
  withdraw: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '↑' }
};

// Direction colors
export const directionColors = {
  in: 'text-emerald-600',
  out: 'text-red-600'
};
