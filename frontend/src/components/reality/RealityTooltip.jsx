/**
 * Reality Tooltip Component
 */

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { RealityBadge } from './RealityBadge';
import { WalletCredibilityBadge } from './WalletCredibilityBadge';

export function RealityTooltip({ reality, credibility, evidence = [] }) {
  const [show, setShow] = useState(false);
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={16} style={{ color: '#6b7280', cursor: 'help' }} />
      
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '200px',
            zIndex: 50,
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Reality</div>
            <RealityBadge verdict={reality?.verdict} size="sm" />
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Wallet</div>
            <WalletCredibilityBadge badge={credibility?.badge} size="sm" />
          </div>
          
          {evidence.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Evidence</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '11px', color: '#d1d5db' }}>
                {evidence.slice(0, 3).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RealityTooltip;
