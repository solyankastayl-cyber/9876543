/**
 * SPX GOVERNANCE TAB
 * 
 * BLOCK B6.15 — Constitution Governance UI
 * 
 * Улучшенный дизайн по аналогии с BTC модулем:
 * - Светлая цветовая схема
 * - Русские описания и тултипы
 * - Четкая структура данных
 */

import React, { useEffect, useState, useCallback } from 'react';
import { HelpCircle, Info, Shield, CheckCircle, Clock, PlayCircle, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// TOOLTIPS — Russian descriptions
// ═══════════════════════════════════════════════════════════════

const SPX_TOOLTIPS = {
  governance: {
    title: 'Governance (Управление)',
    description: 'Процесс управления жизненным циклом конституции. От генерации через тестирование до применения в production.',
  },
  lifecycle: {
    title: 'Жизненный цикл',
    description: 'GENERATED — создана. DRY_RUN — тестируется. PROPOSED — предложена к применению. APPLIED — активна в production.',
  },
  backtest: {
    title: 'Backtest результаты',
    description: 'Историческое тестирование конституции на разных периодах. Сравнение с Raw моделью и Buy & Hold.',
  },
  cagr: {
    title: 'CAGR',
    description: 'Compound Annual Growth Rate — среднегодовая доходность. Показывает рост капитала в годовом выражении.',
  },
  maxdd: {
    title: 'MaxDD',
    description: 'Maximum Drawdown — максимальная просадка. Показывает худший период потерь от пика до дна.',
  },
  sharpe: {
    title: 'Sharpe Ratio',
    description: 'Коэффициент Шарпа — доходность/риск. >1.0 — отлично, 0.5-1.0 — хорошо, <0.5 — требует внимания.',
  },
  verdict: {
    title: 'Вердикт',
    description: 'APPLY RECOMMENDED — конституция улучшает результаты, рекомендуется к применению. DO NOT APPLY — конституция ухудшает результаты.',
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
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const config = {
    GENERATED: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: Clock },
    DRY_RUN: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: PlayCircle },
    PROPOSED: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: AlertTriangle },
    APPLIED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', icon: CheckCircle },
    ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', icon: Archive },
  };
  const c = config[status] || config.GENERATED;
  const Icon = c.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  if (!verdict) return null;
  
  const isPositive = verdict === 'APPLY_RECOMMENDED' || verdict === 'APPLY';
  
  return (
    <span className={`px-3 py-1 rounded text-xs font-bold ${
      isPositive 
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
        : 'bg-red-100 text-red-700 border border-red-300'
    }`}>
      {isPositive ? 'РЕКОМЕНДУЕТСЯ ПРИМЕНИТЬ' : 'НЕ ПРИМЕНЯТЬ'}
    </span>
  );
}

