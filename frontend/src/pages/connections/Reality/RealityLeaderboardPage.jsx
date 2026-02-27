/**
 * Reality Leaderboard Page - LIGHT THEME
 * 
 * PHASE E4: Ranking of "truth" vs "talking books"
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { IconTrophy, IconSpikePump, IconAttention, IconInfluencer, IconNetwork, IconRadar, IconFund } from '../../../components/icons/FomoIcons';
import { RealityLeaderboardTable } from './RealityLeaderboardTable';
import { fetchLeaderboard, fetchLeaderboardGroups } from './reality.api';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

const WINDOWS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const SORTS = [
  { value: 'score', label: 'Reality Score', IconComp: IconTrophy },
  { value: 'confirms', label: 'Most Confirms', IconComp: IconSpikePump },
  { value: 'contradicts', label: 'Talking Books', IconComp: IconAttention },
  { value: 'sample', label: 'Most Data', IconComp: IconInfluencer },
];

// Score Title with Formula Tooltip - defined before main component
function ScoreTitleWithTooltip() {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'help', position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
        Reality Score — Credibility Tiers
      </h3>
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '16px', 
        height: '16px', 
        borderRadius: '50%', 
        background: '#e5e7eb',
        color: '#6b7280',
        fontSize: '10px',
        fontWeight: 600,
      }}>
        ?
      </span>
      
      {/* Formula Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          marginTop: '8px',
          padding: '12px 16px',
          background: '#1f2937',
          color: '#ffffff',
          fontSize: '12px',
          borderRadius: '8px',
          width: '320px',
          lineHeight: '1.6',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>How Reality Score is calculated:</div>
          <div style={{ marginBottom: '8px' }}>
            The score measures how often an influencer's public statements match their actual on-chain activity.
          </div>
          <div style={{ 
            background: '#374151', 
            padding: '8px 12px', 
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            Score = ((confirms − contradicts) ÷ total) × 100
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
            Higher score = more credible influencer
          </div>
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '20px',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #1f2937',
          }} />
        </div>
      )}
    </div>
  );
}

export default function RealityLeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [entries, setEntries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const windowDays = parseInt(searchParams.get('window') || '30');
  const group = searchParams.get('group') || '';
  const sort = searchParams.get('sort') || 'score';
  
  // Load groups on mount
  useEffect(() => {
    fetchLeaderboardGroups()
      .then(res => setGroups(res.data || []))
      .catch(() => {});
  }, []);
  
  // Load leaderboard
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboard({
        windowDays,
        group: group || undefined,
        sort,
        limit: 100,
      });
      setEntries(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [windowDays, group, sort]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };
  
  const handleSelect = (entry) => {
    navigate(`/connections/${encodeURIComponent(entry.actorId)}`);
  };
  
  // Stats
  const totalConfirms = entries.reduce((s, e) => s + e.confirms, 0);
  const totalContradicts = entries.reduce((s, e) => s + e.contradicts, 0);
  const avgScore = entries.length > 0 
    ? Math.round(entries.reduce((s, e) => s + e.realityScore, 0) / entries.length)
    : 0;
  
  // Filtered entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e => 
      e.name?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.actorId?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);
  
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111827',
      }}
      data-testid="reality-leaderboard-page"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div className="p-2 bg-amber-100 rounded-lg mt-1">
              <IconTrophy size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                Reality Leaderboard
              </h1>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px', maxWidth: '700px', lineHeight: '1.5' }}>
                Influencer credibility ranking based on on-chain verification. 
                The system compares public statements with actual blockchain activity, 
                identifying Truth Tellers vs Talking Books (those who manipulate).
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px',
        }}>
          <StatCard 
            label="Actors" 
            value={entries.length} 
            color="#6366f1"
            tooltip="Number of tracked accounts for Reality verification. Each actor is analyzed for alignment between words and actions."
            icon="👤"
          />
          <StatCard 
            label="Total Confirms" 
            value={totalConfirms} 
            color="#10b981"
            tooltip="Sum of all confirmed statements. On-chain activity matched public statements — the influencer speaks truth."
            icon="✓"
          />
          <StatCard 
            label="Total Contradicts" 
            value={totalContradicts} 
            color="#ef4444"
            tooltip="Sum of all contradicted statements (Talking Books). On-chain data contradicts public position — possible manipulation."
            icon="✗"
          />
          <StatCard 
            label="Avg Score" 
            value={avgScore} 
            color="#f59e0b"
            tooltip="Average Reality Score across all actors. Formula: (confirms - contradicts) / total × 100. Higher = more credible influencer."
            icon="★"
          />
        </div>
        
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            alignItems: 'center',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Search */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Search</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-9 px-3 bg-white"
                data-testid="leaderboard-search"
              />
            </div>
          </div>
          
          {/* Window selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Time Window</label>
            <Select 
              value={String(windowDays)} 
              onValueChange={(val) => updateParams('window', val)}
            >
              <SelectTrigger className="w-32 h-9 bg-white" data-testid="window-selector">
                <SelectValue placeholder="Select window" />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map(w => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Group selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Group Filter</label>
            <Select 
              value={group || 'all'} 
              onValueChange={(val) => updateParams('group', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-36 h-9 bg-white" data-testid="group-selector">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.key} value={g.key}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Sort By</label>
            <Select 
              value={sort} 
              onValueChange={(val) => updateParams('sort', val)}
            >
              <SelectTrigger className="w-40 h-9 bg-white" data-testid="sort-selector">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh */}
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}
        
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        )}
        
        {/* Table */}
        {!loading && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <RealityLeaderboardTable entries={filteredEntries} onSelect={handleSelect} lightTheme />
          </div>
        )}
        
        {/* Legend - Score Tiers Visual */}
        <div
          style={{
            marginTop: '24px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative' }}>
                <ScoreTitleWithTooltip />
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>Based on ratio of confirmed vs contradicted statements</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ color: '#6b7280' }}>CONFIRMS = Matches on-chain</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ color: '#6b7280' }}>CONTRADICTS = Contradicts on-chain</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Score Tiers */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <ScoreTier 
                label="ELITE" 
                range="85-100" 
                color="#10b981" 
                bgColor="#d1fae5"
                description="Maximum credibility"
              />
              <ScoreTier 
                label="STRONG" 
                range="70-84" 
                color="#3b82f6" 
                bgColor="#dbeafe"
                description="High credibility"
              />
              <ScoreTier 
                label="MIXED" 
                range="40-69" 
                color="#f59e0b" 
                bgColor="#fef3c7"
                description="Requires attention"
              />
              <ScoreTier 
                label="RISKY" 
                range="0-39" 
                color="#ef4444" 
                bgColor="#fee2e2"
                description="High manipulation risk"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card with Tooltip
function StatCard({ label, value, color, tooltip, icon }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        padding: '16px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        cursor: 'help',
        position: 'relative',
        boxShadow: isHovered ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={() => { setShowTooltip(true); setIsHovered(true); }}
      onMouseLeave={() => { setShowTooltip(false); setIsHovered(false); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
      
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '10px 14px',
          background: '#1f2937',
          color: '#ffffff',
          fontSize: '12px',
          borderRadius: '8px',
          width: '240px',
          lineHeight: '1.5',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {tooltip}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f2937',
          }} />
        </div>
      )}
    </div>
  );
}

// Score Tier Component
function ScoreTier({ label, range, color, bgColor, description }) {
  return (
    <div style={{
      flex: 1,
      padding: '12px 14px',
      background: bgColor,
      borderRadius: '8px',
      border: `1px solid ${color}20`,
      textAlign: 'center',
    }}>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: 700, 
        color: color,
        letterSpacing: '0.5px',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 600, 
        color: '#111827',
        marginBottom: '4px'
      }}>
        {range}
      </div>
      <div style={{ fontSize: '10px', color: '#6b7280' }}>{description}</div>
    </div>
  );
}

// selectStyle removed - using Radix Select component
