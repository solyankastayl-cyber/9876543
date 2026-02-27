// === CONFIDENCE DECAY SYSTEM ===
// Score decreases over time without confirmations
export const applyConfidenceDecay = (baseScore, timestamp, hasRecentActivity = false) => {
  if (!timestamp) return baseScore;
  
  const now = Date.now();
  const ageInHours = (now - timestamp) / (1000 * 60 * 60);
  
  // Decay rate: -2 points per hour without activity
  // No decay if recent activity (< 6h) or hasRecentActivity flag
  if (ageInHours < 6 || hasRecentActivity) {
    return baseScore;
  }
  
  const decayRate = 2; // points per hour
  const decay = Math.floor((ageInHours - 6) * decayRate);
  const decayedScore = Math.max(0, baseScore - decay);
  
  return {
    score: decayedScore,
    originalScore: baseScore,
    decay: decay,
    ageInHours: Math.floor(ageInHours),
    decayed: decay > 0
  };
};

// === SIGNAL LIFECYCLE SYSTEM ===
// Auto-transition: New → Active → Cooling → Archived
export const getSignalLifecycle = (timestamp, score) => {
  if (!timestamp) return 'active';
  
  const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  
  // New: < 2 hours old
  if (ageInHours < 2) return 'new';
  
  // Archived: > 72 hours OR score < 20
  if (ageInHours > 72 || score < 20) return 'archived';
  
  // Cooling: 24-72 hours OR score dropped below 40
  if (ageInHours > 24 || score < 40) return 'cooling';
  
  // Active: everything else
  return 'active';
};

// === SIGNAL SCORE CALCULATION ENGINE ===
// Weighted scoring system with explainable components
export const calculateSignalScore = (item) => {
  const breakdown = [];
  let totalScore = 0;

  // 1. BEHAVIOR (0-25 points)
  let behaviorScore = 0;
  if (item.behaviorChanged) {
    if (item.behavior === 'distributing') {
      behaviorScore = 25;
      breakdown.push({ 
        component: 'Behavior', 
        score: 25, 
        reason: 'Shifted to distribution',
        icon: '🔄'
      });
    } else if (item.behavior === 'accumulating') {
      behaviorScore = 20;
      breakdown.push({ 
        component: 'Behavior', 
        score: 20, 
        reason: 'Started accumulating',
        icon: '📈'
      });
    } else {
      behaviorScore = 15;
      breakdown.push({ 
        component: 'Behavior', 
        score: 15, 
        reason: 'Behavior changed',
        icon: '🔄'
      });
    }
  } else if (item.behavior === 'distributing') {
    behaviorScore = 10;
    breakdown.push({ 
      component: 'Behavior', 
      score: 10, 
      reason: 'Active distribution',
      icon: '📉'
    });
  }
  totalScore += behaviorScore;

  // 2. RISK (0-20 points)
  let riskScore = 0;
  if (item.riskLevel === 'high') {
    riskScore = 20;
    breakdown.push({ 
      component: 'Risk', 
      score: 20, 
      reason: 'High risk level',
      icon: '⚠️'
    });
  } else if (item.riskLevel === 'medium') {
    riskScore = 10;
    breakdown.push({ 
      component: 'Risk', 
      score: 10, 
      reason: 'Elevated risk',
      icon: '⚡'
    });
  }
  totalScore += riskScore;

  // 3. COORDINATION (0-20 points)
  let coordScore = 0;
  if (item.bridgeAligned) {
    const alignedCount = item.alignedCount || 2;
    coordScore = Math.min(20, 10 + alignedCount * 3);
    breakdown.push({ 
      component: 'Coordination', 
      score: coordScore, 
      reason: `Aligned with ${alignedCount} entities`,
      icon: '🔗'
    });
  }
  totalScore += coordScore;

  // 4. MAGNITUDE (0-20 points)
  let magScore = 0;
  if (item.deltaSignals?.length > 0) {
    magScore = Math.min(20, 10 + item.deltaSignals.length * 5);
    breakdown.push({ 
      component: 'Magnitude', 
      score: magScore, 
      reason: 'Flow spike detected',
      icon: '📊'
    });
  } else if (item.attentionScore > 60) {
    magScore = 15;
    breakdown.push({ 
      component: 'Magnitude', 
      score: 15, 
      reason: 'Above-average activity',
      icon: '📊'
    });
  }
  totalScore += magScore;

  // 5. RECENCY (0-15 points)
  let recencyScore = 0;
  if (item.statusChange === '24h') {
    recencyScore = 15;
    breakdown.push({ 
      component: 'Recency', 
      score: 15, 
      reason: 'Activity < 24h ago',
      icon: '🕐'
    });
  } else if (item.dormantDays === 0) {
    recencyScore = 5;
    breakdown.push({ 
      component: 'Recency', 
      score: 5, 
      reason: 'Recently active',
      icon: '🕐'
    });
  }
  totalScore += recencyScore;

  // Sort breakdown by score (highest first)
  breakdown.sort((a, b) => b.score - a.score);

  // Apply confidence decay
  const baseScore = Math.min(totalScore, 100);
  const decayResult = applyConfidenceDecay(baseScore, item.timestamp, item.statusChange === '24h');
  const finalScore = typeof decayResult === 'object' ? decayResult.score : decayResult;
  
  // Determine lifecycle based on final score
  const lifecycle = getSignalLifecycle(item.timestamp, finalScore);

  return {
    score: finalScore,
    originalScore: typeof decayResult === 'object' ? decayResult.originalScore : baseScore,
    decayed: typeof decayResult === 'object' ? decayResult.decayed : false,
    decay: typeof decayResult === 'object' ? decayResult.decay : 0,
    ageInHours: typeof decayResult === 'object' ? decayResult.ageInHours : 0,
    breakdown,
    topReasons: breakdown.slice(0, 3),
    tier: finalScore >= 70 ? 'critical' : finalScore >= 40 ? 'notable' : 'low',
    lifecycle
  };
};

