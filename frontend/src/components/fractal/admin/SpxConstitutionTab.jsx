/**
 * SPX CONSTITUTION TAB
 * 
 * BLOCK B6.14 — Constitution Generator UI
 * 
 * Улучшенный дизайн по аналогии с BTC модулем:
 * - Светлая цветовая схема
 * - Русские описания и тултипы
 * - Четкая структура данных
 */

import React, { useEffect, useState, useCallback } from 'react';
import { HelpCircle, Info, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// TOOLTIPS — Russian descriptions
// ═══════════════════════════════════════════════════════════════

const SPX_TOOLTIPS = {
  constitution: {
    title: 'Конституция SPX',
    description: 'Набор правил использования модели для каждого рыночного режима. Определяет когда модель надёжна, а когда требуется осторожность.',
  },
  proven: {
    title: 'Proven (Доказанный)',
    description: 'Режим с сильной статистической базой (500+ семплов) и стабильностью через декады. Модель работает надёжно.',
  },
  moderate: {
    title: 'Moderate (Умеренный)',
    description: 'Режим с ограниченными данными (100-500 семплов). Модель может работать, но требуется наблюдение.',
  },
  unproven: {
    title: 'Unproven (Непроверенный)',
    description: 'Недостаточно данных для оценки (<100 семплов). Используйте с осторожностью.',
  },
  negative: {
    title: 'Negative (Негативный)',
    description: 'Модель показывает отрицательный skill в этом режиме. Рекомендуется BLOCK или уменьшение позиций.',
  },
  shortFilter: {
    title: 'Short Filter Policy',
    description: 'Политика для коротких (медвежьих) сигналов. ALLOW — разрешено. CAUTION — уменьшенный размер. BLOCK — запрещено.',
  },
  longFilter: {
    title: 'Long Filter Policy',
    description: 'Политика для длинных (бычьих) сигналов. ALLOW — разрешено. CAUTION — уменьшенный размер. BLOCK — запрещено.',
  },
  sizeCap: {
    title: 'Size Cap',
    description: 'Максимальный размер позиции в данном режиме (% от базового). 100% — полный размер, 75% — уменьшенный.',
  },
  stability: {
    title: 'Decade Stability',
    description: 'Анализ стабильности skill модели через разные десятилетия (1950s-2020s). Показывает консистентность результатов.',
  },
  skill: {
    title: 'Skill (Мастерство)',
    description: 'Skill = HitRate - Baseline. Показывает насколько модель превосходит случайное угадывание. Положительное значение — модель полезна.',
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
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function PolicyBadge({ policy }) {
  const config = {
    ALLOW: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircle },
    CAUTION: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: AlertTriangle },
    BLOCK: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: XCircle },
  };
  const c = config[policy] || config.CAUTION;
  const Icon = c.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3 h-3" />
      {policy}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    PROVEN: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    MODERATE: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    UNPROVEN: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
    NEGATIVE: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };
  const c = config[status] || config.UNPROVEN;
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {status}
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

