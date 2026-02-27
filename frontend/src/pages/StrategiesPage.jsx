import { PageHeader } from '../components/PageHeader';
import StrategyTemplates from '../components/StrategyTemplates';

export default function StrategiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      <PageHeader 
        title="Strategy Templates"
        description="Pre-built trading strategies based on on-chain signals"
      />
      
      <StrategyTemplates />
      
      <div className="h-8" />
    </div>
  );
}
