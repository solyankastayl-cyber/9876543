import React from 'react';
import { Activity } from 'lucide-react';
import { actionColors } from '../../data/actors';

const CopyFeed = ({ copyFeed, feedTimeframe, setFeedTimeframe }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Recent Trades</h2>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {['24h', '7d', '30d'].map(tf => (
            <button
              key={tf}
              onClick={() => setFeedTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                feedTimeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        {copyFeed.map((action) => {
          const actionConfig = actionColors[action.type] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity };
          const Icon = actionConfig.icon;
          return (
            <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${actionConfig.bg}`}>
                  <Icon className={`w-4 h-4 ${actionConfig.text}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${actionConfig.text}`}>{action.type}</span>
                    <span className="font-medium text-gray-900">{action.token}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{action.size}</span>
                    {action.price !== '-' && <span>@ {action.price}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* PnL Comparison */}
                {action.actorPnl && action.actorPnl !== '-' && (
                  <div className="text-right border-r border-gray-200 pr-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-xs text-gray-400">Actor</div>
                        <div className={`text-xs font-bold ${action.actorPnl.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{action.actorPnl}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">You</div>
                        <div className={`text-xs font-bold ${action.followerPnl?.startsWith('+') ? 'text-indigo-600' : 'text-red-600'}`}>{action.followerPnl || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}
                {action.entryDelay !== '-' && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Delay</div>
                    <div className="text-sm font-semibold text-gray-900">{action.entryDelay}</div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-xs text-gray-400">{action.time}</div>
                  <a href={`https://etherscan.io/tx/${action.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    View tx
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CopyFeed;
