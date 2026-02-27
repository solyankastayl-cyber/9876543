/**
 * Engine Page (P2 - Sprint 4)
 * 
 * Decision Layer UI
 * - Input selector (Token/Actor)
 * - Decision Card (BUY/SELL/NEUTRAL)
 * - Why section (Primary Context)
 * - Supporting Facts
 * - Risk Notes
 * - Feedback buttons
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, TrendingUp, TrendingDown, Minus, 
  AlertTriangle, Info, ChevronRight, ThumbsUp, ThumbsDown,
  Loader2, RefreshCw, Search, Users, Zap, Shield
} from 'lucide-react';
import { 
  WindowSelector, 
  CoverageBadge, 
  CheckedBadge, 
  EmptyState,
  InterpretationBlock,
  AnalysisStatus 
} from '../components/common';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

const DECISION_CONFIG = {
  BUY: {
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    icon: TrendingUp,
    label: 'BUY',
  },
  SELL: {
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    icon: TrendingDown,
    label: 'SELL',
  },
  NEUTRAL: {
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50',
    icon: Minus,
    label: 'NEUTRAL',
  },
};

const CONFIDENCE_CONFIG = {
  HIGH: { color: 'bg-emerald-100 text-emerald-700', label: 'High Confidence' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700', label: 'Medium Confidence' },
  LOW: { color: 'bg-gray-100 text-gray-600', label: 'Low Confidence' },
};

export default function EnginePage() {
  const [inputType, setInputType] = useState('actor'); // 'actor' | 'token'
  const [inputValue, setInputValue] = useState('binance');
  const [window, setWindow] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [input, setInput] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const runEngine = async () => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    setError(null);
    setDecision(null);
    setFeedbackSent(false);
    
    try {
      const body = inputType === 'actor' 
        ? { actor: inputValue, window }
        : { asset: inputValue, window };
      
      const response = await api.post('/api/engine/decide', body);
      
      if (response.data.ok) {
        setDecision(response.data.data);
        // Also get input details
        const params = inputType === 'actor'
          ? `actor=${inputValue}&window=${window}`
          : `asset=${inputValue}&window=${window}`;
        const inputRes = await api.get(`/api/engine/input?${params}`);
        if (inputRes.data.ok) {
          setInput(inputRes.data.data);
        }
      } else {
        setError(response.data.error || 'Failed to generate decision');
      }
    } catch (err) {
      setError('Failed to connect to engine');
      console.error('Engine error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (helpful) => {
    if (!decision?.id) return;
    
    try {
      await api.post(`/api/engine/decisions/${decision.id}/feedback`, { helpful });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const config = decision ? DECISION_CONFIG[decision.decision] : null;
  const confidenceConfig = decision ? CONFIDENCE_CONFIG[decision.confidenceBand] : null;
  const DecisionIcon = config?.icon || Minus;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Decision Engine</h1>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  v1.1
                </span>
              </div>
              <Link
                to="/engine/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Shield className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
            <p className="text-gray-500">
              Rule-based decision layer. Analyzes contexts, signals, and actors to generate explainable decisions.
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Input Type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Analyze</label>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
                  <button
                    onClick={() => setInputType('actor')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      inputType === 'actor' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Actor
                  </button>
                  <button
                    onClick={() => setInputType('token')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      inputType === 'token' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    Token
                  </button>
                </div>
              </div>
              
              {/* Input Value */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1.5">
                  {inputType === 'actor' ? 'Actor Slug' : 'Token Address'}
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputType === 'actor' ? 'e.g., binance' : 'e.g., 0x...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Window */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Window</label>
                <WindowSelector value={window} onChange={setWindow} />
              </div>
              
              {/* Run Button */}
              <button
                onClick={runEngine}
                disabled={loading || !inputValue.trim()}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                Analyze
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-500">Analyzing contexts and generating decision...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Decision Result */}
          {decision && !loading && (
            <div className="space-y-6">
              {/* Decision Card */}
              <div className={`rounded-2xl p-8 border-2 ${config.bgLight} border-${config.color.replace('bg-', '')}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${config.color}`}>
                      <DecisionIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div className={`text-4xl font-bold ${config.textColor}`}>
                        {decision.decision}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Engine Decision
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence Band */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${confidenceConfig.color} cursor-help`}>
                        {confidenceConfig.label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <p className="font-semibold mb-1">Confidence Band</p>
                      <p className="text-sm text-gray-600">
                        Band reflects robustness of observed evidence & data coverage.
                        It is not a probability or performance metric.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Evidence</div>
                    <div className="text-2xl font-bold text-gray-900">{decision.scores.evidence}</div>
                    <div className="text-xs text-gray-400">/ 100</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Direction</div>
                    <div className={`text-2xl font-bold ${
                      decision.scores.direction > 0 ? 'text-emerald-600' : 
                      decision.scores.direction < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {decision.scores.direction > 0 ? '+' : ''}{decision.scores.direction}
                    </div>
                    <div className="text-xs text-gray-400">-100 to +100</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Risk</div>
                    <div className={`text-2xl font-bold ${
                      decision.scores.risk > 50 ? 'text-red-600' : 
                      decision.scores.risk > 30 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {decision.scores.risk}
                    </div>
                    <div className="text-xs text-gray-400">/ 100</div>
                  </div>
                </div>
              </div>

              {/* Why - Primary Context */}
              {decision.reasoning.primaryContext && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Why this decision?</h3>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="font-medium text-blue-900">
                      {decision.reasoning.primaryContext.headline}
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      {decision.reasoning.primaryContext.whyItMatters}
                    </p>
                  </div>
                  
                  <Link
                    to="/signals"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                  >
                    View context in Signals <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Supporting Facts */}
              {decision.reasoning.supportingFacts?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Supporting Facts</h3>
                  </div>
                  
                  <ul className="space-y-2">
                    {decision.reasoning.supportingFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />
                        <span className="text-gray-700">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Notes */}
              {decision.reasoning.riskNotes?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Risk Notes</h3>
                  </div>
                  
                  <ul className="space-y-2">
                    {decision.reasoning.riskNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coverage & Actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Coverage */}
                  {input && (
                    <div className="flex items-center gap-4">
                      <CoverageBadge 
                        pct={input.coverage.overall} 
                        note={`Contexts: ${input.coverage.contexts}%, Actors: ${input.coverage.actors}%`}
                      />
                      <CheckedBadge checked={['contexts', 'signals', 'actors', 'graph']} />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {inputType === 'actor' && (
                      <Link
                        to={`/actors/${inputValue}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        View Actor
                      </Link>
                    )}
                    <button
                      onClick={runEngine}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Re-analyze
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback (P4) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Was this helpful?</h3>
                    <p className="text-sm text-gray-500">Your feedback helps improve the engine</p>
                  </div>
                  
                  {feedbackSent ? (
                    <div className="text-emerald-600 text-sm font-medium">
                      ✓ Thanks for your feedback!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => submitFeedback(true)}
                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                      >
                        <ThumbsUp className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                      </button>
                      <button
                        onClick={() => submitFeedback(false)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <ThumbsDown className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 text-center italic">
                This is a rule-based decision engine v1.0. Decisions are based on observed patterns and should not be considered financial advice.
              </p>
            </div>
          )}

          {/* Initial state */}
          {!decision && !loading && !error && (
            <EmptyState 
              message="Enter an actor or token to analyze"
              description="The engine will analyze contexts, signals, and actors to generate a decision"
              icon={Brain}
              checked={[]}
            />
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
