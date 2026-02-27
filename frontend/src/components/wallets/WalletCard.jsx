import { Star, TrendingUp, TrendingDown, Shield, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTypeBadgeColor, formatAddress } from './walletUtils';

export const WalletCard = ({ wallet, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(wallet.address)}
      className={`w-full p-4 rounded-xl border transition-all text-left ${
        isSelected 
          ? 'bg-gray-900 border-gray-700 ring-2 ring-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      data-testid={`wallet-card-${wallet.address.slice(0, 8)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <Star className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {wallet.label}
            </div>
            <div className={`text-xs ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatAddress(wallet.address)}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          isSelected ? 'bg-white/10 text-gray-300' : getTypeBadgeColor(wallet.type)
        }`}>
          {wallet.type}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className={`text-xs ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>Balance</div>
          <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
            {wallet.balance}
          </div>
        </div>
        <div>
          <div className={`text-xs ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>PnL</div>
          <div className={`font-semibold text-sm flex items-center gap-1 ${
            wallet.pnl.startsWith('+') 
              ? 'text-emerald-500' 
              : 'text-red-500'
          }`}>
            {wallet.pnl.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {wallet.pnl}
          </div>
        </div>
        <div>
          <div className={`text-xs ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>Risk</div>
          <div className={`font-semibold text-sm flex items-center gap-1 ${
            wallet.riskScore < 30 ? 'text-emerald-500' : wallet.riskScore < 60 ? 'text-amber-500' : 'text-red-500'
          }`}>
            <Shield className="w-3 h-3" />
            {wallet.riskScore}
          </div>
        </div>
      </div>

      <div className={`text-xs p-2 rounded-lg ${
        isSelected ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-600'
      }`}>
        <span className="font-medium">Why featured:</span> {wallet.whyFeatured}
      </div>

      <Link
        to={`/signal/${wallet.address}`}
        onClick={(e) => e.stopPropagation()}
        className={`mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
          isSelected 
            ? 'bg-white text-gray-900 hover:bg-gray-100' 
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        View Full Analysis
        <ArrowUpRight className="w-3 h-3" />
      </Link>
    </button>
  );
};

export default WalletCard;
