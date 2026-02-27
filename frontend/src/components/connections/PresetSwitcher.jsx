/**
 * Preset Switcher Component
 * 
 * PHASE D: UI for switching between account presets.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Building2, Brain, Users, Newspaper, 
  Image, TrendingUp, Star, Search, ChevronDown 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const ICONS = {
  Sparkles, Building2, Brain, Users, Newspaper, Image, TrendingUp, Star, Search
};

export default function PresetSwitcher({ basePath = '/connections/unified' }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentPreset = searchParams.get('preset');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/connections/presets`);
        if (res.data.ok) {
          setPresets(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load presets:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (presetId) => {
    const newParams = new URLSearchParams(searchParams);
    if (presetId) {
      newParams.set('preset', presetId);
    } else {
      newParams.delete('preset');
    }
    setSearchParams(newParams);
    setOpen(false);
  };

  const selected = presets.find(p => p.id === currentPreset);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-700/50 rounded-lg h-10 w-40" />
    );
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                   border border-gray-700 rounded-lg transition-colors"
        data-testid="preset-switcher-btn"
      >
        {selected ? (
          <>
            {ICONS[selected.icon] && React.createElement(ICONS[selected.icon], {
              className: 'w-4 h-4',
              style: { color: selected.color },
            })}
            <span className="text-sm font-medium text-white">{selected.label}</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">All Accounts</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 
                        rounded-lg shadow-xl z-50 overflow-hidden">
          {/* All option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors
                       ${!currentPreset ? 'bg-gray-700/30' : ''}`}
          >
            <Users className="w-4 h-4 text-gray-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-white">All Accounts</div>
              <div className="text-xs text-gray-500">Show everything</div>
            </div>
          </button>

          <div className="border-t border-gray-700" />

          {/* Preset options */}
          {presets.map(preset => {
            const Icon = ICONS[preset.icon] || Users;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors
                           ${currentPreset === preset.id ? 'bg-gray-700/30' : ''}`}
                data-testid={`preset-${preset.id.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" style={{ color: preset.color }} />
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-white">{preset.label}</div>
                  <div className="text-xs text-gray-500 truncate">{preset.description}</div>
                </div>
                {preset.badges?.length > 0 && (
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                  >
                    {preset.badges[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