// Event info helper
export const getEventInfo = (item) => {
  if (item.bridgeAligned && item.behavior === 'distributing') {
    return { 
      event: 'Coordinated Distribution', 
      severity: 'high',
      why: `Outflows aligned with ${item.alignedCount || 3} entities`
    };
  }
  if (item.bridgeAligned && item.behavior === 'accumulating') {
    return { 
      event: 'Aligned Accumulation', 
      severity: 'medium',
      why: 'Multiple entities entering same position'
    };
  }
  if (item.riskLevel === 'high' && item.behavior === 'distributing') {
    return { 
      event: 'High-Risk Outflow', 
      severity: 'high',
      why: 'Large net outflows exceeding normal range'
    };
  }
  if (item.behaviorChanged && item.behavior === 'accumulating') {
    return { 
      event: 'Accumulation Started', 
      severity: 'medium',
      why: 'Behavior shifted to net inflows'
    };
  }
  if (item.behaviorChanged && item.behavior === 'distributing') {
    return { 
      event: 'Distribution Started', 
      severity: 'high',
      why: 'Behavior shifted to net outflows'
    };
  }
  if (item.behavior === 'dormant') {
    return { 
      event: 'Dormant', 
      severity: 'low',
      why: `No activity for ${item.dormantDays || 7}+ days`
    };
  }
  return { event: 'Monitoring', severity: 'neutral', why: 'No significant changes' };
};

// Card style helper
export const getCardStyle = (item, tier) => {
  // Critical / Coordinated Distribution
  if (tier === 'critical' || (item.bridgeAligned && item.behavior === 'distributing')) {
    return 'border-l-gray-900 bg-gray-900/5';
  }
  // Distribution (soft red)
  if (item.behavior === 'distributing') {
    return 'border-l-red-400 bg-red-50/50';
  }
  // Accumulation (soft green)
  if (item.behavior === 'accumulating') {
    return 'border-l-emerald-400 bg-emerald-50/50';
  }
  // Bridge aligned (soft blue/purple)
  if (item.bridgeAligned) {
    return 'border-l-blue-400 bg-blue-50/50';
  }
  // Neutral / Monitoring (gray-white)
  return 'border-l-gray-200 bg-white';
};
