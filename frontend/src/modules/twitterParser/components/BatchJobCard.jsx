// B4.3 - Batch Job Card Component

import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, Eye, Trash2 } from 'lucide-react';

function getStatusIcon(status) {
  switch (status) {
    case 'DONE':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'ERROR':
    case 'CANCELLED':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'RUNNING':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'PENDING':
    default:
      return <Clock className="w-4 h-4 text-slate-400" />;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'DONE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'ERROR':
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'RUNNING':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'PENDING':
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
}

export function BatchJobCard({ job, onView, onRemove }) {
  const { label, status, progress, results, error, createdAt, queries } = job;
  
  const percent = progress.total === 0 
    ? 0 
    : Math.round((progress.completed / progress.total) * 100);

  const time = new Date(createdAt).toLocaleTimeString();

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="font-medium text-sm">{label}</span>
          </div>
          <Badge variant="outline" className={`text-xs ${getStatusBadge(status)}`}>
            {status}
          </Badge>
        </div>

        {/* Progress */}
        {status === 'RUNNING' && (
          <div className="mb-3">
            <Progress value={percent} className="h-1.5" />
            <p className="text-[10px] text-slate-500 mt-1">
              {progress.completed}/{progress.total} queries ({percent}%)
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <span>{queries?.length || 0} queries</span>
          <span>{results?.length || 0} results</span>
          <span>{time}</span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mb-3 truncate">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {results?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(job)}
              className="flex-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Results
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove?.(job.id)}
            className="text-slate-500 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
