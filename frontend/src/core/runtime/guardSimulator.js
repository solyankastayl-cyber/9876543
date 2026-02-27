/**
 * GUARD TRANSITION SIMULATOR — For testing UI guard state changes
 * 
 * Usage: Import in dev mode only
 * 
 * simulateGuardTransition(['NONE', 'WARN', 'CRISIS', 'BLOCK', 'NONE'])
 */

const GUARD_LEVELS = ['NONE', 'WARN', 'CRISIS', 'BLOCK'];

/**
 * Simulate guard level transitions
 * @param {string[]} sequence - Array of guard levels to transition through
 * @param {number} intervalMs - Time between transitions
 * @param {function} onTransition - Callback(prevLevel, nextLevel)
 */
export async function simulateGuardTransition(
  sequence = ['NONE', 'WARN', 'CRISIS', 'BLOCK', 'NONE'],
  intervalMs = 2000,
  onTransition
) {
  for (let i = 0; i < sequence.length - 1; i++) {
    const prevLevel = sequence[i];
    const nextLevel = sequence[i + 1];
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    
    if (onTransition) {
      onTransition(prevLevel, nextLevel);
    }
  }
}

/**
 * Test toast deduplication
 */
export function testToastDeduplication(toast, count = 5) {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    const id = toast.warning(`Guard changed: Test ${i}`);
    results.push(id);
  }
  
  // Check for duplicate IDs
  const unique = new Set(results);
  return {
    total: results.length,
    unique: unique.size,
    duplicates: results.length - unique.size,
    passed: results.length === unique.size,
  };
}

/**
 * Validate guard → allocation policy
 */
export function validateGuardAllocationPolicy(guardLevel, allocations) {
  const CAPS = {
    BTC: { NONE: 1.0, WARN: 0.70, CRISIS: 0.35, BLOCK: 0 },
    SPX: { NONE: 1.0, WARN: 0.80, CRISIS: 0.50, BLOCK: 0 },
  };
  
  const results = {
    guardLevel,
    allocations,
    violations: [],
    passed: true,
  };
  
  // Check BTC cap
  if (allocations.btc > CAPS.BTC[guardLevel]) {
    results.violations.push(`BTC ${allocations.btc} exceeds cap ${CAPS.BTC[guardLevel]} for ${guardLevel}`);
    results.passed = false;
  }
  
  // Check SPX cap
  if (allocations.spx > CAPS.SPX[guardLevel]) {
    results.violations.push(`SPX ${allocations.spx} exceeds cap ${CAPS.SPX[guardLevel]} for ${guardLevel}`);
    results.passed = false;
  }
  
  return results;
}

export default {
  simulateGuardTransition,
  testToastDeduplication,
  validateGuardAllocationPolicy,
  GUARD_LEVELS,
};
