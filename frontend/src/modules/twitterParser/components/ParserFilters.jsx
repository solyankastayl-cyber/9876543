// B4.1 + B4.2 - Parser Filters Component

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Search, User, Play, Loader2, Save, Filter } from 'lucide-react';

export function ParserFilters({ onRun, onSavePreset, loading }) {
  const [type, setType] = useState('keyword');
  const [keyword, setKeyword] = useState('SOL');
  const [username, setUsername] = useState('');
  const [limit, setLimit] = useState([50]);
  const [sort, setSort] = useState('latest');
  
  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minLikes, setMinLikes] = useState([0]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const canRun = useMemo(() => {
    if (type === 'keyword') return keyword.trim().length >= 2;
    return username.trim().length >= 2;
  }, [type, keyword, username]);

  const currentPayload = {
    type,
    keyword: type === 'keyword' ? keyword.trim() : undefined,
    username: type === 'account' ? username.trim().replace('@', '') : undefined,
    limit: limit[0],
    sort,
    filters: {
      minLikes: minLikes[0],
      verifiedOnly,
    },
  };

  function handleRun() {
    if (!canRun || loading) return;
    onRun(currentPayload);
  }

  function handleSavePreset() {
    if (!onSavePreset) return;
    const label = type === 'keyword' ? keyword : `@${username}`;
    onSavePreset(label, currentPayload);
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={type === 'keyword' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('keyword')}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Keyword
          </Button>
          <Button
            variant={type === 'account' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('account')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Account
          </Button>
        </div>

        {/* Query Input */}
        {type === 'keyword' ? (
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Keyword</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. SOL, airdrop, memecoin"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace('@', ''))}
              placeholder="e.g. elonmusk, VitalikButerin"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        )}

        {/* Limit Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-slate-400">Limit</Label>
            <span className="text-xs text-slate-400">{limit[0]} tweets</span>
          </div>
          <Slider
            value={limit}
            onValueChange={setLimit}
            min={10}
            max={100}
            step={10}
            className="py-2"
          />
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Sort</Label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="engagement">Top Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs text-slate-400"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-slate-400">Min Likes</Label>
                <span className="text-xs text-slate-400">{minLikes[0]}</span>
              </div>
              <Slider
                value={minLikes}
                onValueChange={setMinLikes}
                min={0}
                max={1000}
                step={50}
                className="py-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">Verified Only</Label>
              <Button
                variant={verifiedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
              >
                {verifiedOnly ? 'Yes' : 'No'}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRun}
            disabled={!canRun || loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Running...' : 'Run Parser'}
          </Button>
          
          {onSavePreset && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSavePreset}
              disabled={!canRun}
              title="Save as Preset"
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Runtime Note */}
        <p className="text-[10px] text-slate-500 text-center">
          Data via Runtime Layer (MOCK/REMOTE/PROXY)
        </p>
      </CardContent>
    </Card>
  );
}
