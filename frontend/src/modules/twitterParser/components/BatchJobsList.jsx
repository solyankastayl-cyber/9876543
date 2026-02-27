// B4.3 - Batch Jobs List Component

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { BatchJobCard } from './BatchJobCard';
import { Layers, InboxIcon } from 'lucide-react';

export function BatchJobsList({ jobs, onView, onRemove }) {
  if (!jobs || jobs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-8 text-center">
          <InboxIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No batch jobs</p>
          <p className="text-xs text-slate-500 mt-1">Create a batch to run multiple queries</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Batch Jobs ({jobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <BatchJobCard
            key={job.id}
            job={job}
            onView={onView}
            onRemove={onRemove}
          />
        ))}
      </CardContent>
    </Card>
  );
}
