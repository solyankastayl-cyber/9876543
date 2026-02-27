// B4.2 - View Toggle Component

import { Button } from '../../../components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className="h-7 px-2"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        className="h-7 px-2"
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
}
