/**
 * Engine Page V2 - PHASE 4.1
 * 
 * UI = V2 Truth
 * Source: GET /api/engine/v2/decide
 * 
 * NO:
 * - "AI decided"
 * - "ML powered" 
 * - "Prediction"
 * - "Confidence boost"
 * - V1 endpoints
 * 
 * YES:
 * - rules
 * - gates
 * - reasons
 * - evidence
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, Zap, Search, Settings,
  Loader2, AlertTriangle
} from 'lucide-react';
import EngineDecisionCardV2 from '../components/EngineDecisionCardV2';
import { api } from '../api/client';

// ============ WINDOW SELECTOR ============
function WindowSelector({ value, onChange }) {
  const windows = ['24h', '7d', '30d'];
  
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {windows.map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === w 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

// ============ INPUT SELECTOR ============
function InputSelector({ type, value, onTypeChange, onValueChange }) {
  return (
    <div className="flex items-center gap-3">
      {/* Type Toggle */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={() => onTypeChange('actor')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
            type === 'actor' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Actor
        </button>
        <button
          onClick={() => onTypeChange('token')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
            type === 'token' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Token
        </button>
      </div>
      
      {/* Input Field */}
      <div className="flex-1 max-w-xs">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={type === 'actor' ? 'e.g., binance' : 'e.g., 0x...'}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="input-field"
        />
      </div>
    </div>
  );
}

// ============ ENGINE HEALTH MINI ============
function EngineHealthMini({ health }) {
  if (!health) return null;
  
  const statusConfig = {
    CRITICAL: { color: 'bg-red-500', label: 'Critical' },
    WARNING: { color: 'bg-amber-500', label: 'Warning' },
    OK: { color: 'bg-green-500', label: 'Healthy' },
  };
  
  const config = statusConfig[health.status] || statusConfig.WARNING;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <div className="text-sm">
        <span className="text-gray-500">Engine: </span>
        <span className="text-gray-900 font-medium">{config.label}</span>
      </div>
      <div className="text-xs text-gray-500 border-l border-gray-200 pl-3">
        Coverage: {health.avgCoverage?.toFixed(0) || 0}%
      </div>
      <div className="text-xs text-gray-500">
        Risk: {health.avgRisk?.toFixed(0) || 0}
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function EnginePage() {
  const [inputType, setInputType] = useState('actor');
  const [inputValue, setInputValue] = useState('');
  const [window, setWindow] = useState('24h');
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Fetch engine health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/api/engine/v2/health');
        if (response.data.ok) {
          setHealth(response.data.data);
        }
      } catch (err) {
        console.error('Health fetch error:', err);
      } finally {
        setHealthLoading(false);
      }
    };
    
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Decision Engine</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                v2
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Rule-based decision layer with full explainability. No ML influence.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/engine/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              data-testid="dashboard-link"
            >
              <Settings className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Engine Health Mini */}
        {!healthLoading && health && (
          <div className="mb-6">
            <EngineHealthMini health={health} />
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <InputSelector
              type={inputType}
              value={inputValue}
              onTypeChange={setInputType}
              onValueChange={setInputValue}
            />
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Window:</span>
              <WindowSelector value={window} onChange={setWindow} />
            </div>
          </div>
        </div>

        {/* Decision Card V2 */}
        <EngineDecisionCardV2
          actor={inputType === 'actor' ? inputValue || null : null}
          token={inputType === 'token' ? inputValue || null : null}
          window={window}
        />

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 text-center">
            All decisions are rule-based and deterministic. 
            No ML predictions influence outcomes. 
            Decisions are logged for audit.
          </p>
        </div>
      </main>
    </div>
  );
}
