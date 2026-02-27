// B4.1 - Execution Status Component

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Activity,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
} from 'lucide-react';

function getBadgeClass(status) {
  switch (status) {
    case 'RUNNING':
    case 'OK':
    case 'HEALTHY':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'STOPPED':
    case 'PAUSED':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    case 'ERROR':
    case 'DOWN':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
}

export function ExecutionStatus({ status }) {
  const data = status?.data;
  const worker = data?.worker;
  const capacity = data?.capacity;
  const runtime = data?.runtime;

  const workerStatus = worker?.running ? 'RUNNING' : 'STOPPED';
  const capacityPercent = capacity?.percentUsed || 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Execution Core
          </span>
          <Badge variant="outline" className={getBadgeClass(workerStatus)}>
            {workerStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Worker Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400">Processed</p>
            <p className="font-semibold text-lg">{worker?.processedCount || 0}</p>
          </div>
          <div>
            <p className="text-slate-400">Errors</p>
            <p className="font-semibold text-lg text-red-400">{worker?.errorCount || 0}</p>
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Hourly Capacity</span>
            <span className="font-medium">
              {capacity?.usedInWindow || 0} / {capacity?.totalAvailable || 0}
            </span>
          </div>
          <Progress value={capacityPercent} className="h-2" />
          <p className="text-[10px] text-slate-500 text-right">
            {capacityPercent.toFixed(1)}% used
          </p>
        </div>

        {/* Runtime Summary */}
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400 mb-2">Runtime Health</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <p className="font-semibold text-emerald-400">{runtime?.healthy || 0}</p>
              <p className="text-slate-500">OK</p>
            </div>
            <div>
              <p className="font-semibold text-amber-400">{runtime?.degraded || 0}</p>
              <p className="text-slate-500">Degraded</p>
            </div>
            <div>
              <p className="font-semibold text-red-400">{runtime?.error || 0}</p>
              <p className="text-slate-500">Error</p>
            </div>
            <div>
              <p className="font-semibold text-slate-400">{runtime?.unknown || 0}</p>
              <p className="text-slate-500">Unknown</p>
            </div>
          </div>
        </div>

        {/* Tasks */}
        {data?.tasks && (
          <div className="border-t border-slate-800 pt-3">
            <p className="text-xs text-slate-400 mb-2">Task Queue</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-semibold">{data.tasks.pending || 0}</p>
                <p className="text-slate-500">Pending</p>
              </div>
              <div>
                <p className="font-semibold text-emerald-400">{data.tasks.completed || 0}</p>
                <p className="text-slate-500">Done</p>
              </div>
              <div>
                <p className="font-semibold text-red-400">{data.tasks.failed || 0}</p>
                <p className="text-slate-500">Failed</p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Info */}
        <div className="text-[10px] text-slate-500 text-center">
          {data?.accountsCount || 0} accounts • {data?.instancesCount || 0} slots
        </div>
      </CardContent>
    </Card>
  );
}