// Version Card
function VersionCard({ version, onTransition, loading }) {
  const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU') : '—';
  const formatPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={version.status} />
          <span className="font-mono text-sm text-gray-700">{version.hash}</span>
        </div>
        <span className="text-xs text-gray-500">{formatDate(version.createdAt)}</span>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-gray-500">Proven</div>
          <div className="font-bold text-emerald-600">{version.summary?.proven || 0}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-gray-500">Moderate</div>
          <div className="font-bold text-blue-600">{version.summary?.moderate || 0}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-gray-500">Unproven</div>
          <div className="font-bold text-gray-600">{version.summary?.unproven || 0}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-gray-500">Negative</div>
          <div className="font-bold text-red-600">{version.summary?.negative || 0}</div>
        </div>
      </div>
      
      {/* Transition buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {version.status === 'GENERATED' && (
          <button
            onClick={() => onTransition(version.hash, 'DRY_RUN')}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 text-xs font-medium disabled:opacity-50"
          >
            Начать DRY_RUN
          </button>
        )}
        {version.status === 'DRY_RUN' && (
          <button
            onClick={() => onTransition(version.hash, 'PROPOSED')}
            disabled={loading}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded text-amber-700 text-xs font-medium disabled:opacity-50"
          >
            Предложить (PROPOSE)
          </button>
        )}
        {version.status === 'PROPOSED' && (
          <>
            <button
              onClick={() => onTransition(version.hash, 'APPLIED')}
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-700 text-xs font-medium disabled:opacity-50"
            >
              Применить (APPLY)
            </button>
            <button
              onClick={() => onTransition(version.hash, 'ARCHIVED')}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium disabled:opacity-50"
            >
              Архивировать
            </button>
          </>
        )}
        {version.status === 'APPLIED' && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Активна с {formatDate(version.appliedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// Backtest Period Card
function BacktestPeriodCard({ period }) {
  const { label, raw, constitution, buyHold, verdict, deltas } = period;
  
  const formatPct = (v) => v != null ? `${v.toFixed(1)}%` : '—';
  const formatNum = (v) => v != null ? v.toFixed(2) : '—';
  
  const isPositive = verdict === 'APPLY_RECOMMENDED' || verdict === 'APPLY';
  
  return (
    <div className={`bg-white rounded-lg p-4 border ${isPositive ? 'border-emerald-200' : 'border-red-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900">{label}</span>
        <VerdictBadge verdict={verdict} />
      </div>
      
      {/* Metrics comparison */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Raw Model</div>
          <div className="text-sm font-medium text-gray-700">CAGR {formatPct(raw?.cagr)}</div>
          <div className="text-xs text-gray-500">MaxDD {formatPct(raw?.maxDD)}</div>
        </div>
        <div className={`rounded p-2 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-500 mb-1">Constitution</div>
          <div className={`text-sm font-medium ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            CAGR {formatPct(constitution?.cagr)}
          </div>
          <div className="text-xs text-gray-500">MaxDD {formatPct(constitution?.maxDD)}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Buy & Hold</div>
          <div className="text-sm font-medium text-gray-700">CAGR {formatPct(buyHold?.cagr)}</div>
          <div className="text-xs text-gray-500">MaxDD {formatPct(buyHold?.maxDD)}</div>
        </div>
      </div>
      
      {/* Delta summary */}
      <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-100">
        <div>
          <span className="text-gray-500">MaxDD Δ: </span>
          <span className={deltas?.maxDD < 0 ? 'text-emerald-600' : 'text-red-600'}>
            {deltas?.maxDD > 0 ? '+' : ''}{formatPct(deltas?.maxDD)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Sharpe Δ: </span>
          <span className={deltas?.sharpe > 0 ? 'text-emerald-600' : 'text-red-600'}>
            {deltas?.sharpe > 0 ? '+' : ''}{formatNum(deltas?.sharpe)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">CAGR Δ: </span>
          <span className={deltas?.cagr > 0 ? 'text-emerald-600' : 'text-red-600'}>
            {deltas?.cagr > 0 ? '+' : ''}{formatPct(deltas?.cagr)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpxGovernanceTab() {
  const [versions, setVersions] = useState([]);
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      // Fetch versions
      const versionsRes = await fetch(`${API_BASE}/api/spx/v2.1/admin/governance/versions?preset=BALANCED`);
      const versionsJson = await versionsRes.json();
      if (versionsJson.ok) setVersions(versionsJson.data || []);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const runBacktest = async () => {
    try {
      setTransitioning(true);
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'BALANCED', startDate: '1950-01-01', endDate: '2025-12-31' }),
      });
      const json = await res.json();
      if (json.ok) setBacktest(json.data);
      else setError(json.error || 'Backtest failed');
    } catch (err) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleCreateVersion = async () => {
    try {
      setTransitioning(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/governance/create-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'BALANCED' }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchData();
      } else {
        setError(json.error || 'Ошибка создания версии');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };
  
  const handleTransition = async (hash, targetStatus) => {
    try {
      setTransitioning(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/governance/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, targetStatus, preset: 'BALANCED' }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchData();
      } else {
        setError(json.error || 'Ошибка перехода');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных governance...</p>
        </div>
      </div>
    );
  }
  
  const activeVersion = versions.find(v => v.status === 'APPLIED');
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="spx-governance-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">B6.15 — Управление политикой</h2>
            <InfoTooltip tooltip={SPX_TOOLTIPS.governance} />
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            Жизненный цикл: GENERATED → DRY_RUN → PROPOSED → APPLIED
            <InfoTooltip tooltip={SPX_TOOLTIPS.lifecycle} placement="right" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateVersion}
            disabled={transitioning}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Создать версию
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {/* Active Constitution Badge */}
      {activeVersion && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Активная конституция:</span>
            <span className="font-mono text-gray-700">{activeVersion.hash}</span>
            <span className="text-gray-500 text-sm">
              Применена {new Date(activeVersion.appliedAt).toLocaleString('ru-RU')}
            </span>
          </div>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Versions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Версии конституции</h3>
          </div>
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <div className="text-gray-500">Версии ещё не созданы</div>
                <p className="text-xs text-gray-400 mt-1">Сначала сгенерируйте конституцию</p>
              </div>
            ) : (
              versions.map(v => (
                <VersionCard 
                  key={v.hash} 
                  version={v} 
                  onTransition={handleTransition}
                  loading={transitioning}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Backtest Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Результаты Backtest</h3>
              <InfoTooltip tooltip={SPX_TOOLTIPS.backtest} />
            </div>
            <button
              onClick={runBacktest}
              disabled={transitioning}
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1"
            >
              <PlayCircle className="w-3 h-3" />
              {transitioning ? 'Запуск...' : 'Запустить Backtest'}
            </button>
          </div>
          
          {backtest?.performance ? (
            <div className="space-y-3">
              {/* Overall Performance */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Период: {backtest.period} ({backtest.tradingDays?.toLocaleString()} дней)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Raw Model</div>
                    <div className="text-sm font-medium">CAGR {(backtest.performance.rawModel?.cagr * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">MaxDD {(backtest.performance.rawModel?.maxDrawdown * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Sharpe {backtest.performance.rawModel?.sharpeRatio?.toFixed(3)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded p-3 border border-emerald-200">
                    <div className="text-xs text-gray-500 mb-1">Constitution</div>
                    <div className="text-sm font-medium text-emerald-700">CAGR {(backtest.performance.constitutionFiltered?.cagr * 100).toFixed(1)}%</div>
                    <div className="text-xs text-emerald-600">MaxDD {(backtest.performance.constitutionFiltered?.maxDrawdown * 100).toFixed(1)}%</div>
                    <div className="text-xs text-emerald-600">Sharpe {backtest.performance.constitutionFiltered?.sharpeRatio?.toFixed(3)}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Улучшение</div>
                    <div className="text-sm font-medium text-amber-600">
                      CAGR {((backtest.performance.constitutionFiltered?.cagr - backtest.performance.rawModel?.cagr) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-emerald-600">
                      MaxDD {((backtest.performance.constitutionFiltered?.maxDrawdown - backtest.performance.rawModel?.maxDrawdown) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-emerald-600">
                      Sharpe +{((backtest.performance.constitutionFiltered?.sharpeRatio / backtest.performance.rawModel?.sharpeRatio - 1) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Regime Performance */}
              {backtest.regimePerformance && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">По режимам</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {backtest.regimePerformance.filter(r => r.tradingDays > 0).map(r => (
                      <div key={r.regimeTag} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50">
                        <span className="font-medium text-gray-700 truncate flex-1">{r.regimeTag.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500 mx-2">{r.tradingDays} дней</span>
                        <span className={r.blocked ? 'text-red-500' : 'text-emerald-600'}>
                          {r.constitutionPolicy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
              <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500">Нет данных backtest</div>
              <p className="text-xs text-gray-400 mt-1">Нажмите "Запустить Backtest" для генерации результатов</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        Governance B6.15 • Все переходы логируются • APPLY требует положительных результатов backtest
      </div>
    </div>
  );
}

export default SpxGovernanceTab;
