/**
 * SPX REGIMES TAB
 * 
 * BLOCK B6.12 — Regime Matrix UI + Terminal Badge
 * 
 * Улучшенный дизайн по аналогии с BTC модулем:
 * - Светлая цветовая схема
 * - Русские описания и тултипы
 * - Четкая структура данных
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { HelpCircle, Info, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// TOOLTIPS — Russian descriptions
// ═══════════════════════════════════════════════════════════════

const SPX_TOOLTIPS = {
  regimeMatrix: {
    title: 'Матрица Skill по режимам',
    description: 'Skill = HitRate - Baseline. Показывает где модель имеет преимущество над случайным угадыванием. Положительное значение — модель полезна в этом режиме.',
  },
  skillDown: {
    title: 'Skill DOWN',
    description: 'Мастерство модели для медвежьих (SHORT) сигналов. Положительное значение означает, что модель предсказывает падения лучше случайного.',
  },
  skillUp: {
    title: 'Skill UP',
    description: 'Мастерство модели для бычьих (LONG) сигналов. Положительное значение означает, что модель предсказывает рост лучше случайного.',
  },
  confidence: {
    title: 'Уверенность (Confidence)',
    description: 'Статистическая надёжность данных. HIGH — 500+ семплов (надёжно). MEDIUM — 100-500 (осторожно). LOW — <100 (ненадёжно).',
  },
  currentRegime: {
    title: 'Текущий режим',
    description: 'Рыночный режим на последнюю дату данных. Используется для определения текущей политики модели.',
  },
  recompute: {
    title: 'Пересчёт режимов',
    description: 'Запускает полный пересчёт режимов и outcomes для обновления матрицы skill. Процесс может занять несколько минут.',
  },
  volatility: {
    title: 'Распределение по волатильности',
    description: 'LOW — спокойный рынок (<20% годовой vol). MEDIUM — нормальная волатильность. HIGH — турбулентность (>35% vol).',
  },
};

// InfoTooltip Component
function InfoTooltip({ tooltip, placement = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!tooltip) return null;
  
  return (
    <div className="relative inline-flex items-center ml-1">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>
      
      {isOpen && (
        <div className={`absolute z-50 w-72 p-4 rounded-xl border shadow-xl bg-blue-50 border-blue-200 ${
          placement === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
          placement === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
          placement === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
          'top-full mt-2 left-1/2 -translate-x-1/2'
        }`}>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {tooltip.title}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {tooltip.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getSkillColor(skill, samples = 0) {
  if (samples < 100) return 'bg-gray-100 text-gray-400';
  if (skill > 0.02) return 'bg-emerald-100 text-emerald-700';
  if (skill > 0) return 'bg-emerald-50 text-emerald-600';
  if (skill > -0.02) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function formatSkill(skill) {
  if (typeof skill !== 'number' || isNaN(skill)) return '—';
  return `${skill >= 0 ? '+' : ''}${(skill * 100).toFixed(1)}%`;
}

function formatPct(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  return `${(val * 100).toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ConfidenceBadge({ confidence }) {
  const config = {
    HIGH: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    LOW: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
  };
  const c = config[confidence] || config.LOW;
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {confidence}
    </span>
  );
}

function RiskLevelBadge({ level }) {
  const config = {
    LOW: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
    EXTREME: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  const c = config[level] || config.MEDIUM;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      {level}
    </span>
  );
}

function ModelUsefulBadge({ isUseful }) {
  return isUseful ? (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
      МОДЕЛЬ РАБОТАЕТ
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-500">
      МОДЕЛЬ СЛАБАЯ
    </span>
  );
}

function KPICard({ label, value, subtext, severity = 'neutral', tooltip }) {
  const colorMap = {
    good: 'bg-emerald-50 border-emerald-200',
    warn: 'bg-amber-50 border-amber-200',
    bad: 'bg-red-50 border-red-200',
    neutral: 'bg-gray-50 border-gray-200',
  };
  
  const textColorMap = {
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    bad: 'text-red-700',
    neutral: 'text-gray-900',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colorMap[severity]}`}>
      <div className="flex items-center text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
        {tooltip && <InfoTooltip tooltip={tooltip} />}
      </div>
      <div className={`text-2xl font-bold ${textColorMap[severity]}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

// Terminal Badge Preview
function TerminalBadgePreview({ current }) {
  if (!current) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">Нет данных о текущем режиме</div>
        <div className="text-xs text-gray-400 mt-1">Запустите пересчёт для генерации данных</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        SPX Terminal Header Badge Preview
        <InfoTooltip tooltip={SPX_TOOLTIPS.currentRegime} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">РЕЖИМ:</span>
            <span className="px-2 py-1 rounded bg-blue-600 text-white text-sm font-bold">
              {current.regimeTag?.replace(/_/g, ' ') || 'UNKNOWN'}
            </span>
          </div>
          <RiskLevelBadge level={current.riskLevel} />
          <ModelUsefulBadge isUseful={current.isModelUseful} />
        </div>
        <div className="mt-2 text-sm text-gray-300">
          {current.description}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-500">Vol20: </span>
            <span className="text-white">{formatPct(current.features?.vol20)}</span>
          </div>
          <div>
            <span className="text-gray-500">Vol60: </span>
            <span className="text-white">{formatPct(current.features?.vol60)}</span>
          </div>
          <div>
            <span className="text-gray-500">MaxDD60: </span>
            <span className="text-red-400">{formatPct(current.features?.maxDD60)}</span>
          </div>
          <div>
            <span className="text-gray-500">Тренд: </span>
            <span className={current.features?.trendDir === 'UP' ? 'text-emerald-400' : 
                           current.features?.trendDir === 'DOWN' ? 'text-red-400' : 'text-gray-400'}>
              {current.features?.trendDir === 'UP' ? 'ВВЕРХ' : 
               current.features?.trendDir === 'DOWN' ? 'ВНИЗ' : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Matrix Cell
function MatrixCell({ cell, onClick }) {
  const { skillUp, skillDown, hitUp, hitDown, baselineUp, baselineDown, samples, confidence } = cell;
  
  const bgColor = getSkillColor(Math.max(skillUp, skillDown), samples);
  const isLowSamples = samples < 100;
  
  return (
    <td 
      className={`p-2 text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all rounded ${bgColor} ${isLowSamples ? 'opacity-60' : ''}`}
      onClick={() => onClick(cell)}
      title={`Семплов: ${samples}\nHit↑: ${formatPct(hitUp)} | Hit↓: ${formatPct(hitDown)}\nBase↑: ${formatPct(baselineUp)} | Base↓: ${formatPct(baselineDown)}`}
    >
      <div className="text-xs font-bold">
        <span className={skillDown > 0 ? 'text-emerald-700' : 'text-red-600'}>
          <TrendingDown className="w-3 h-3 inline" />{formatSkill(skillDown)}
        </span>
        <span className="text-gray-400 mx-1">|</span>
        <span className={skillUp > 0 ? 'text-emerald-700' : 'text-red-600'}>
          <TrendingUp className="w-3 h-3 inline" />{formatSkill(skillUp)}
        </span>
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-center gap-1">
        n={samples} <ConfidenceBadge confidence={confidence} />
      </div>
    </td>
  );
}

// Regime Matrix Heatmap
function RegimeMatrixHeatmap({ matrix, onCellClick }) {
  const { regimes = [], horizons = [], cells = [] } = matrix || {};
  
  const cellMap = useMemo(() => {
    const map = new Map();
    for (const c of cells) {
      map.set(`${c.regimeTag}|${c.horizon}`, c);
    }
    return map;
  }, [cells]);
  
  if (regimes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
        <div className="text-gray-500 mb-2">Нет данных по режимам</div>
        <div className="text-xs text-gray-400">Запустите пересчёт для генерации матрицы</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <h3 className="font-semibold text-gray-900">Матрица Skill: Режим × Горизонт</h3>
        <InfoTooltip tooltip={SPX_TOOLTIPS.regimeMatrix} />
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Режим</th>
              {horizons.map(h => (
                <th key={h} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regimes.map(regime => (
              <tr key={regime} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-sm text-gray-900 whitespace-nowrap">
                  {regime.replace(/_/g, ' ')}
                </td>
                {horizons.map(h => {
                  const cell = cellMap.get(`${regime}|${h}`);
                  if (!cell) return <td key={h} className="p-2 bg-gray-50 text-center text-xs text-gray-400">—</td>;
                  return <MatrixCell key={h} cell={cell} onClick={onCellClick} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cell Drilldown Modal
function CellDrilldownModal({ cell, onClose }) {
  if (!cell) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">{cell.regimeTag?.replace(/_/g, ' ')}</div>
            <div className="text-sm text-gray-500">Горизонт: {cell.horizon}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Skill DOWN
            </div>
            <div className={`text-2xl font-black ${cell.skillDown > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatSkill(cell.skillDown)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Hit: {formatPct(cell.hitDown)} | Baseline: {formatPct(cell.baselineDown)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Skill UP
            </div>
            <div className={`text-2xl font-black ${cell.skillUp > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatSkill(cell.skillUp)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Hit: {formatPct(cell.hitUp)} | Baseline: {formatPct(cell.baselineUp)}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Всего семплов</div>
              <div className="text-xl font-bold text-gray-900">{cell.samples?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Уверенность</div>
              <ConfidenceBadge confidence={cell.confidence} />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <strong className="text-sm text-blue-800">Интерпретация:</strong>
          <p className="text-sm text-blue-700 mt-1">
            {cell.skillDown > 0.02 && cell.skillUp > 0.02 && 'Оба фильтра работают хорошо в этом режиме!'}
            {cell.skillDown > 0.02 && cell.skillUp <= 0 && 'Short-фильтр работает, long-фильтр слабый.'}
            {cell.skillUp > 0.02 && cell.skillDown <= 0 && 'Long-фильтр работает, short-фильтр слабый.'}
            {cell.skillDown <= 0 && cell.skillUp <= 0 && 'Модель испытывает трудности в этом режиме.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Regime Summary Card
function RegimeSummaryCard({ summary, onRecompute, loading }) {
  const { totalDays = 0, byRegime = {}, byVolBucket = {}, regimeDetails = [] } = summary || {};
  
  const sortedRegimes = [...regimeDetails].sort((a, b) => b.count - a.count);
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Распределение режимов</span>
          <InfoTooltip tooltip={SPX_TOOLTIPS.volatility} />
        </div>
        <button
          onClick={onRecompute}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Пересчёт...' : 'Пересчитать'}
        </button>
      </div>
      
      <div className="text-sm text-gray-500 mb-3">
        Всего: <span className="text-gray-900 font-bold">{totalDays.toLocaleString()}</span> дней
      </div>
      
      {/* Vol Buckets */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">По волатильности</div>
        <div className="grid grid-cols-3 gap-2">
          {['LOW', 'MEDIUM', 'HIGH'].map(bucket => {
            const count = byVolBucket[bucket] || 0;
            const pct = totalDays > 0 ? ((count / totalDays) * 100).toFixed(1) : 0;
            return (
              <div key={bucket} className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">{bucket}</div>
                <div className="text-sm font-bold text-gray-900">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Regime list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sortedRegimes.slice(0, 8).map(r => {
          const pct = totalDays > 0 ? ((r.count / totalDays) * 100).toFixed(1) : 0;
          return (
            <div key={r.tag} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
              <span className="text-xs font-medium text-gray-700 truncate flex-1">
                {r.tag.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-500 mx-2">{r.count.toLocaleString()}</span>
              <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
              <span className="ml-2">
                {r.isModelUseful ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">WORKS</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">WEAK</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SpxRegimesTab() {
  const [preset, setPreset] = useState('BALANCED');
  const [summary, setSummary] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recomputeLoading, setRecomputeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, matrixRes, currentRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/summary?preset=${preset}`),
        fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/matrix?preset=${preset}`),
        fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/current?preset=${preset}`),
      ]);
      
      const summaryJson = await summaryRes.json();
      const matrixJson = await matrixRes.json();
      const currentJson = await currentRes.json();
      
      if (summaryJson.ok) setSummary(summaryJson.data);
      if (matrixJson.ok) setMatrix(matrixJson.data);
      if (currentJson.ok) setCurrent(currentJson.data);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset]);
  
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);
  
  const handleRecompute = async () => {
    try {
      setRecomputeLoading(true);
      setError(null);
      
      // Step 1: Recompute regimes
      const regimeRes = await fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/recompute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });
      const regimeJson = await regimeRes.json();
      
      if (!regimeJson.ok) {
        setError(regimeJson.error || 'Ошибка пересчёта режимов');
        return;
      }
      
      // Step 2: Generate outcomes for skill matrix
      const outcomesRes = await fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/generate-outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });
      const outcomesJson = await outcomesRes.json();
      
      if (!outcomesJson.ok) {
        setError(outcomesJson.error || 'Ошибка генерации outcomes');
        return;
      }
      
      // Step 3: Refresh data
      await fetchData();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setRecomputeLoading(false);
    }
  };
  
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных режимов...</p>
        </div>
      </div>
    );
  }
  
  if (error && !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="font-bold text-red-700">Ошибка</span>
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm hover:bg-red-700">
            Повторить
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate KPIs
  const bestRegimeDown = matrix?.summary?.bestRegimeDown;
  const worstRegimeDown = matrix?.summary?.worstRegimeDown;
  const totalRegimes = matrix?.regimes?.length || 0;
  const totalSamples = matrix?.totalSamples || 0;
  const maxSkill = Math.max(...(matrix?.cells || []).map(c => Math.max(c.skillUp, c.skillDown)));
  const hasOverfitWarning = maxSkill > 0.08;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="spx-regimes-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">B6.12 — Матрица режимов</h2>
            <InfoTooltip tooltip={SPX_TOOLTIPS.regimeMatrix} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Skill = HitRate - Baseline (режимно-обусловленный). Показывает где модель имеет преимущество.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm"
          >
            <option value="BALANCED">BALANCED</option>
            <option value="DEFENSIVE">DEFENSIVE</option>
            <option value="AGGRESSIVE">AGGRESSIVE</option>
          </select>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium"
          >
            Обновить
          </button>
        </div>
      </div>
      
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard 
          label="Всего режимов" 
          value={totalRegimes} 
          subtext={`${totalSamples.toLocaleString()} семплов`}
        />
        <KPICard 
          label="Лучший режим (DOWN)" 
          value={bestRegimeDown?.replace(/_/g, ' ') || '—'} 
          subtext="Максимальный skillDown"
          severity={bestRegimeDown ? 'good' : 'neutral'}
          tooltip={SPX_TOOLTIPS.skillDown}
        />
        <KPICard 
          label="Худший режим (DOWN)" 
          value={worstRegimeDown?.replace(/_/g, ' ') || '—'} 
          subtext="Минимальный skillDown"
        />
        <KPICard 
          label="Макс. Skill" 
          value={formatSkill(maxSkill)} 
          subtext={hasOverfitWarning ? 'ПРОВЕРИТЬ ПЕРЕОБУЧЕНИЕ' : 'В норме'}
          severity={hasOverfitWarning ? 'warn' : 'good'}
        />
        <KPICard 
          label="Текущий режим" 
          value={current?.regimeTag?.replace(/_/g, ' ') || '—'} 
          subtext={current?.date || 'Нет данных'}
          severity={current?.isModelUseful ? 'good' : 'neutral'}
          tooltip={SPX_TOOLTIPS.currentRegime}
        />
      </div>
      
      {/* Terminal Badge Preview */}
      <TerminalBadgePreview current={current} />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <RegimeMatrixHeatmap matrix={matrix} onCellClick={setSelectedCell} />
        </div>
        <div>
          <RegimeSummaryCard 
            summary={summary} 
            onRecompute={handleRecompute} 
            loading={recomputeLoading}
          />
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      
      {/* Cell Drilldown Modal */}
      <CellDrilldownModal cell={selectedCell} onClose={() => setSelectedCell(null)} />
      
      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        Вычислено: {matrix?.computedAt ? new Date(matrix.computedAt).toLocaleString('ru-RU') : '—'}
      </div>
    </div>
  );
}
