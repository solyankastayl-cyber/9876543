import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice, getChangeColor } from './tokenUtils';

export const TokenSelector = ({ tokens, selectedToken, onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {tokens.map(token => (
        <button
          key={token.id}
          onClick={() => onSelect(token.id)}
          data-testid={`token-select-${token.id}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
            selectedToken === token.id 
              ? 'bg-gray-900 text-white' 
              : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300'
          }`}
        >
          <span className="font-bold">{token.symbol}</span>
          <span className={`text-sm ${selectedToken === token.id ? 'text-gray-300' : 'text-gray-500'}`}>
            {formatPrice(token.price)}
          </span>
          <span className={`text-xs flex items-center gap-0.5 ${
            selectedToken === token.id 
              ? (token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400')
              : getChangeColor(token.change24h)
          }`}>
            {token.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(token.change24h)}%
          </span>
        </button>
      ))}
    </div>
  );
};

export default TokenSelector;
