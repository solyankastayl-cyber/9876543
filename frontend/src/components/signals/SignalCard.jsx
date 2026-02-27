import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, MoreVertical, Volume2, VolumeX, Repeat, Bookmark, BellPlus, Trash2,
  Zap, Activity, Clock, Wallet, CheckCircle, Link2
} from 'lucide-react';
import { calculateSignalScore, getEventInfo, getCardStyle } from './signalUtils';

export const SignalCard = ({ item, onRemove, onOpenAlerts, onUserAction }) => {
  const { score, originalScore, decayed, decay, ageInHours, topReasons, tier, lifecycle } = calculateSignalScore(item);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(item.muted || false);
  const [isTracking, setIsTracking] = useState(item.tracking || false);

  const eventInfo = getEventInfo(item);

  return (
    <div
      className={`p-3 rounded-lg border border-gray-200 border-l-4 ${getCardStyle(item, tier)} hover:shadow-md transition-shadow ${isMuted ? 'opacity-50' : ''}`}
      data-testid={`signal-card-${item.id}`}
    >
      {/* Event Label + Lifecycle + Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            tier === 'critical' ? 'bg-gray-900 text-white' :
            item.behavior === 'distributing' ? 'bg-red-100 text-red-700' :
            item.behavior === 'accumulating' ? 'bg-emerald-100 text-emerald-700' :
            item.bridgeAligned ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {eventInfo.event}
          </span>
          
          {/* Lifecycle Badge */}
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase flex items-center gap-1 ${
            lifecycle === 'new' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            lifecycle === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            lifecycle === 'cooling' ? 'bg-gray-100 text-gray-600 border border-gray-300' :
            'bg-gray-50 text-gray-400 border border-gray-200'
          }`}>
            {lifecycle === 'new' && <Zap className="w-2.5 h-2.5" />}
            {lifecycle === 'active' && <Activity className="w-2.5 h-2.5" />}
            {lifecycle === 'cooling' && <Clock className="w-2.5 h-2.5" />}
            {lifecycle}
          </span>
          
          {item.statusChange === '24h' && (
            <span className="text-[10px] text-gray-400">{'< 24h'}</span>
          )}
          
          {/* Decay Indicator */}
          {decayed && (
            <span className="text-[9px] text-gray-400 flex items-center gap-0.5" title={`Score decayed by ${decay} points (${ageInHours}h old)`}>
              <Clock className="w-2.5 h-2.5" />
              -{decay}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 relative">
          <button onClick={() => onOpenAlerts(item)} className="p-1 text-gray-300 hover:text-gray-600 rounded">
            <Bell className="w-3 h-3" />
          </button>
          
          {/* User Actions Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowActionsMenu(!showActionsMenu)} 
              className="p-1 text-gray-300 hover:text-gray-600 rounded"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    onUserAction?.({ action: 'mute', itemId: item.id, value: !isMuted });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {isMuted ? 'Unmute Signal' : 'Mute Signal'}
                </button>
                <button
                  onClick={() => {
                    setIsTracking(!isTracking);
                    onUserAction?.({ action: 'track', itemId: item.id, value: !isTracking });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  {isTracking ? 'Stop Tracking Similar' : 'Track Similar'}
                </button>
                <button
                  onClick={() => {
                    onUserAction?.({ action: 'watchlist', itemId: item.id });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Add to Watchlist
                </button>
                <button
                  onClick={() => {
                    onUserAction?.({ action: 'escalation', itemId: item.id });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <BellPlus className="w-3.5 h-3.5" />
                  Notify on Escalation
                </button>
                <div className="border-t border-gray-200 mt-1"></div>
                <button
                  onClick={() => {
                    onRemove(item.id);
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Signal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entity Line */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
          tier === 'critical' ? 'bg-gray-900' :
          item.behavior === 'distributing' ? 'bg-red-500' :
          item.behavior === 'accumulating' ? 'bg-emerald-500' :
          item.bridgeAligned ? 'bg-blue-500' :
          'bg-gray-400'
        }`}>
          <Wallet className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-900 truncate">{item.label}</span>
            {item.verified && <CheckCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />}
          </div>
          <span className="text-[10px] text-gray-400 uppercase">{item.type?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
          item.behavior === 'accumulating' ? 'bg-emerald-100 text-emerald-700' :
          item.behavior === 'distributing' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {item.behavior || 'monitoring'}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
          item.riskLevel === 'high' ? 'bg-gray-900 text-white' :
          item.riskLevel === 'medium' ? 'bg-gray-200 text-gray-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {item.riskLevel || 'low'}
        </span>
        {item.bridgeAligned && (
          <div className="relative group/bridge">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-blue-100 text-blue-700 cursor-help flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5" />
              Bridge
            </span>
            {/* Bridge Explanation Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/bridge:block z-20">
              <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg min-w-[220px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Why Coordinated?</div>
                </div>
                <p className="text-xs mb-2 text-gray-300">
                  {item.alignedCount || 3} entities showing similar behavior pattern within {item.coordinationWindow || '6h'} window
                </p>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Involved Entities:</div>
                <div className="space-y-1">
                  {(item.alignedEntities || ['Binance', 'Bybit', 'OKX']).slice(0, 3).map((entity, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span className="text-gray-300">{entity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Confidence</span>
                    <span className="font-bold text-blue-400">{item.coordinationConfidence || 85}%</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* Why it matters */}
      <p className="text-[11px] text-gray-600 mb-2 italic">{eventInfo.why}</p>

      {/* Score + Top Reasons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
        <div className="flex items-center gap-2">
          {/* Score Badge */}
          <div className="relative group/score">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold cursor-help ${
              tier === 'critical' ? 'bg-gray-900 text-white' :
              tier === 'notable' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              'bg-gray-100 text-gray-500'
            }`}>
              {score}
            </span>
            {/* Score Tooltip on hover */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/score:block z-20">
              <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg min-w-[160px]">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Score Breakdown</div>
                {topReasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5">
                    <span>{r.icon}</span>
                    <span className="flex-1">{r.reason}</span>
                    <span className="font-bold text-emerald-400">+{r.score}</span>
                  </div>
                ))}
                {decayed && (
                  <>
                    <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between text-[10px]">
                      <span className="text-gray-400">Base Score</span>
                      <span className="font-bold">{originalScore}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-amber-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Decay ({ageInHours}h)</span>
                      </div>
                      <span className="font-bold">-{decay}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between text-[10px]">
                  <span className="text-gray-400">{decayed ? 'Current' : 'Total'}</span>
                  <span className="font-bold">{score}/100</span>
                </div>
              </div>
              <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          {/* Top reasons mini-display */}
          <div className="flex items-center gap-1">
            {topReasons.slice(0, 2).map((r, i) => (
              <span key={i} className="text-[9px] text-gray-400" title={r.reason}>
                {r.icon}
              </span>
            ))}
          </div>
        </div>
        <Link 
          to={`/signal/${item.id}`}
          className="text-[11px] font-semibold text-gray-500 hover:text-gray-900"
          data-testid={`signal-view-link-${item.id}`}
        >
          View →
        </Link>
      </div>
    </div>
  );
};

export default SignalCard;
