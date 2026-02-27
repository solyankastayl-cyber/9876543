/**
 * Risk Panel Component (Light Theme)
 * 
 * Shows risks and system diagnostics
 */

import { Shield, AlertTriangle, Activity, Server, Clock, Wifi } from 'lucide-react';

export function RiskPanel({ decision, observability }) {
  if (!decision || !decision.ok) return null;

  const { explainability } = decision;
  
  const riskFlags = [];
  const rf = explainability?.riskFlags || {};
  
  if (rf.whaleRisk && rf.whaleRisk !== 'LOW') {
    riskFlags.push({ 
      code: 'WHALE_RISK', 
      severity: rf.whaleRisk, 
      description: 'Significant whale positioning detected' 
    });
  }
  if (rf.contradiction) {
    riskFlags.push({ 
      code: 'CONTRADICTION', 
      severity: 'HIGH', 
      description: 'Conflicting signals between data sources' 
    });
  }
  if (rf.marketStress && rf.marketStress !== 'NORMAL') {
    riskFlags.push({ 
      code: 'MARKET_STRESS', 
      severity: 'MEDIUM', 
      description: 'Elevated market stress levels' 
    });
  }
  if (rf.liquidationRisk) {
    riskFlags.push({ 
      code: 'LIQUIDATION', 
      severity: 'HIGH', 
      description: 'High liquidation risk in current range' 
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" data-testid="risk-panel">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-gray-600" />
        Risks & Diagnostics
      </h3>

      {/* Risk Flags */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Risk Flags</h4>
        
        {riskFlags.length === 0 ? (
          <div className="text-sm text-gray-400 italic">
            No risk flags detected
          </div>
        ) : (
          <div className="space-y-2">
            {riskFlags.map((risk, i) => (
              <RiskFlag key={i} risk={risk} />
            ))}
          </div>
        )}
      </div>

      {/* System Diagnostics */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">System State</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <DiagnosticCard
            icon={Server}
            label="Data Mode"
            value={explainability?.dataMode || 'UNKNOWN'}
            status={explainability?.dataMode === 'LIVE' ? 'success' : 'warning'}
          />
          
          <DiagnosticCard
            icon={Activity}
            label="Completeness"
            value={observability?.completeness 
              ? `${(observability.completeness * 100).toFixed(0)}%`
              : 'N/A'
            }
            status={
              observability?.completeness >= 0.9 ? 'success' :
              observability?.completeness >= 0.7 ? 'warning' :
              'error'
            }
          />
          
          <DiagnosticCard
            icon={Clock}
            label="Staleness"
            value={observability?.staleness 
              ? `${observability.staleness}s`
              : 'N/A'
            }
            status={
              observability?.staleness <= 30 ? 'success' :
              observability?.staleness <= 120 ? 'warning' :
              'error'
            }
          />
          
          <DiagnosticCard
            icon={Wifi}
            label="Providers"
            value={explainability?.providersUsed?.length || 0}
            status={
              (explainability?.providersUsed?.length || 0) >= 2 ? 'success' :
              (explainability?.providersUsed?.length || 0) >= 1 ? 'warning' :
              'error'
            }
          />
        </div>

        {explainability?.providersUsed?.length > 0 && (
          <div className="mt-3 text-xs text-gray-400">
            Sources: {explainability.providersUsed.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskFlag({ risk }) {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityStyle(risk.severity)}`}>
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{risk.code}</span>
          <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
            {risk.severity}
          </span>
        </div>
        <p className="text-xs mt-1 opacity-80">
          {risk.description}
        </p>
      </div>
    </div>
  );
}

function DiagnosticCard({ icon: Icon, label, value, status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className={`text-lg font-semibold ${getStatusColor()}`}>
        {value}
      </div>
    </div>
  );
}
