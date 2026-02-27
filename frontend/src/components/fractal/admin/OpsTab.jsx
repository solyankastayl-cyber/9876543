/**
 * BLOCK 80.1 + 80.3 + L4.1 — Ops Tab
 * 
 * Daily Run Control + History + Consensus Timeline + L4 Orchestrator
 */

import React from 'react';
import { DailyRunCard } from './DailyRunCard';
import { DailyRunHistory } from './DailyRunHistory';
import { ConsensusTimelineCard } from './ConsensusTimelineCard';
import { L4DailyRunCard } from './L4DailyRunCard';

export function OpsTab() {
  return (
    <div className="space-y-6" data-testid="ops-tab">
      {/* L4.1 Daily Run Orchestrator */}
      <L4DailyRunCard />
      
      {/* Legacy Daily Run Control */}
      <DailyRunCard />
      
      {/* Consensus Timeline */}
      <ConsensusTimelineCard />
      
      {/* Run History */}
      <DailyRunHistory />
    </div>
  );
}

export default OpsTab;
