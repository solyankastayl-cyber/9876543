// B4.2 - Parser Presets Component

import { useState } from 'react';
import { useParserPresets } from '../hooks/useParserPresets';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Bookmark, X, Play, Plus } from 'lucide-react';

export function ParserPresets({ onRun }) {
  const { presets, savePreset, removePreset } = useParserPresets();
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  if (presets.length === 0 && !showAdd) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4 text-center">
          <Bookmark className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No saved presets</p>
          <p className="text-[10px] text-slate-600 mt-1">Save a filter to create one</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          Quick Presets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Preset Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-1 group">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRun(preset.payload)}
                className="text-xs h-7 px-2"
              >
                <Play className="w-3 h-3 mr-1" />
                {preset.label}
              </Button>
              <button
                onClick={() => removePreset(preset.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-[10px] text-slate-500">
          Click to run • Hover to remove • Max 10 presets
        </p>
      </CardContent>
    </Card>
  );
}
