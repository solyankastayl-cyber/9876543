import { Activity, ChevronDown } from 'lucide-react';

const STRATEGY_DATA = [
  ['Smart', [3, 1, 0, 0]],
  ['Infra', [2, 0, 1, 0]],
  ['Momen', [1, 2, 1, 0]],
  ['Meme', [0, 1, 0, 1]]
];

const PHASES = ['Acc', 'Act', 'Rot', 'Dis'];

export const StrategyFlow = ({ expanded, toggle }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full">
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50"
      data-testid="strategy-flow-toggle"
    >
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-gray-500" />
        <span className="font-semibold text-gray-900 text-xs">Strategy Flow</span>
      </div>
      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition ${expanded ? 'rotate-180' : ''}`} />
    </button>
    {expanded && (
      <div className="px-2.5 pb-2.5 border-t border-gray-100" data-testid="strategy-flow-content">
        <table className="w-full text-[10px] mt-1.5">
          <thead>
            <tr>
              <th></th>
              {PHASES.map(p => (
                <th key={p} className="p-0.5 text-gray-400 text-center">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STRATEGY_DATA.map(([s, vals]) => (
              <tr key={s}>
                <td className="p-0.5 text-gray-500">{s}</td>
                {vals.map((v, i) => (
                  <td key={i} className="p-0.5">
                    <div className={`w-4 h-4 mx-auto rounded flex items-center justify-center text-[9px] font-medium ${
                      v >= 3 ? 'bg-gray-800 text-white' :
                      v === 2 ? 'bg-gray-300 text-gray-700' :
                      v === 1 ? 'bg-gray-100 text-gray-500' : ''
                    }`}>
                      {v || ''}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default StrategyFlow;
