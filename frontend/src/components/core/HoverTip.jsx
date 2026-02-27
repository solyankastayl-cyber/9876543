import React from 'react';
import './HoverTip.css';

/**
 * HoverTip — Universal hover tooltip wrapper
 * 
 * Usage:
 * <HoverTip text="Explanation here">
 *   <span>Label</span>
 * </HoverTip>
 */
export default function HoverTip({ text, children, position = 'bottom' }) {
  return (
    <span className="hoverTipWrap">
      {children}
      <span className={`hoverTipBubble hoverTipBubble--${position}`}>
        {text}
      </span>
    </span>
  );
}
