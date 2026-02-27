import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';

export function TokenTable({ tokens }) {
  const getDecisionVariant = (decision) => {
    if (decision === 'BUY') return 'success';
    if (decision === 'SELL') return 'danger';
    return 'default';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Token
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Decision
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change 24h
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Badges
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token) => (
            <tr key={token.symbol} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {token.symbol}
                    </div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge
                  label={token.decision}
                  variant={getDecisionVariant(token.decision)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-32">
                  <ConfidenceBar confidence={token.confidence} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${token.priceUsd?.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`text-sm ${
                    token.change24h > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {token.change24h > 0 ? '+' : ''}
                  {token.change24h?.toFixed(2)}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                  {token.badges.map((badge) => (
                    <Badge key={badge} label={badge} variant="default" />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
