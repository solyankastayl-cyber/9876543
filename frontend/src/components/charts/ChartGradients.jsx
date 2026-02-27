/**
 * Reusable SVG Gradient Definitions for Recharts
 * Usage: Include <ChartGradients /> inside ResponsiveContainer
 */
import { chartColors } from '../../styles/chartTheme';

export const ChartGradients = () => (
  <defs>
    {/* Primary Area Gradient - Teal */}
    <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} />
      <stop offset="50%" stopColor={chartColors.primary} stopOpacity={0.15} />
      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.02} />
    </linearGradient>
    
    {/* Secondary Area Gradient - Purple */}
    <linearGradient id="secondaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={chartColors.secondary} stopOpacity={0.3} />
      <stop offset="100%" stopColor={chartColors.secondary} stopOpacity={0.02} />
    </linearGradient>
    
    {/* Positive Bar Gradient */}
    <linearGradient id="positiveBarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={chartColors.positive} stopOpacity={1} />
      <stop offset="100%" stopColor={chartColors.positiveLight} stopOpacity={0.85} />
    </linearGradient>
    
    {/* Negative Bar Gradient */}
    <linearGradient id="negativeBarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={chartColors.negative} stopOpacity={1} />
      <stop offset="100%" stopColor={chartColors.negativeLight} stopOpacity={0.85} />
    </linearGradient>
    
    {/* Blue Gradient for CEX/secondary bars */}
    <linearGradient id="blueBarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.85} />
    </linearGradient>
    
    {/* Orange Gradient */}
    <linearGradient id="orangeBarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
      <stop offset="100%" stopColor="#FB923C" stopOpacity={0.85} />
    </linearGradient>
  </defs>
);

export default ChartGradients;
