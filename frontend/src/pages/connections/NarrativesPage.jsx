import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { IconSeeding, IconIgnition, IconExpansion, IconWarning, IconDecay, IconFire, IconTarget, IconSpikePump, IconInfluencer, IconNarratives } from '../../components/icons/FomoIcons';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon components for narrative states
const NARRATIVE_STATE_ICONS = {
  SEEDING: IconSeeding,
  IGNITION: IconIgnition,
  EXPANSION: IconExpansion,
  SATURATION: IconWarning,
  DECAY: IconDecay,
};

const NARRATIVE_STATE_COLORS = {
  SEEDING: { bg: 'bg-purple-100', text: 'text-purple-700', color: '#8b5cf6' },
  IGNITION: { bg: 'bg-green-100', text: 'text-green-700', color: '#22c55e' },
  EXPANSION: { bg: 'bg-amber-100', text: 'text-amber-700', color: '#f59e0b' },
  SATURATION: { bg: 'bg-orange-100', text: 'text-orange-700', color: '#f97316' },
  DECAY: { bg: 'bg-gray-100', text: 'text-gray-600', color: '#9ca3af' },
};

const SURFACE_COLORS = {
  IMMEDIATE_MOMENTUM: { bg: 'bg-red-500', text: 'text-white', IconComp: IconFire, label: 'Immediate Momentum' },
  NARRATIVE_ROTATION: { bg: 'bg-blue-500', text: 'text-white', IconComp: RefreshCw, label: 'Narrative Rotation' },
  CROWDED_TRADE: { bg: 'bg-orange-500', text: 'text-white', IconComp: IconInfluencer, label: 'Crowded Trade' },
};

