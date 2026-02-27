/**
 * GraphTopBar - Graph controls with tooltips
 * All filters have explanations for what they do
 */
import React from 'react';
import { Info } from 'lucide-react';

const LAYERS = [
  { key: 'CO_ENGAGEMENT', label: 'Co-Engagement', tooltip: 'Shows accounts that engage with similar content (likes, retweets, replies)' },
  { key: 'FOLLOW', label: 'Follow', tooltip: 'Direct follow relationships between accounts' },
  { key: 'CO_INVEST', label: 'Co-Invest', tooltip: 'Accounts that invested in the same projects/tokens' },
  { key: 'ONCHAIN', label: 'Onchain', tooltip: 'On-chain transaction connections (wallet interactions)' },
  { key: 'MEDIA', label: 'Media', tooltip: 'Accounts mentioned together in media or discussions' },
  { key: 'BLENDED', label: 'Blended', tooltip: 'Combined view of all connection types weighted by strength' },
];

// Tooltip component
const Tooltip = ({ text, children }) => (
  <div className="relative group inline-block">
    {children}
    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 w-48 text-left shadow-lg">
      {text}
      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// Filter tooltips
const FILTER_TOOLTIPS = {
  layer: 'Select connection type to visualize. Each layer shows different relationship patterns.',
  anchors: 'Anchors are verified high-authority nodes (VCs, known funds). Toggle to show/hide them as reference points.',
  minConfidence: 'Minimum confidence threshold for connections (0.4-0.95). Higher = only show high-certainty connections.',
  minWeight: 'Minimum edge weight to display (0.05-0.5). Higher = only show stronger connections.',
  handshake: 'Select 2 nodes to find shortest path between them. Shows how accounts are connected.',
  hasName: 'Filter to show only accounts with known names/handles.',
  legend: 'Node colors represent different categories: VCs (blue), Influencers (purple), Projects (green), etc.',
};

export default function GraphTopBar({ cfg, actions, selected, pathLocked }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Layer Selection */}
        <div className="flex items-center gap-2">
          <Tooltip text={FILTER_TOOLTIPS.layer}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
              Layer
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </Tooltip>
          <div className="flex gap-1">
            {LAYERS.map((l) => (
              <Tooltip key={l.key} text={l.tooltip}>
                <button
                  onClick={() => actions.setLayer(l.key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    cfg.layer === l.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {l.label}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Anchors Toggle */}
        <div className="flex items-center gap-2">
          <Tooltip text={FILTER_TOOLTIPS.anchors}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
              Anchors
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </Tooltip>
          <button
            onClick={() => actions.setAnchors(!cfg.anchors)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              cfg.anchors
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cfg.anchors ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Confidence Slider */}
        <div className="flex items-center gap-2">
          <Tooltip text={FILTER_TOOLTIPS.minConfidence}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
              Min Confidence
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </Tooltip>
          <input
            type="range"
            min="0.4"
            max="0.95"
            step="0.01"
            value={cfg.minConfidence}
            onChange={(e) => actions.setMinConfidence(Number(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 w-10">
            {Math.round(cfg.minConfidence * 100)}%
          </span>
        </div>

        {/* Weight Slider */}
        <div className="flex items-center gap-2">
          <Tooltip text={FILTER_TOOLTIPS.minWeight}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
              Min Weight
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </Tooltip>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.01"
            value={cfg.minWeight}
            onChange={(e) => actions.setMinWeight(Number(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 w-10">
            {cfg.minWeight.toFixed(2)}
          </span>
        </div>

        {/* hasName Filter (if exists) */}
        {cfg.hasName !== undefined && (
          <div className="flex items-center gap-2">
            <Tooltip text={FILTER_TOOLTIPS.hasName}>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
                Named Only
                <Info className="w-3 h-3 text-gray-400" />
              </span>
            </Tooltip>
            <button
              onClick={() => actions.setHasName && actions.setHasName(!cfg.hasName)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                cfg.hasName
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cfg.hasName ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        {/* Handshake Controls */}
        <div className="ml-auto flex items-center gap-2">
          <Tooltip text={FILTER_TOOLTIPS.handshake}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-help">
              Handshake
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </Tooltip>
          <span className="text-xs text-gray-600 dark:text-gray-400">{selected.length}/2</span>
          <button
            className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            onClick={actions.clearSelection}
            disabled={pathLocked}
          >
            Clear
          </button>
          {!pathLocked ? (
            <button
              className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={actions.lockPath}
              disabled={selected.length !== 2}
            >
              Lock
            </button>
          ) : (
            <button
              className="px-3 py-1.5 text-xs rounded-md bg-orange-500 text-white hover:bg-orange-600"
              onClick={actions.unlockPath}
            >
              Unlock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
