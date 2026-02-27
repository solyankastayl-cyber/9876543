/**
 * AltScreenerTable Component
 * ===========================
 * Table of alt candidates with scores and explanations
 */

import React from 'react';
import ScoreBar from './ScoreBar';
import WhyChips from './WhyChips';

export default function AltScreenerTable({ rows = [], onSelect }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th>#</Th>
            <Th>Symbol</Th>
            <Th>Score</Th>
            <Th>WHY (top factors)</Th>
            <Th align="right">pWinner</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.symbol}
              onClick={() => onSelect?.(r)}
              className={`
                border-t border-gray-100 
                ${onSelect ? 'cursor-pointer hover:bg-gray-50' : ''}
                transition-colors
              `}
            >
              <Td className="text-gray-400 font-mono">{i + 1}</Td>
              <Td className="font-bold text-gray-900">{r.symbol}</Td>
              <Td><ScoreBar value01={r.pWinner} /></Td>
              <Td><WhyChips why={r.topContributions || r.why} /></Td>
              <Td align="right" className="font-mono text-gray-700 tabular-nums">
                {(Number(r.pWinner) * 100).toFixed(1)}%
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-gray-400">
                No candidates found.
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th className={`
      text-${align ?? 'left'} 
      px-4 py-3 
      text-xs font-semibold text-gray-500 uppercase tracking-wider
    `}>
      {children}
    </th>
  );
}

function Td({ children, align, colSpan, className = '' }) {
  return (
    <td 
      colSpan={colSpan} 
      className={`
        text-${align ?? 'left'} 
        px-4 py-3 
        ${className}
      `}
    >
      {children}
    </td>
  );
}
