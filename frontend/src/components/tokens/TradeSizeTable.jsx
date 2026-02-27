import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getActionColor } from './tokenUtils';

export const TradeSizeTable = ({ tradeSize }) => {
  if (!tradeSize || tradeSize.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Flow by Trade Size</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 text-xs text-gray-500 font-medium">Size</th>
              <th className="text-left py-2 text-xs text-gray-500 font-medium">Range</th>
              <th className="text-center py-2 text-xs text-gray-500 font-medium">Action</th>
              <th className="text-left py-2 text-xs text-gray-500 font-medium">Entities</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">Net Flow</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">Avg Hold</th>
              <th className="text-center py-2 text-xs text-gray-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tradeSize.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 font-semibold text-gray-900">{row.size}</td>
                <td className="py-3 text-gray-600">{row.range}</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(row.action)}`}>
                    {row.action}
                  </span>
                </td>
                <td className="py-3 text-gray-600">{row.entities}</td>
                <td className={`py-3 text-right font-semibold ${
                  row.netFlow.startsWith('+') ? 'text-emerald-600' : row.netFlow.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {row.netFlow}
                </td>
                <td className="py-3 text-right text-gray-600">{row.avgHold}</td>
                <td className="py-3 text-center">
                  <Link 
                    to={row.link} 
                    className="p-1.5 hover:bg-gray-100 rounded inline-flex"
                    data-testid={`trade-size-link-${row.size}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeSizeTable;
