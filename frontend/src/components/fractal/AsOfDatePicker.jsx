/**
 * BLOCK U2 — As-of Date Picker + Simulation Mode
 * 
 * Allows switching between:
 * - Auto (Live): Uses latest available data
 * - Simulation: Pick historical date for backtesting
 */

import React, { useState, useCallback } from 'react';
import { Calendar, Clock, RefreshCw, Play, History } from 'lucide-react';

export function AsOfDatePicker({ asOf, mode, onAsOfChange, onModeChange, lastCandle }) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputDate, setInputDate] = useState(asOf || '');
  
  const handleModeToggle = useCallback(() => {
    if (mode === 'auto') {
      // Switch to simulation, use last candle as default
      onModeChange('simulation');
      onAsOfChange(lastCandle || new Date().toISOString().split('T')[0]);
    } else {
      // Switch back to auto/live
      onModeChange('auto');
      onAsOfChange(null);
    }
    setShowPicker(false);
  }, [mode, lastCandle, onModeChange, onAsOfChange]);
  
  const handleDateSubmit = useCallback(() => {
    if (inputDate) {
      onAsOfChange(inputDate);
      onModeChange('simulation');
    }
    setShowPicker(false);
  }, [inputDate, onAsOfChange, onModeChange]);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Latest';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };
  
  return (
    <div className="relative" data-testid="asof-date-picker">
      {/* Main Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          mode === 'simulation'
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {mode === 'simulation' ? (
          <History className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          As of: {mode === 'simulation' ? formatDate(asOf) : 'Live'}
        </span>
        {mode === 'simulation' && (
          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] rounded">
            SIM
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {showPicker && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl border border-slate-200 shadow-lg p-4 min-w-[280px]">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Analysis Mode
          </div>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { onModeChange('auto'); onAsOfChange(null); setShowPicker(false); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                mode === 'auto'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Live</span>
            </button>
            <button
              onClick={() => { onModeChange('simulation'); setInputDate(asOf || lastCandle || ''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                mode === 'simulation'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">Simulation</span>
            </button>
          </div>
          
          {/* Date Picker (only in simulation mode) */}
          {mode === 'simulation' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Select Date</label>
                <input
                  type="date"
                  value={inputDate}
                  onChange={e => setInputDate(e.target.value)}
                  max={lastCandle || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1M ago', days: 30 },
                  { label: '3M ago', days: 90 },
                  { label: '6M ago', days: 180 },
                  { label: '1Y ago', days: 365 },
                ].map(preset => {
                  const date = new Date();
                  date.setDate(date.getDate() - preset.days);
                  const dateStr = date.toISOString().split('T')[0];
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setInputDate(dateStr)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleDateSubmit}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Simulation
              </button>
            </div>
          )}
          
          {/* Info text */}
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            {mode === 'auto' 
              ? 'Using latest available market data for analysis.'
              : 'Simulating analysis as if today was the selected date.'}
          </div>
        </div>
      )}
    </div>
  );
}

export default AsOfDatePicker;
