/**
 * ClusterBadge Component (P2.2)
 * 
 * Shows if wallet/actor is part of a cluster
 */
import { Users, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

function ClusterBadge({ clusterId, walletCount, confidence }) {
  if (!clusterId) return null;
  
  const confidencePercent = Math.round(confidence * 100);
  
  let confidenceColor = 'bg-gray-100 text-gray-700';
  if (confidence >= 0.80) {
    confidenceColor = 'bg-emerald-100 text-emerald-700';
  } else if (confidence >= 0.60) {
    confidenceColor = 'bg-blue-100 text-blue-700';
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${confidenceColor} cursor-help`}>
            <Users size={12} />
            <span>Clustered</span>
            <span className="opacity-60">•</span>
            <span>{confidencePercent}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium mb-1">Actor Cluster</div>
            <div className="text-gray-400">
              {walletCount} wallets grouped together
            </div>
            <div className="text-gray-400 mt-1">
              Confidence: {confidencePercent}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ClusterBadge;