export default function NarrativesPage() {
  const [narratives, setNarratives] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [alphaCandidates, setAlphaCandidates] = useState([]);
  const [alphaStats, setAlphaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('narratives');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [narrativesRes, candidatesRes, alphaRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/narratives`),
        fetch(`${API_URL}/api/narratives/candidates`),
        fetch(`${API_URL}/api/alpha/top`),
        fetch(`${API_URL}/api/alpha/health`),
      ]);

      const narrativesData = await narrativesRes.json();
      const candidatesData = await candidatesRes.json();
      const alphaData = await alphaRes.json();
      const statsData = await statsRes.json();

      if (narrativesData.ok) {
        // Data comes as { narratives: [...], active, igniting, ... }
        const narrativesList = narrativesData.data?.narratives || narrativesData.data || [];
        setNarratives(narrativesList);
      }
      if (candidatesData.ok) setCandidates(candidatesData.data || []);
      if (alphaData.ok) setAlphaCandidates(alphaData.data || []);
      if (statsData.ok) setAlphaStats(statsData.data);
    } catch (err) {
      console.error('Failed to load narratives data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats - use phase instead of state (API returns phase)
  const stats = {
    narratives: narratives.length,
    igniting: narratives.filter(n => (n.phase || n.state) === 'IGNITION').length,
    expanding: narratives.filter(n => (n.phase || n.state) === 'EXPANSION').length,
    candidates: candidates.length,
    alphaSignals: alphaCandidates.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="narratives-page">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <IconNarratives size={28} className="text-purple-500" />
              Narrative Intelligence
            </h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Track crypto narratives lifecycle from SEEDING → IGNITION → EXPANSION → DECAY. 
              Identify tokens aligned with rising narratives and surface alpha opportunities 
              before they become mainstream. Combines social signals with influencer activity.
            </p>
          </div>
          <button onClick={loadData} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 group relative cursor-help">
            <div className="text-sm text-gray-500">Active Narratives</div>
            <div className="text-2xl font-bold text-gray-900">{stats.narratives}</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Total number of tracked crypto narratives across all lifecycle stages
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 border-l-4 border-l-green-500 group relative cursor-help">
            <div className="text-sm text-gray-500 flex items-center gap-1"><IconIgnition size={14} className="text-green-600" /> Igniting</div>
            <div className="text-2xl font-bold text-green-600">{stats.igniting}</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Narratives gaining rapid momentum. Best entry point for associated tokens
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4 border-l-4 border-l-amber-500 group relative cursor-help">
            <div className="text-sm text-gray-500 flex items-center gap-1"><IconExpansion size={14} className="text-amber-600" /> Expanding</div>
            <div className="text-2xl font-bold text-amber-600">{stats.expanding}</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Peak activity narratives. High attention but watch for saturation signals
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4 border-l-4 border-l-blue-500 group relative cursor-help">
            <div className="text-sm text-gray-500 flex items-center gap-1"><IconTarget size={14} className="text-blue-600" /> Candidates</div>
            <div className="text-2xl font-bold text-blue-600">{stats.candidates}</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tokens showing strong narrative alignment + social signals. Ranked by composite score
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 border-l-4 border-l-red-500 group relative cursor-help">
            <div className="text-sm text-gray-500 flex items-center gap-1"><IconFire size={14} className="text-red-600" /> Alpha Signals</div>
            <div className="text-2xl font-bold text-red-600">{stats.alphaSignals}</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              High-conviction opportunities combining market, narrative & influencer signals
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        {/* Alpha System Health */}
        {alphaStats && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <IconSpikePump size={20} />
              Alpha System Health
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500">Hit Rate</div>
                <div className="text-xl font-bold text-green-600">{((alphaStats?.hitRate || 0) * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500">Avg Return</div>
                <div className="text-xl font-bold text-blue-600">+{((alphaStats?.avgReturn || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500">False Alpha</div>
                <div className="text-xl font-bold text-red-600">{((alphaStats?.falseAlphaRate || 0) * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500">Narrative Eff.</div>
                <div className="text-xl font-bold text-purple-600">{((alphaStats?.narrativeEfficiency || 0) * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500">Influencer ROI</div>
                <div className="text-xl font-bold text-orange-600">{(alphaStats?.influencerROI || 0).toFixed(2)}x</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('narratives')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
              activeTab === 'narratives' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <IconNarratives size={16} /> Narratives
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
              activeTab === 'candidates' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <IconTarget size={16} /> Token Candidates
          </button>
          <button
            onClick={() => setActiveTab('alpha')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
              activeTab === 'alpha' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <IconSpikePump size={16} /> Alpha Signals
          </button>
        </div>

        {/* Narratives Tab */}
        {activeTab === 'narratives' && (
          <div className="grid gap-4 md:grid-cols-2">
            {narratives.length === 0 ? (
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                  <IconNarratives size={32} className="text-purple-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Narratives</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  There are currently no tracked narratives. New narratives will appear here as they emerge from social signals and influencer activity.
                </p>
              </div>
            ) : (
              narratives.map((n) => {
              const narrativeState = n.phase || n.state || 'SEEDING';
              const colors = NARRATIVE_STATE_COLORS[narrativeState] || NARRATIVE_STATE_COLORS.SEEDING;
              const StateIcon = NARRATIVE_STATE_ICONS[narrativeState] || IconSeeding;
              return (
                <div key={n.key} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{n.displayName || n.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text} flex items-center gap-1`}>
                      <StateIcon size={12} /> {narrativeState}
                    </span>
                  </div>
                  
                  {/* NMS Score */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Narrative Momentum</span>
                      <span className="font-bold" style={{ color: colors.color }}>{((n.nms || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(n.nms || 0) * 100}%`, backgroundColor: colors.color }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Velocity</div>
                      <div className="font-bold text-gray-900">{n.velocity || 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Confidence</div>
                      <div className="font-bold text-gray-900">{((n.confidence || n.influencerWeight || 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Mentions</div>
                      <div className="font-bold text-gray-900">{n.mentionCount || 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Influencers</div>
                      <div className="font-bold text-gray-900">{n.uniqueInfluencers || 0}</div>
                    </div>
                  </div>

                  {/* Linked Tokens */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500 mb-2">Linked Tokens</div>
                    <div className="flex flex-wrap gap-2">
                      {(n.tokens || n.linkedTokens || []).map((token) => (
                        <span key={token} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Drivers */}
                  {n.topDrivers?.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <IconInfluencer size={14} />
                      Top Drivers: {n.topDrivers.slice(0, 3).map(d => `@${d}`).join(', ')}
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Narrative-Based Token Candidates</h3>
              <p className="text-sm text-gray-500">Ranked by social signals + narrative alignment</p>
            </div>
            {candidates.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                  <IconTarget size={32} className="text-blue-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Token Candidates</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  No tokens currently match active narrative criteria. Candidates will appear as tokens show alignment with emerging narratives.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Social Signal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narratives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidates.map((c, idx) => (
                  <tr key={c.symbol} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                        idx === 1 ? 'bg-gray-300 text-gray-700' : 
                        idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-gray-900">{c.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.candidateScore || c.score || 0) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{((c.candidateScore || c.score || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        (c.socialWeight || 0) > 0.7 ? 'text-green-600' : (c.socialWeight || 0) > 0.4 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {((c.socialWeight || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.narratives || []).slice(0, 2).map((n) => (
                          <span key={typeof n === 'string' ? n : n.key} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                            {typeof n === 'string' ? n.replace('_', ' ') : n.key?.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* Alpha Signals Tab */}
        {activeTab === 'alpha' && (
          <div className="space-y-4">
            {alphaCandidates.map((a) => {
              const surface = SURFACE_COLORS[a.surface] || SURFACE_COLORS.NARRATIVE_ROTATION;
              return (
                <div key={`${a.asset}-${a.narrative}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-gray-900">{a.asset}</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${
                        a.direction === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {a.direction === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {a.direction}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{a.horizon}</span>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${surface.bg} ${surface.text}`}>
                      {surface.icon} {surface.label}
                    </span>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{((a.alphaScore || a.score || 0) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">Alpha Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-700">{((a.marketScore || 0) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">Market</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{((a.narrativeScore || 0) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">Narrative</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">{((a.influencerScore || a.confidence || 0) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">Influencer</div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2 font-medium">WHY THIS SIGNAL</div>
                    <ul className="space-y-1">
                      {a.explanation?.map((exp, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-green-500">✓</span> {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            {alphaCandidates.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <IconSpikePump size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No alpha signals at this time</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
