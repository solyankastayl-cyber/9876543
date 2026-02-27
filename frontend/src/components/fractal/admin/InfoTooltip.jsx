/**
 * BLOCK 50 — InfoTooltip Component
 * 
 * Provides contextual help for moderators.
 * Titles in English, descriptions in Russian.
 */

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export function InfoTooltip({ 
  title, 
  description, 
  action,
  severity,
  placement = 'top',
  children 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const severityColors = {
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
  };

  const bgColor = severityColors[severity] || severityColors.info;

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-0.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-label="More info"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
      </button>

      {isOpen && (
        <div 
          ref={tooltipRef}
          className={`absolute z-50 w-72 p-4 rounded-xl border shadow-xl ${bgColor} ${
            placement === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
            placement === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
            placement === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
            'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          {title && (
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {title}
            </h4>
          )}
          {description && (
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              {description}
            </p>
          )}
          {action && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Действия:</p>
              <p className="text-sm text-gray-700">{action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tooltips: English titles, Russian descriptions
export const FRACTAL_TOOLTIPS = {
  governance: {
    title: 'Governance Mode',
    description: 'Режим управления системой. NORMAL — штатная работа. PROTECTION — ограниченный режим. FROZEN — торговля приостановлена.',
    action: 'При статусе отличном от NORMAL — проверьте Playbook.',
  },
  freeze: {
    title: 'Contract Status',
    description: 'Статус контракта модели. FROZEN — параметры заблокированы от изменений.',
    action: 'FROZEN — нормальное состояние для production.',
  },
  guardrails: {
    title: 'Guardrails',
    description: 'Защитные ограничения параметров. VALID — все в норме.',
    action: 'При VIOLATIONS — требуется корректировка.',
  },
  health: {
    title: 'System Health',
    description: 'Общий показатель здоровья системы (0-100%). Учитывает надёжность, качество данных, стабильность.',
    action: 'HEALTHY (>80%) — норма. WATCH (60-80%) — наблюдение. ALERT (<60%) — внимание. CRITICAL (<40%) — срочно.',
    severity: 'info',
  },
  topRisks: {
    title: 'Top Risks',
    description: 'Ключевые факторы риска системы.',
    action: 'Фокус на ALERT и CRITICAL. OK и WARN — мониторинг.',
  },
  guard: {
    title: 'Catastrophic Guard',
    description: 'Защита от катастрофических потерь. Degeneration Score показывает приближение к опасным порогам.',
    action: 'OK (<55%) — безопасно. WARN (55-75%) — внимание. CRITICAL (>75%) — автоснижение риска.',
    severity: 'warning',
  },
  reliability: {
    title: 'Reliability',
    description: 'Надёжность текущих сигналов. Влияет на размер позиций.',
    action: 'При низкой надёжности (<50%) система автоматически уменьшает позиции.',
    severity: 'info',
  },
  tailRisk: {
    title: 'Tail Risk (MC)',
    description: 'Monte Carlo оценка максимальных потерь. P95 Max Drawdown — просадка в 95% сценариев.',
    action: 'До 35% — норма. 35-45% — повышенный риск. >45% — критично.',
    severity: 'warning',
  },
  performance: {
    title: 'Performance Windows',
    description: 'Историческая эффективность за 30/60/90 дней. Sharpe — доходность/риск. MaxDD — макс. просадка. Hit Rate — % прибыльных.',
    action: 'Sharpe >1.0 — отлично. 0.5-1.0 — хорошо. <0.5 — анализ.',
    severity: 'info',
  },
  playbook: {
    title: 'Playbook',
    description: 'Автоматическая рекомендация действий системы на основе анализа текущего состояния.',
    action: `Приоритеты:
• P1 CRITICAL — Критическая ситуация. Действуйте немедленно.
• P2 HIGH — Высокий приоритет. Требуется быстрое решение.
• P3 MEDIUM — Средний приоритет. Запланируйте действия.
• P4 LOW — Низкий приоритет. Рассмотрите при возможности.
• P5 INFO — Информационно. Для сведения, действия не требуются.
• P6 NONE — Всё в норме. Никаких рекомендаций.`,
    severity: 'warning',
  },
  playbookTypes: {
    title: 'Playbook Types',
    description: `Типы рекомендуемых действий:
• NO_ACTION — Система работает штатно, вмешательство не требуется.
• INVESTIGATION — Требуется анализ. Изучите метрики и логи.
• PROTECTION_ESCALATION — Эскалация защиты. Система рекомендует усилить риск-контроль.
• RECALIBRATION — Требуется перекалибровка модели или параметров.
• RECOVERY — Восстановление. Система возвращается к нормальному режиму.
• FREEZE_ONLY — Критично. Торговля должна быть приостановлена.`,
    severity: 'warning',
  },
  recentActivity: {
    title: 'Recent Activity',
    description: 'График надёжности за 7 дней и журнал действий.',
    action: 'Следите за трендом. Падение может указывать на проблемы.',
  },
  // Shadow Tab
  shadowVerdict: {
    title: 'Shadow Verdict',
    description: 'Итоговый вердикт сравнения Active и Shadow моделей. Система анализирует статистическую значимость различий в производительности.',
    action: 'SHADOW_OUTPERFORMS — Shadow превосходит, рекомендуется promotion. HOLD_ACTIVE — Active справляется, изменения не нужны. NO_EDGE — различия статистически незначимы. INSUFFICIENT_DATA — недостаточно данных для вывода.',
    severity: 'info',
  },
  resolvedSignals: {
    title: 'Resolved Signals',
    description: 'Количество сигналов, по которым уже известен результат (прошло достаточно времени). Минимум 30 сигналов требуется для статистически достоверного вердикта.',
    action: 'До 30 сигналов — данных недостаточно. После 30 — можно принимать решения о promotion.',
    severity: 'info',
  },
  shadowScore: {
    title: 'Shadow Score',
    description: 'Комплексная оценка Shadow модели (0-100). Учитывает Sharpe, MaxDD, Win Rate, калибровку.',
    action: '65+ — отлично, Shadow готов к promotion. 50-65 — хорошо, но требуется наблюдение. <50 — Shadow уступает Active.',
    severity: 'info',
  },
  deltaSharpe: {
    title: 'ΔSharpe (Delta Sharpe)',
    description: 'Разница коэффициента Sharpe между Shadow и Active. Sharpe = доходность / риск. Положительное значение — Shadow эффективнее.',
    action: '>+0.1 — значимое преимущество Shadow. <-0.1 — Active лучше. ±0.1 — нейтрально.',
    severity: 'info',
  },
  deltaMaxDD: {
    title: 'ΔMaxDD (Delta Max Drawdown)',
    description: 'Разница максимальной просадки. Отрицательное значение — Shadow показывает меньшие просадки.',
    action: '<-2% — Shadow значительно безопаснее. >+2% — Shadow рискованнее. ±2% — сопоставимо.',
    severity: 'warning',
  },
  deltaCAGR: {
    title: 'ΔCAGR (Delta CAGR)',
    description: 'Разница среднегодовой доходности (Compound Annual Growth Rate) между моделями.',
    action: '>+1% — Shadow доходнее. <-1% — Active доходнее. ±1% — сопоставимая доходность.',
    severity: 'info',
  },
  divergenceMatrix: {
    title: 'Divergence Matrix',
    description: 'Матрица расхождений 3×3: Preset (CONSERVATIVE, BALANCED, AGGRESSIVE) × Horizon (7d, 14d, 30d). Тепловая карта показывает Delta Sharpe для каждой комбинации.',
    action: 'Зелёная ячейка — Shadow лучше. Красная — Active лучше. Серая — нейтрально. Клик по ячейке выбирает её для детального анализа.',
    severity: 'info',
  },
  equityOverlay: {
    title: 'Equity Overlay',
    description: 'График кривых капитала Active (серая линия) vs Shadow (синяя линия). Нормализация приводит обе кривые к старту с 1.0 для корректного сравнения.',
    action: 'Визуально оцените стабильность и направление кривых. Резкие провалы — высокая волатильность.',
    severity: 'info',
  },
  calibration: {
    title: 'Calibration Delta',
    description: 'Сравнение калибровки вероятностей между Active и Shadow. ECE (Expected Calibration Error) показывает, насколько уверенность модели соответствует реальности. Brier Score — точность вероятностных прогнозов.',
    action: 'Рост ECE/Brier >2% при лучшем Sharpe — признак overfitting. Модель уверена в прогнозах больше, чем следует.',
    severity: 'warning',
  },
  divergenceLedger: {
    title: 'Divergence Ledger',
    description: 'Журнал всех расхождений между Active и Shadow моделями. Показывает когда модели принимали разные торговые решения и кто оказался прав.',
    action: 'Анализируйте паттерны: если Shadow систематически побеждает в определённых режимах — это важный сигнал.',
    severity: 'info',
  },
  governanceActions: {
    title: 'Governance Actions',
    description: 'Управляющие действия над Shadow моделью. Все действия логируются и требуют подтверждения. Promotion — переводит Shadow в Active. Freeze — останавливает генерацию сигналов. Archive — переводит в архив.',
    action: 'Действия разблокируются после 30+ resolved signals. При SHADOW_OUTPERFORMS рассмотрите Promotion.',
    severity: 'warning',
  },
  // Volatility Tab
  volAttribution: {
    title: 'Volatility Attribution',
    description: 'Анализ влияния волатильности на результаты. Сравнение Raw vs Scaled equity.',
    action: 'Scaled должен показывать меньший MaxDD при сохранении Sharpe.',
  },
  regimeTimeline: {
    title: 'Regime Timeline',
    description: 'История режимов волатильности за период. LOW, NORMAL, HIGH, EXPANSION, CRISIS.',
    action: 'Следите за частотой переходов в CRISIS режим.',
  },
  protectionReport: {
    title: 'Protection Report',
    description: 'Сравнение Raw vs Scaled метрик. Показывает эффективность vol scaling.',
    action: 'Снижение MaxDD при сохранении доходности — хороший знак.',
  },
  regimePerformance: {
    title: 'Performance by Regime',
    description: 'Статистика по каждому режиму: Hit Rate, MaxDD, Vol Multiplier.',
    action: 'В CRISIS режиме ожидается сниженный размер позиций.',
  },
  // Alerts Tab
  alertQuota: {
    title: 'Alert Quota (24h)',
    description: 'Лимит 3 INFO/HIGH алерта за 24 часа. CRITICAL — без лимита.',
    action: 'При исчерпании квоты новые INFO/HIGH алерты блокируются.',
  },
  alertStats: {
    title: 'Alert Statistics',
    description: 'Количество алертов за 24h и 7 дней по уровням.',
    action: 'Частые CRITICAL алерты требуют внимания к системе.',
  },
  alertHistory: {
    title: 'Alert History',
    description: 'Журнал всех алертов с фильтрами. SENT — отправлено, остальные — заблокированы.',
    action: 'Просматривайте заблокированные алерты для понимания нагрузки.',
  },
};

export default InfoTooltip;
