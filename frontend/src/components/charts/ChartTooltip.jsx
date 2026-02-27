/**
 * Unified Chart Tooltip Component
 * Matches FOMO design system
 */
import { chartColors } from '../../styles/chartTheme';

export const ChartTooltip = ({ active, payload, label, formatter, valueLabel = 'Value' }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0];
  const value = data.value;
  const isPositive = value >= 0;
  
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      <div className="chart-tooltip-separator" />
      {payload.map((entry, index) => (
        <div key={index} className="chart-tooltip-item">
          <span className="chart-tooltip-name" style={{ color: entry.color || chartColors.text }}>
            {entry.name || valueLabel}
          </span>
          <span 
            className="chart-tooltip-value"
            style={{ color: isPositive ? chartColors.positive : chartColors.negative }}
          >
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PriceTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label || data?.date}</div>
      <div className="chart-tooltip-separator" />
      {payload.map((entry, index) => (
        <div key={index} className="chart-tooltip-item">
          <div 
            className="chart-tooltip-dot"
            style={{ background: entry.color }}
          />
          <span className="chart-tooltip-name">{entry.name}</span>
          <span className="chart-tooltip-value">
            ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PnLTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const value = payload[0]?.value || 0;
  const isPositive = value >= 0;
  
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-separator" />
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">PnL</span>
        <span 
          className="chart-tooltip-value"
          style={{ color: isPositive ? chartColors.positive : chartColors.negative }}
        >
          {isPositive ? '+' : ''}${Math.abs(value / 1000).toFixed(1)}K
        </span>
      </div>
    </div>
  );
};

export default ChartTooltip;
