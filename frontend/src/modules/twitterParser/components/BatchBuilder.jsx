// B4.3 - Batch Builder Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Layers, Play, Loader2 } from 'lucide-react';

export function BatchBuilder({ onCreate, loading }) {
  const [raw, setRaw] = useState('');

  const queries = raw
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length >= 2);

  function handleCreate() {
    if (!queries.length || loading) return;
    onCreate(queries);
    setRaw('');
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Batch Search
          {queries.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              {queries.length} queries
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={5}
          placeholder="Enter one keyword per line&#10;e.g.:&#10;SOL&#10;ETH&#10;airdrop&#10;memecoin"
          className="bg-slate-800 border-slate-700 text-sm resize-none"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        <Button
          onClick={handleCreate}
          disabled={!queries.length || loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run {queries.length} {queries.length === 1 ? 'Query' : 'Queries'}
        </Button>

        <p className="text-[10px] text-slate-500 text-center">
          Each line becomes a separate search task
        </p>
      </CardContent>
    </Card>
  );
}