// Policy Row Component
function PolicyRow({ policy }) {
  const formatPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={policy.status} />
          <span className="font-semibold text-gray-900">{policy.regimeTag.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs">
            <span className="text-gray-500">Short: </span>
            <PolicyBadge policy={policy.shortFilterPolicy} />
          </div>
          <div className="text-xs">
            <span className="text-gray-500">Long: </span>
            <PolicyBadge policy={policy.longFilterPolicy} />
          </div>
          <div className="text-xs text-gray-500 w-20 text-right">
            Cap: <span className="font-medium text-gray-700">{(policy.sizeCapShort * 100).toFixed(0)}%</span>
          </div>
          <div className="text-xs text-gray-500 w-24 text-right">
            n=<span className="font-medium text-gray-700">{policy.samples.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Metrics row */}
      <div className="flex items-center gap-6 text-xs border-t border-gray-100 pt-3">
        <div>
          <span className="text-gray-500">Skill DOWN: </span>
          <span className={policy.avgSkillDown > 0.02 ? 'text-emerald-600 font-medium' : policy.avgSkillDown < -0.02 ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {formatPct(policy.avgSkillDown)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Skill UP: </span>
          <span className={policy.avgSkillUp > 0.02 ? 'text-emerald-600 font-medium' : policy.avgSkillUp < -0.02 ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {formatPct(policy.avgSkillUp)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Стабильность: </span>
          <span className="text-gray-700 font-medium">{policy.stabilityGrade}</span>
        </div>
        <div>
          <span className="text-gray-500">Покрытие декад: </span>
          <span className="text-gray-700 font-medium">{(policy.decadeCoverage * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      {/* Notes */}
      {policy.notes && policy.notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {policy.notes.map((note, i) => (
            <div key={i} className="text-xs text-gray-500 pl-3 border-l-2 border-gray-200 italic">
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Decade Stability Section
function DecadeStabilitySection({ stability, selectedRegime }) {
  if (!stability || !stability.matrix) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center text-gray-500">
        Нет данных о стабильности по декадам
      </div>
    );
  }
  
  const regimeData = stability.matrix[selectedRegime];
  const decades = stability.decades || ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  
  const formatPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  
  const getSkillColor = (skill) => {
    if (skill == null) return 'bg-gray-100 text-gray-400';
    if (skill > 0.02) return 'bg-emerald-100 text-emerald-700';
    if (skill > 0) return 'bg-emerald-50 text-emerald-600';
    if (skill > -0.02) return 'bg-amber-50 text-amber-600';
    return 'bg-red-100 text-red-700';
  };
  
  // Calculate summary
  const validDecades = regimeData ? Object.values(regimeData).filter(d => d && d.samples > 0) : [];
  const avgSkill = validDecades.length > 0 
    ? validDecades.reduce((sum, d) => sum + (d.skillDown || 0), 0) / validDecades.length 
    : 0;
  const consistency = validDecades.length > 0
    ? (validDecades.filter(d => (d.skillDown || 0) > 0).length / validDecades.length * 100)
    : 0;
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">
          Стабильность по декадам: {selectedRegime?.replace(/_/g, ' ')} (90d)
        </div>
        <InfoTooltip tooltip={SPX_TOOLTIPS.stability} placement="left" />
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Декад</div>
          <div className="text-lg font-bold text-gray-900">{validDecades.length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Консистентность</div>
          <div className={`text-lg font-bold ${consistency >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {consistency.toFixed(0)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Средний Skill</div>
          <div className={`text-lg font-bold ${avgSkill > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatPct(avgSkill)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Оценка</div>
          <div className={`text-lg font-bold ${
            consistency >= 66 ? 'text-emerald-600' : 
            consistency >= 33 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {consistency >= 66 ? 'HIGH' : consistency >= 33 ? 'MEDIUM' : 'LOW'}
          </div>
        </div>
      </div>
      
      {/* Decade breakdown */}
      <div className="space-y-1">
        {decades.map(decade => {
          const d = regimeData?.[decade];
          if (!d) return (
            <div key={decade} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50">
              <span className="text-xs text-gray-400">{decade}</span>
              <span className="text-xs text-gray-400">Нет данных</span>
            </div>
          );
          
          return (
            <div key={decade} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
              <span className="text-xs font-medium text-gray-700 w-16">{decade}</span>
              <div className="flex-1 mx-2">
                <div className={`h-4 rounded ${getSkillColor(d.skillDown)}`} 
                     style={{ width: `${Math.min(Math.abs((d.skillDown || 0) * 100) * 5, 100)}%`, minWidth: '4px' }}>
                </div>
              </div>
              <span className={`text-xs font-medium w-16 text-right ${
                (d.skillDown || 0) > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatPct(d.skillDown)}
              </span>
              <span className="text-xs text-gray-400 w-16 text-right">n={d.samples || 0}</span>
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

export function SpxConstitutionTab() {
  const [constitution, setConstitution] = useState(null);
  const [stability, setStability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      const [constRes, stabRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/admin/constitution`),
        fetch(`${API_BASE}/api/spx/v2.1/admin/regimes/stability`),
      ]);
      
      const constJson = await constRes.json();
      const stabJson = await stabRes.json();
      
      if (constJson.ok && constJson.data) {
        setConstitution(constJson.data);
        if (!selectedRegime && constJson.data.policies?.length > 0) {
          setSelectedRegime(constJson.data.policies[0].regimeTag);
        }
      }
      if (stabJson.ok && stabJson.data) setStability(stabJson.data);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRegime]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/constitution/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'BALANCED', save: true }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setConstitution(json.data);
        if (json.data.policies?.length > 0) {
          setSelectedRegime(json.data.policies[0].regimeTag);
        }
      } else {
        setError(json.error || 'Ошибка генерации');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных конституции...</p>
        </div>
      </div>
    );
  }
  
  if (!constitution) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-600 mb-2">Конституция ещё не сгенерирована</div>
          <p className="text-sm text-gray-500 mb-6">
            Конституция определяет правила использования модели для каждого рыночного режима
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Сгенерировать Конституцию v2
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="spx-constitution-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">B6.14 — Конституция SPX v2</h2>
            <InfoTooltip tooltip={SPX_TOOLTIPS.constitution} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Режимные ограничения со стабильностью по декадам • Hash: {constitution.hash}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Перегенерировать
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium"
          >
            Обновить
          </button>
        </div>
      </div>
      
      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          label="Proven режимов" 
          value={constitution.summary?.proven || 0} 
          subtext="Сильная статистическая база"
          severity="good"
          tooltip={SPX_TOOLTIPS.proven}
        />
        <KPICard 
          label="Moderate" 
          value={constitution.summary?.moderate || 0} 
          subtext="Ограниченные данные"
          severity="neutral"
          tooltip={SPX_TOOLTIPS.moderate}
        />
        <KPICard 
          label="Unproven" 
          value={constitution.summary?.unproven || 0} 
          subtext="Недостаточно данных"
          severity="warn"
          tooltip={SPX_TOOLTIPS.unproven}
        />
        <KPICard 
          label="Negative" 
          value={constitution.summary?.negative || 0} 
          subtext="Модель вредит"
          severity="bad"
          tooltip={SPX_TOOLTIPS.negative}
        />
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Policies (2 cols) */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Политики по режимам</h3>
            <InfoTooltip tooltip={SPX_TOOLTIPS.shortFilter} />
          </div>
          {constitution.policies?.map(p => (
            <div 
              key={p.regimeTag} 
              onClick={() => setSelectedRegime(p.regimeTag)}
              className={`cursor-pointer transition-all ${selectedRegime === p.regimeTag ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
            >
              <PolicyRow policy={p} />
            </div>
          ))}
        </div>
        
        {/* Stability Detail (1 col) */}
        <div className="space-y-4">
          <DecadeStabilitySection 
            stability={stability} 
            selectedRegime={selectedRegime || constitution.policies?.[0]?.regimeTag}
          />
          
          {/* Config info */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="font-semibold text-gray-900 mb-3">Параметры конституции</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Мин. семплов (PROVEN)</span>
                <span className="text-gray-900 font-medium">{constitution.minSamplesRule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Мин. консистентность</span>
                <span className="text-gray-900 font-medium">{(constitution.minStabilityScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Сгенерировано</span>
                <span className="text-gray-900 font-medium">
                  {new Date(constitution.generatedAt).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        Constitution v2 • Не alpha-генератор, только risk gates • Используйте с Governance (B6.15)
      </div>
    </div>
  );
}

export default SpxConstitutionTab;
