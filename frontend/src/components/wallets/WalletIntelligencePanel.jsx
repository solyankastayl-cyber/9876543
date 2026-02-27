import { Check, AlertTriangle, Info, Eye, Bell, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { getVerdictColor, getRiskColor, getRiskLabel } from './walletUtils';

export const WalletIntelligencePanel = ({ 
  intelligence, 
  walletData, 
  selectedWallet,
  isTracked,
  onTrack,
  onShowSignals,
  onShowAlerts
}) => {
  if (!intelligence || !walletData) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white mb-6">
      {/* Header with Decision Score */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getVerdictColor(intelligence.verdict)}`}>
              {intelligence.verdict}
            </span>
            <span className="text-sm text-gray-400">Decision Score: {intelligence.decisionScore}/100</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Current State:</span>
            <span className="font-semibold text-white">{intelligence.walletState}</span>
            <span className="text-gray-500">({intelligence.walletStatePeriod})</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 hover:bg-white/10 rounded">
                  <Info className="w-3 h-3 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
                <p className="text-xs">{intelligence.walletStateExplanation}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Confidence</div>
          <div className="text-3xl font-bold">{intelligence.confidence}<span className="text-xl text-gray-500">%</span></div>
          <div className="text-xs text-gray-400 mt-1">{intelligence.tradesAnalyzed} trades</div>
        </div>
      </div>

      {/* Analysis context */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-gray-400">
          <span className="font-medium">Analysis applies only to:</span> {walletData.label} ({selectedWallet.slice(0, 6)}...{selectedWallet.slice(-4)})
        </div>
      </div>

      {/* Why Follow? */}
      <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Why {intelligence.verdict === 'FOLLOW' ? 'Follow' : 'Consider'} This Wallet?</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Profitable over 6 months ({intelligence.totalPnl} realized)</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Low systemic risk ({intelligence.riskScore}/100)</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Aligned with current market regime ({intelligence.marketAlignment})</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">High frequency trader — short holding periods ({intelligence.avgEntryDelay} avg delay)</span>
          </div>
        </div>
      </div>

      {/* What happens if you follow */}
      <div className="mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
        <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
          What Happens If You Follow
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 hover:bg-white/10 rounded">
                <Info className="w-3 h-3 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
              <p className="mb-2">Estimated impact based on historical behavior</p>
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/20">
                <span className="font-semibold">Replicability: {intelligence.replicability}</span><br/>
                {intelligence.earlyEntryProfit} profit captured within first 12h of position opening
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-gray-400 mb-1">Avg Drawdown</div>
            <div className="text-base font-bold text-white">{intelligence.avgDrawdown}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Entry Delay</div>
            <div className="text-base font-bold text-white">{intelligence.avgEntryDelay}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Expected Slippage</div>
            <div className="text-base font-bold text-white">{intelligence.expectedSlippage}</div>
          </div>
        </div>
      </div>

      {/* Actionable buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onTrack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isTracked 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="track-wallet-btn"
            >
              {isTracked ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isTracked ? 'Tracking' : 'Track Wallet'}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">{isTracked ? 'Click to stop tracking this wallet' : 'Adds to Watchlist • Enables Alerts • Shows in Market → "Tracked Wallet Activity"'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onShowSignals}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
              data-testid="copy-signals-btn"
            >
              <Activity className="w-4 h-4" />
              Copy Signals
              <span className="text-xs text-gray-400">(Read-only)</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">Shows theoretical entry points based on wallet actions. Execution latency and slippage not included.</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onShowAlerts}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
              data-testid="alert-changes-btn"
            >
              <Bell className="w-4 h-4" />
              Alert on Changes
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">State-based alerts only (not price-based). Behavioral, narrative, risk, and exit signals.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default WalletIntelligencePanel;
