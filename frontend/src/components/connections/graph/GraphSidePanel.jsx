import React from 'react';

export default function GraphSidePanel({ selected, path, data }) {
  const find = (id) => data.nodes.find((n) => n.id === id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h3>

      {/* Selected Nodes */}
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected:</span>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {selected.length > 0
            ? selected.map((id) => find(id)?.label || id).join(' → ')
            : 'None'}
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Handshake Path */}
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Handshake Path:</span>
        {!path ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pick 2 nodes…</div>
        ) : path.ok === false ? (
          <div className="text-sm text-red-500 mt-1">NO PATH FOUND</div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Hops:</span>
              <span className="font-medium text-gray-900 dark:text-white">{path.hops}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Strength:</span>
              <span className="font-medium text-green-600">{Math.round((path.strength || 0) * 100)}%</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Path:</span>
              <div className="font-mono text-xs mt-1 text-gray-700 dark:text-gray-300 break-all">
                {path.pathIds?.map((id) => find(id)?.label || id).join(' → ')}
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Legend */}
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend:</span>
        <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Twitter Account</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>Backer (Anchor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-800"></span>
            <span>Selected</span>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Stats */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div>Nodes: {data.nodes.length}</div>
        <div>Edges: {data.edges.length}</div>
      </div>
    </div>
  );
}
